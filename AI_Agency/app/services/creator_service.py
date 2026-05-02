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

        # Step 5: auto-deliver (ZIP and/or Drive) based on settings.
        # Failures here don't fail the job — content is still valid
        # and the client can always call the export endpoints manually.
        try:
            await _auto_deliver(job_id, session_factory, settings)
        except Exception as e:
            logger.error(
                f"Job {job_id}: auto-delivery failed ({e}); "
                "content is fine, client can export manually.",
                exc_info=True,
            )

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

        # Defensive: if LLM returns empty/broken calendar, fail the job
        # LOUDLY rather than silently producing zero pieces downstream.
        if not calendar:
            job.status = "failed"
            job.error_message = (
                f"Strategy step returned empty calendar. "
                f"Raw response keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}"
            )
            await db.commit()
            logger.error(
                "Job %s: strategy returned empty calendar; raw=%s",
                job_id, str(result)[:500],
            )
            raise RuntimeError(job.error_message)

        # Coerce each day's `platforms` field to a list of strings.
        # LLMs (especially Gemini in "helpful" mode) return this field in
        # at least three shapes:
        #   1. ["instagram", "twitter"]                          ← what we want
        #   2. [{"platform": "instagram", "post_copy": "..."}]   ← array of objects
        #   3. {"instagram": {"post_type": "...", ...}, ...}     ← dict keyed by platform
        # Downstream code iterates platforms as strings, so we normalize all
        # three shapes here.
        for day in calendar:
            raw_platforms = day.get("platforms")

            # Shape 3: dict keyed by platform name.
            if isinstance(raw_platforms, dict):
                coerced = [
                    name.lower().strip()
                    for name in raw_platforms.keys()
                    if isinstance(name, str) and name
                ]
                if coerced:
                    logger.warning(
                        "Job %s day %s: coerced dict-keyed platforms → strings: %s",
                        job_id, day.get("day"), coerced,
                    )
                day["platforms"] = coerced
                continue

            # Shape 2: list of objects.
            if isinstance(raw_platforms, list) and raw_platforms and isinstance(raw_platforms[0], dict):
                coerced = []
                for p in raw_platforms:
                    name = p.get("platform") or p.get("name")
                    if isinstance(name, str) and name:
                        coerced.append(name.lower().strip())
                if coerced:
                    logger.warning(
                        "Job %s day %s: coerced list-of-dicts platforms → strings: %s",
                        job_id, day.get("day"), coerced,
                    )
                day["platforms"] = coerced
                continue

            # Shape 1 (good) or unexpected types.
            if isinstance(raw_platforms, list) and raw_platforms and not isinstance(raw_platforms[0], str):
                logger.warning(
                    "Job %s day %s: unexpected platforms element type %s; dropping day",
                    job_id, day.get("day"), type(raw_platforms[0]).__name__,
                )
                day["platforms"] = []
            elif raw_platforms is None:
                day["platforms"] = []

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
        brand_description = brand.description or ""
        brand_sample_content = list(brand.sample_content or [])
        brand_tone = brand.tone or ""
        brand_industry = brand.industry or ""
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
                brand_description=brand_description,
                sample_content=brand_sample_content,
                tone=brand_tone,
                industry=brand_industry,
                input_summary=input_summary,
            )
            try:
                result = await llm.chat_json(
                    model=get_model_name(settings, "creator"),
                    messages=messages,
                    temperature=0.8,
                    max_tokens=1024,
                )
                # New: LLM can reject a piece if the brief is too thin
                # to ground content in specific facts. Log + skip rather
                # than let it hallucinate.
                if isinstance(result, dict) and result.get("error") == "brief_too_thin":
                    logger.warning(
                        "Day %s/%s: LLM flagged brief_too_thin: %s",
                        day_plan.get("day"), platform,
                        result.get("reason", "(no reason given)"),
                    )
                    return None
                return {
                    "day": int(day_plan.get("day", 0)),
                    "platform": platform,
                    "copy": result.get("copy", ""),
                    "hashtags": result.get("hashtags", []),
                    "format": result.get("format", "caption"),
                    "grounded_facts": result.get("grounded_facts", []),
                    "hook_used": result.get("hook_used", ""),
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


async def _auto_deliver(
    job_id: UUID,
    session_factory: async_sessionmaker,
    settings: Settings,
):
    """Dispatch the configured delivery modes after a successful run.

    ``settings.delivery_mode`` controls behavior:
      * ``zip``   — build a local ZIP (always works; no creds)
      * ``drive`` — upload a Drive folder (requires google creds)
      * ``both``  — do both; stamp the job with the Drive link
                    (frontend prefers Drive when present)

    If Drive is requested but unconfigured, we log a warning and fall
    back to ZIP so the client still gets *something*.
    """
    mode = (settings.delivery_mode or "zip").strip().lower()
    if mode not in {"zip", "drive", "both"}:
        logger.warning(
            "Unknown delivery_mode=%r for job %s; defaulting to zip.",
            mode, job_id,
        )
        mode = "zip"

    wants_drive = mode in {"drive", "both"}
    wants_zip = mode in {"zip", "both"}

    # Validate Drive config up front. Fall back silently to ZIP-only
    # if creds are missing — a running demo is better than a 500.
    if wants_drive and not settings.google_credentials_path:
        logger.warning(
            "Job %s: delivery_mode=%s but google_credentials_path is unset; "
            "falling back to zip-only delivery.",
            job_id, mode,
        )
        wants_drive = False
        wants_zip = True

    # ZIP first — cheap, local, stamps delivery_url with the path.
    if wants_zip:
        from app.services.export_service import build_zip_archive
        async with session_factory() as db:
            try:
                zip_path, piece_count = await build_zip_archive(db, job_id)
                logger.info(
                    "Job %s: built ZIP (%d pieces) at %s",
                    job_id, piece_count, zip_path,
                )
            except Exception as e:
                logger.error("Job %s: ZIP build failed: %s", job_id, e, exc_info=True)

    # Drive second — if successful it overwrites delivery_type+url so
    # the frontend shows the richer "Open in Drive" experience.
    if wants_drive:
        from app.services.drive_delivery_service import deliver_to_drive
        async with session_factory() as db:
            try:
                await deliver_to_drive(
                    db,
                    job_id,
                    credentials_path=settings.google_credentials_path,
                    root_folder_id=settings.google_drive_root_folder_id or None,
                )
            except Exception as e:
                logger.error(
                    "Job %s: Drive delivery failed: %s (ZIP remains as fallback)",
                    job_id, e, exc_info=True,
                )
