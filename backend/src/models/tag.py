"""Tag model definition for task categorization."""
from sqlmodel import SQLModel, Field, Column, Index, Relationship
import sqlalchemy as sa
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from src.models.task import Task


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Tag(SQLModel, table=True):
    """Tag model for task categorization.

    Allows users to create custom tags for organizing tasks.
    Each tag has a name and color, and is scoped per user.

    Note: user_id references the Better Auth users table.
    No SQLModel relationship defined since User model is managed by Better Auth.

    Indexes:
    - user_id (for filtering tags by user)
    - (user_id, name) unique constraint (prevents duplicate tag names per user)
    """

    __tablename__ = "tags"
    __table_args__ = (
        Index("idx_tags_user_id", "user_id"),
        sa.UniqueConstraint("user_id", "name", name="uq_tags_user_name"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(
            sa.String(36),
            sa.ForeignKey("user.id", use_alter=True, name="tags_user_id_fkey", ondelete="CASCADE"),
            nullable=False,
            index=True
        ),
        description="Owner of this tag"
    )
    name: str = Field(
        max_length=50,
        nullable=False,
        description="Tag name (max 50 chars, unique per user)"
    )
    color: str = Field(
        default="#808080",
        max_length=7,
        nullable=False,
        description="Hex color code for UI display (default: gray)"
    )
    created_at: datetime = Field(
        default_factory=utcnow,
        nullable=False,
        description="When tag was created"
    )

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="tags", link_model="TaskTag")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "work",
                "color": "#3b82f6"  # Blue
            }
        }
