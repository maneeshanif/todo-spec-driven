"""Agent execution utilities for running the TodoBot.

This module provides utilities for running the agent in both
streaming and non-streaming modes. It uses the OpenAI Agents SDK's
NATIVE MCP integration via MCPServerStreamableHttp.

KEY PATTERN: The MCP server connection is managed via async context manager.
The agent automatically discovers and uses tools from the MCP server.

Streaming uses Runner.run_streamed() which returns a result object
(NOT an async context manager). Iterate with: async for event in result.stream_events()

VERBOSE MODE: When verbose=True, emits detailed SSE events for:
- agent_start/agent_end: Agent lifecycle
- llm_start/llm_end: LLM (Gemini) calls
- mcp_request/mcp_response: MCP tool requests and responses
"""

import logging
import asyncio
from dataclasses import dataclass, field
from typing import AsyncGenerator, Optional, List

from agents import Agent, Runner, ItemHelpers, enable_verbose_stdout_logging
from agents.mcp import MCPServerStreamableHttp
from agents.items import (
    TResponseInputItem,
    MessageOutputItem,
    ToolCallItem,
    ToolCallOutputItem,
    HandoffCallItem,
    HandoffOutputItem,
    ReasoningItem,
)
from openai.types.responses import ResponseTextDeltaEvent

from src.agents.config import get_gemini_model, get_mcp_server_url
from src.agents.hooks import (
    run_hooks,
    VerboseEvent,
    VerboseEventType,
    set_verbose_callback,
)
from src.agents.errors import (
    AgentError,
    classify_exception,
)

logger = logging.getLogger("todobot.runner")


@dataclass
class AgentResponse:
    """Response from a non-streaming agent run."""

    content: str
    tool_calls: Optional[list[dict]] = None


@dataclass
class StreamEvent:
    """Event emitted during streaming agent execution.

    Event types for hybrid UI:
    - 'thinking': Agent is processing/reasoning
    - 'token': Text content chunk from the assistant
    - 'tool_call': Tool is being called (with tool name, args)
    - 'tool_result': Result from tool execution
    - 'agent_updated': Agent changed (for multi-agent scenarios)
    - 'done': Streaming completed
    - 'error': Error occurred

    Verbose event types (when verbose=True):
    - 'agent_start': Agent initialized
    - 'agent_end': Agent finished
    - 'llm_start': LLM call starting
    - 'llm_end': LLM response received
    - 'mcp_request': MCP tool request sent
    - 'mcp_response': MCP tool response received
    - 'handoff': Agent handoff occurred
    """

    type: str
    content: Optional[str] = None
    data: Optional[dict] = None


