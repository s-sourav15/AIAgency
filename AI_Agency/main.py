from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import Settings
from app import database
from app.models import Base
from app.routes import brands, generation, content, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()
    database.init_db(settings)

    # Create tables on startup
    async with database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Verify DB connection
    async with database.engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    print("Database connected and tables created.")

    yield

    # Cleanup
    await database.engine.dispose()


app = FastAPI(
    title="AI Content Engine",
    description="One input. 30 days of on-brand content.",
    version="0.1.0",
    lifespan=lifespan,
)


def _parse_allowed_origins(raw: str) -> list[str]:
    """Parse the ALLOWED_ORIGINS env var into a list.

    Rules:
    - Comma-separated values, whitespace-trimmed, empties dropped.
    - "*" is allowed only if credentials are NOT required.
      Browsers reject "*" + credentials=True, and this combo is a CSRF
      footgun behind misconfigured proxies. We defensively drop it.
    """
    items = [o.strip() for o in (raw or "").split(",") if o.strip()]
    # Never allow wildcard with credentials.
    items = [o for o in items if o != "*"]
    return items


_settings = Settings()
_origins = _parse_allowed_origins(_settings.allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(brands.router, prefix="/api", tags=["brands"])
app.include_router(generation.router, prefix="/api", tags=["generation"])
app.include_router(content.router, prefix="/api", tags=["content"])
app.include_router(export.router, prefix="/api", tags=["export"])


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ready")
async def ready():
    async with database.engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ok"}
