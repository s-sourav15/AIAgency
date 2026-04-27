"""Tests for Block E: build_zip_archive + delivery endpoints.

Uses an in-memory SQLite DB and a temp output directory so nothing
touches the real filesystem or the real RDS.
"""

import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.base import Base
from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.models.generation_job import GenerationJob
from app.services import export_service
from app.services.export_service import (
    _brand_slug,
    brand_output_dir,
    build_zip_archive,
    zip_size_bytes,
)


# ---------- Fixtures ----------


@pytest_asyncio.fixture
async def db_session():
    """Fresh in-memory DB with all tables for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def tmp_output_dir(monkeypatch):
    """Redirect export_service's OUTPUT_ROOT / ZIP_ROOT to a temp dir."""
    tmp = tempfile.mkdtemp(prefix="utsuk-test-")
    monkeypatch.setattr(export_service, "OUTPUT_ROOT", tmp)
    monkeypatch.setattr(export_service, "ZIP_ROOT", os.path.join(tmp, "_zips"))
    yield tmp
    shutil.rmtree(tmp, ignore_errors=True)


async def _seed_brand_with_pieces(
    session: AsyncSession,
    brand_name: str = "TestBrand",
    num_pieces: int = 3,
    calendar: dict | None = None,
) -> tuple[Brand, GenerationJob, list[ContentPiece]]:
    """Create a brand + job + N validated content pieces."""
    brand = Brand(
        id=str(uuid4()),
        name=brand_name,
        description="A test brand for zip tests.",
    )
    session.add(brand)
    await session.flush()

    job = GenerationJob(
        id=str(uuid4()),
        brand_id=brand.id,
        input_type="text",
        input_data="seed brief",
        status="completed",
        platforms=["instagram", "linkedin"],
        num_days=num_pieces,
        calendar=calendar,
    )
    session.add(job)
    await session.flush()

    pieces = []
    for i in range(num_pieces):
        p = ContentPiece(
            id=str(uuid4()),
            job_id=job.id,
            brand_id=brand.id,
            day_number=i + 1,
            platform="instagram" if i % 2 == 0 else "linkedin",
            format="post",
            copy=f"Day {i+1} copy for {brand_name}.",
            hashtags=["test", "brand"],
            image_urls=[],
            validation_score=0.85,
            status="validated",
        )
        session.add(p)
        pieces.append(p)
    await session.commit()
    return brand, job, pieces


# ---------- _brand_slug helper ----------


def test_brand_slug_lowercases():
    assert _brand_slug("MyBrand") == "mybrand"


def test_brand_slug_replaces_spaces():
    assert _brand_slug("My Cool Brand") == "my_cool_brand"


def test_brand_slug_combined():
    assert _brand_slug("PlutoApp Test") == "plutoapp_test"


def test_brand_output_dir_uses_slug(tmp_output_dir):
    # monkeypatch redirects OUTPUT_ROOT → tmp
    out = brand_output_dir("My Brand")
    assert out.endswith(os.path.join("my_brand"))


# ---------- zip_size_bytes ----------


def test_zip_size_bytes_missing_returns_zero(tmp_path):
    assert zip_size_bytes(str(tmp_path / "does_not_exist.zip")) == 0


def test_zip_size_bytes_real_file(tmp_path):
    p = tmp_path / "x.txt"
    p.write_bytes(b"hello world")
    assert zip_size_bytes(str(p)) == len(b"hello world")


# ---------- build_zip_archive: happy path ----------


@pytest.mark.asyncio
async def test_build_zip_archive_creates_file(db_session, tmp_output_dir):
    brand, job, _ = await _seed_brand_with_pieces(db_session, num_pieces=2)

    zip_path, piece_count = await build_zip_archive(db_session, job.id)

    assert os.path.isfile(zip_path)
    assert zip_path.endswith(".zip")
    assert piece_count == 2


@pytest.mark.asyncio
async def test_build_zip_archive_contains_csv_and_json(db_session, tmp_output_dir):
    brand, job, _ = await _seed_brand_with_pieces(
        db_session, brand_name="Acme", num_pieces=3,
    )

    zip_path, _ = await build_zip_archive(db_session, job.id)

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        assert "acme/content.csv" in names
        assert "acme/content.json" in names

        json_bytes = zf.read("acme/content.json")
        data = json.loads(json_bytes)
        assert len(data) == 3
        assert data[0]["day"] == 1
        assert data[0]["copy"].startswith("Day 1")

        csv_bytes = zf.read("acme/content.csv")
        csv_str = csv_bytes.decode("utf-8")
        # Header + 3 data rows
        assert csv_str.count("\n") >= 4
        assert "Day 1 copy" in csv_str


