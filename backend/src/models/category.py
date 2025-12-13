"""Category models for task organization."""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from src.models.task import Task
    from src.models.user import User


class TaskCategoryMapping(SQLModel, table=True):
    """Many-to-many mapping between tasks and categories."""

    __tablename__ = "task_category_mappings"

    task_id: int = Field(foreign_key="tasks.id", primary_key=True, ondelete="CASCADE")
    category_id: int = Field(foreign_key="task_categories.id", primary_key=True, ondelete="CASCADE")


class TaskCategory(SQLModel, table=True):
    """Category model for organizing tasks."""

    __tablename__ = "task_categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, nullable=False)
    color: str = Field(max_length=20, nullable=False, default="#6366f1")  # Default indigo color
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="categories")
