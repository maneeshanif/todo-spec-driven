"""AI Agent module for Phase 3 chatbot functionality.

This module contains:
- config.py: Gemini model configuration using OpenAI-compatible endpoint
- todo_agent.py: Agent definition with system prompt
- runner.py: Agent execution with NATIVE MCP integration
- hooks.py: AgentHooks for logging and observability
- errors.py: Custom exception classes for AI errors
- tools.py: (DEPRECATED) Documentation only - tools now via native MCP

Architecture (Native MCP Integration):
    Chat Endpoint -> Runner -> MCPServerStreamableHttp -> MCP Server -> Database

KEY INSIGHT: The OpenAI Agents SDK has NATIVE MCP support via MCPServerStreamableHttp.
We don't need @function_tool wrappers anymore! The agent connects directly to the
MCP server and discovers tools automatically.

Example usage:
    from src.agents import run_agent, run_agent_streamed

    # Non-streaming
    response = await run_agent(
        user_id="user-123",
        message="Add a task to buy groceries"
    )
    print(response.content)

    # Streaming (for SSE)
    async for event in run_agent_streamed(user_id="user-123", message="Show my tasks"):
        if event.type == "token":
            print(event.content, end="")
        elif event.type == "done":
            print("\\nComplete!")
"""

# Config
from src.agents.config import (
    get_gemini_client,
    get_gemini_model,
    get_mcp_server_url,
    GEMINI_BASE_URL,
)

# Hooks
from src.agents.hooks import (
    TodoBotAgentHooks,
    TodoBotRunHooks,
    agent_hooks,
    run_hooks,
    configure_logging,
)

# Agent
from src.agents.todo_agent import (
    create_todo_agent_config,
    SYSTEM_PROMPT,
)

# Runner (main API)
from src.agents.runner import (
    AgentResponse,
    StreamEvent,
    run_agent,
    run_agent_streamed,
)

# Errors
from src.agents.errors import (
    ErrorCode,
    AgentError,
    ModelError,
    RateLimitError,
    AuthenticationError,
    ConnectionError,
    ToolError,
    TimeoutError,
    InvalidResponseError,
    classify_exception,
    get_user_friendly_message,
    get_error_code,
)

__all__ = [
    # Config
    "get_gemini_client",
    "get_gemini_model",
    "get_mcp_server_url",
    "GEMINI_BASE_URL",
    # Hooks
    "TodoBotAgentHooks",
    "TodoBotRunHooks",
    "agent_hooks",
    "run_hooks",
    "configure_logging",
    # Agent
    "create_todo_agent_config",
    "SYSTEM_PROMPT",
    # Runner (main API - use these!)
    "AgentResponse",
    "StreamEvent",
    "run_agent",
    "run_agent_streamed",
    # Errors
    "ErrorCode",
    "AgentError",
    "ModelError",
    "RateLimitError",
    "AuthenticationError",
    "ConnectionError",
    "ToolError",
    "TimeoutError",
    "InvalidResponseError",
    "classify_exception",
    "get_user_friendly_message",
    "get_error_code",
]
