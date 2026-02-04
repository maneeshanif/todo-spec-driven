"""Dapr subscription handler for reminder events."""
import json
import logging
from typing import Dict, Any

from fastapi import Request
from dapr.ext.fastapi import DaprApp
from pydantic import BaseModel, Field, ValidationError

from .config import get_config
from .notifier import notification_service

logger = logging.getLogger(__name__)
config = get_config()


class ReminderEvent(BaseModel):
    """Reminder event structure from reminders topic."""

    task_id: int = Field(..., description="Task ID")
    user_id: str = Field(..., description="User ID")
    title: str = Field(..., description="Task title")
    due_at: str = Field(..., description="Task due date (ISO format)")
    remind_at: str = Field(..., description="Reminder time (ISO format)")
    notification_type: str = Field(default="in-app", description="Notification type")
    correlation_id: str | None = Field(default=None, description="Tracing ID")


async def handle_reminder_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle reminder event from Dapr Pub/Sub.

    This function is called by Dapr when a reminder is triggered.
    It sends an in-app notification to the user.

    Args:
        event: Reminder event payload from Kafka

    Returns:
        Response dict with status
    """
    try:
        # Validate event structure
        reminder = ReminderEvent(**event)
        logger.info(
            f"Received reminder event for task {reminder.task_id}, user {reminder.user_id}"
        )

        # Send notification
        message = f"Reminder: Task '{reminder.title}' is due at {reminder.due_at}"
        success = await notification_service.send_reminder_notification(
            user_id=reminder.user_id,
            task_id=reminder.task_id,
            title=reminder.title,
            message=message,
            correlation_id=reminder.correlation_id,
        )

        if success:
            logger.info(
                f"Reminder notification sent successfully - Task: {reminder.task_id}, User: {reminder.user_id}"
            )
            return {
                "status": "success",
                "message": "Reminder notification sent",
                "task_id": reminder.task_id,
            }
        else:
            logger.error(
                f"Failed to send reminder notification - Task: {reminder.task_id}, User: {reminder.user_id}"
            )
            return {
                "status": "error",
                "message": "Failed to send notification",
                "task_id": reminder.task_id,
            }

    except ValidationError as e:
        logger.error(f"Invalid reminder event structure: {e}")
        return {"status": "error", "message": f"Invalid event: {e}"}
    except Exception as e:
        logger.error(f"Error processing reminder event: {e}", exc_info=True)
        return {"status": "error", "message": f"Processing error: {str(e)}"}


def register_subscriptions(dapr_app: DaprApp) -> None:
    """
    Register Dapr subscriptions for the notification service.

    Args:
        dapr_app: Dapr FastAPI app instance
    """

    @dapr_app.subscribe(pubsub=config.dapr_pubsub_name, topic=config.reminders_topic)
    async def reminder_subscription_handler(event: Dict[str, Any]):
        """
        Subscription handler for reminders topic.

        Dapr calls this function when a message is published to the reminders topic.
        """
        logger.info(f"Received event from {config.reminders_topic} topic")
        result = await handle_reminder_event(event)
        return result

    logger.info(f"Subscribed to topic: {config.reminders_topic}")
