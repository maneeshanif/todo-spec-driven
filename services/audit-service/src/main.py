"""FastAPI application entry point for the Audit Service."""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp

from .config import get_settings
from .routes import health_router
from .routes.audit import router as audit_router
from .consumer import register_all_subscriptions
from .logger import audit_logger

# Configure logging
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    logger.info(f"{settings.service_name} v{settings.service_version} starting...")
    logger.info(f"Database URL configured: {settings.database_url[:20]}...")
    logger.info(f"Subscribing to pubsub: {settings.pubsub_name}/{settings.topic_name}")

    yield

    # Shutdown
    logger.info(f"{settings.service_name} shutting down...")
    await audit_logger.close()


# Create FastAPI application
app = FastAPI(
    title="Audit Service",
    description="Microservice for logging audit events to the database",
    version=settings.service_version,
    lifespan=lifespan
)

# Create Dapr app for pub/sub integration
dapr_app = DaprApp(app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Include routers
app.include_router(health_router)
app.include_router(audit_router)

# Register Dapr subscriptions for event handling
register_all_subscriptions(dapr_app)


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "running",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )
