import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text, JSON

from app.models.base import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    colors = Column(JSON, default=list)
    fonts = Column(JSON, default=list)
    tone = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    email = Column(String(320), nullable=True)
    voice_profile = Column(JSON, nullable=True)
    visual_style = Column(JSON, nullable=True)
    sample_content = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
