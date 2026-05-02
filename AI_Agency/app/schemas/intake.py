"""Block F — intake wiring schemas.

One-shot payload from the Utsuk web intake form. Wraps brand creation
and job kickoff into a single endpoint so the frontend doesn't have
to orchestrate two requests.
"""
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID


# ---- Frontend → Backend platform normalization ------------------------------

# The frontend uses human-friendly labels; the backend generation schema
# accepts lowercase keys. Keep these two in sync when we add platforms.
_PLATFORM_MAP: dict[str, str] = {
    "instagram": "instagram",
    "twitter": "twitter",
    "twitter/x": "twitter",
    "x": "twitter",
    "linkedin": "linkedin",
    "ads": "ads",
    "email": "email",
}

_VALID_BACKEND_PLATFORMS = {"instagram", "twitter", "linkedin", "ads", "email"}


def normalize_platforms(raw: list[str]) -> list[str]:
    """Lowercase + map to backend platform keys, dropping unknowns."""
    out: list[str] = []
    for p in raw or []:
        key = _PLATFORM_MAP.get((p or "").strip().lower())
        if key and key in _VALID_BACKEND_PLATFORMS and key not in out:
            out.append(key)
    return out


# ---- Request / response -----------------------------------------------------

IntakeMode = Literal["fast", "full"]


class IntakeRequest(BaseModel):
    """Payload shape matches web/app/page.tsx submitPayload()."""

    mode: IntakeMode = "full"

    brand_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    industry: str = Field(..., min_length=1, max_length=64)
    num_days: int = Field(..., ge=1, le=30)

    brand_description: str = Field(..., min_length=10)
    tone: list[str] = Field(default_factory=list)

    # Seed content for voice extraction + generation brief.
    sample_content: str = ""
    content_brief: str | None = None

    platforms: list[str] = Field(..., min_length=1)

    # Frontend currently doesn't upload images — this is a count hint only.
    brand_illustrations_count: int = 0

    @field_validator("tone")
    @classmethod
    def _clean_tone(cls, v: list[str]) -> list[str]:
        return [t.strip().lower() for t in v if t and t.strip()]

    @field_validator("platforms")
    @classmethod
    def _clean_platforms(cls, v: list[str]) -> list[str]:
        normalized = normalize_platforms(v)
        if not normalized:
            raise ValueError("At least one supported platform is required.")
        return normalized


class IntakeResponse(BaseModel):
    brand_id: UUID
    job_id: UUID
    status: str
    # Echo for UI wiring — lets the client jump straight to the job page.
    redirect_to: str
