"""Agent hooks for logging, observability, and SSE event emission.

This module provides hooks that can be attached to the agent
to log events during execution. Useful for debugging, monitoring,
and understanding agent behavior.

For verbose mode, these hooks can emit SSE events via a callback
to provide real-time visibility into:
- Agent lifecycle (start, end)
- LLM calls (model_start, model_end)
- MCP tool requests/responses (tool_start, tool_end)
- Handoffs between agents
"""

import logging
from typing import Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum

from agents import (
    AgentHooks,
    RunHooks,
    RunContextWrapper,
    Agent,
    Tool,
    enable_verbose_stdout_logging,
)
from agents.items import ModelResponse, ToolCallItem, ToolCallOutputItem

# Configure logger
logger = logging.getLogger("todobot.agent")


class VerboseEventType(str, Enum):
    """Types of verbose events emitted during agent execution."""
    AGENT_START = "agent_start"
    AGENT_END = "agent_end"
    LLM_START = "llm_start"
    LLM_END = "llm_end"
    MCP_REQUEST = "mcp_request"
    MCP_RESPONSE = "mcp_response"
    TOOL_START = "tool_start"
    TOOL_END = "tool_end"
    HANDOFF = "handoff"


@dataclass
class VerboseEvent:
    """A verbose event emitted during agent execution.

    These events provide granular visibility into the agent lifecycle
    for debugging and UI display purposes.
    """
    type: VerboseEventType
    message: str
    agent_name: Optional[str] = None
    tool_name: Optional[str] = None
    call_id: Optional[str] = None
    data: Optional[dict] = None


# Global callback for SSE event emission (set per-request)
_verbose_callback: Optional[Callable[[VerboseEvent], None]] = None


def set_verbose_callback(callback: Optional[Callable[[VerboseEvent], None]]) -> None:
    """Set the callback for verbose event emission.

    This should be called at the start of each streaming request
    to enable verbose events to be yielded as SSE events.

    Args:
        callback: Function to call with each VerboseEvent, or None to disable
    """
    global _verbose_callback
    _verbose_callback = callback


def emit_verbose_event(event: VerboseEvent) -> None:
    """Emit a verbose event via the callback if set."""
    if _verbose_callback:
        try:
            _verbose_callback(event)
        except Exception as e:
            logger.warning(f"Failed to emit verbose event: {e}")


class TodoBotAgentHooks(AgentHooks):
    """Hooks for the TodoBot agent lifecycle events.

    These hooks are called at various points during agent execution,
    providing visibility into the agent's behavior. They both log
    and emit SSE events for real-time UI updates.
    """

    async def on_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
    ) -> None:
        """Called when the agent starts processing."""
        logger.info(
            f"Agent '{agent.name}' starting execution",
            extra={"agent_name": agent.name},
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.AGENT_START,
            message=f"Agent '{agent.name}' initialized",
            agent_name=agent.name,
        ))

    async def on_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        output: Any,
    ) -> None:
        """Called when the agent completes processing."""
        logger.info(
            f"Agent '{agent.name}' completed execution",
            extra={
                "agent_name": agent.name,
                "has_output": output is not None,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.AGENT_END,
            message=f"Agent '{agent.name}' finished",
            agent_name=agent.name,
            data={"has_output": output is not None},
        ))

    async def on_handoff(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        source: Agent,
    ) -> None:
        """Called when control is handed off to this agent."""
        logger.info(
            f"Handoff from '{source.name}' to '{agent.name}'",
            extra={
                "from_agent": source.name,
                "to_agent": agent.name,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.HANDOFF,
            message=f"Handoff: {source.name} → {agent.name}",
            agent_name=agent.name,
            data={"from_agent": source.name, "to_agent": agent.name},
        ))

    async def on_tool_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool: Tool,
    ) -> None:
        """Called when a tool is about to be executed."""
        logger.info(
            f"Agent '{agent.name}' calling tool: {tool.name}",
            extra={
                "agent_name": agent.name,
                "tool_name": tool.name,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.TOOL_START,
            message=f"Tool starting: {tool.name}",
            agent_name=agent.name,
            tool_name=tool.name,
        ))

    async def on_tool_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool: Tool,
        result: str,
    ) -> None:
        """Called when a tool completes execution."""
        # Truncate result for logging
        result_preview = result[:200] + "..." if len(result) > 200 else result
        logger.info(
            f"Tool '{tool.name}' completed",
            extra={
                "agent_name": agent.name,
                "tool_name": tool.name,
                "result_preview": result_preview,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.TOOL_END,
            message=f"Tool completed: {tool.name}",
            agent_name=agent.name,
            tool_name=tool.name,
            data={"result_preview": result_preview},
        ))


