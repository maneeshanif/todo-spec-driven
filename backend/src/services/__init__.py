"""Services package initialization."""
# Note: Auth and User services removed - using Better Auth
from src.services.task_service import TaskService

__all__ = ["TaskService"]