@pytest.mark.asyncio
async def test_build_zip_archive_includes_calendar_when_present(
    db_session, tmp_output_dir,
):
    calendar = {"days": [{"day": 1, "theme": "intro"}]}
    brand, job, _ = await _seed_brand_with_pieces(
        db_session, num_pieces=1, calendar=calendar,
    )

    zip_path, _ = await build_zip_archive(db_session, job.id)

    with zipfile.ZipFile(zip_path) as zf:
        assert "testbrand/calendar.json" in zf.namelist()
        parsed = json.loads(zf.read("testbrand/calendar.json"))
        assert parsed == calendar


@pytest.mark.asyncio
async def test_build_zip_archive_omits_calendar_when_null(db_session, tmp_output_dir):
    brand, job, _ = await _seed_brand_with_pieces(db_session, calendar=None)

    zip_path, _ = await build_zip_archive(db_session, job.id)

    with zipfile.ZipFile(zip_path) as zf:
        assert "testbrand/calendar.json" not in zf.namelist()


@pytest.mark.asyncio
async def test_build_zip_archive_includes_images_dir_if_exists(
    db_session, tmp_output_dir,
):
    brand, job, _ = await _seed_brand_with_pieces(db_session, num_pieces=1)

    # Seed fake images in the brand's images/ dir.
    img_dir = os.path.join(brand_output_dir(brand.name), "images")
    os.makedirs(img_dir, exist_ok=True)
    Path(img_dir, "day1_instagram.webp").write_bytes(b"fake-image-bytes")
    Path(img_dir, "day1_linkedin.webp").write_bytes(b"another")

    zip_path, _ = await build_zip_archive(db_session, job.id)

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        assert "testbrand/images/day1_instagram.webp" in names
        assert "testbrand/images/day1_linkedin.webp" in names


@pytest.mark.asyncio
async def test_build_zip_archive_handles_missing_images_dir(
    db_session, tmp_output_dir,
):
    """No images dir on disk → zip builds successfully, just no images."""
    brand, job, _ = await _seed_brand_with_pieces(db_session, num_pieces=1)

    zip_path, _ = await build_zip_archive(db_session, job.id)

    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        # CSV + JSON present, no images/ entries
        assert any(n.endswith("/content.csv") for n in names)
        assert not any("/images/" in n for n in names)


# ---------- build_zip_archive: side effects on job row ----------


@pytest.mark.asyncio
async def test_build_zip_archive_stamps_job_fields(db_session, tmp_output_dir):
    brand, job, _ = await _seed_brand_with_pieces(db_session)
    zip_path, _ = await build_zip_archive(db_session, job.id)

    await db_session.refresh(job)
    assert job.delivery_type == "zip"
    assert job.delivery_url == zip_path
    assert job.delivered_at is not None
    # delivered_at should be recent (within last minute). SQLite strips
    # timezone info, so normalize both sides before subtracting.
    now = datetime.now(timezone.utc)
    stored = job.delivered_at
    if stored.tzinfo is None:
        stored = stored.replace(tzinfo=timezone.utc)
    age = now - stored
    assert age.total_seconds() < 60


@pytest.mark.asyncio
async def test_build_zip_archive_twice_produces_different_files(
    db_session, tmp_output_dir,
):
    brand, job, _ = await _seed_brand_with_pieces(db_session)

    import asyncio
    zip1, _ = await build_zip_archive(db_session, job.id)
    await asyncio.sleep(1.1)  # timestamp granularity is seconds
    zip2, _ = await build_zip_archive(db_session, job.id)

    assert zip1 != zip2
    assert os.path.isfile(zip1)
    assert os.path.isfile(zip2)

    # Job row points at the latest one.
    await db_session.refresh(job)
    assert job.delivery_url == zip2


# ---------- Error paths ----------


@pytest.mark.asyncio
async def test_build_zip_archive_missing_job_raises(db_session, tmp_output_dir):
    with pytest.raises(ValueError, match="not found"):
        await build_zip_archive(db_session, uuid4())


@pytest.mark.asyncio
async def test_build_zip_archive_skips_validation_filter(db_session, tmp_output_dir):
    """Pieces with status != 'validated' should NOT be in the zip.

    Matches export_csv / export_json behavior.
    """
    brand, job, pieces = await _seed_brand_with_pieces(db_session, num_pieces=3)
    # Flip one to "draft"
    pieces[0].status = "draft"
    await db_session.commit()

    zip_path, piece_count = await build_zip_archive(db_session, job.id)
    assert piece_count == 2

    with zipfile.ZipFile(zip_path) as zf:
        data = json.loads(zf.read("testbrand/content.json"))
        assert len(data) == 2
        assert all(p["day"] in (2, 3) for p in data)
