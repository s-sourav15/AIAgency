from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class BrandCreate(BaseModel):
    name: str
    colors: list[str] = []
    fonts: list[str] = []
    tone: str | None = None
    industry: str | None = None
    sample_content: list[str] = []
    description: str | None = None
    email: str | None = None


class BrandResponse(BaseModel):
    id: UUID
    name: str
    logo_url: str | None = None
    colors: list
    fonts: list
    tone: str | None
    industry: str | None
    email: str | None = None
    voice_profile: dict | None
    visual_style: dict | None = None
    sample_content: list
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
