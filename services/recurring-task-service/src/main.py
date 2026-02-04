"""
Recurring Task Service - Main Application

FastAPI service that listens for task completion events and automatically
creates the next occurrence of recurring tasks via Dapr Service Invocation.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from contextlib import asynccontextmanager
import logging

from pythonjsonlogger import jsonlogger

# Configure JSON logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s"
)
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter())
logger.addHandler(handler)

from .config import Settings, get_settings
from .consumer import register_subscriptions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    settings = get_settings()
    logger.info(
        "Recurring Task Service starting...",
        extra={
            "service": "recurring-task-service",
            "dapr_app_id": settings.dapr_app_id,
            "port": settings.port
        }
    )
    yield
    logger.info("Recurring Task Service shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Recurring Task Service",
    description="Auto-creates next occurrences of recurring tasks",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Dapr
dapr_app = DaprApp(app)

# Register Dapr subscriptions
register_subscriptions(dapr_app)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "recurring-task-service",
        "dapr_app_id": "recurring-task-service"
    }


@app.get("/ready")
async def ready():
    """Readiness check endpoint."""
    return {
        "status": "ready",
        "service": "recurring-task-service"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Recurring Task Service",
        "version": "1.0.0",
        "description": "Auto-creates next occurrences of recurring tasks"
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )
