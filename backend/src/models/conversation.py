"""Conversation model for Phase 3 AI Chatbot.

A conversation represents a chat thread between a user and the AI assistant.
Each conversation contains multiple messages.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, List

import sqlalchemy as sa
from sqlmodel import SQLModel, Field, Relationship, Column


if TYPE_CHECKING:
    from src.models.message import Message


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Conversation(SQLModel, table=True):
    """Conversation model for chat threads.

    A conversation belongs to a user and contains multiple messages.
    The title is auto-generated from the first user message.

    Note: user_id references the Better Auth users table.
    No SQLModel relationship defined since User model is managed by Better Auth.
    """

    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(
            sa.String,
            sa.ForeignKey(
                "user.id",
                use_alter=True,
                name="conversations_user_id_fkey",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        )
    )
    title: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)

    # Relationships
    messages: List["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": "user_abc123",
                "title": "Add task to buy groceries",
                "created_at": "2025-12-17T10:00:00Z",
                "updated_at": "2025-12-17T10:05:00Z",
            }
        }
