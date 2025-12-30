"""Reminder model definition for task notifications."""
from enum import Enum
from sqlmodel import SQLModel, Field, Column
import sqlalchemy as sa
from datetime import datetime, timezone
from typing import Optional


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ReminderStatus(str, Enum):
    """Reminder status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Reminder(SQLModel, table=True):
    """Reminder model for scheduled task notifications.

    Reminders are scheduled using Dapr Jobs API for exact-time delivery.
    The notification service consumes reminder events and delivers
    in-app notifications via WebSocket.

    Note: user_id references the Better Auth users table.
    No SQLModel relationship defined since User model is managed by Better Auth.

    Indexes:
    - user_id (for filtering reminders by user)
    - task_id (for finding reminders for a specific task)
    - remind_at (for finding reminders due soon)
    - status (for filtering pending/sent/failed reminders)
    """

    __tablename__ = "reminders"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(
        sa_column=Column(
            sa.Integer,
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        ),
        description="Task this reminder is for"
    )
    user_id: str = Field(
        sa_column=Column(
            sa.String(36),
            sa.ForeignKey("user.id", use_alter=True, name="reminders_user_id_fkey", ondelete="CASCADE"),
            nullable=False,
            index=True
        ),
        max_length=36,
        description="Owner of this reminder"
    )
    remind_at: datetime = Field(
        nullable=False,
        index=True,
        description="When to send the reminder (UTC)"
    )
    status: ReminderStatus = Field(
        sa_column=Column(
            sa.Enum(ReminderStatus),
            nullable=False,
            index=True,
            default=ReminderStatus.PENDING.value
        ),
        description="Reminder delivery status"
    )
    sent_at: Optional[datetime] = Field(
        default=None,
        description="When the reminder was actually sent (UTC)"
    )
    dapr_job_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Dapr Jobs API job identifier for this reminder"
    )
    created_at: datetime = Field(
        default_factory=utcnow,
        nullable=False,
        description="When reminder was created"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 123,
                "remind_at": "2026-01-15T09:00:00Z",
                "status": "pending"
            }
        }
