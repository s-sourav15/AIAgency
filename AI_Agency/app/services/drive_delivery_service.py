"""Drive delivery — the agency-feel alternative to ZIP.

ZIP gives you a file. Drive gives you a folder that *feels* like a
deliverable from a real agency: a 30-Day Content Calendar Google Doc,
all the images, and the raw CSV/JSON for anyone who wants to pipe it
into Buffer. Open one link, see the whole month.

Shape of a Drive delivery folder::

    Utsuk Deliveries / <Brand Name> / <YYYY-MM-DD HHMM UTC> /
      ├── 30-Day Content Calendar.gdoc   ← Google Doc (human-readable)
      ├── content.csv                    ← Buffer/Hootsuite import
      ├── content.json                   ← raw data
      ├── calendar.json                  ← strategy (themes, pillars)
      └── images/
            ├── day1_instagram.webp
            ├── day2_twitter.webp
            └── ...

The folder is made viewable by anyone with the link. We stamp the job
row with ``delivery_type="drive"`` and ``delivery_url=<folder link>`` so
the frontend can render an "Open in Drive" button.

This is an async-wrapper around the googleapiclient (which is sync).
We run the blocking calls in a thread via ``asyncio.to_thread`` so the
FastAPI event loop is never blocked on network I/O.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.models.generation_job import GenerationJob
from app.services.export_service import (
    _brand_slug,
    brand_output_dir,
    export_csv,
    export_json,
)
from app.utils.gdrive_client import GDriveClient

logger = logging.getLogger(__name__)


# Root folder title on the service-account / OAuth-owner's Drive. When
# GOOGLE_DRIVE_ROOT_FOLDER_ID is set in settings we nest under that id;
# otherwise we create this folder at the Drive root the first time.
DEFAULT_ROOT_FOLDER_NAME = "Utsuk Deliveries"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def deliver_to_drive(
    db: AsyncSession,
    job_id: UUID,
    credentials_path: str,
    root_folder_id: str | None = None,
) -> dict[str, Any]:
    """Build a Drive folder deliverable for a generation job.

    Returns a dict shaped like::

        {
            "job_id": "...",
            "delivery_type": "drive",
            "delivery_url": "https://drive.google.com/drive/folders/<id>",
            "folder_id": "<id>",
            "doc_url": "https://docs.google.com/document/d/.../edit",
            "piece_count": 30,
            "image_count": 12,
        }

    Raises ``ValueError`` if the job or brand cannot be found. Raises
    ``FileNotFoundError`` if ``credentials_path`` does not exist.
    """
    if not credentials_path or not os.path.exists(credentials_path):
        raise FileNotFoundError(
            f"Google credentials not found at {credentials_path!r}. "
            "Set GOOGLE_CREDENTIALS_PATH in .env."
        )

    job = await db.get(GenerationJob, str(job_id))
    if job is None:
        raise ValueError(f"Job {job_id} not found")

    brand = await db.get(Brand, job.brand_id)
    if brand is None:
        raise ValueError(f"Brand {job.brand_id} for job {job_id} not found")

    # Gather everything we need *before* we start calling Drive. Fail
    # fast on DB errors; never leave a half-built folder because we
    # couldn't read content pieces.
    csv_data = await export_csv(db, brand.id)
    json_data = await export_json(db, brand.id)
    piece_count = len(json_data)
    calendar_data = job.calendar or {}

    # Pieces for the Google Doc (ordered by day then platform).
    pieces = await _load_pieces_for_doc(db, brand.id)

    images_dir = os.path.join(brand_output_dir(brand.name), "images")
    image_files: list[str] = []
    if os.path.isdir(images_dir):
        image_files = sorted(
            os.path.join(images_dir, f)
            for f in os.listdir(images_dir)
            if os.path.isfile(os.path.join(images_dir, f)) and not f.startswith(".")
        )

    # All Drive API calls happen inside this thread so we never block
    # the event loop. The client caches the HTTP transport internally
    # so this is fine to run per-job.
    def _blocking_upload() -> dict[str, Any]:
        gdrive = GDriveClient(credentials_path)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H%M UTC")

        # Folder: <root> / <Brand> / <timestamp>
        root_id = root_folder_id or _ensure_root(gdrive)
        brand_folder = gdrive.create_folder(brand.name, parent_id=root_id)
        job_folder = gdrive.create_folder(timestamp, parent_id=brand_folder)

        # Make job folder shareable so the client can just click the link.
        _make_shareable(gdrive, job_folder)

        # 1. Google Doc — the human-readable deliverable.
        doc_id, doc_url = _create_calendar_doc(
            gdrive,
            parent_id=job_folder,
            brand_name=brand.name,
            calendar=calendar_data,
            pieces=pieces,
            num_days=job.num_days or 30,
        )

        # 2. Raw files.
        _upload_text(
            gdrive, job_folder, "content.csv", csv_data, mime_type="text/csv"
        )
        _upload_text(
            gdrive,
            job_folder,
            "content.json",
            json.dumps(json_data, indent=2, ensure_ascii=False),
            mime_type="application/json",
        )
        if calendar_data:
            _upload_text(
                gdrive,
                job_folder,
                "calendar.json",
                json.dumps(calendar_data, indent=2, ensure_ascii=False),
                mime_type="application/json",
            )

        # 3. Images — nested folder for tidiness.
        image_count = 0
        if image_files:
            images_folder = gdrive.create_folder("images", parent_id=job_folder)
            for path in image_files:
                try:
                    gdrive.upload_image(path, images_folder)
                    image_count += 1
                except Exception as e:  # pragma: no cover — network
                    logger.warning("Failed to upload %s to Drive: %s", path, e)

        folder_url = f"https://drive.google.com/drive/folders/{job_folder}"
        return {
            "folder_id": job_folder,
            "folder_url": folder_url,
            "doc_id": doc_id,
            "doc_url": doc_url,
            "image_count": image_count,
        }

    try:
        result = await asyncio.to_thread(_blocking_upload)
    except Exception as e:
        logger.exception("Drive delivery failed for job %s: %s", job_id, e)
        raise

    # Stamp the job row.
    job.delivery_type = "drive"
    job.delivery_url = result["folder_url"]
    job.delivered_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(
        "Delivered job %s to Drive: %s (%d pieces, %d images)",
        job_id,
        result["folder_url"],
        piece_count,
        result["image_count"],
    )

    return {
        "job_id": str(job_id),
        "delivery_type": "drive",
        "delivery_url": result["folder_url"],
        "folder_id": result["folder_id"],
        "doc_url": result["doc_url"],
        "piece_count": piece_count,
        "image_count": result["image_count"],
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _load_pieces_for_doc(
    db: AsyncSession, brand_id: Any
) -> list[ContentPiece]:
    from sqlalchemy import select

    result = await db.execute(
        select(ContentPiece)
        .where(ContentPiece.brand_id == str(brand_id))
        .where(ContentPiece.status == "validated")
        .order_by(ContentPiece.day_number, ContentPiece.platform)
    )
    return list(result.scalars().all())


def _ensure_root(gdrive: GDriveClient) -> str:
    """Return id of the 'Utsuk Deliveries' root folder, creating if missing.

    We look up by name at the Drive root. If two folders with the same
    name exist (unlikely but possible on an owner's personal Drive) we
    pick the oldest — callers can override with GOOGLE_DRIVE_ROOT_FOLDER_ID
    for deterministic behavior.
    """
    query = (
        f"name = '{DEFAULT_ROOT_FOLDER_NAME}' "
        "and mimeType = 'application/vnd.google-apps.folder' "
        "and trashed = false"
    )
    resp = gdrive.service.files().list(
        q=query,
        fields="files(id,name,createdTime)",
        pageSize=10,
    ).execute()
    files = resp.get("files", [])
    if files:
        files.sort(key=lambda f: f.get("createdTime", ""))
        return files[0]["id"]
    return gdrive.create_folder(DEFAULT_ROOT_FOLDER_NAME)


def _make_shareable(gdrive: GDriveClient, file_id: str) -> None:
    """Make a file/folder readable by anyone with the link."""
    gdrive.service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()


def _upload_text(
    gdrive: GDriveClient,
    parent_id: str,
    filename: str,
    content: str,
    mime_type: str,
) -> str:
    """Upload a text blob as a file in Drive. Returns file id."""
    from googleapiclient.http import MediaInMemoryUpload

    metadata = {"name": filename, "parents": [parent_id]}
    media = MediaInMemoryUpload(content.encode("utf-8"), mimetype=mime_type)
    file = gdrive.service.files().create(
        body=metadata, media_body=media, fields="id"
    ).execute()
    return file["id"]


def _create_calendar_doc(
    gdrive: GDriveClient,
    *,
    parent_id: str,
    brand_name: str,
    calendar: dict,
    pieces: list[ContentPiece],
    num_days: int,
) -> tuple[str, str]:
    """Create a Google Doc with the full content calendar rendered.

    Returns ``(doc_id, doc_url)``.

    Implementation note: we create the file as ``text/markdown`` and
    let Drive convert it to a Google Doc via ``uploadType=multipart``.
    This renders the headings, bold text, and day separators correctly
    and avoids the much-slower Docs API (50+ requests for a 30-day doc).
    """
    from googleapiclient.http import MediaInMemoryUpload

    markdown = _render_calendar_markdown(brand_name, calendar, pieces, num_days)

    metadata = {
        "name": f"{brand_name} — 30-Day Content Calendar",
        "parents": [parent_id],
        "mimeType": "application/vnd.google-apps.document",
    }
    media = MediaInMemoryUpload(markdown.encode("utf-8"), mimetype="text/markdown")
    file = gdrive.service.files().create(
        body=metadata, media_body=media, fields="id,webViewLink"
    ).execute()

    # Make doc readable by anyone with the link (the folder is already
    # shareable but individual files inherit folder perms; explicit is
    # safer).
    _make_shareable(gdrive, file["id"])

    return file["id"], file.get("webViewLink", "")


def _render_calendar_markdown(
    brand_name: str,
    calendar: dict,
    pieces: list[ContentPiece],
    num_days: int,
) -> str:
    """Render the full calendar as a single Markdown doc.

    Structure:
      # <Brand> — 30-Day Content Calendar
      _Generated <timestamp>_

      ## Strategy
      (pillars, tone, hooks from calendar)

      ## Day 1: <theme>
      ### Instagram
      <copy>
      `#hashtag1 #hashtag2`

      ### Twitter
      ...

      ## Day 2: ...
    """
    lines: list[str] = []
    lines.append(f"# {brand_name} — 30-Day Content Calendar")
    lines.append("")
    lines.append(f"_Generated {datetime.now(timezone.utc).strftime('%B %d, %Y')} by Utsuk_")
    lines.append("")

    # --- Strategy section (if present on the job) ---
    strategy = _extract_strategy(calendar)
    if strategy:
        lines.append("## Strategy")
        lines.append("")
        for key, value in strategy.items():
            label = key.replace("_", " ").title()
            if isinstance(value, list):
                lines.append(f"**{label}:**")
                for item in value:
                    lines.append(f"- {item}")
            else:
                lines.append(f"**{label}:** {value}")
            lines.append("")

    # --- Day-by-day ---
    by_day: dict[int, list[ContentPiece]] = {}
    for p in pieces:
        by_day.setdefault(p.day_number or 0, []).append(p)

    # Theme lookup from calendar if available.
    day_themes = _extract_day_themes(calendar)

    if not by_day:
        lines.append("## Content")
        lines.append("")
        lines.append("_No validated content pieces yet — the pipeline may still be running._")
        lines.append("")
        return "\n".join(lines)

    for day_num in sorted(by_day.keys()):
        theme = day_themes.get(day_num, "")
        header = f"## Day {day_num}"
        if theme:
            header += f": {theme}"
        lines.append(header)
        lines.append("")

        for piece in by_day[day_num]:
            platform = (piece.platform or "").title() or "Post"
            fmt = piece.format or ""
            heading = f"### {platform}"
            if fmt and fmt.lower() != platform.lower():
                heading += f" — {fmt}"
            lines.append(heading)
            lines.append("")

            copy_text = (piece.copy or "").strip()
            if copy_text:
                lines.append(copy_text)
                lines.append("")

            hashtags = piece.hashtags or []
            if hashtags:
                tag_str = " ".join(f"#{h.lstrip('#')}" for h in hashtags)
                lines.append(f"`{tag_str}`")
                lines.append("")

            if piece.validation_score is not None:
                lines.append(f"_Quality score: {piece.validation_score:.2f}_")
                lines.append("")

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def _extract_strategy(calendar: dict) -> dict[str, Any]:
    """Pull the human-readable top-level strategy fields out of ``calendar``.

    The creator emits varying shapes over time — be defensive.
    """
    if not isinstance(calendar, dict):
        return {}
    out: dict[str, Any] = {}
    for key in ("tone", "pillars", "content_pillars", "hooks", "goals", "audience"):
        if key in calendar and calendar[key]:
            out[key] = calendar[key]
    return out


def _extract_day_themes(calendar: dict) -> dict[int, str]:
    """Map day_number → theme string, if the calendar carries one."""
    if not isinstance(calendar, dict):
        return {}
    days = calendar.get("days") or calendar.get("calendar") or []
    themes: dict[int, str] = {}
    for d in days:
        if not isinstance(d, dict):
            continue
        num = d.get("day_number") or d.get("day")
        theme = d.get("theme") or d.get("topic")
        if isinstance(num, int) and theme:
            themes[num] = str(theme)
    return themes
