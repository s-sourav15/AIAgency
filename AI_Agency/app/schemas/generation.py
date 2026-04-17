from uuid import UUID
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class GenerationRequest(BaseModel):
    brand_id: UUID
    input_type: Literal["photo", "blog", "text"]
    input_data: str
    platforms: list[Literal["instagram", "twitter", "linkedin", "ads", "email"]] = [
        "instagram", "twitter", "linkedin"
    ]
    num_days: int = 30


class JobResponse(BaseModel):
    id: UUID
    brand_id: UUID
    input_type: str
    status: str
    platforms: list
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
