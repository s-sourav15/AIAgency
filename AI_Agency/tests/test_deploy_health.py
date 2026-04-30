"""Tests for deploy-related bits: effective_database_url + /health + /ready."""
import os

import pytest
from fastapi.testclient import TestClient

from app.config import Settings


# ---------- Settings.effective_database_url ----------

def _make(**overrides) -> Settings:
    # _env_file=None prevents picking up a local .env while tests run.
    return Settings(_env_file=None, **overrides)


def test_default_falls_back_to_sqlite():
    s = _make()
    assert s.effective_database_url.startswith("sqlite+aiosqlite://")


def test_explicit_database_url_wins():
    s = _make(database_url="postgresql+asyncpg://u:p@h:5432/d")
    assert s.effective_database_url == "postgresql+asyncpg://u:p@h:5432/d"


def test_db_field_parts_assemble_asyncpg_url():
    s = _make(
        db_user="aiagency",
        db_password="pw",
        db_host="rds.example.com",
        db_port="5432",
        db_name="aiagency",
    )
    assert s.effective_database_url == (
        "postgresql+asyncpg://aiagency:pw@rds.example.com:5432/aiagency"
    )


def test_db_field_parts_precedence_database_url_wins():
    s = _make(
        database_url="sqlite+aiosqlite:///explicit.db",
        db_user="u", db_password="p", db_host="h", db_name="d",
    )
    # explicit DATABASE_URL always takes precedence
    assert s.effective_database_url == "sqlite+aiosqlite:///explicit.db"


def test_partial_db_fields_falls_back_to_sqlite():
    # Host set but user missing -> don't build a broken URL, fall back
    s = _make(db_host="h")
    assert s.effective_database_url.startswith("sqlite+aiosqlite://")


# ---------- /health and /ready endpoints ----------

@pytest.fixture(scope="module")
def client():
    # Force SQLite so the lifespan can bring up tables + run SELECT 1
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
    from main import app  # noqa: E402
    with TestClient(app) as c:
        yield c


def test_health_returns_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_ready_returns_ok_when_db_up(client):
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
