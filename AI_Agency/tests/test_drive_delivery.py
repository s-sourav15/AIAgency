"""Tests for Drive delivery service + route.

Mocks the GDriveClient so we never hit the real Google API. The tests
exercise:

  - Markdown rendering (empty / populated / with strategy block)
  - ``deliver_to_drive`` happy path — folder structure, doc creation,
    file uploads, job row stamped
  - ``deliver_to_drive`` error paths — missing credentials, missing
    job, missing brand
  - Pipeline auto-deliver dispatch (``_auto_deliver``) — zip/drive/both
  - Route behavior — 503 without creds, 404 for missing job, 200 happy
"""

from __future__ import annotations

import os
import shutil
import tempfile
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings
from app.models.base import Base
from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.models.generation_job import GenerationJob
from app.services import drive_delivery_service, export_service
from app.services.drive_delivery_service import (
    _extract_day_themes,
    _extract_strategy,
    _render_calendar_markdown,
    deliver_to_drive,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def tmp_output_dir(monkeypatch):
    tmp = tempfile.mkdtemp(prefix="utsuk-drive-test-")
    monkeypatch.setattr(export_service, "OUTPUT_ROOT", tmp)
    monkeypatch.setattr(export_service, "ZIP_ROOT", os.path.join(tmp, "_zips"))
    yield tmp
    shutil.rmtree(tmp, ignore_errors=True)


@pytest.fixture
def fake_credentials_file(tmp_path):
    """A real file on disk so the 'credentials_path exists' check passes.

    Content is irrelevant because we mock GDriveClient.
    """
    path = tmp_path / "fake-creds.json"
    path.write_text('{"type": "service_account"}')
    return str(path)


class FakeGDriveClient:
    """Records every call so tests can assert structure without real API.

    Mirrors the subset of GDriveClient API that drive_delivery_service uses:
      - create_folder(name, parent_id) → id
      - upload_image(path, folder_id) → {"id", "link"}
      - service.files().create(...).execute()   (for docs + raw files)
      - service.files().list(...).execute()     (for root folder lookup)
      - service.permissions().create(...).execute()
    """

    def __init__(self, *_args, **_kwargs):
        self.folders: list[dict] = []  # [{name, parent_id, id}]
        self.images: list[dict] = []  # [{path, folder_id, id}]
        self.uploaded_files: list[dict] = []  # [{name, parent, mime, body}]
        self.permissions_created: list[str] = []  # file ids
        self._next_id = 0
        self.service = self  # pretend to be the googleapiclient service too

    def _id(self, prefix="id") -> str:
        self._next_id += 1
        return f"{prefix}-{self._next_id}"

    # --- GDriveClient API ---------------------------------------------------

    def create_folder(self, name: str, parent_id: str | None = None) -> str:
        fid = self._id("folder")
        self.folders.append({"id": fid, "name": name, "parent_id": parent_id})
        return fid

    def upload_image(self, file_path: str, folder_id: str) -> dict:
        fid = self._id("img")
        self.images.append({"id": fid, "path": file_path, "folder_id": folder_id})
        return {"id": fid, "link": f"https://drive.example/file/{fid}"}

    # --- service.files() / service.permissions() shims ---------------------

    def files(self):
        return _FakeFiles(self)

    def permissions(self):
        return _FakePermissions(self)


class _FakeRequest:
    def __init__(self, result):
        self._result = result

    def execute(self):
        return self._result


class _FakeFiles:
    def __init__(self, parent: FakeGDriveClient):
        self.p = parent

    def create(self, body=None, media_body=None, fields=None):
        # Used for raw files (CSV/JSON) and Google Doc creation.
        fid = self.p._id("file")
        name = body.get("name") if body else ""
        mime = body.get("mimeType") if body else None
        parents = body.get("parents") if body else []
        parent = parents[0] if parents else None
        # Pull body bytes out of the MediaInMemoryUpload if possible.
        body_bytes = None
        if media_body is not None:
            try:
                body_bytes = media_body.getbytes(0, media_body.size())
            except Exception:
                body_bytes = None
        self.p.uploaded_files.append(
            {
                "id": fid,
                "name": name,
                "parent": parent,
                "mime": mime,
                "media_body": media_body,
                "body_bytes": body_bytes,
            }
        )
        return _FakeRequest(
            {
                "id": fid,
                "webViewLink": f"https://docs.google.com/document/d/{fid}/edit",
            }
        )

    def list(self, q=None, fields=None, pageSize=None):
        # Return "no pre-existing folder" so _ensure_root creates one.
        return _FakeRequest({"files": []})


class _FakePermissions:
    def __init__(self, parent: FakeGDriveClient):
        self.p = parent

    def create(self, fileId=None, body=None):
        self.p.permissions_created.append(fileId)
        return _FakeRequest({"id": "perm-1"})


async def _seed_job(
    session: AsyncSession,
    *,
    brand_name: str = "Pluto",
    num_pieces: int = 4,
    calendar: dict | None = None,
) -> tuple[Brand, GenerationJob]:
    brand = Brand(id=str(uuid4()), name=brand_name, description="social app")
    session.add(brand)
    await session.flush()

    job = GenerationJob(
        id=str(uuid4()),
        brand_id=brand.id,
        input_type="text",
        input_data="launch content",
        status="completed",
        platforms=["instagram", "twitter"],
        num_days=num_pieces,
        calendar=calendar,
    )
    session.add(job)
    await session.flush()

    for i in range(num_pieces):
        session.add(
            ContentPiece(
                id=str(uuid4()),
                job_id=job.id,
                brand_id=brand.id,
                day_number=i + 1,
                platform="instagram" if i % 2 == 0 else "twitter",
                format="post",
                copy=f"Day {i+1} caption for {brand_name}.",
                hashtags=["pluto", f"day{i+1}"],
                image_urls=[],
                validation_score=0.9,
                status="validated",
            )
        )
    await session.commit()
    return brand, job


# ---------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------


def test_render_markdown_empty_pieces_still_includes_header():
    md = _render_calendar_markdown("Acme", {}, [], num_days=30)
    assert "# Acme — 30-Day Content Calendar" in md
    assert "No validated content pieces yet" in md


def test_render_markdown_includes_strategy_block():
    calendar = {
        "tone": "playful",
        "pillars": ["origin", "product", "community"],
        "audience": "indian d2c founders",
    }
    md = _render_calendar_markdown("Utsuk", calendar, [], num_days=30)
    assert "## Strategy" in md
    assert "**Tone:** playful" in md
    assert "- origin" in md
    assert "**Audience:** indian d2c founders" in md


def test_render_markdown_day_and_platform_structure():
    calendar = {"days": [{"day_number": 1, "theme": "Welcome"}]}
    pieces = [
        _piece(day=1, platform="instagram", copy="Hi there.", tags=["hello"]),
        _piece(day=1, platform="twitter", copy="Short hi.", tags=["hi"]),
    ]
    md = _render_calendar_markdown("Utsuk", calendar, pieces, num_days=30)
    assert "## Day 1: Welcome" in md
    assert "### Instagram" in md
    assert "### Twitter" in md
    assert "Hi there." in md
    assert "`#hello`" in md


def _piece(*, day, platform, copy, tags, score=0.9):
    p = MagicMock(spec=ContentPiece)
    p.day_number = day
    p.platform = platform
    p.format = "post"
    p.copy = copy
    p.hashtags = tags
    p.validation_score = score
    return p


def test_extract_strategy_handles_missing_fields():
    assert _extract_strategy({}) == {}
    assert _extract_strategy(None) == {}  # type: ignore[arg-type]
    assert _extract_strategy({"tone": "warm"}) == {"tone": "warm"}


def test_extract_day_themes_tolerates_schema_variants():
    # "days" key
    assert _extract_day_themes(
        {"days": [{"day_number": 1, "theme": "A"}]}
    ) == {1: "A"}
    # Alternate "calendar" key + "day" instead of "day_number"
    assert _extract_day_themes(
        {"calendar": [{"day": 2, "topic": "B"}]}
    ) == {2: "B"}
    # Garbage in → empty out
    assert _extract_day_themes({"days": ["not a dict"]}) == {}
    assert _extract_day_themes("totally not a dict") == {}  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# deliver_to_drive happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_deliver_to_drive_stamps_job_and_creates_folders(
    db_session, tmp_output_dir, fake_credentials_file
):
    _, job = await _seed_job(
        db_session,
        calendar={"tone": "warm", "days": [{"day_number": 1, "theme": "Kickoff"}]},
    )

    fake = FakeGDriveClient()
    with patch.object(drive_delivery_service, "GDriveClient", return_value=fake):
        result = await deliver_to_drive(
            db_session, job.id, credentials_path=fake_credentials_file
        )

    # Result shape
    assert result["delivery_type"] == "drive"
    assert result["piece_count"] == 4
    assert result["delivery_url"].startswith("https://drive.google.com/drive/folders/")

    # Job row stamped
    refreshed = await db_session.get(GenerationJob, job.id)
    assert refreshed.delivery_type == "drive"
    assert refreshed.delivery_url == result["delivery_url"]
    assert refreshed.delivered_at is not None

    # Folder structure: root → brand → timestamp (3 folders minimum)
    assert len(fake.folders) >= 3
    names = [f["name"] for f in fake.folders]
    assert "Utsuk Deliveries" in names  # root
    assert "Pluto" in names              # brand

    # Uploaded files should include the Google Doc, csv, json, calendar.json.
    uploaded_names = [f["name"] for f in fake.uploaded_files]
    assert any("30-Day Content Calendar" in n for n in uploaded_names)
    assert "content.csv" in uploaded_names
    assert "content.json" in uploaded_names
    assert "calendar.json" in uploaded_names


