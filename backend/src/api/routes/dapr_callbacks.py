"""Dapr callback endpoints for jobs and pub/sub.

These endpoints are called by the Dapr sidecar when scheduled jobs trigger
or when pub/sub events are received.
"""
from fastapi import APIRouter, Request, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.core.database import get_session
from src.core.logging import get_logger
from src.services.reminder_service import ReminderService
from src.services.dapr_client import DaprClient
from src.schemas.events import ReminderEvent

router = APIRouter(prefix="/dapr", tags=["dapr-callbacks"])
logger = get_logger(__name__)


@router.post("/jobs/reminder")
async def reminder_job_callback(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Dapr Jobs API callback for reminder notifications.

    Called by Dapr when a scheduled reminder job is due.
    Publishes a ReminderEvent to the 'reminders' topic for the Notification Service.

    Job data format:
    {
        "reminder_id": 123,
        "task_id": 456,
        "user_id": "user-uuid-123"
    }
    """
    try:
        # Parse job data from Dapr request
        payload = await request.json()
        job_data = payload.get("data", {})

        reminder_id = job_data.get("reminder_id")
        task_id = job_data.get("task_id")
        user_id = job_data.get("user_id")

        if not all([reminder_id, task_id, user_id]):
            logger.error(
                "Invalid reminder job data: missing required fields",
                extra={"payload": job_data}
            )
            return {"status": "error", "message": "Invalid job data"}

        logger.info(
            f"Processing reminder job for reminder {reminder_id}",
            extra={
                "reminder_id": reminder_id,
                "task_id": task_id,
                "user_id": user_id
            }
        )

        # Get reminder from database
        reminder = await ReminderService.get_reminder_by_id(
            session=session,
            reminder_id=reminder_id,
            user_id=user_id
        )

        if not reminder:
            logger.warning(
                f"Reminder {reminder_id} not found in database (may have been deleted)",
                extra={"reminder_id": reminder_id}
            )
            return {"status": "skipped", "message": "Reminder not found"}

        # Publish ReminderEvent to Dapr pub/sub
        # The Notification Service will consume this event and deliver the notification
        event_data = {
            "reminder_id": reminder.id,
            "task_id": reminder.task_id,
            "user_id": reminder.user_id,
            "remind_at": reminder.remind_at.isoformat(),
            "event_type": "reminder_due"
        }

        # Publish to Kafka via Dapr pub/sub
        published = await DaprClient.publish_event(
            pubsub_name="kafka-pubsub",  # Dapr pub/sub component name
            topic="reminders",  # Kafka topic
            data=event_data
        )

        if published:
            # Mark reminder as sent (notification service will handle delivery)
            await ReminderService.mark_reminder_sent(session=session, reminder=reminder)

            logger.info(
                f"Published reminder event for reminder {reminder_id}",
                extra={
                    "reminder_id": reminder_id,
                    "task_id": task_id,
                    "user_id": user_id
                }
            )

            return {
                "status": "success",
                "reminder_id": reminder_id,
                "message": "Reminder event published"
            }
        else:
            # Mark reminder as failed if pub/sub failed
            await ReminderService.mark_reminder_failed(session=session, reminder=reminder)

            logger.error(
                f"Failed to publish reminder event for reminder {reminder_id}",
                extra={"reminder_id": reminder_id}
            )

            return {
                "status": "failed",
                "reminder_id": reminder_id,
                "message": "Failed to publish reminder event"
            }

    except Exception as e:
        logger.error(
            f"Error processing reminder job callback: {e}",
            exc_info=True
        )
        return {
            "status": "error",
            "message": str(e)
        }


@router.get("/health")
async def dapr_health():
    """Health check endpoint for Dapr.

    Dapr will call this endpoint to verify the app is ready to receive events.
    """
    return {"status": "healthy", "service": "todo-api"}


@router.get("/subscribe")
async def dapr_subscribe():
    """Dapr pub/sub subscription endpoint.

    Returns the list of topics this service subscribes to.
    Dapr will register these subscriptions automatically.

    For now, this service only publishes to topics (via reminder jobs).
    Actual subscription is handled by the Notification Service.
    """
    return []  # Empty list - we only publish, not subscribe
