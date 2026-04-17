import csv
import io
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_piece import ContentPiece


async def export_csv(db: AsyncSession, brand_id: UUID) -> str:
    result = await db.execute(
        select(ContentPiece)
        .where(ContentPiece.brand_id == str(brand_id))
        .where(ContentPiece.status == "validated")
        .order_by(ContentPiece.day_number, ContentPiece.platform)
    )
    pieces = list(result.scalars().all())

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Day", "Platform", "Format", "Copy", "Hashtags",
        "Image URL", "Quality Score", "Status",
    ])
    for p in pieces:
        hashtags = " ".join(f"#{h}" for h in (p.hashtags or []))
        image_url = (p.image_urls or [""])[0] if p.image_urls else ""
        writer.writerow([
            p.day_number, p.platform, p.format, p.copy,
            hashtags, image_url,
            f"{p.validation_score:.2f}" if p.validation_score else "",
            p.status,
        ])
    return output.getvalue()


async def export_json(db: AsyncSession, brand_id: UUID) -> list[dict]:
    result = await db.execute(
        select(ContentPiece)
        .where(ContentPiece.brand_id == str(brand_id))
        .where(ContentPiece.status == "validated")
        .order_by(ContentPiece.day_number, ContentPiece.platform)
    )
    pieces = list(result.scalars().all())

    return [
        {
            "day": p.day_number,
            "platform": p.platform,
            "format": p.format,
            "copy": p.copy,
            "hashtags": p.hashtags or [],
            "image_urls": p.image_urls or [],
            "quality_score": p.validation_score,
            "status": p.status,
        }
        for p in pieces
    ]
