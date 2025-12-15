"""Task model definition."""
from sqlmodel import SQLModel, Field, Relationship, Column, ForeignKey
import sqlalchemy as sa
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from src.models.category import TaskCategory


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Task(SQLModel, table=True):
    """Task model for user todo items.
    
    Note: user_id references the Better Auth users table.
    No SQLModel relationship defined since User model is managed by Better Auth.
    """

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(
            sa.String,
            sa.ForeignKey("user.id", use_alter=True, name="tasks_user_id_fkey", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True, nullable=False)
    priority: str = Field(default="medium", max_length=20, index=True, nullable=False)  # low, medium, high
    due_date: Optional[datetime] = Field(default=None, index=True)
    is_recurring: bool = Field(default=False, nullable=False)
    recurrence_pattern: Optional[str] = Field(default=None, max_length=50)  # daily, weekly, monthly, yearly
    recurrence_data: Optional[dict] = Field(default=None, sa_column=Column(sa.JSON))
    parent_recurring_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)

    # Relationships (to other SQLModel models only)
    # Note: No user relationship - Better Auth manages users externally
