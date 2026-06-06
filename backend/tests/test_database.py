import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from backend.config import Settings
from backend.database import (
    create_engine,
    create_session_maker,
    normalize_database_url,
)


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_normalize_database_url_uses_async_psycopg_driver():
    assert (
        normalize_database_url("postgresql://user:password@localhost:5432/app")
        == "postgresql+psycopg://user:password@localhost:5432/app"
    )
    assert (
        normalize_database_url("postgres://user:password@localhost:5432/app")
        == "postgresql+psycopg://user:password@localhost:5432/app"
    )
    assert (
        normalize_database_url("postgresql+psycopg://user:password@localhost:5432/app")
        == "postgresql+psycopg://user:password@localhost:5432/app"
    )


def test_create_engine_returns_async_engine():
    settings = Settings(
        DATABASE_URL="postgresql://user:password@localhost:5432/app",
    )

    engine = create_engine(settings)

    try:
        assert isinstance(engine, AsyncEngine)
        assert engine.url.drivername == "postgresql+psycopg"
    finally:
        engine.sync_engine.dispose()


async def test_create_session_maker_returns_async_sessions():
    settings = Settings(
        DATABASE_URL="postgresql://user:password@localhost:5432/app",
    )
    engine = create_engine(settings)
    session_maker = create_session_maker(engine)

    try:
        async with session_maker() as session:
            assert isinstance(session, AsyncSession)
    finally:
        await engine.dispose()
