"""API routes package initialization."""
from fastapi import APIRouter
from src.api.routes.tasks import router as tasks_router
from src.api.routes.categories import router as categories_router
from src.api.routes.stats import router as stats_router
from src.api.routes.chat import router as chat_router
from src.api.routes.chatkit import router as chatkit_router
from src.api.health import router as health_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Include sub-routers
# Note: Better Auth handles authentication via Next.js frontend at /api/auth/*
api_router.include_router(health_router)  # Health checks (no auth required)
api_router.include_router(tasks_router)
api_router.include_router(categories_router)
api_router.include_router(stats_router)
api_router.include_router(chat_router)  # Phase 3: AI Chat (custom SSE)
api_router.include_router(chatkit_router)  # Phase 3: ChatKit SDK endpoint

__all__ = ["api_router"]
