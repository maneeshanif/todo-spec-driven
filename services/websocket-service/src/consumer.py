"""Dapr subscription handler for task-updates events."""
import json
import logging
from typing import Any

from dapr.ext.fastapi import DaprApp

from .broadcaster import broadcaster

logger = logging.getLogger(__name__)


def register_subscriptions(dapr_app: DaprApp, pubsub_name: str, topic: str) -> None:
    """
    Register Dapr event subscriptions.

    Args:
        dapr_app: The Dapr FastAPI application instance
        pubsub_name: The name of the pub/sub component
        topic: The topic to subscribe to
    """
    logger.info(f"Registering subscription to pubsub={pubsub_name}, topic={topic}")

    @dapr_app.subscribe(pubsub=pubsub_name, topic=topic)
    async def handle_task_update(event: dict[str, Any]) -> dict[str, str]:
        """
        Handle task update events from Dapr.

        Expected event structure:
        {
            "event_type": "task.created" | "task.updated" | "task.deleted" | "task.completed",
            "user_id": str,
            "task": {...task_data...}
        }

        Args:
            event: The event payload from Dapr

        Returns:
            Confirmation dict for Dapr
        """
        try:
            event_type = event.get("event_type")
            user_id = event.get("user_id")
            task_data = event.get("task")

            if not event_type or not user_id:
                logger.error(f"Invalid event structure: {event}")
                return {"status": "error", "message": "Invalid event structure"}

            # Construct broadcast message
            message = {
                "type": "task_update",
                "event": event_type,
                "task": task_data,
                "timestamp": event.get("timestamp"),
            }

            logger.info(
                f"Received event {event_type} for user {user_id}, broadcasting to connections"
            )

            # Broadcast to all connections for this user
            await broadcaster.broadcast_to_user(user_id, message)

            return {"status": "success", "message": "Event processed"}

        except Exception as e:
            logger.error(f"Error handling task update event: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
