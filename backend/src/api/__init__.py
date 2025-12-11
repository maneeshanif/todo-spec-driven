"""API routes package initialization."""
from fastapi import APIRouter
from src.api.routes.auth import router as auth_router
from src.api.routes.tasks import router as tasks_router
from src.api.health import router as health_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Include sub-routers
api_router.include_router(health_router)  # Health checks (no auth required)
api_router.include_router(auth_router)
api_router.include_router(tasks_router)

__all__ = ["api_router"]
