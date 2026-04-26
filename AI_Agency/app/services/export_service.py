"""Export services: CSV, JSON, and ZIP archives for delivered calendars.

Block E introduces `build_zip_archive`, which packages a job's full
deliverable (CSV + JSON + calendar.json + images/ directory) into a
single downloadable zipfile. This is the default delivery method for v1
— shareable Drive links come later when we wire Drive OAuth properly.
"""

import csv
import io
import json
import logging
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.models.generation_job import GenerationJob

logger = logging.getLogger(__name__)


# Where all deliverables live on disk. Mirrors what run.py / image_service
# already use: ``output/{brand_slug}/``. Zip files land in ``output/_zips/``
# so they don't pollute individual brand folders.
OUTPUT_ROOT = "output"
ZIP_ROOT = os.path.join(OUTPUT_ROOT, "_zips")


def _brand_slug(brand_name: str) -> str:
    """Match run.py's convention: lowercase, spaces→underscores."""
    return brand_name.lower().replace(" ", "_")


def brand_output_dir(brand_name: str) -> str:
    """Absolute-ish path to the brand's output directory."""
    return os.path.join(OUTPUT_ROOT, _brand_slug(brand_name))


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


async def build_zip_archive(
    db: AsyncSession,
    job_id: UUID,
) -> tuple[str, int]:
    """Build a ZIP deliverable for a generation job.

    Contents of the zip:
      - ``<brand>/content.csv`` — Buffer/Hootsuite-compatible CSV
      - ``<brand>/content.json`` — raw JSON dump of all validated pieces
      - ``<brand>/calendar.json`` — top-level strategy + day themes
        (if present on the job)
      - ``<brand>/images/*`` — every image file under ``output/<brand>/images/``
        that exists on disk

    Also updates the job row:
      - ``delivery_type = "zip"``
      - ``delivery_url = <absolute path to the zip>``
      - ``delivered_at = now(utc)``

    Returns ``(absolute_zip_path, piece_count)``. Raises ``ValueError`` if
    the job or its brand cannot be found; does NOT raise for missing image
    files (they are skipped, logged).
    """
    job = await db.get(GenerationJob, str(job_id))
    if job is None:
        raise ValueError(f"Job {job_id} not found")

    brand = await db.get(Brand, job.brand_id)
    if brand is None:
        raise ValueError(f"Brand {job.brand_id} for job {job_id} not found")

    slug = _brand_slug(brand.name)
    brand_dir = brand_output_dir(brand.name)
    images_dir = os.path.join(brand_dir, "images")

    # Generate fresh CSV + JSON (cheap: one query each) and pack them in
    # with whatever is already on disk.
    csv_data = await export_csv(db, brand.id)
    json_data = await export_json(db, brand.id)
    piece_count = len(json_data)

    os.makedirs(ZIP_ROOT, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    zip_filename = f"{slug}_{timestamp}.zip"
    zip_path = os.path.abspath(os.path.join(ZIP_ROOT, zip_filename))

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Always included, even if they weren't already on disk.
        zf.writestr(f"{slug}/content.csv", csv_data)
        zf.writestr(
            f"{slug}/content.json",
            json.dumps(json_data, indent=2, ensure_ascii=False),
        )

        # calendar.json — job.calendar is the full strategy object
        if job.calendar is not None:
            zf.writestr(
                f"{slug}/calendar.json",
                json.dumps(job.calendar, indent=2, ensure_ascii=False),
            )

        # Images directory, if it exists.
        if os.path.isdir(images_dir):
            for img_name in sorted(os.listdir(images_dir)):
                src = os.path.join(images_dir, img_name)
                if not os.path.isfile(src):
                    continue
                try:
                    zf.write(src, arcname=f"{slug}/images/{img_name}")
                except OSError as e:
                    logger.warning(
                        "Skipping image %s in zip for job %s: %s",
                        img_name, job_id, e,
                    )

    # Update job row.
    job.delivery_type = "zip"
    job.delivery_url = zip_path
    job.delivered_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(
        "Built zip for job %s: %s (%d pieces)",
        job_id, zip_path, piece_count,
    )
    return zip_path, piece_count


def zip_size_bytes(zip_path: str) -> int:
    """Small helper so callers don't need to import os just to stat the file."""
    try:
        return os.path.getsize(zip_path)
    except OSError:
        return 0
