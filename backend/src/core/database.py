"""Database connection and session management."""
from sqlmodel import create_engine, Session, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from src.core.config import settings


# Create async engine for PostgreSQL
# Using NullPool for serverless (Neon) to avoid connection issues
# Each request gets a fresh connection that's closed after use
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    future=True,
    # Pool settings for serverless PostgreSQL (Neon)
    poolclass=NullPool,  # Disable connection pooling for serverless
    connect_args={
        "server_settings": {
            "application_name": "todo-api",
        },
    },
)

# Async session maker
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session() -> AsyncSession:
    """
    Dependency for getting async database sessions.
    
    Yields:
        AsyncSession: Database session
    """
    async with async_session_maker() as session:
        yield session


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
