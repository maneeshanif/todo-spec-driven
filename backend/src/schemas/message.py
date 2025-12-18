"""Message Pydantic schemas for Phase 3 AI Chatbot.

These schemas handle:
- MessageCreate: Create a new message
- MessageResponse: Message in API responses
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from src.models.message import MessageRole


class MessageCreate(BaseModel):
    """Schema for creating a new message."""

    content: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    """Schema for message in API responses."""

    id: int
    conversation_id: int
    role: str
    content: str
    tool_calls: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """Schema for paginated message list."""

    messages: list[MessageResponse]
    total: int
    limit: int
    offset: int
