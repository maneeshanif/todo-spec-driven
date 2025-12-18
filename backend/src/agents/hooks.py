"""Agent hooks for logging and observability.

This module provides hooks that can be attached to the agent
to log events during execution. Useful for debugging, monitoring,
and understanding agent behavior.
"""

import logging
from typing import Any

from agents import (
    AgentHooks,
    RunHooks,
    RunContextWrapper,
    Agent,
    Tool,
)
from agents.items import ModelResponse, ToolCallItem, ToolCallOutputItem

# Configure logger
logger = logging.getLogger("todobot.agent")


class TodoBotAgentHooks(AgentHooks):
    """Hooks for the TodoBot agent lifecycle events.

    These hooks are called at various points during agent execution,
    providing visibility into the agent's behavior.
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


class TodoBotRunHooks(RunHooks):
    """Hooks for the overall run lifecycle.

    These hooks provide visibility into the entire agent run,
    including model calls and tool executions.
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
        """Called before the model is invoked."""
        logger.debug(
            f"Model call starting for agent: {agent.name}",
            extra={"agent_name": agent.name},
        )

    async def on_model_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        response: ModelResponse,
    ) -> None:
        """Called after the model responds."""
        logger.debug(
            f"Model call completed for agent: {agent.name}",
            extra={
                "agent_name": agent.name,
                "response_type": type(response).__name__,
            },
        )

    async def on_tool_call_start(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool_call: ToolCallItem,
    ) -> None:
        """Called before a tool is executed."""
        logger.info(
            f"Executing tool: {tool_call.name}",
            extra={
                "agent_name": agent.name,
                "tool_name": tool_call.name,
                "tool_call_id": tool_call.call_id,
            },
        )

    async def on_tool_call_end(
        self,
        context: RunContextWrapper[Any],
        agent: Agent,
        tool_call: ToolCallItem,
        result: ToolCallOutputItem,
    ) -> None:
        """Called after a tool execution completes."""
        # Truncate output for logging
        output_preview = str(result.output)[:200]
        if len(str(result.output)) > 200:
            output_preview += "..."

        logger.info(
            f"Tool completed: {tool_call.name}",
            extra={
                "agent_name": agent.name,
                "tool_name": tool_call.name,
                "tool_call_id": tool_call.call_id,
                "output_preview": output_preview,
            },
        )


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
]
