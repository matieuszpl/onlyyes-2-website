import os
import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Wyciszamy błędy CancelledError przy zamykaniu połączeń - są to normalne sytuacje
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.connectors").setLevel(logging.WARNING)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/db_name")
DATABASE_URL_ASYNC = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL_ASYNC,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_reset_on_return='commit',
    connect_args={
        "server_settings": {
            "application_name": "onlyyes_radio",
        },
        "command_timeout": 30,
    }
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except asyncio.CancelledError:
            await session.rollback()
            raise
        except Exception:
            await session.rollback()
            raise
        finally:
            try:
                await session.close()
            except (asyncio.CancelledError, Exception):
                # Ignorujemy błędy przy zamykaniu sesji - są to normalne sytuacje
                pass