from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import Settings

engine = None
async_session_factory = None


def init_db(settings: Settings):
    global engine, async_session_factory

    is_sqlite = settings.database_url.startswith("sqlite")

    kwargs = {"echo": False}
    if not is_sqlite:
        # PostgreSQL via pgbouncer
        from sqlalchemy.pool import NullPool
        kwargs["poolclass"] = NullPool
        kwargs["connect_args"] = {
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: "",
        }

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
