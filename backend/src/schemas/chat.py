"""Chat Pydantic schemas for Phase 3 AI Chatbot.

These schemas handle:
- ChatRequest: Send a message to the chat API
- ChatResponse: Response from the chat API
- ToolCall: MCP tool invocation record
"""

from typing import Any, Optional

from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    """Schema for an MCP tool invocation."""

    id: str
    tool: str
    arguments: dict[str, Any]
    result: Optional[dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Schema for sending a message to the chat API."""

    conversation_id: Optional[int] = None
    message: str = Field(..., min_length=1, max_length=4000)
    verbose: bool = Field(
        default=False,
        description="Enable verbose mode to emit detailed agent lifecycle events"
    )


class ChatResponse(BaseModel):
    """Schema for non-streaming chat response."""

    conversation_id: int
    message_id: int
    response: str
    tool_calls: Optional[list[ToolCall]] = None


class ChatStreamDoneEvent(BaseModel):
    """Schema for SSE done event data."""

    conversation_id: int
    message_id: int
