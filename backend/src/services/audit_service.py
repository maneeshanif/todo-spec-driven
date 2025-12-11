"""Audit logging service for tracking user actions."""
from typing import Optional
from fastapi import Request
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.audit_log import AuditLog, AuditAction
from src.core.logging import get_logger

logger = get_logger(__name__)


class AuditService:
    """
    Service for creating audit log entries.

    Usage:
        from src.services.audit_service import AuditService, AuditAction

        # In your route handler
        await AuditService.log_action(
            session=session,
            user_id=current_user.id,
            action=AuditAction.TASK_CREATED,
            resource_type="task",
            resource_id=str(task.id),
            request=request,
            details={"title": task.title}
        )
    """

    @staticmethod
    async def log_action(
        session: AsyncSession,
        action: str,
        *,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request: Optional[Request] = None,
        request_id: Optional[str] = None,
        details: Optional[dict] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ) -> AuditLog:
        """
        Create an audit log entry.

        Args:
            session: Database session
            action: Action type (use AuditAction constants)
            user_id: User who performed the action (optional for system actions)
            resource_type: Type of resource affected (e.g., "task", "user")
            resource_id: ID of the resource
            request: FastAPI request object (for IP, user agent, request ID)
            request_id: Request ID for correlation (extracted from request if not provided)
            details: Additional action-specific details
            status: Action status (success, failure, error)
            error_message: Error message if action failed

        Returns:
            Created AuditLog instance
        """
        # Extract request context if request provided
        ip_address = None
        user_agent = None

        if request:
            # Get IP address (handle X-Forwarded-For)
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                ip_address = forwarded.split(",")[0].strip()
            elif request.client:
                ip_address = request.client.host

            # Get user agent
            user_agent = request.headers.get("User-Agent")

            # Get request ID from headers if not provided
            if not request_id:
                request_id = request.headers.get("X-Request-ID")

        # Create audit log entry
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            request_id=request_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
            status=status,
            error_message=error_message,
        )

        try:
            session.add(audit_log)
            await session.commit()
            await session.refresh(audit_log)

            logger.info(
                f"Audit log created: {action}",
                extra={
                    "audit_id": audit_log.id,
                    "action": action,
                    "user_id": user_id,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "status": status,
                }
            )

            return audit_log

        except Exception as e:
            logger.error(
                "Failed to create audit log",
                extra={
                    "action": action,
                    "user_id": user_id,
                    "error": str(e),
                },
                exc_info=True
            )
            # Don't fail the main operation if audit logging fails
            # Just log the error and continue
            raise

    @staticmethod
    async def log_auth_event(
        session: AsyncSession,
        action: str,
        request: Request,
        user_id: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> AuditLog:
        """
        Log an authentication event.

        Convenience method for logging auth-related actions.

        Args:
            session: Database session
            action: Auth action (use AuditAction.AUTH_* constants)
            request: FastAPI request object
            user_id: User ID (if known)
            status: Action status
            error_message: Error message if failed
            details: Additional details (e.g., email for failed login)

        Returns:
            Created AuditLog instance
        """
        return await AuditService.log_action(
            session=session,
            action=action,
            user_id=user_id,
            resource_type="auth",
            request=request,
            status=status,
            error_message=error_message,
            details=details,
        )

    @staticmethod
    async def log_task_event(
        session: AsyncSession,
        action: str,
        task_id: int,
        user_id: str,
        request: Request,
        details: Optional[dict] = None,
    ) -> AuditLog:
        """
        Log a task-related event.

        Convenience method for logging task CRUD operations.

        Args:
            session: Database session
            action: Task action (use AuditAction.TASK_* constants)
            task_id: Task ID
            user_id: User who performed the action
            request: FastAPI request object
            details: Additional details (e.g., task title, changes made)

        Returns:
            Created AuditLog instance
        """
        return await AuditService.log_action(
            session=session,
            action=action,
            user_id=user_id,
            resource_type="task",
            resource_id=str(task_id),
            request=request,
            details=details,
        )

    @staticmethod
    async def get_user_audit_trail(
        session: AsyncSession,
        user_id: str,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get audit trail for a specific user.

        Args:
            session: Database session
            user_id: User ID
            limit: Maximum number of entries to return

        Returns:
            List of audit log entries, newest first
        """
        from sqlmodel import select

        statement = (
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )

        result = await session.exec(statement)
        return list(result.all())

    @staticmethod
    async def get_resource_audit_trail(
        session: AsyncSession,
        resource_type: str,
        resource_id: str,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get audit trail for a specific resource.

        Args:
            session: Database session
            resource_type: Resource type (e.g., "task")
            resource_id: Resource ID
            limit: Maximum number of entries to return

        Returns:
            List of audit log entries, newest first
        """
        from sqlmodel import select

        statement = (
            select(AuditLog)
            .where(
                AuditLog.resource_type == resource_type,
                AuditLog.resource_id == resource_id
            )
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )

        result = await session.exec(statement)
        return list(result.all())
