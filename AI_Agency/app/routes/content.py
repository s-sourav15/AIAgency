from uuid import UUID
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.generation_job import GenerationJob
from app.models.content_piece import ContentPiece
from app.schemas.content import ContentPieceResponse, CalendarDayResponse, CalendarResponse

router = APIRouter()


@router.get("/content/{brand_id}/calendar", response_model=CalendarResponse)
async def get_calendar(
    brand_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    # Get latest completed job for this brand
    result = await db.execute(
        select(GenerationJob)
        .where(GenerationJob.brand_id == str(brand_id))
        .where(GenerationJob.status == "completed")
        .order_by(GenerationJob.completed_at.desc())
        .limit(1)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="No completed generation found for this brand")

    # Get all pieces for this job
    result = await db.execute(
        select(ContentPiece)
        .where(ContentPiece.job_id == job.id)
        .order_by(ContentPiece.day_number, ContentPiece.platform)
    )
    pieces = list(result.scalars().all())

    # Group by day
    by_day = defaultdict(list)
    for p in pieces:
        by_day[p.day_number].append(p)

    # Build calendar with themes from job.calendar
    calendar_data = job.calendar or {}
    day_themes = {}
    for day_plan in calendar_data.get("days", []):
        day_themes[day_plan.get("day")] = day_plan.get("theme", "")

    days = []
    for day_num in sorted(by_day.keys()):
        days.append(CalendarDayResponse(
            day_number=day_num,
            theme=day_themes.get(day_num),
            pieces=[ContentPieceResponse.model_validate(p) for p in by_day[day_num]],
        ))

    return CalendarResponse(
        brand_id=brand_id,
        job_id=job.id,
        total_pieces=len(pieces),
        days=days,
    )


@router.get("/content/{brand_id}/pieces", response_model=list[ContentPieceResponse])
async def get_pieces(
    brand_id: UUID,
    platform: str | None = Query(None),
    day: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ContentPiece)
        .where(ContentPiece.brand_id == str(brand_id))
        .order_by(ContentPiece.day_number, ContentPiece.platform)
    )
    if platform:
        query = query.where(ContentPiece.platform == platform)
    if day:
        query = query.where(ContentPiece.day_number == day)

    result = await db.execute(query)
    return list(result.scalars().all())


class ContentPieceUpdate(BaseModel):
    copy: str | None = None
    hashtags: list[str] | None = None


@router.patch("/content/pieces/{piece_id}")
async def update_piece(
    piece_id: UUID,
    update: ContentPieceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update copy and/or hashtags for a piece (used by feedback loop)."""
    piece = await db.get(ContentPiece, str(piece_id))
    if not piece:
        raise HTTPException(status_code=404, detail="Piece not found")

    if update.copy is not None:
        piece.copy = update.copy
        piece.regeneration_count += 1
    if update.hashtags is not None:
        piece.hashtags = update.hashtags

    await db.commit()
    return {"status": "updated", "piece_id": str(piece_id)}