@pytest.mark.asyncio
async def test_deliver_to_drive_uploads_images_when_present(
    db_session, tmp_output_dir, fake_credentials_file
):
    brand, job = await _seed_job(db_session, brand_name="Pluto")

    # Create fake image files on disk under the brand's output dir.
    images_dir = os.path.join(tmp_output_dir, "pluto", "images")
    os.makedirs(images_dir, exist_ok=True)
    for fname in ["day1_instagram.webp", "day2_twitter.webp"]:
        with open(os.path.join(images_dir, fname), "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\nfake")

    fake = FakeGDriveClient()
    with patch.object(drive_delivery_service, "GDriveClient", return_value=fake):
        result = await deliver_to_drive(
            db_session, job.id, credentials_path=fake_credentials_file
        )

    assert result["image_count"] == 2
    image_paths = sorted(os.path.basename(img["path"]) for img in fake.images)
    assert image_paths == ["day1_instagram.webp", "day2_twitter.webp"]


@pytest.mark.asyncio
async def test_deliver_to_drive_reuses_explicit_root_folder_id(
    db_session, tmp_output_dir, fake_credentials_file
):
    _, job = await _seed_job(db_session)

    fake = FakeGDriveClient()
    with patch.object(drive_delivery_service, "GDriveClient", return_value=fake):
        await deliver_to_drive(
            db_session,
            job.id,
            credentials_path=fake_credentials_file,
            root_folder_id="ROOT-PROVIDED",
        )

    # When a root id is explicitly passed, we skip the list() lookup and
    # skip creating "Utsuk Deliveries" at the Drive root.
    folder_names = [f["name"] for f in fake.folders]
    assert "Utsuk Deliveries" not in folder_names
    # First folder created should be the brand under the provided root.
    assert fake.folders[0]["parent_id"] == "ROOT-PROVIDED"


