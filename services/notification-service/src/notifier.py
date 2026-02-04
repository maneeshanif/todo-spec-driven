"""Notification logic for sending in-app notifications via Dapr Pub/Sub."""
import json
import logging
from datetime import datetime
from typing import Any, Dict

import httpx
from pydantic import BaseModel, Field

from .config import get_config

logger = logging.getLogger(__name__)
config = get_config()


class NotificationEvent(BaseModel):
    """Notification event structure for task-updates topic."""

    event_type: str = Field(..., description="Type of event: notification.sent")
    task_id: int = Field(..., description="Task ID")
    user_id: str = Field(..., description="User ID")
    title: str = Field(..., description="Task title")
    message: str = Field(..., description="Notification message")
    notification_type: str = Field(default="in-app", description="Type: in-app, push, email")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    correlation_id: str | None = Field(default=None, description="Tracing ID")


class NotificationService:
    """Service for handling notifications and publishing to task-updates topic."""

    def __init__(self):
        self.dapr_http_port = config.dapr_http_port
        self.dapr_pubsub_name = config.dapr_pubsub_name
        self.task_updates_topic = config.task_updates_topic

    async def send_reminder_notification(
        self,
        user_id: str,
        task_id: int,
        title: str,
        message: str,
        correlation_id: str | None = None,
    ) -> bool:
        """
        Send reminder notification to user.

        Args:
            user_id: User identifier
            task_id: Task ID
            title: Task title
            message: Reminder message
            correlation_id: Tracing correlation ID

        Returns:
            True if notification sent successfully, False otherwise
        """
        logger.info(
            f"Sending reminder notification to user {user_id} for task {task_id}: {title}"
        )

        # Create notification event
        notification = NotificationEvent(
            event_type="notification.sent",
            task_id=task_id,
            user_id=user_id,
            title=title,
            message=message,
            notification_type="in-app",
            correlation_id=correlation_id,
        )

        # Publish to task-updates topic (WebSocket will broadcast to connected clients)
        success = await self._publish_to_dapr(notification.model_dump())

        if success:
            logger.info(
                f"Reminder notification sent successfully - User: {user_id}, Task: {task_id}"
            )
        else:
            logger.error(
                f"Failed to send reminder notification - User: {user_id}, Task: {task_id}"
            )

        return success

    async def send_completion_notification(
        self,
        user_id: str,
        task_id: int,
        title: str,
        correlation_id: str | None = None,
    ) -> bool:
        """
        Send task completion notification.

        Args:
            user_id: User identifier
            task_id: Task ID
            title: Task title
            correlation_id: Tracing correlation ID

        Returns:
            True if notification sent successfully, False otherwise
        """
        logger.info(f"Sending completion notification to user {user_id} for task {task_id}")

        # Create notification event
        notification = NotificationEvent(
            event_type="notification.sent",
            task_id=task_id,
            user_id=user_id,
            title=title,
            message=f"Task '{title}' has been completed!",
            notification_type="in-app",
            correlation_id=correlation_id,
        )

        # Publish to task-updates topic
        success = await self._publish_to_dapr(notification.model_dump())

        if success:
            logger.info(
                f"Completion notification sent successfully - User: {user_id}, Task: {task_id}"
            )
        else:
            logger.error(
                f"Failed to send completion notification - User: {user_id}, Task: {task_id}"
            )

        return success

    async def _publish_to_dapr(self, event: Dict[str, Any]) -> bool:
        """
        Publish event to Dapr Pub/Sub.

        Args:
            event: Event payload dictionary

        Returns:
            True if published successfully, False otherwise
        """
        url = f"http://localhost:{self.dapr_http_port}/v1.0/publish/{self.dapr_pubsub_name}/{self.task_updates_topic}"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    url,
                    json=event,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                logger.debug(f"Published event to {self.task_updates_topic}: {event}")
                return True
        except httpx.TimeoutException as e:
            logger.error(f"Timeout publishing to Dapr: {e}")
            return False
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error publishing to Dapr: {e.response.status_code} - {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error publishing to Dapr: {e}")
            return False


# Global notification service instance
notification_service = NotificationService()
