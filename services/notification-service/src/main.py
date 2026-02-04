"""FastAPI application entry point for Notification Service."""
import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp

from .config import get_config
from .routes import health
from .consumer import register_subscriptions

config = get_config()

# Configure structured logging
logging.basicConfig(level=config.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Notification Service starting...")
    logger.info(f"Dapr HTTP Port: {config.dapr_http_port}")
    logger.info(f"Listening on port: {config.app_port}")
    yield
    logger.info("Notification Service shutting down...")


# Create FastAPI application
app = FastAPI(
    title=config.app_title,
    version=config.app_version,
    description="Notification Service - Phase 5 Microservice",
    lifespan=lifespan,
)

# Create Dapr app
dapr_app = DaprApp(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)

# Register Dapr subscriptions
register_subscriptions(dapr_app)


@app.get("/")
async def root():
    """Root endpoint - service information."""
    return {
        "service": config.app_title,
        "version": config.app_version,
        "dapr_app_id": config.dapr_app_id,
        "port": config.app_port,
        "status": "running",
    }
