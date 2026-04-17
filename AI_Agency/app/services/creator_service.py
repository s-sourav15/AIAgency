import asyncio
import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.models.brand import Brand
from app.models.generation_job import GenerationJob
from app.models.content_piece import ContentPiece
from app.prompts.brand_voice import voice_injection_block
from app.prompts.strategy import calendar_strategy_prompt
from app.prompts.copy_generation import copy_prompt
from app.services.validator_service import validate_job
from app.services.image_service import generate_images_for_job
from app.utils.llm_factory import get_llm_client, get_model_name

logger = logging.getLogger(__name__)


async def run_pipeline(
    job_id: UUID,
    session_factory: async_sessionmaker,
    settings: Settings,
):
    llm = get_llm_client(settings, role="creator")
    try:
        # Step 1: Strategy
        await _update_status(session_factory, job_id, "strategizing")
        calendar = await _strategy_step(job_id, session_factory, llm, settings)

        # Step 2: Copy generation
        await _update_status(session_factory, job_id, "creating")
        await _copy_step(job_id, calendar, session_factory, llm, settings)

        # Step 3: Validation
        await _update_status(session_factory, job_id, "validating")
        await validate_job(job_id, session_factory, settings)

        # Step 4: Image generation (if Replicate token provided)
        if settings.replicate_api_token:
            await _update_status(session_factory, job_id, "generating_images")
            try:
                await generate_images_for_job(job_id, session_factory, settings)
            except Exception as e:
                logger.error(f"Job {job_id}: image generation failed: {e}", exc_info=True)
                # Continue to completed — text content is still valid

        # Done
        await _update_status(session_factory, job_id, "completed")
        logger.info(f"Job {job_id} completed successfully")

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        async with session_factory() as db:
            job = await db.get(GenerationJob, job_id)
            if job:
                job.status = "failed"
                job.error_message = str(e)[:1000]
                await db.commit()
    finally:
        await llm.close()


async def _strategy_step(
    job_id: UUID,
    session_factory: async_sessionmaker,
    llm,
    settings: Settings,
) -> list[dict]:
    async with session_factory() as db:
        job = await db.get(GenerationJob, job_id)
        brand = await db.get(Brand, job.brand_id)

        voice_block = voice_injection_block(brand.name, brand.voice_profile)
        messages = calendar_strategy_prompt(
            brand_name=brand.name,
            brand_description=brand.description or "",
            voice_block=voice_block,
            input_type=job.input_type,
            input_data=job.input_data or "",
            platforms=job.platforms,
            industry=brand.industry or "general",
            num_days=job.num_days or 30,
        )

        result = await llm.chat_json(
            model=get_model_name(settings, "creator"),
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
        )

        calendar = result.get("days", [])

        # Enforce num_days limit — LLM sometimes generates more
        num_days = job.num_days or 30
        if len(calendar) > num_days:
            logger.warning(f"Job {job_id}: LLM generated {len(calendar)} days, trimming to {num_days}")
            calendar = calendar[:num_days]
            result["days"] = calendar

        job.calendar = result
        await db.commit()

    logger.info(f"Job {job_id}: strategy generated with {len(calendar)} days")
    return calendar


async def _copy_step(
    job_id: UUID,
    calendar: list[dict],
    session_factory: async_sessionmaker,
    llm,
    settings: Settings,
):
    # Load brand context once
    async with session_factory() as db:
        job = await db.get(GenerationJob, job_id)
        brand = await db.get(Brand, job.brand_id)
        brand_name = brand.name
        voice_block = voice_injection_block(brand.name, brand.voice_profile)
        input_summary = (job.input_data or "")[:500]
        brand_id = brand.id

    semaphore = asyncio.Semaphore(settings.max_concurrent_llm_calls)
    pieces = []

    async def generate_one(day_plan: dict, platform: str):
        async with semaphore:
            messages = copy_prompt(
                platform=platform,
                day_number=day_plan.get("day", 0),
                theme=day_plan.get("theme", ""),
                hook=day_plan.get("hook", ""),
                content_type=day_plan.get("content_type", "educational"),
                voice_block=voice_block,
                brand_name=brand_name,
                input_summary=input_summary,
            )
            try:
                result = await llm.chat_json(
                    model=get_model_name(settings, "creator"),
                    messages=messages,
                    temperature=0.8,
                    max_tokens=1024,
                )
                return {
                    "day": int(day_plan.get("day", 0)),
                    "platform": platform,
                    "copy": result.get("copy", ""),
                    "hashtags": result.get("hashtags", []),
                    "format": result.get("format", "caption"),
                }
            except Exception as e:
                logger.error(f"Copy gen failed for day {day_plan.get('day')}/{platform}: {e}")
                return None

    # Build tasks for all day x platform combinations
    tasks = []
    for day_plan in calendar:
        day_platforms = day_plan.get("platforms", [])
        for platform in day_platforms:
            tasks.append(generate_one(day_plan, platform))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Save all pieces to DB
    async with session_factory() as db:
        for r in results:
            if isinstance(r, Exception) or r is None:
                continue
            piece = ContentPiece(
                job_id=job_id,
                brand_id=brand_id,
                day_number=int(r["day"]),
                platform=r["platform"],
                format=r["format"],
                copy=r["copy"],
                hashtags=r["hashtags"],
            )
            db.add(piece)
            pieces.append(piece)
        await db.commit()

    logger.info(f"Job {job_id}: generated {len(pieces)} content pieces")


async def _update_status(
    session_factory: async_sessionmaker, job_id: UUID, status: str
):
    async with session_factory() as db:
        job = await db.get(GenerationJob, job_id)
        if job:
            job.status = status
            if status == "completed":
                job.completed_at = datetime.now(timezone.utc)
            await db.commit()
