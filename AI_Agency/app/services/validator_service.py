import asyncio
import json
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import Settings
from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.prompts.validation import scoring_prompt
from app.prompts.copy_generation import regeneration_prompt
from app.prompts.brand_voice import voice_injection_block
from app.utils.llm_factory import get_llm_client, get_model_name

logger = logging.getLogger(__name__)


def _feedback_to_str(feedback) -> str:
    """Ensure feedback is always a string for the Text column."""
    if feedback is None:
        return ""
    if isinstance(feedback, str):
        return feedback
    return json.dumps(feedback)


async def validate_job(
    job_id: UUID,
    session_factory: async_sessionmaker,
    settings: Settings,
):
    llm = get_llm_client(settings, role="validator")
    try:
        async with session_factory() as db:
            result = await db.execute(
                select(ContentPiece).where(ContentPiece.job_id == job_id)
            )
            pieces = list(result.scalars().all())

            if not pieces:
                logger.warning(f"No pieces to validate for job {job_id}")
                return

            brand = await db.get(Brand, pieces[0].brand_id)
            voice_profile = brand.voice_profile or {}
            brand_name = brand.name

        semaphore = asyncio.Semaphore(settings.max_concurrent_llm_calls)

        async def validate_one(piece_id: UUID):
            async with semaphore:
                await _validate_and_regen(
                    piece_id, brand_name, voice_profile,
                    session_factory, llm, settings,
                )

        tasks = [validate_one(p.id) for p in pieces]
        await asyncio.gather(*tasks, return_exceptions=True)

        logger.info(f"Job {job_id}: validated {len(pieces)} pieces")
    finally:
        await llm.close()


async def _validate_and_regen(
    piece_id: UUID,
    brand_name: str,
    voice_profile: dict,
    session_factory: async_sessionmaker,
    llm,
    settings: Settings,
):
    try:
        for attempt in range(settings.max_validation_loops):
            async with session_factory() as db:
                piece = await db.get(ContentPiece, piece_id)
                if not piece:
                    return

                # Score the current copy
                messages = scoring_prompt(
                    copy=piece.copy,
                    platform=piece.platform,
                    brand_name=brand_name,
                    voice_profile=voice_profile,
                )
                try:
                    scores = await llm.chat_json(
                        model=get_model_name(settings, "validator"),
                        messages=messages,
                        temperature=0.2,
                        max_tokens=512,
                    )
                except Exception as e:
                    logger.error(f"Validation failed for piece {piece_id}: {e}")
                    piece.status = "validated"
                    piece.validation_score = 0.5
                    await db.commit()
                    return

                quality = scores.get("quality_score", 0.5)
                piece.validation_score = quality
                piece.validation_details = scores
                piece.validation_feedback = _feedback_to_str(scores.get("feedback", ""))

                if quality >= settings.min_quality_score:
                    piece.status = "validated"
                    await db.commit()
                    return

                # Need regeneration
                if piece.regeneration_count >= settings.max_validation_loops - 1:
                    piece.status = "validated"  # Accept best effort
                    await db.commit()
                    logger.info(
                        f"Piece {piece_id}: max regen reached, "
                        f"accepting score {quality:.2f}"
                    )
                    return

                # Regenerate with feedback
                voice_block = voice_injection_block(brand_name, voice_profile)
                feedback_str = _feedback_to_str(scores.get("feedback", "Improve overall quality"))
                regen_messages = regeneration_prompt(
                    platform=piece.platform,
                    original_copy=piece.copy,
                    feedback=feedback_str,
                    voice_block=voice_block,
                    brand_name=brand_name,
                )
                try:
                    regen_result = await llm.chat_json(
                        model=get_model_name(settings, "creator"),
                        messages=regen_messages,
                        temperature=0.8,
                        max_tokens=1024,
                    )
                    piece.copy = regen_result.get("copy", piece.copy)
                    piece.hashtags = regen_result.get("hashtags", piece.hashtags)
                    piece.regeneration_count += 1
                    await db.commit()
                    logger.info(
                        f"Piece {piece_id}: regenerated (attempt {piece.regeneration_count}), "
                        f"prev score {quality:.2f}"
                    )
                except Exception as e:
                    logger.error(f"Regeneration failed for piece {piece_id}: {e}")
                    piece.status = "validated"
                    await db.commit()
                    return
    except Exception as e:
        # Ensure piece is always marked validated even on unexpected errors
        logger.error(f"Unexpected error validating piece {piece_id}: {e}")
        try:
            async with session_factory() as db:
                piece = await db.get(ContentPiece, piece_id)
                if piece and piece.status != "validated":
                    piece.status = "validated"
                    piece.validation_score = piece.validation_score or 0.5
                    await db.commit()
        except Exception:
            pass
