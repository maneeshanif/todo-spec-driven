"""Health check endpoints for Notification Service."""
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """
    Liveness probe - returns service status.
    This endpoint indicates if the service is running.
    """
    return {
        "status": "healthy",
        "service": "notification-service",
        "port": 8002,
    }


@router.get("/ready")
async def ready():
    """
    Readiness probe - checks if service is ready to handle requests.
    Verifies Dapr sidecar connectivity.
    """
    dapr_port = "3500"
    dapr_url = f"http://localhost:{dapr_port}/v1.0/healthz"

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(dapr_url)
            if response.status_code == 200:
                return {
                    "status": "ready",
                    "service": "notification-service",
                    "dapr": "connected",
                }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service not ready: Dapr sidecar not accessible - {str(e)}"
        )

    raise HTTPException(
        status_code=503,
        detail="Service not ready: Dapr health check failed"
    )
