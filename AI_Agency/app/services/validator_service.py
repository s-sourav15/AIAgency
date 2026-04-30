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
from app.utils.slop_check import (
    apply_slop_penalty,
    check_slop,
    compute_quality_score,
)

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
            brand_description = brand.description or ""
            brand_sample_content = list(brand.sample_content or [])
            brand_tone = brand.tone or ""

        semaphore = asyncio.Semaphore(settings.max_concurrent_llm_calls)

        async def validate_one(piece_id: UUID):
            async with semaphore:
                await _validate_and_regen(
                    piece_id=piece_id,
                    brand_name=brand_name,
                    voice_profile=voice_profile,
                    brand_description=brand_description,
                    brand_sample_content=brand_sample_content,
                    brand_tone=brand_tone,
                    session_factory=session_factory,
                    llm=llm,
                    settings=settings,
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
    brand_description: str,
    brand_sample_content: list,
    brand_tone: str,
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

                # Python-side slop check. Belt-and-suspenders: the LLM is also
                # told about the banned list, but we don't trust it to enforce.
                slop = check_slop(piece.copy or "")
                scores = apply_slop_penalty(scores, slop)

                # Compute quality_score in Python, not as LLM-side prompt math.
                quality = compute_quality_score(scores)
                scores["quality_score"] = quality

                piece.validation_score = quality
                piece.validation_details = scores
                llm_feedback = _feedback_to_str(scores.get("feedback", ""))
                slop_feedback = slop.feedback()
                combined_feedback = (
                    f"{llm_feedback} || SLOP: {slop_feedback}"
                    if slop_feedback
                    else llm_feedback
                )
                piece.validation_feedback = combined_feedback

                # Pass threshold = score OK AND no forced-regen from slop hits.
                if quality >= settings.min_quality_score and not slop.should_regen:
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
                base_feedback = _feedback_to_str(
                    scores.get("feedback", "Improve overall quality")
                )
                slop_feedback = slop.feedback()
                feedback_str = (
                    f"{base_feedback}\n\nSLOP ISSUES: {slop_feedback}"
                    if slop_feedback
                    else base_feedback
                )
                regen_messages = regeneration_prompt(
                    platform=piece.platform,
                    original_copy=piece.copy,
                    feedback=feedback_str,
                    voice_block=voice_block,
                    brand_name=brand_name,
                    brand_description=brand_description,
                    sample_content=brand_sample_content,
                    tone=brand_tone,
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
