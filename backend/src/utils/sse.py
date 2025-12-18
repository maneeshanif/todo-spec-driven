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


# =====================================================
# Verbose Events - Detailed agent lifecycle indicators
# =====================================================


def create_verbose_event(
    event_type: str,
    message: str,
    agent_name: str | None = None,
    tool_name: str | None = None,
    call_id: str | None = None,
    data: dict[str, Any] | None = None,
) -> ServerSentEvent:
    """Create a verbose SSE event for agent lifecycle.

    These events provide granular visibility into agent execution:
    - agent_start: Agent initialized
    - agent_end: Agent finished
    - llm_start: LLM call starting
    - llm_end: LLM response received
    - mcp_request: MCP tool request sent
    - mcp_response: MCP tool response received
    - handoff: Agent handoff occurred

    Args:
        event_type: The verbose event type
        message: Human-readable description
        agent_name: Name of the agent (optional)
        tool_name: Name of the tool (optional)
        call_id: Tool call ID (optional)
        data: Additional event data (optional)

    Returns:
        ServerSentEvent with the specified verbose event type
    """
    event_data = {
        "message": message,
    }
    if agent_name:
        event_data["agent_name"] = agent_name
    if tool_name:
        event_data["tool_name"] = tool_name
    if call_id:
        event_data["call_id"] = call_id
    if data:
        event_data.update(data)

    return format_sse_event(event_type, event_data)


def create_agent_start_event(
    agent_name: str,
    message: str = "Agent initialized",
) -> ServerSentEvent:
    """Create SSE event for agent start."""
    return create_verbose_event("agent_start", message, agent_name=agent_name)


def create_agent_end_event(
    agent_name: str,
    message: str = "Agent finished",
) -> ServerSentEvent:
    """Create SSE event for agent end."""
    return create_verbose_event("agent_end", message, agent_name=agent_name)


def create_llm_start_event(
    agent_name: str,
    model: str = "gemini-2.5-flash",
) -> ServerSentEvent:
    """Create SSE event for LLM call starting."""
    return create_verbose_event(
        "llm_start",
        f"Calling LLM ({model})...",
        agent_name=agent_name,
        data={"model": model},
    )


def create_llm_end_event(
    agent_name: str,
) -> ServerSentEvent:
    """Create SSE event for LLM response received."""
    return create_verbose_event(
        "llm_end",
        "LLM response received",
        agent_name=agent_name,
    )


def create_mcp_request_event(
    tool_name: str,
    call_id: str,
    agent_name: str | None = None,
) -> ServerSentEvent:
    """Create SSE event for MCP tool request sent."""
    return create_verbose_event(
        "mcp_request",
        f"MCP Request → {tool_name}",
        agent_name=agent_name,
        tool_name=tool_name,
        call_id=call_id,
    )


def create_mcp_response_event(
    tool_name: str,
    call_id: str,
    agent_name: str | None = None,
) -> ServerSentEvent:
    """Create SSE event for MCP tool response received."""
    return create_verbose_event(
        "mcp_response",
        f"MCP Response ← {tool_name}",
        agent_name=agent_name,
        tool_name=tool_name,
        call_id=call_id,
    )


def create_handoff_event(
    from_agent: str,
    to_agent: str,
) -> ServerSentEvent:
    """Create SSE event for agent handoff."""
    return create_verbose_event(
        "handoff",
        f"Handoff: {from_agent} → {to_agent}",
        agent_name=to_agent,
        data={"from_agent": from_agent, "to_agent": to_agent},
    )


# =====================================================
# RunItem Events - All 6 RunItem types from SDK
# =====================================================


def create_handoff_call_event(
    tool: str,
    call_id: str,
) -> ServerSentEvent:
    """Create SSE event for handoff call (LLM calling handoff tool).

    This is the handoff_call_item from RunItem types.
    """
    return format_sse_event("handoff_call", {
        "tool": tool,
        "call_id": call_id,
    })


def create_reasoning_event(
    content: str,
) -> ServerSentEvent:
    """Create SSE event for reasoning/thinking from LLM.

    This is the reasoning_item from RunItem types.
    Shows the LLM's internal reasoning process.
    """
    return format_sse_event("reasoning", {
        "content": content,
    })


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
    # Verbose events
    "create_verbose_event",
    "create_agent_start_event",
    "create_agent_end_event",
    "create_llm_start_event",
    "create_llm_end_event",
    "create_mcp_request_event",
    "create_mcp_response_event",
    "create_handoff_event",
    # RunItem events
    "create_handoff_call_event",
    "create_reasoning_event",
]