async def run_agent(
    user_id: str,
    message: str,
    history: Optional[list[dict[str, str]]] = None,
) -> AgentResponse:
    """Run the agent with a message and return the complete response.

    This is the non-streaming version that waits for the complete
    response before returning. Uses native MCP integration.

    Args:
        user_id: The user's ID for task operations
        message: The user's message to process
        history: Optional conversation history as list of
                 {"role": str, "content": str} dicts

    Returns:
        AgentResponse with content and optional tool_calls
    """
    # Build input with history if provided
    input_messages: list[TResponseInputItem] = []

    if history:
        for msg in history:
            input_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

    # Add current message
    input_messages.append({
        "role": "user",
        "content": message,
    })

    logger.info(f"Running agent for user {user_id} with {len(input_messages)} messages")

    mcp_url = get_mcp_server_url()
    logger.debug(f"Connecting to MCP server at {mcp_url}")

    try:
        # Use native MCP integration via async context manager
        # Increase timeout to 30s for Neon serverless cold starts
        async with MCPServerStreamableHttp(
            name="Todo MCP Server",
            params={"url": mcp_url, "timeout": 30},
            client_session_timeout_seconds=30,
            cache_tools_list=True,
        ) as mcp_server:
            # Create agent with MCP server attached
            from src.agents.todo_agent import create_todo_agent_config
            name, instructions = create_todo_agent_config(user_id)

            agent = Agent(
                name=name,
                instructions=instructions,
                model=get_gemini_model(),
                mcp_servers=[mcp_server],  # Native MCP integration!
            )

            # Run the agent
            result = await Runner.run(
                agent,
                input=input_messages,
                hooks=run_hooks,
            )

            # Extract response content and tool calls
            content = ""
            tool_calls: list[dict] = []

            for item in result.new_items:
                if isinstance(item, MessageOutputItem):
                    # Extract text content from message using ItemHelpers
                    text = ItemHelpers.text_message_output(item)
                    if text:
                        content += text
                elif isinstance(item, ToolCallItem):
                    # Access tool data via raw_item (McpCall or ResponseFunctionToolCall)
                    raw = item.raw_item
                    tool_calls.append({
                        "tool": getattr(raw, "name", "unknown"),
                        "args": getattr(raw, "arguments", "{}"),
                        "call_id": getattr(raw, "call_id", None) or getattr(raw, "id", ""),
                    })
                elif isinstance(item, ToolCallOutputItem):
                    # Find matching tool call and add result
                    # call_id is in raw_item (dict or FunctionCallOutput)
                    raw_output = item.raw_item
                    output_call_id = (
                        raw_output.get("call_id") if isinstance(raw_output, dict)
                        else getattr(raw_output, "call_id", None)
                    )
                    for tc in tool_calls:
                        if tc.get("call_id") == output_call_id:
                            tc["result"] = item.output
                            break

            # If content is empty, try to get final output
            if not content and result.final_output:
                content = str(result.final_output)

            logger.info(
                f"Agent run complete: {len(content)} chars, {len(tool_calls)} tool calls"
            )

            return AgentResponse(
                content=content,
                tool_calls=tool_calls if tool_calls else None,
            )

    except AgentError as e:
        # Already classified agent error
        logger.error(f"Agent run failed [{e.code.value}]: {e.internal_message}", exc_info=True)
        raise e
    except Exception as e:
        # Classify unknown exception and re-raise as AgentError
        logger.error(f"Agent run failed: {e}", exc_info=True)
        classified = classify_exception(e)
        raise classified from e


