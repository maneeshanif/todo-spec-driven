"""Reminder API endpoints for task notification scheduling."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional

from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.models.reminder import ReminderStatus
from src.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderPublic,
    ReminderListResponse,
    ReminderResponse
)
from src.services.reminder_service import ReminderService
from src.core.logging import get_logger
from src.core.errors import AppException

router = APIRouter(prefix="/users/{user_id}/reminders", tags=["reminders"])
logger = get_logger(__name__)


def verify_user_access(current_user: dict, user_id: str):
    """Verify that the authenticated user matches the requested user_id.

    Args:
        current_user: Current authenticated user from JWT
        user_id: Requested user_id from path parameter

    Raises:
        HTTPException: If user IDs don't match
    """
    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this resource"
        )


@router.get("", response_model=ReminderListResponse)
async def list_reminders(
    user_id: str,
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, sent, failed)"),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List user's reminders with optional filters.

    - **task_id**: Filter reminders for a specific task
    - **status**: Filter by reminder status (pending, sent, failed)

    Returns list of reminders ordered by remind_at (ascending).
    """
    verify_user_access(current_user, user_id)

    # Parse and validate status filter
    reminder_status = None
    if status_filter:
        try:
            reminder_status = ReminderStatus(status_filter.lower())
        except ValueError:
            raise AppException.bad_request(
                detail=f"Invalid status '{status_filter}'. Must be one of: pending, sent, failed"
            )

    reminders = await ReminderService.get_reminders(
        session=session,
        user_id=user_id,
        task_id=task_id,
        status=reminder_status
    )

    return ReminderListResponse(
        reminders=[ReminderPublic.model_validate(r) for r in reminders],
        total=len(reminders)
    )


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    user_id: str,
    reminder_data: ReminderCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new reminder for a task.

    - **task_id**: ID of the task to set reminder for (must belong to user)
    - **remind_at**: When to send the reminder (UTC datetime, must be in future)

    Automatically schedules a Dapr job for notification delivery if Dapr is available.
    If Dapr is not available, the reminder is still created but won't be delivered.
    """
    verify_user_access(current_user, user_id)

    try:
        reminder = await ReminderService.create_reminder(
            session=session,
            user_id=user_id,
            task_id=reminder_data.task_id,
            remind_at=reminder_data.remind_at
        )

        logger.info(
            f"User {user_id} created reminder {reminder.id} for task {reminder_data.task_id}",
            extra={
                "user_id": user_id,
                "reminder_id": reminder.id,
                "task_id": reminder_data.task_id,
                "remind_at": reminder_data.remind_at.isoformat()
            }
        )

        return ReminderResponse(reminder=ReminderPublic.model_validate(reminder))

    except AppException:
        raise
    except Exception as e:
        logger.error(f"Error creating reminder: {e}", exc_info=True)
        raise AppException.internal_error(detail="Failed to create reminder")


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    user_id: str,
    reminder_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a single reminder by ID.

    Verifies that the reminder belongs to the authenticated user.
    """
    verify_user_access(current_user, user_id)

    reminder = await ReminderService.get_reminder_by_id(
        session=session,
        reminder_id=reminder_id,
        user_id=user_id
    )

    if not reminder:
        raise AppException.not_found(detail=f"Reminder {reminder_id} not found")

    return ReminderResponse(reminder=ReminderPublic.model_validate(reminder))


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    user_id: str,
    reminder_id: int,
    reminder_data: ReminderUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update a reminder's scheduled time.

    - **remind_at**: New reminder time (UTC datetime, must be in future)

    Cancels the existing Dapr job and schedules a new one.
    Only pending reminders can be updated.
    """
    verify_user_access(current_user, user_id)

    reminder = await ReminderService.get_reminder_by_id(
        session=session,
        reminder_id=reminder_id,
        user_id=user_id
    )

    if not reminder:
        raise AppException.not_found(detail=f"Reminder {reminder_id} not found")

    # Only allow updating pending reminders
    if reminder.status != ReminderStatus.PENDING:
        raise AppException.bad_request(
            detail=f"Cannot update reminder with status '{reminder.status}'. Only pending reminders can be updated."
        )

    if not reminder_data.remind_at:
        raise AppException.bad_request(detail="remind_at is required")

    try:
        updated_reminder = await ReminderService.update_reminder(
            session=session,
            reminder=reminder,
            remind_at=reminder_data.remind_at
        )

        logger.info(
            f"User {user_id} updated reminder {reminder_id}",
            extra={
                "user_id": user_id,
                "reminder_id": reminder_id,
                "new_remind_at": reminder_data.remind_at.isoformat()
            }
        )

        return ReminderResponse(reminder=ReminderPublic.model_validate(updated_reminder))

    except AppException:
        raise
    except Exception as e:
        logger.error(f"Error updating reminder: {e}", exc_info=True)
        raise AppException.internal_error(detail="Failed to update reminder")


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    user_id: str,
    reminder_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Cancel and delete a reminder.

    Cancels the Dapr job if it exists and removes the reminder from the database.
    """
    verify_user_access(current_user, user_id)

    reminder = await ReminderService.get_reminder_by_id(
        session=session,
        reminder_id=reminder_id,
        user_id=user_id
    )

    if not reminder:
        raise AppException.not_found(detail=f"Reminder {reminder_id} not found")

    try:
        await ReminderService.delete_reminder(session=session, reminder=reminder)

        logger.info(
            f"User {user_id} deleted reminder {reminder_id}",
            extra={
                "user_id": user_id,
                "reminder_id": reminder_id,
                "task_id": reminder.task_id
            }
        )

    except Exception as e:
        logger.error(f"Error deleting reminder: {e}", exc_info=True)
        raise AppException.internal_error(detail="Failed to delete reminder")