# ---------------------------------------------------------------------------
# deliver_to_drive error paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_deliver_to_drive_missing_credentials_raises(db_session):
    with pytest.raises(FileNotFoundError):
        await deliver_to_drive(
            db_session, uuid4(), credentials_path="/nope/does/not/exist.json"
        )


@pytest.mark.asyncio
async def test_deliver_to_drive_unknown_job_raises(
    db_session, fake_credentials_file
):
    with pytest.raises(ValueError):
        await deliver_to_drive(
            db_session, uuid4(), credentials_path=fake_credentials_file
        )


# ---------------------------------------------------------------------------
# Pipeline auto-delivery dispatch
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_auto_deliver_zip_only_does_not_call_drive(monkeypatch):
    from app.services import creator_service

    settings = Settings(delivery_mode="zip")
    build_zip_mock = AsyncMock(return_value=("/tmp/fake.zip", 30))
    deliver_drive_mock = AsyncMock()

    monkeypatch.setattr(
        "app.services.export_service.build_zip_archive", build_zip_mock
    )
    monkeypatch.setattr(
        "app.services.drive_delivery_service.deliver_to_drive", deliver_drive_mock
    )

    fake_factory = MagicMock()
    fake_factory.return_value.__aenter__ = AsyncMock(return_value=MagicMock())
    fake_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    await creator_service._auto_deliver(uuid4(), fake_factory, settings)

    assert build_zip_mock.await_count == 1
    assert deliver_drive_mock.await_count == 0