async def run_agent_streamed(
    user_id: str,
    message: str,
    history: Optional[list[dict[str, str]]] = None,
    verbose: bool = False,
) -> AsyncGenerator[StreamEvent, None]:
    """Run the agent with streaming output.

    This version yields events as they occur, suitable for
    Server-Sent Events (SSE) streaming to the frontend.
    Uses native MCP integration.

    Args:
        user_id: The user's ID for task operations
        message: The user's message to process
        history: Optional conversation history
        verbose: If True, emit detailed lifecycle events (agent_start,
                 llm_start, llm_end, mcp_request, mcp_response)

    Yields:
        StreamEvent objects for each event type:
        - thinking: Agent is processing (show spinner/indicator)
        - token: Text content chunk
        - tool_call: Tool being called with args
        - tool_result: Result of tool execution
        - agent_updated: Agent changed (multi-agent)
        - done: Completion signal
        - error: Error occurred

        When verbose=True, also yields:
        - agent_start: Agent initialized
        - agent_end: Agent finished
        - llm_start: LLM call starting
        - llm_end: LLM response received
        - mcp_request: MCP tool request sent
        - mcp_response: MCP tool response received
        - handoff: Agent handoff occurred
    """
    # Build input with history if provided
    input_messages: list[TResponseInputItem] = []

    if history:
        for msg in history:
            input_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

    # Add current message
    input_messages.append({
        "role": "user",
        "content": message,
    })

    logger.info(f"Starting streamed agent run for user {user_id} with {len(input_messages)} messages (verbose={verbose})")

    mcp_url = get_mcp_server_url()
    tool_calls: list[dict] = []
    full_content = ""

    # Queue to receive verbose events from hooks (thread-safe)
    verbose_queue: asyncio.Queue[VerboseEvent] = asyncio.Queue() if verbose else None

    # Set up verbose callback if enabled
    if verbose:
        # Enable SDK's verbose stdout logging for debugging
        enable_verbose_stdout_logging()

        def verbose_callback(event: VerboseEvent) -> None:
            """Callback for hooks to emit verbose events."""
            try:
                # Put event in queue (non-blocking)
                verbose_queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(f"Verbose event queue full, dropping: {event.type}")

        set_verbose_callback(verbose_callback)

    try:
        # Use native MCP integration via async context manager
        # Increase timeout to 30s for Neon serverless cold starts
        async with MCPServerStreamableHttp(
            name="Todo MCP Server",
            params={"url": mcp_url, "timeout": 30},
            client_session_timeout_seconds=30,
            cache_tools_list=True,
        ) as mcp_server:
            # Create agent with MCP server attached
            from src.agents.todo_agent import create_todo_agent_config
            name, instructions = create_todo_agent_config(user_id)

            agent = Agent(
                name=name,
                instructions=instructions,
                model=get_gemini_model(),
                mcp_servers=[mcp_server],  # Native MCP integration!
            )

            # Signal that agent is starting to think
            yield StreamEvent(
                type="thinking",
                content="Processing your request...",
                data={"agent": name},
            )

            # CORRECT PATTERN: Runner.run_streamed returns result directly (NOT async context manager)
            # See: https://github.com/openai/openai-agents-python/blob/main/docs/streaming.md
            result = Runner.run_streamed(
                agent,
                input=input_messages,
                hooks=run_hooks,
            )

            # Helper to drain verbose queue and yield events
            async def drain_verbose_queue():
                """Drain any pending verbose events from the queue."""
                if not verbose_queue:
                    return
                while not verbose_queue.empty():
                    try:
                        verbose_event = verbose_queue.get_nowait()
                        yield StreamEvent(
                            type=verbose_event.type.value,
                            content=verbose_event.message,
                            data={
                                "agent_name": verbose_event.agent_name,
                                "tool_name": verbose_event.tool_name,
                                "call_id": verbose_event.call_id,
                                **(verbose_event.data or {}),
                            },
                        )
                    except asyncio.QueueEmpty:
                        break

            # Iterate over stream events
            async for event in result.stream_events():
                # Drain any verbose events that came in
                if verbose:
                    async for verbose_stream_event in drain_verbose_queue():
                        yield verbose_stream_event

                event_type = event.type

                # Raw response events - contains text deltas for token-by-token streaming
                if event_type == "raw_response_event":
                    # Check if it's a text delta event
                    if isinstance(event.data, ResponseTextDeltaEvent):
                        delta_text = event.data.delta
                        if delta_text:
                            full_content += delta_text
                            yield StreamEvent(
                                type="token",
                                content=delta_text,
                            )

                # Agent updated events (for multi-agent scenarios)
                elif event_type == "agent_updated_stream_event":
                    if hasattr(event, "new_agent"):
                        yield StreamEvent(
                            type="agent_updated",
                            content=f"Agent changed to {event.new_agent.name}",
                            data={"agent": event.new_agent.name},
                        )

                # Run item stream events - higher level events for tool calls, messages
                elif event_type == "run_item_stream_event":
                    item = event.item

                    # Tool call item - tool is being invoked
                    if item.type == "tool_call_item":
                        # Access tool data via raw_item (McpCall or ResponseFunctionToolCall)
                        raw = item.raw_item
                        tool_name = getattr(raw, "name", "unknown")
                        tool_data = {
                            "tool": tool_name,
                            "args": getattr(raw, "arguments", "{}"),
                            "call_id": getattr(raw, "call_id", None) or getattr(raw, "id", ""),
                        }
                        tool_calls.append(tool_data)
                        yield StreamEvent(
                            type="tool_call",
                            content=f"Calling tool: {tool_name}",
                            data=tool_data,
                        )

                    # Tool call output item - tool returned result
                    elif item.type == "tool_call_output_item":
                        # call_id is in raw_item (dict or FunctionCallOutput)
                        raw_output = item.raw_item
                        output_call_id = (
                            raw_output.get("call_id") if isinstance(raw_output, dict)
                            else getattr(raw_output, "call_id", "")
                        )
                        result_data = {
                            "call_id": output_call_id,
                            "output": item.output if hasattr(item, "output") else None,
                        }
                        # Update matching tool call with result
                        for tc in tool_calls:
                            if tc.get("call_id") == output_call_id:
                                tc["result"] = result_data.get("output")
                                break
                        yield StreamEvent(
                            type="tool_result",
                            content="Tool execution completed",
                            data=result_data,
                        )

                    # Message output item - final message content
                    elif item.type == "message_output_item":
                        # Use ItemHelpers to extract text properly
                        text = ItemHelpers.text_message_output(item)
                        if text and text not in full_content:
                            # Only yield if it's new content not already streamed
                            full_content += text
                            yield StreamEvent(
                                type="token",
                                content=text,
                            )

                    # Handoff call item - LLM is calling handoff to another agent
                    elif item.type == "handoff_call_item":
                        raw = item.raw_item
                        yield StreamEvent(
                            type="handoff_call",
                            content=f"Initiating handoff to another agent",
                            data={
                                "tool": getattr(raw, "name", "handoff"),
                                "call_id": getattr(raw, "call_id", None) or getattr(raw, "id", ""),
                            },
                        )

                    # Handoff output item - Agent handoff occurred
                    elif item.type == "handoff_output_item":
                        source_agent = getattr(item, "source_agent", None)
                        target_agent = getattr(item, "target_agent", None)
                        source_name = source_agent.name if source_agent else "Unknown"
                        target_name = target_agent.name if target_agent else "Unknown"
                        yield StreamEvent(
                            type="handoff",
                            content=f"Handoff: {source_name} → {target_name}",
                            data={
                                "from_agent": source_name,
                                "to_agent": target_name,
                            },
                        )

                    # Reasoning item - LLM's reasoning/thinking process
                    elif item.type == "reasoning_item":
                        raw = item.raw_item
                        # ResponseReasoningItem has a 'summary' field with reasoning text
                        reasoning_text = ""
                        if hasattr(raw, "summary"):
                            for part in raw.summary:
                                if hasattr(part, "text"):
                                    reasoning_text += part.text
                        if reasoning_text:
                            yield StreamEvent(
                                type="reasoning",
                                content=reasoning_text,
                                data={"type": "reasoning"},
                            )

            # Drain any remaining verbose events
            if verbose:
                async for verbose_stream_event in drain_verbose_queue():
                    yield verbose_stream_event

            # Get final output if we didn't stream any content
            if not full_content and result.final_output:
                full_content = str(result.final_output)
                yield StreamEvent(
                    type="token",
                    content=full_content,
                )

        # Signal completion (after MCP context closes)
        yield StreamEvent(
            type="done",
            content=full_content,
            data={"tool_calls": tool_calls if tool_calls else None},
        )

        logger.info(f"Streamed agent run complete with {len(tool_calls)} tool calls")

    except AgentError as e:
        # Already classified agent error - yield user-friendly message
        logger.error(f"Streamed agent run failed [{e.code.value}]: {e.internal_message}", exc_info=True)
        yield StreamEvent(
            type="error",
            content=e.user_message,
            data={"code": e.code.value},
        )
    except Exception as e:
        # Classify unknown exception
        logger.error(f"Streamed agent run failed: {e}", exc_info=True)
        classified = classify_exception(e)
        yield StreamEvent(
            type="error",
            content=classified.user_message,
            data={"code": classified.code.value},
        )
    finally:
        # Clean up verbose callback to prevent memory leaks
        if verbose:
            set_verbose_callback(None)


__all__ = [
    "AgentResponse",
    "StreamEvent",
    "run_agent",
    "run_agent_streamed",
]
