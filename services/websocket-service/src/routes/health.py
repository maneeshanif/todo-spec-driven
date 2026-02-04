"""Health check endpoints for WebSocket Service."""
from fastapi import APIRouter
from ..broadcaster import broadcaster
from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.

    Returns:
        Health status of the service
    """
    return {
        "status": "healthy",
        "service": "websocket",
        "version": settings.app_version,
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint - verifies service is ready to accept connections.

    Returns:
        Readiness status with connection statistics
    """
    status = {
        "status": "ready",
        "service": "websocket",
        "connections": broadcaster.active_connections_count,
        "active_users": broadcaster.active_users_count,
    }

    # Service is always ready if it's running
    # In production, you might check external dependencies like Dapr
    return status


@router.get("/status")
async def status_check():
    """
    Detailed status endpoint with connection statistics.

    Returns:
        Detailed status information
    """
    return {
        "service": "websocket",
        "version": settings.app_version,
        "connections": broadcaster.get_status(),
    }
