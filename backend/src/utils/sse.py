"""Server-Sent Events (SSE) utilities for streaming responses.

This module provides utilities for creating SSE responses
that stream AI agent responses to the frontend.
"""

import json
from typing import Any, AsyncGenerator

from sse_starlette.sse import ServerSentEvent


def format_sse_event(
    event: str,
    data: Any,
) -> ServerSentEvent:
    """Format data as a Server-Sent Event.

    Args:
        event: The event type (e.g., 'token', 'tool_call', 'done')
        data: The data to send (will be JSON encoded)

    Returns:
        ServerSentEvent: Formatted SSE event
    """
    return ServerSentEvent(
        event=event,
        data=json.dumps(data) if not isinstance(data, str) else data,
    )


def create_token_event(content: str) -> ServerSentEvent:
    """Create an SSE event for a text token.

    Args:
        content: The text content chunk

    Returns:
        ServerSentEvent with event type 'token'
    """
    return format_sse_event("token", {"content": content})


def create_tool_call_event(
    tool: str,
    args: dict[str, Any],
    call_id: str,
) -> ServerSentEvent:
    """Create an SSE event for a tool call.

    Args:
        tool: The name of the tool being called
        args: The arguments passed to the tool
        call_id: Unique identifier for this tool call

    Returns:
        ServerSentEvent with event type 'tool_call'
    """
    return format_sse_event("tool_call", {
        "tool": tool,
        "args": args,
        "call_id": call_id,
    })


def create_tool_result_event(
    call_id: str,
    output: Any,
) -> ServerSentEvent:
    """Create an SSE event for a tool result.

    Args:
        call_id: The tool call ID this result is for
        output: The result from the tool execution

    Returns:
        ServerSentEvent with event type 'tool_result'
    """
    return format_sse_event("tool_result", {
        "call_id": call_id,
        "output": output,
    })


def create_done_event(
    conversation_id: int,
    message_id: int,
) -> ServerSentEvent:
    """Create an SSE event signaling completion.

    Args:
        conversation_id: The conversation ID
        message_id: The ID of the final message

    Returns:
        ServerSentEvent with event type 'done'
    """
    return format_sse_event("done", {
        "conversation_id": conversation_id,
        "message_id": message_id,
    })


def create_error_event(
    message: str,
    code: str = "error",
) -> ServerSentEvent:
    """Create an SSE event for an error.

    Args:
        message: Human-readable error message
        code: Error code for programmatic handling

    Returns:
        ServerSentEvent with event type 'error'
    """
    return format_sse_event("error", {
        "message": message,
        "code": code,
    })


def create_thinking_event(
    content: str,
    agent: str = "TodoBot",
) -> ServerSentEvent:
    """Create an SSE event for thinking/processing state.

    Used to show a "thinking" indicator in the UI while
    the agent is processing or reasoning.

    Args:
        content: Description of what the agent is doing
        agent: Name of the agent that is thinking

    Returns:
        ServerSentEvent with event type 'thinking'
    """
    return format_sse_event("thinking", {
        "content": content,
        "agent": agent,
    })


def create_agent_updated_event(
    agent: str,
    content: str = "",
) -> ServerSentEvent:
    """Create an SSE event for agent change (multi-agent).

    Used in multi-agent scenarios when control is handed
    off to a different agent.

    Args:
        agent: Name of the new agent
        content: Optional description of the handoff

    Returns:
        ServerSentEvent with event type 'agent_updated'
    """
    return format_sse_event("agent_updated", {
        "agent": agent,
        "content": content,
    })


async def stream_events(
    events: AsyncGenerator[ServerSentEvent, None],
) -> AsyncGenerator[ServerSentEvent, None]:
    """Wrap an async generator of events for SSE streaming.

    This is a pass-through that can be used for any additional
    processing needed on the event stream.

    Args:
        events: Async generator of ServerSentEvent objects

    Yields:
        ServerSentEvent objects
    """
    async for event in events:
        yield event


__all__ = [
    "format_sse_event",
    "create_token_event",
    "create_tool_call_event",
    "create_tool_result_event",
    "create_done_event",
    "create_error_event",
    "create_thinking_event",
    "create_agent_updated_event",
    "stream_events",
]
