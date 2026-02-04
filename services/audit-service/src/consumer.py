"""Dapr subscription handler for task events."""
import logging
from typing import Dict, Any
from dapr.ext.fastapi import DaprApp

from .config import get_settings
from .logger import audit_logger

logger = logging.getLogger(__name__)

settings = get_settings()


def register_subscriptions(dapr_app: DaprApp):
    """
    Register Dapr subscriptions for task events.

    This function subscribes to the task-events topic via the Dapr pub/sub component
    and handles incoming task lifecycle events (created, updated, completed, deleted).
    """

    @dapr_app.subscribe(
        pubsub=settings.pubsub_name,
        topic=settings.topic_name
    )
    async def handle_task_event(event: Dict[str, Any]):
        """
        Handle incoming task events from the pub/sub broker.

        Event format:
        {
            "event_type": "task.created|task.updated|task.completed|task.deleted",
            "user_id": "user-id",
            "task": {
                "id": "task-id",
                "title": "Task title",
                "description": "Task description",
                "completed": false,
                ...
            },
            "request_id": "request-id",
            "timestamp": "2025-12-30T00:00:00Z"
        }

        Args:
            event: The event payload from Dapr
        """
        try:
            # Extract event fields
            event_type = event.get("event_type")
            user_id = event.get("user_id")
            task_data = event.get("task", {})
            request_id = event.get("request_id")

            # Validate required fields
            if not event_type:
                logger.warning("Received event without event_type")
                return

            if not user_id:
                logger.warning("Received event without user_id")
                return

            task_id = task_data.get("id")
            if not task_id:
                logger.warning("Received event without task.id")
                return

            # Log based on event type
            if event_type == "task.created":
                logger.info(f"Task created: {task_id} by user {user_id}")
                await audit_logger.log_task_event(
                    event_type=event_type,
                    user_id=user_id,
                    task_id=str(task_id),
                    task_data=task_data,
                    request_id=request_id
                )

            elif event_type == "task.updated":
                logger.info(f"Task updated: {task_id} by user {user_id}")
                await audit_logger.log_task_event(
                    event_type=event_type,
                    user_id=user_id,
                    task_id=str(task_id),
                    task_data=task_data,
                    request_id=request_id
                )

            elif event_type == "task.completed":
                logger.info(f"Task completed: {task_id} by user {user_id}")
                await audit_logger.log_task_event(
                    event_type=event_type,
                    user_id=user_id,
                    task_id=str(task_id),
                    task_data=task_data,
                    request_id=request_id
                )

            elif event_type == "task.deleted":
                logger.info(f"Task deleted: {task_id} by user {user_id}")
                await audit_logger.log_task_event(
                    event_type=event_type,
                    user_id=user_id,
                    task_id=str(task_id),
                    task_data=task_data,
                    request_id=request_id
                )

            else:
                logger.warning(f"Unknown event type: {event_type}")

        except Exception as e:
            logger.error(f"Error processing task event: {e}", exc_info=True)
            # Log the error as an audit entry
            try:
                user_id = event.get("user_id", "system")
                await audit_logger.create_audit_log(
                    user_id=user_id,
                    action=event.get("event_type", "task.event.error"),
                    resource_type="task",
                    resource_id=str(event.get("task", {}).get("id", "")),
                    status="error",
                    error_message=str(e)
                )
            except Exception as log_error:
                logger.error(f"Failed to log error event: {log_error}")

    logger.info(f"Registered subscription for topic: {settings.topic_name}")


def register_all_subscriptions(dapr_app: DaprApp):
    """
    Register all Dapr subscriptions for the audit service.

    This is the main entry point for registering subscriptions.
    Additional subscriptions can be added here in the future.
    """
    register_subscriptions(dapr_app)
    logger.info("All Dapr subscriptions registered successfully")
