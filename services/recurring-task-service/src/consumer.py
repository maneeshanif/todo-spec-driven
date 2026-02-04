"""
Dapr event subscription handler for Recurring Task Service.

Subscribes to task-events topic and handles task completion events
to create the next occurrence of recurring tasks.
"""
import logging
from datetime import datetime

from dapr.ext.fastapi import DaprApp

from .scheduler import RecurringTaskScheduler

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = RecurringTaskScheduler()


def register_subscriptions(dapr_app: DaprApp) -> None:
    """Register all Dapr pub/sub subscriptions.

    Args:
        dapr_app: Dapr FastAPI extension instance
    """
    @dapr_app.subscribe(
        pubsub="taskpubsub",
        topic="task-events",
        metadata={"rawPayload": "false"}
    )
    async def handle_task_event(event: dict):
        """Handle incoming task events.

        Processes task.completed events for recurring tasks and creates
        the next occurrence if applicable.

        Args:
            event: Event payload from Dapr pub/sub
                {
                    "event_type": "task.completed",
                    "task_id": "uuid",
                    "user_id": "uuid",
                    "task": {
                        "id": "uuid",
                        "title": "...",
                        "recurring_pattern": "daily|weekly|monthly",
                        ...
                    },
                    "timestamp": "ISO-8601"
                }
        """
        try:
            event_type = event.get("event_type")
            task_data = event.get("task", {})
            user_id = event.get("user_id")

            logger.info(
                "Received task event",
                extra={
                    "event_type": event_type,
                    "task_id": task_data.get("id"),
                    "user_id": user_id
                }
            )

            # Only process task completion events
            if event_type != "task.completed":
                logger.debug(
                    f"Ignoring non-completion event: {event_type}",
                    extra={"event_type": event_type}
                )
                return

            # Check if task is recurring
            recurring_pattern = task_data.get("recurring_pattern")
            if not recurring_pattern or recurring_pattern == "none":
                logger.debug(
                    "Task is not recurring, skipping next occurrence creation",
                    extra={"task_id": task_data.get("id")}
                )
                return

            # Create next occurrence
            await scheduler.create_next_occurrence(
                task_data=task_data,
                user_id=user_id
            )

            logger.info(
                "Successfully processed recurring task completion",
                extra={
                    "original_task_id": task_data.get("id"),
                    "recurring_pattern": recurring_pattern
                }
            )

        except Exception as e:
            logger.error(
                f"Error processing task event: {str(e)}",
                extra={
                    "event": event,
                    "error": str(e),
                    "error_type": type(e).__name__
                },
                exc_info=True
            )
            # Re-raise to trigger Dapr retry
            raise