@pytest.mark.asyncio
async def test_auto_deliver_drive_without_creds_falls_back_to_zip(monkeypatch):
    from app.services import creator_service

    settings = Settings(delivery_mode="drive", google_credentials_path="")
    build_zip_mock = AsyncMock(return_value=("/tmp/fake.zip", 30))
    deliver_drive_mock = AsyncMock()

    monkeypatch.setattr(
        "app.services.export_service.build_zip_archive", build_zip_mock
    )
    monkeypatch.setattr(
        "app.services.drive_delivery_service.deliver_to_drive", deliver_drive_mock
    )

    fake_factory = MagicMock()
    fake_factory.return_value.__aenter__ = AsyncMock(return_value=MagicMock())
    fake_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    await creator_service._auto_deliver(uuid4(), fake_factory, settings)

    assert build_zip_mock.await_count == 1
    assert deliver_drive_mock.await_count == 0


@pytest.mark.asyncio
async def test_auto_deliver_both_calls_zip_then_drive(monkeypatch):
    from app.services import creator_service

    settings = Settings(
        delivery_mode="both", google_credentials_path="/tmp/creds.json"
    )
    build_zip_mock = AsyncMock(return_value=("/tmp/fake.zip", 30))
    deliver_drive_mock = AsyncMock()

    monkeypatch.setattr(
        "app.services.export_service.build_zip_archive", build_zip_mock
    )
    monkeypatch.setattr(
        "app.services.drive_delivery_service.deliver_to_drive", deliver_drive_mock
    )

    fake_factory = MagicMock()
    fake_factory.return_value.__aenter__ = AsyncMock(return_value=MagicMock())
    fake_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    await creator_service._auto_deliver(uuid4(), fake_factory, settings)

    assert build_zip_mock.await_count == 1
    assert deliver_drive_mock.await_count == 1


@pytest.mark.asyncio
async def test_auto_deliver_unknown_mode_falls_back_to_zip(monkeypatch, caplog):
    from app.services import creator_service

    settings = Settings(delivery_mode="carrier-pigeon")
    build_zip_mock = AsyncMock(return_value=("/tmp/fake.zip", 30))
    monkeypatch.setattr(
        "app.services.export_service.build_zip_archive", build_zip_mock
    )

    fake_factory = MagicMock()
    fake_factory.return_value.__aenter__ = AsyncMock(return_value=MagicMock())
    fake_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    await creator_service._auto_deliver(uuid4(), fake_factory, settings)

    assert build_zip_mock.await_count == 1


# ---------------------------------------------------------------------------
# Route tests
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def client(monkeypatch):
    """FastAPI test client with in-memory DB and a Settings override."""
    # Monkeypatch database init before importing the app.
    from app import database

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    monkeypatch.setattr(database, "engine", engine, raising=False)
    monkeypatch.setattr(database, "async_session_factory", factory, raising=False)

    # Import main AFTER patching so its lifespan sees our engine.
    from main import app

    async def _override_db():
        async with factory() as session:
            yield session

    from app.database import get_db

    app.dependency_overrides[get_db] = _override_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c, factory
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()


@pytest.mark.asyncio
async def test_drive_route_returns_503_when_unconfigured(client, monkeypatch):
    c, factory = client
    from app.dependencies import get_settings
    from main import app

    app.dependency_overrides[get_settings] = lambda: Settings(
        google_credentials_path=""
    )
    resp = await c.post(f"/api/jobs/{uuid4()}/export/drive")
    assert resp.status_code == 503
    assert "not configured" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_drive_route_returns_404_for_unknown_job(
    client, fake_credentials_file, monkeypatch
):
    c, factory = client
    from app.dependencies import get_settings
    from main import app

    app.dependency_overrides[get_settings] = lambda: Settings(
        google_credentials_path=fake_credentials_file
    )

    fake = FakeGDriveClient()
    with patch.object(drive_delivery_service, "GDriveClient", return_value=fake):
        resp = await c.post(f"/api/jobs/{uuid4()}/export/drive")

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_drive_route_happy_path(
    client, fake_credentials_file, tmp_output_dir, monkeypatch
):
    c, factory = client
    from app.dependencies import get_settings
    from main import app

    app.dependency_overrides[get_settings] = lambda: Settings(
        google_credentials_path=fake_credentials_file
    )

    # Seed a brand+job in the same DB the client uses.
    async with factory() as session:
        _, job = await _seed_job(session)

    fake = FakeGDriveClient()
    with patch.object(drive_delivery_service, "GDriveClient", return_value=fake):
        resp = await c.post(f"/api/jobs/{job.id}/export/drive")

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["delivery_type"] == "drive"
    assert body["delivery_url"].startswith("https://drive.google.com/drive/folders/")
    assert body["piece_count"] == 4
