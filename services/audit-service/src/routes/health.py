"""Health check endpoints for the Audit Service."""
from fastapi import APIRouter
from sqlmodel import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..logger import audit_logger

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """
    Health check endpoint.

    Returns the current health status of the service.
    This endpoint does not check dependencies.
    """
    return {
        "status": "healthy",
        "service": "audit-service",
        "version": "1.0.0"
    }


@router.get("/ready")
async def ready():
    """
    Readiness check endpoint.

    Checks if the service and its dependencies (database) are ready.
    """
    try:
        # Check database connection
        async with audit_logger.async_session() as session:
            await session.execute(text("SELECT 1"))
            await session.commit()

        return {
            "status": "ready",
            "service": "audit-service",
            "dependencies": {
                "database": "connected"
            }
        }
    except Exception as e:
        from .logger import logger
        logger.error(f"Readiness check failed: {e}")
        return {
            "status": "not_ready",
            "service": "audit-service",
            "dependencies": {
                "database": "disconnected"
            },
            "error": str(e)
        }


@router.get("/metrics")
async def metrics():
    """
    Metrics endpoint for service monitoring.

    Returns basic metrics about the audit service.
    """
    try:
        # Count total audit logs in database
        async with audit_logger.async_session() as session:
            result = await session.execute(
                text("SELECT COUNT(*) as count FROM audit_logs")
            )
            total_logs = result.scalar()

        return {
            "service": "audit-service",
            "metrics": {
                "total_audit_logs": total_logs
            }
        }
    except Exception as e:
        from .logger import logger
        logger.error(f"Metrics check failed: {e}")
        return {
            "service": "audit-service",
            "error": str(e)
        }
