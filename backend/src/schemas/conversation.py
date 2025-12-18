"""Conversation Pydantic schemas for Phase 3 AI Chatbot.

These schemas handle:
- ConversationCreate: Create a new conversation
- ConversationUpdate: Rename a conversation
- ConversationResponse: Conversation in API responses
- ConversationWithMessages: Conversation with its messages
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from src.schemas.message import MessageResponse


class ConversationCreate(BaseModel):
    """Schema for creating a new conversation."""

    title: Optional[str] = Field(None, max_length=255)


class ConversationUpdate(BaseModel):
    """Schema for updating (renaming) a conversation."""

    title: str = Field(..., min_length=1, max_length=255)


class ConversationResponse(BaseModel):
    """Schema for conversation in API responses."""

    id: int
    user_id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    preview: Optional[str] = None  # Preview of last message (truncated)
    messages: Optional[list["MessageResponse"]] = None

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Schema for paginated conversation list."""

    conversations: list[ConversationResponse]
    total: int
    page: int
    page_size: int


# Forward reference resolution
from src.schemas.message import MessageResponse
ConversationResponse.model_rebuild()
