"""Health check endpoints for deployment verification."""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import text
from src.core.database import get_session
from src.core.logging import get_logger
from src.utils.metrics import metrics_collector

logger = get_logger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.

    Returns 200 OK if the service is running.

    Used by:
    - Load balancers
    - Kubernetes liveness probes
    - Uptime monitoring services
    """
    return {
        "status": "healthy",
        "service": "todo-api",
        "version": "1.0.0"
    }


@router.get("/health/db")
async def database_health_check(session: AsyncSession = Depends(get_session)):
    """
    Database health check endpoint.

    Verifies database connectivity and basic functionality.

    Returns 200 OK if database is accessible and responding.
    Returns 503 Service Unavailable if database is down.

    Used by:
    - Kubernetes readiness probes
    - Deployment verification
    - Database failover detection
    """
    try:
        # Execute simple query to verify database connection
        result = await session.exec(text("SELECT 1"))
        await result.close()

        return {
            "status": "healthy",
            "database": "connected",
            "message": "Database is accessible and responding"
        }

    except Exception as e:
        logger.error(
            "Database health check failed",
            extra={"error": str(e)},
            exc_info=True
        )

        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "message": "Database connection failed"
            }
        )


@router.get("/health/ready")
async def readiness_check(session: AsyncSession = Depends(get_session)):
    """
    Readiness check endpoint.

    Verifies the service is ready to accept traffic.
    Checks both application and database readiness.

    Returns 200 OK if service is ready.
    Returns 503 Service Unavailable if not ready.

    Used by:
    - Kubernetes readiness probes
    - Load balancer registration
    """
    # Check database connectivity
    try:
        result = await session.exec(text("SELECT 1"))
        await result.close()
    except Exception as e:
        logger.error(
            "Readiness check failed - database not ready",
            extra={"error": str(e)}
        )
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not ready",
                "reason": "database unavailable"
            }
        )

    # All checks passed
    return {
        "status": "ready",
        "service": "todo-api",
        "database": "connected"
    }


@router.get("/health/live")
async def liveness_check():
    """
    Liveness check endpoint.

    Verifies the application process is alive (not deadlocked/crashed).
    Does NOT check external dependencies like database.

    Returns 200 OK if process is alive.

    Used by:
    - Kubernetes liveness probes (will restart pod if this fails)
    """
    return {
        "status": "alive",
        "service": "todo-api"
    }


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.

    Exposes application metrics in Prometheus text format.

    Metrics include:
    - HTTP request counts and durations (p50, p95, p99)
    - Database query counts and durations
    - Error rates by status code
    - Response sizes

    Configure Prometheus to scrape this endpoint:
    ```yaml
    scrape_configs:
      - job_name: 'todo-api'
        static_configs:
          - targets: ['localhost:8000']
        metrics_path: '/api/metrics'
    ```
    """
    prometheus_text = metrics_collector.export_prometheus()

    return Response(
        content=prometheus_text,
        media_type="text/plain; version=0.0.4"
    )
