"""WebSocket Service - Real-time task synchronization microservice."""
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp

from .config import settings
from .broadcaster import broadcaster
from .routes import health_router, websocket_router
from .consumer import register_subscriptions

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.

    Tasks on startup:
    - Log service initialization
    - Start background heartbeat task

    Tasks on shutdown:
    - Log service shutdown
    - Cancel background tasks
    """
    logger.info("=" * 60)
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Listening on {settings.host}:{settings.port}")
    logger.info(f"Dapr HTTP Port: {settings.dapr_http_port}")
    logger.info(f"Dapr Pub/Sub: {settings.dapr_pubsub_name}")
    logger.info(f"Dapr Topic: {settings.dapr_topic}")
    logger.info("=" * 60)

    # Start heartbeat background task
    heartbeat_task = asyncio.create_task(heartbeat_loop())

    yield

    logger.info("Shutting down service...")
    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass
    logger.info(f"Service stopped. Active connections: {broadcaster.active_connections_count}")


# Initialize FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Real-time WebSocket service for task synchronization",
    lifespan=lifespan,
)

# Initialize Dapr application
dapr_app = DaprApp(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(websocket_router, tags=["websocket"])


# Register Dapr event subscriptions
register_subscriptions(
    dapr_app=dapr_app,
    pubsub_name=settings.dapr_pubsub_name,
    topic=settings.dapr_topic,
)


# Background heartbeat task
async def heartbeat_loop():
    """
    Send periodic heartbeat messages to all connected clients.

    This keeps connections alive and detects dead connections.
    """
    while True:
        try:
            await asyncio.sleep(settings.heartbeat_interval)
            await broadcaster.send_heartbeat()
            # Also cleanup stale connections
            await broadcaster.cleanup_stale_connections()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Heartbeat error: {e}", exc_info=True)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "connections": broadcaster.active_connections_count,
        "endpoints": {
            "health": "/health",
            "ready": "/ready",
            "status": "/status",
            "websocket": "/ws/{user_id}",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
