import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, JSON

from app.models.base import Base


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False)
    input_type = Column(String(50), nullable=False)  # photo, blog, text
    input_data = Column(Text, nullable=True)
    # TODO: remove when photo-upload ships and migrations land. Not written
    # to by any current code path. Safe to keep as NULL for now; dropping
    # requires alembic migration infra we don't have yet.
    input_image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")
    platforms = Column(JSON, default=list)
    num_days = Column(Integer, default=30)
    calendar = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    # Delivery tracking (Block E). Set when the job's deliverable is built.
    # delivery_type: "zip" (local path) or "drive" (shareable URL).
    delivery_type = Column(String(20), nullable=True)
    delivery_url = Column(String(1000), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
