"""Message model for Phase 3 AI Chatbot.

A message represents a single message within a conversation.
Messages can be from the user, assistant, or system.
Tool calls are stored as JSONB for flexible schema.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field, Relationship, Column


if TYPE_CHECKING:
    from src.models.conversation import Conversation


def utcnow() -> datetime:
    """Return current UTC time without timezone info (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class MessageRole(str, Enum):
    """Message role enumeration.

    Defines who sent the message in a conversation.
    """

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(SQLModel, table=True):
    """Message model for conversation messages.

    A message belongs to a conversation and contains:
    - role: who sent the message (user/assistant/system)
    - content: the text content of the message
    - tool_calls: optional JSONB field for MCP tool invocations

    Messages are immutable once created (no updates).
    """

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(
        sa_column=Column(
            sa.Integer,
            sa.ForeignKey(
                "conversations.id",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        )
    )
    role: str = Field(max_length=20, nullable=False)
    content: str = Field(nullable=False)
    tool_calls: Optional[dict[str, Any]] = Field(
        default=None, sa_column=Column(JSONB)
    )
    created_at: datetime = Field(default_factory=utcnow, nullable=False)

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "conversation_id": 1,
                "role": "user",
                "content": "Add a task to buy groceries",
                "tool_calls": None,
                "created_at": "2025-12-17T10:00:00Z",
            }
        }