class TodoBotRunHooks(RunHooks):
    """Hooks for the overall run lifecycle.

    These hooks provide visibility into the entire agent run,
    including model calls (LLM) and tool executions (MCP).
    They emit SSE events for real-time UI updates.
    """

    async def on_agent_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
    ) -> None:
        """Called when an agent starts within a run."""
        logger.debug(
            f"Run starting agent: {agent.name}",
            extra={"agent_name": agent.name},
        )

    async def on_agent_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        output: Any,
    ) -> None:
        """Called when an agent ends within a run."""
        logger.debug(
            f"Run ending agent: {agent.name}",
            extra={"agent_name": agent.name},
        )

    async def on_model_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
    ) -> None:
        """Called before the model (LLM) is invoked."""
        logger.info(
            f"LLM call starting for agent: {agent.name}",
            extra={"agent_name": agent.name},
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.LLM_START,
            message=f"Calling LLM (Gemini)...",
            agent_name=agent.name,
            data={"model": "gemini-2.5-flash"},
        ))

    async def on_model_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        response: ModelResponse,
    ) -> None:
        """Called after the model (LLM) responds."""
        logger.info(
            f"LLM call completed for agent: {agent.name}",
            extra={
                "agent_name": agent.name,
                "response_type": type(response).__name__,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.LLM_END,
            message=f"LLM response received",
            agent_name=agent.name,
            data={"response_type": type(response).__name__},
        ))

    async def on_tool_call_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool_call: ToolCallItem,
    ) -> None:
        """Called before a tool is executed (MCP request sent)."""
        logger.info(
            f"MCP Request: {tool_call.name}",
            extra={
                "agent_name": agent.name,
                "tool_name": tool_call.name,
                "tool_call_id": tool_call.call_id,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.MCP_REQUEST,
            message=f"MCP Request → {tool_call.name}",
            agent_name=agent.name,
            tool_name=tool_call.name,
            call_id=tool_call.call_id,
            data={"arguments": str(getattr(tool_call, 'arguments', '{}'))[:100]},
        ))

    async def on_tool_call_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool_call: ToolCallItem,
        result: ToolCallOutputItem,
    ) -> None:
        """Called after a tool execution completes (MCP response received)."""
        # Truncate output for logging
        output_preview = str(result.output)[:200]
        if len(str(result.output)) > 200:
            output_preview += "..."

        logger.info(
            f"MCP Response: {tool_call.name}",
            extra={
                "agent_name": agent.name,
                "tool_name": tool_call.name,
                "tool_call_id": tool_call.call_id,
                "output_preview": output_preview,
            },
        )
        emit_verbose_event(VerboseEvent(
            type=VerboseEventType.MCP_RESPONSE,
            message=f"MCP Response ← {tool_call.name}",
            agent_name=agent.name,
            tool_name=tool_call.name,
            call_id=tool_call.call_id,
            data={"output_preview": output_preview},
        ))


# Create singleton instances for reuse
agent_hooks = TodoBotAgentHooks()
run_hooks = TodoBotRunHooks()


def configure_logging(level: int = logging.INFO) -> None:
    """Configure logging for the agent module.

    Args:
        level: Logging level (default: INFO)
    """
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    )
    logger.addHandler(handler)
    logger.setLevel(level)


__all__ = [
    "TodoBotAgentHooks",
    "TodoBotRunHooks",
    "agent_hooks",
    "run_hooks",
    "configure_logging",
    "VerboseEventType",
    "VerboseEvent",
    "set_verbose_callback",
    "emit_verbose_event",
    "enable_verbose_stdout_logging",
]
