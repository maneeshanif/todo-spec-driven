"""Audit log storage service for persisting events to database."""
import logging
from typing import Optional
from sqlmodel import SQLModel, Session, create_engine, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from .config import get_settings

logger = logging.getLogger(__name__)


class AuditLogger:
    """Service for writing audit logs to the database."""

    def __init__(self):
        """Initialize the audit logger with database connection."""
        settings = get_settings()
        self.database_url = settings.database_url

        # Create async engine
        self.engine = create_async_engine(
            self.database_url,
            echo=False,
            future=True
        )

        # Create session factory
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

        logger.info("Audit logger initialized")

    async def get_session(self) -> AsyncSession:
        """Get a new async database session."""
        async with self.async_session() as session:
            yield session

    async def create_audit_log(
        self,
        user_id: Optional[str],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[dict] = None,
        status: str = "success",
        error_message: Optional[str] = None
    ) -> int:
        """
        Create a new audit log entry.

        Args:
            user_id: User who performed the action (null for system actions)
            action: Action type (e.g., task.created, task.updated, task.deleted)
            resource_type: Type of resource affected (e.g., task, user)
            resource_id: ID of the resource affected
            request_id: Request ID for correlation
            ip_address: IP address of the request
            user_agent: User agent string from request
            details: JSON object with action-specific details
            status: Action status (success, failure, error)
            error_message: Error message if action failed

        Returns:
            The ID of the created audit log entry
        """
        from datetime import datetime

        try:
            async with self.async_session() as session:
                # Build SQL insert statement manually to avoid model dependency
                query = text("""
                    INSERT INTO audit_logs (
                        user_id, action, resource_type, resource_id,
                        request_id, ip_address, user_agent, details,
                        status, error_message, created_at
                    ) VALUES (
                        :user_id, :action, :resource_type, :resource_id,
                        :request_id, :ip_address, :user_agent, :details,
                        :status, :error_message, :created_at
                    ) RETURNING id
                """)

                result = await session.execute(query, {
                    "user_id": user_id,
                    "action": action,
                    "resource_type": resource_type,
                    "resource_id": str(resource_id) if resource_id else None,
                    "request_id": request_id,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "details": details,
                    "status": status,
                    "error_message": error_message,
                    "created_at": datetime.utcnow()
                })

                await session.commit()
                log_id = result.scalar()
                logger.info(f"Created audit log {log_id}: {action} by {user_id}")
                return log_id

        except Exception as e:
            logger.error(f"Failed to create audit log: {e}", exc_info=True)
            # Re-raise for caller to handle
            raise

    async def log_task_event(
        self,
        event_type: str,
        user_id: str,
        task_id: str,
        task_data: dict,
        request_id: Optional[str] = None
    ) -> int:
        """
        Log a task event to the audit log.

        Args:
            event_type: Type of task event (created, updated, completed, deleted)
            user_id: ID of the user who owns the task
            task_id: ID of the task
            task_data: Task data including title, description, etc.
            request_id: Request ID for correlation

        Returns:
            The ID of the created audit log entry
        """
        action_map = {
            "task.created": "task.created",
            "task.updated": "task.updated",
            "task.completed": "task.completed",
            "task.deleted": "task.deleted"
        }

        action = action_map.get(event_type, event_type)

        # Extract relevant task details
        details = {
            "event_type": event_type,
            "task": {
                "id": task_id,
                "title": task_data.get("title"),
                "description": task_data.get("description"),
                "completed": task_data.get("completed", False)
            }
        }

        # Add additional task fields if present
        for key in ["priority", "tags", "due_date", "category_id"]:
            if key in task_data:
                details["task"][key] = task_data[key]

        return await self.create_audit_log(
            user_id=user_id,
            action=action,
            resource_type="task",
            resource_id=task_id,
            request_id=request_id,
            details=details,
            status="success"
        )

    async def close(self):
        """Close the database engine."""
        await self.engine.dispose()
        logger.info("Audit logger database connection closed")


# Global audit logger instance
audit_logger = AuditLogger()
