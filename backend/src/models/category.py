"""Category models for task organization."""
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from src.models.task import Task


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TaskCategoryMapping(SQLModel, table=True):
    """Many-to-many mapping between tasks and categories."""

    __tablename__ = "task_category_mappings"

    task_id: int = Field(foreign_key="tasks.id", primary_key=True, ondelete="CASCADE")
    category_id: int = Field(foreign_key="task_categories.id", primary_key=True, ondelete="CASCADE")


class TaskCategory(SQLModel, table=True):
    """Category model for organizing tasks.
    
    Note: user_id references the Better Auth users table.
    No SQLModel relationship defined since User model is managed by Better Auth.
    """

    __tablename__ = "task_categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, nullable=False)
    color: str = Field(max_length=20, nullable=False, default="#6366f1")  # Default indigo color
    user_id: str = Field(
        sa_column=Column(
            sa.String,
            sa.ForeignKey("user.id", use_alter=True, name="task_categories_user_id_fkey", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    created_at: datetime = Field(default_factory=utcnow, nullable=False)

    # Relationships (to other SQLModel models only)
    # Note: No user relationship - Better Auth manages users externally
