"""Block F — /api/intake route.

One endpoint wraps the two-step brand creation + job kickoff flow so
the web form can submit once and receive `{brand_id, job_id}` back.

Voice-profile extraction runs as a background task (mirrors the
existing `/api/brands` behavior); the generation pipeline also runs
in the background. The endpoint returns immediately with
``job.status == "pending"`` so the frontend can navigate to the job
status page and poll.
"""
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import database
from app.config import Settings
from app.database import get_db
from app.dependencies import get_settings
from app.models.generation_job import GenerationJob
from app.schemas.brand import BrandCreate
from app.schemas.intake import IntakeRequest, IntakeResponse
from app.services import brand_service
from app.services.creator_service import run_pipeline
from app.utils.llm_factory import get_llm_client, get_model_name

router = APIRouter()


@router.post("/intake", response_model=IntakeResponse, status_code=202)
async def create_intake(
    request: IntakeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    # 1. Create the brand row.
    sample_list = [s.strip() for s in (request.sample_content or "").split("\n\n") if s.strip()]
    if not sample_list and (request.sample_content or "").strip():
        sample_list = [request.sample_content.strip()]

    brand_payload = BrandCreate(
        name=request.brand_name,
        tone=", ".join(request.tone) if request.tone else None,
        industry=request.industry,
        sample_content=sample_list,
        description=request.brand_description,
        email=request.email,
    )
    brand = await brand_service.create_brand(db, brand_payload)
    await db.flush()

    # 2. Kick voice extraction in background (only if we have samples).
    if sample_list:
        llm = get_llm_client(settings, role="creator")

        async def extract_voice():
            async with database.async_session_factory() as bg_db:
                await brand_service.extract_voice_profile(
                    bg_db, brand.id, llm, get_model_name(settings, "creator")
                )
            await llm.close()

        background_tasks.add_task(extract_voice)

    # 3. Create the generation job and kick the pipeline.
    #    We seed input_data from content_brief if present, otherwise brand_description.
    seed_text = (request.content_brief or request.brand_description).strip()

    job = GenerationJob(
        brand_id=str(brand.id),
        input_type="text",
        input_data=seed_text,
        platforms=request.platforms,
        num_days=request.num_days,
        status="pending",
    )
    db.add(job)
    await db.flush()

    background_tasks.add_task(
        run_pipeline,
        job_id=job.id,
        session_factory=database.async_session_factory,
        settings=settings,
    )

    # Commit brand + job together so the background tasks see them.
    await db.commit()

    return IntakeResponse(
        brand_id=brand.id,
        job_id=job.id,
        status=job.status,
        redirect_to=f"/dashboard/jobs/{job.id}",
    )
