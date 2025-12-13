"""Task model definition."""
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.category import TaskCategory


class Task(SQLModel, table=True):
    """Task model for user todo items."""

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True, nullable=False)
    priority: str = Field(default="medium", max_length=20, index=True, nullable=False)  # low, medium, high
    due_date: Optional[datetime] = Field(default=None, index=True)
    is_recurring: bool = Field(default=False, nullable=False)
    recurrence_pattern: Optional[str] = Field(default=None, max_length=50)  # daily, weekly, monthly, yearly
    recurrence_data: Optional[dict] = Field(default=None, sa_column=Column(sa.JSON))
    parent_recurring_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="tasks")
