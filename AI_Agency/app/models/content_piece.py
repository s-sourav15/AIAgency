import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON

from app.models.base import Base


class ContentPiece(Base):
    __tablename__ = "content_pieces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("generation_jobs.id"), nullable=False)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    platform = Column(String(50), nullable=False)
    format = Column(String(50), nullable=False)
    copy = Column(Text, nullable=False)
    image_urls = Column(JSON, default=list)
    hashtags = Column(JSON, default=list)
    validation_score = Column(Float, nullable=True)
    validation_details = Column(JSON, nullable=True)
    validation_feedback = Column(Text, nullable=True)
    regeneration_count = Column(Integer, default=0)
    status = Column(String(50), default="draft")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
