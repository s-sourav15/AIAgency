from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db
from app import database
from app.dependencies import get_settings
from app.models.generation_job import GenerationJob
from app.models.content_piece import ContentPiece
from app.schemas.generation import GenerationRequest, JobResponse
from app.services import brand_service
from app.services.creator_service import run_pipeline

router = APIRouter()


@router.post("/generate", response_model=JobResponse)
async def start_generation(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    # Verify brand exists
    brand = await brand_service.get_brand(db, request.brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Create job
    job = GenerationJob(
        brand_id=str(request.brand_id),
        input_type=request.input_type,
        input_data=request.input_data,
        platforms=request.platforms,
        num_days=request.num_days,
        status="pending",
    )
    db.add(job)
    await db.flush()

    # Spawn pipeline in background
    background_tasks.add_task(
        run_pipeline,
        job_id=job.id,
        session_factory=database.async_session_factory,
        settings=settings,
    )

    return job


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(GenerationJob, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/stats")
async def get_job_stats(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(GenerationJob, str(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = await db.execute(
        select(ContentPiece).where(ContentPiece.job_id == str(job_id))
    )
    pieces = list(result.scalars().all())

    validated = [p for p in pieces if p.status == "validated"]
    avg_score = (
        sum(p.validation_score for p in validated if p.validation_score)
        / len(validated)
        if validated
        else 0
    )
    total_regens = sum(p.regeneration_count for p in pieces)

    return {
        "job_id": str(job_id),
        "status": job.status,
        "total_pieces": len(pieces),
        "validated_pieces": len(validated),
        "average_quality_score": round(avg_score, 3),
        "total_regenerations": total_regens,
    }
