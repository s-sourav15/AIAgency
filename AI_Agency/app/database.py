import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import Settings

engine = None
async_session_factory = None


def init_db(settings: Settings):
    global engine, async_session_factory

    is_sqlite = settings.database_url.startswith("sqlite")
    use_pgbouncer = os.getenv("PGBOUNCER", "").lower() in ("1", "true", "yes")

    kwargs = {"echo": False}
    if not is_sqlite:
        if use_pgbouncer:
            from sqlalchemy.pool import NullPool
            kwargs["poolclass"] = NullPool
            kwargs["connect_args"] = {
                "prepared_statement_cache_size": 0,
                "statement_cache_size": 0,
                "prepared_statement_name_func": lambda: "",
            }
        else:
            kwargs["pool_size"] = 5
            kwargs["max_overflow"] = 10
            kwargs["pool_pre_ping"] = True
            kwargs["pool_recycle"] = 300

    engine = create_async_engine(settings.database_url, **kwargs)
    async_session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
