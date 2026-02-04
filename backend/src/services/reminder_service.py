"""Reminder service for business logic and data operations."""
from typing import List, Optional
from datetime import datetime, timezone
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.reminder import Reminder, ReminderStatus
from src.models.task import Task
from src.services.dapr_client import DaprClient
from src.core.logging import get_logger
from src.core.errors import AppException

logger = get_logger(__name__)


class ReminderService:
    """Service for managing task reminders with Dapr Jobs API scheduling."""

    @staticmethod
    async def get_reminders(
        session: AsyncSession,
        user_id: str,
        task_id: Optional[int] = None,
        status: Optional[ReminderStatus] = None
    ) -> List[Reminder]:
        """Get user's reminders with optional filters.

        Args:
            session: Database session
            user_id: User ID to filter by
            task_id: Optional task ID filter
            status: Optional status filter (pending, sent, failed)

        Returns:
            List of reminders matching the filters
        """
        statement = select(Reminder).where(Reminder.user_id == user_id)

        if task_id is not None:
            statement = statement.where(Reminder.task_id == task_id)

        if status is not None:
            statement = statement.where(Reminder.status == status)

        statement = statement.order_by(Reminder.remind_at.asc())

        result = await session.exec(statement)
        reminders = result.all()

        logger.info(
            f"Retrieved {len(reminders)} reminders for user {user_id}",
            extra={"user_id": user_id, "count": len(reminders)}
        )

        return reminders

    @staticmethod
    async def get_reminder_by_id(
        session: AsyncSession,
        reminder_id: int,
        user_id: str
    ) -> Optional[Reminder]:
        """Get a single reminder by ID, verifying user ownership.

        Args:
            session: Database session
            reminder_id: Reminder ID
            user_id: User ID for ownership verification

        Returns:
            Reminder if found and owned by user, None otherwise
        """
        statement = select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id
        )

        result = await session.exec(statement)
        reminder = result.first()

        if reminder:
            logger.debug(
                f"Retrieved reminder {reminder_id} for user {user_id}",
                extra={"reminder_id": reminder_id, "user_id": user_id}
            )

        return reminder

    @staticmethod
    async def create_reminder(
        session: AsyncSession,
        user_id: str,
        task_id: int,
        remind_at: datetime
    ) -> Reminder:
        """Create a new reminder for a task.

        Validates task ownership and schedules Dapr job if available.
        If reminder time is in the past, fires it immediately.

        Args:
            session: Database session
            user_id: User ID creating the reminder
            task_id: Task ID to set reminder for
            remind_at: When to send the reminder (UTC)

        Returns:
            Created reminder

        Raises:
            AppException: If task not found or not owned by user
        """
        # Validate task exists and belongs to user
        task_statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        task_result = await session.exec(task_statement)
        task = task_result.first()

        if not task:
            raise AppException.not_found(
                detail=f"Task {task_id} not found or access denied"
            )

        # Normalize timezone
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        remind_at_naive = remind_at.replace(tzinfo=None) if remind_at.tzinfo else remind_at

        # Create reminder with pending status
        reminder = Reminder(
            task_id=task_id,
            user_id=user_id,
            remind_at=remind_at_naive,
            status=ReminderStatus.PENDING
        )

        session.add(reminder)
        await session.commit()
        await session.refresh(reminder)

        # Check if reminder is past due
        if remind_at_naive <= now:
            # Fire immediately via pub/sub
            await ReminderService.fire_past_due_reminder(
                session=session,
                reminder=reminder,
                task=task
            )
            logger.info(
                f"Fired past-due reminder {reminder.id} immediately",
                extra={"reminder_id": reminder.id, "was_past_due": True}
            )
            return reminder

        # Schedule Dapr job for future reminder (fire and forget - gracefully handle failure)
        job_name = f"reminder-{reminder.id}"
        job_scheduled = await DaprClient.schedule_job(
            job_name=job_name,
            schedule_time=remind_at_naive,
            data={
                "reminder_id": reminder.id,
                "task_id": task_id,
                "user_id": user_id
            }
        )

        # Store job name if successfully scheduled
        if job_scheduled:
            reminder.dapr_job_name = job_name
            await session.commit()
            await session.refresh(reminder)
            logger.info(
                f"Created reminder {reminder.id} with Dapr job '{job_name}'",
                extra={"reminder_id": reminder.id, "job_name": job_name}
            )
        else:
            logger.warning(
                f"Created reminder {reminder.id} but Dapr job scheduling failed",
                extra={"reminder_id": reminder.id}
            )

        return reminder

    @staticmethod
    async def update_reminder(
        session: AsyncSession,
        reminder: Reminder,
        remind_at: datetime
    ) -> Reminder:
        """Update reminder time and reschedule Dapr job.

        Args:
            session: Database session
            reminder: Reminder to update
            remind_at: New reminder time (UTC)

        Returns:
            Updated reminder

        Raises:
            AppException: If reminder time is in the past
        """
        # Validate new time is in the future
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        remind_at_naive = remind_at.replace(tzinfo=None) if remind_at.tzinfo else remind_at

        if remind_at_naive <= now:
            raise AppException.bad_request(
                detail="Reminder time must be in the future"
            )

        # Cancel existing Dapr job if it exists
        if reminder.dapr_job_name:
            await DaprClient.cancel_job(reminder.dapr_job_name)

        # Update reminder time
        reminder.remind_at = remind_at_naive

        # Schedule new Dapr job
        job_name = f"reminder-{reminder.id}"
        job_scheduled = await DaprClient.schedule_job(
            job_name=job_name,
            schedule_time=remind_at_naive,
            data={
                "reminder_id": reminder.id,
                "task_id": reminder.task_id,
                "user_id": reminder.user_id
            }
        )

        if job_scheduled:
            reminder.dapr_job_name = job_name
            logger.info(
                f"Updated reminder {reminder.id} with new Dapr job '{job_name}'",
                extra={"reminder_id": reminder.id, "job_name": job_name}
            )
        else:
            reminder.dapr_job_name = None
            logger.warning(
                f"Updated reminder {reminder.id} but Dapr job rescheduling failed",
                extra={"reminder_id": reminder.id}
            )

        await session.commit()
        await session.refresh(reminder)

        return reminder

    @staticmethod
    async def delete_reminder(
        session: AsyncSession,
        reminder: Reminder
    ) -> None:
        """Delete reminder and cancel Dapr job.

        Args:
            session: Database session
            reminder: Reminder to delete
        """
        # Cancel Dapr job if it exists
        if reminder.dapr_job_name:
            await DaprClient.cancel_job(reminder.dapr_job_name)

        # Delete reminder
        await session.delete(reminder)
        await session.commit()

        logger.info(
            f"Deleted reminder {reminder.id}",
            extra={"reminder_id": reminder.id}
        )

    @staticmethod
    async def mark_reminder_sent(
        session: AsyncSession,
        reminder: Reminder
    ) -> Reminder:
        """Mark reminder as sent with timestamp.

        Args:
            session: Database session
            reminder: Reminder to mark as sent

        Returns:
            Updated reminder
        """
        reminder.status = ReminderStatus.SENT
        reminder.sent_at = datetime.now(timezone.utc).replace(tzinfo=None)

        await session.commit()
        await session.refresh(reminder)

        logger.info(
            f"Marked reminder {reminder.id} as sent",
            extra={"reminder_id": reminder.id}
        )

        return reminder

    @staticmethod
    async def mark_reminder_failed(
        session: AsyncSession,
        reminder: Reminder
    ) -> Reminder:
        """Mark reminder as failed.

        Args:
            session: Database session
            reminder: Reminder to mark as failed

        Returns:
            Updated reminder
        """
        reminder.status = ReminderStatus.FAILED

        await session.commit()
        await session.refresh(reminder)

        logger.warning(
            f"Marked reminder {reminder.id} as failed",
            extra={"reminder_id": reminder.id}
        )

        return reminder

    @staticmethod
    async def get_pending_reminders_for_task(
        session: AsyncSession,
        task_id: int,
        user_id: str
    ) -> List[Reminder]:
        """Get all pending reminders for a specific task.

        Args:
            session: Database session
            task_id: Task ID
            user_id: User ID for ownership verification

        Returns:
            List of pending reminders for the task
        """
        statement = select(Reminder).where(
            Reminder.task_id == task_id,
            Reminder.user_id == user_id,
            Reminder.status == ReminderStatus.PENDING
        )

        result = await session.exec(statement)
        return result.all()

    @staticmethod
    async def fire_past_due_reminder(
        session: AsyncSession,
        reminder: Reminder,
        task: Task
    ) -> None:
        """Fire a past-due reminder immediately by publishing to Dapr pub/sub.

        This method is called when a reminder is created with a time in the past.
        Instead of scheduling, it immediately publishes the reminder event and
        marks the reminder as sent.

        Args:
            session: Database session
            reminder: Reminder to fire
            task: Associated task (for event data)
        """
        from src.schemas.events import ReminderEvent, ReminderEventType

        # Publish reminder event to "reminder-events" topic
        event = ReminderEvent(
            event_type=ReminderEventType.DUE,
            reminder_id=reminder.id,
            task_id=task.id,
            user_id=reminder.user_id,
            title=task.title,
            due_at=task.due_date,
            remind_at=reminder.remind_at
        )

        # Publish via Dapr pub/sub
        published = await DaprClient.publish_event(
            pubsub_name="pubsub-kafka",
            topic="reminder-events",
            data=event.model_dump(mode='json')
        )

        if published:
            # Mark reminder as sent
            reminder.status = ReminderStatus.SENT
            reminder.sent_at = datetime.now(timezone.utc).replace(tzinfo=None)
            await session.commit()
            await session.refresh(reminder)

            logger.info(
                f"Published past-due reminder {reminder.id} to reminder-events topic",
                extra={
                    "reminder_id": reminder.id,
                    "task_id": task.id,
                    "user_id": reminder.user_id,
                    "was_past_due": True
                }
            )
        else:
            # Mark as failed if publish didn't succeed
            reminder.status = ReminderStatus.FAILED
            await session.commit()
            await session.refresh(reminder)

            logger.error(
                f"Failed to publish past-due reminder {reminder.id}",
                extra={"reminder_id": reminder.id, "task_id": task.id}
            )
