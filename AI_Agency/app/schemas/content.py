from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ContentPieceResponse(BaseModel):
    id: UUID
    job_id: UUID
    brand_id: UUID
    day_number: int
    platform: str
    format: str
    copy_text: str = Field(alias="copy")
    image_urls: list
    hashtags: list
    validation_score: float | None
    validation_details: dict | None
    regeneration_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class CalendarDayResponse(BaseModel):
    day_number: int
    theme: str | None = None
    pieces: list[ContentPieceResponse]


class CalendarResponse(BaseModel):
    brand_id: UUID
    job_id: UUID
    total_pieces: int
    days: list[CalendarDayResponse]
