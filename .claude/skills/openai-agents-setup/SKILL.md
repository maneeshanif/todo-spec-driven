---
name: openai-agents-setup
description: Initialize and configure OpenAI Agents SDK for building AI-powered chatbots. Covers agent creation, function tools, conversation handling, and Runner execution. Use when setting up AI agents for Phase 3 chatbot implementation.
allowed-tools: Bash, Write, Read, Edit, Glob
---

# OpenAI Agents SDK Setup with Gemini + MCP Integration

Quick reference for initializing OpenAI Agents SDK with **Gemini models** (gemini-2.5-flash) that connects to **FastMCP server tools** for the Todo AI Chatbot Phase 3.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  Chat Endpoint  │────▶│  OpenAI Agents SDK          │   │
│  │  /api/chat      │     │  (Agent + Gemini Model)     │   │
│  └─────────────────┘     └──────────────┬──────────────┘   │
│                                         │                   │
│                          Agent calls MCP tools              │
│                                         │                   │
│                          ┌──────────────▼──────────────┐   │
│                          │  FastMCP Client             │   │
│                          │  (Connects to MCP Server)   │   │
│                          └──────────────┬──────────────┘   │
│                                         │                   │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │  FastMCP Server               │
                          │  (Task Tools: add, list, etc.)│
                          │  → Database Operations        │
                          └───────────────────────────────┘
```

**Key Insight**: The Agent uses **FastMCP Client** to call MCP tools. We do NOT duplicate tool implementations - MCP server handles all database operations.

---

## Project Structure

```
backend/src/
├── agents/
│   ├── __init__.py          # Package exports
│   ├── gemini_config.py     # Gemini + AsyncOpenAI setup
│   ├── mcp_tools.py         # MCP Client tool wrappers (NEW!)
│   ├── hooks.py             # Agent and Runner lifecycle hooks
│   ├── todo_agent.py        # Main agent definition
│   └── runner.py            # Agent execution with Runner
│
├── mcp_server/
│   ├── __init__.py
│   └── server.py            # FastMCP server with task tools
│
└── routers/
    └── chat.py              # Chat API endpoint
```

---

## Installation

```bash
cd backend
uv add openai-agents fastmcp httpx
```

**Required Environment Variables** (`.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001/mcp
```

---

## Core Setup Files

### 1. Gemini Configuration (`gemini_config.py`)

```python
# backend/src/agents/gemini_config.py
"""
Gemini model configuration for OpenAI Agents SDK.
Uses AsyncOpenAI client with Gemini's OpenAI-compatible endpoint.
"""
import os
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def get_gemini_client() -> AsyncOpenAI:
    """Create AsyncOpenAI client configured for Gemini API."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")

    return AsyncOpenAI(
        api_key=api_key,
        base_url=GEMINI_BASE_URL,
    )


def get_gemini_model(model_name: str | None = None) -> OpenAIChatCompletionsModel:
    """Create OpenAIChatCompletionsModel wrapper for Gemini."""
    client = get_gemini_client()
    model = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    return OpenAIChatCompletionsModel(
        model=model,
        openai_client=client,
    )
```

### 2. MCP Tools Integration (`mcp_tools.py`) - **KEY FILE**

This is where we create `@function_tool` wrappers that call the FastMCP server:

```python
# backend/src/agents/mcp_tools.py
"""
MCP Tool wrappers for OpenAI Agents SDK.
These tools call the FastMCP server - NO database logic here!
"""
import os
from typing import Annotated
from agents import function_tool
from fastmcp import Client

# MCP Server URL from environment
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")


async def get_mcp_client() -> Client:
    """Get configured MCP client."""
    return Client(MCP_SERVER_URL)


@function_tool
async def add_task(
    user_id: Annotated[str, "The user's unique identifier"],
    title: Annotated[str, "The task title (required)"],
    description: Annotated[str, "Optional task description"] = "",
) -> str:
    """Create a new task for the user via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool(
            name="add_task",
            arguments={
                "user_id": user_id,
                "title": title,
                "description": description,
            }
        )
        return str(result.data) if hasattr(result, 'data') else str(result)


@function_tool
async def list_tasks(
    user_id: Annotated[str, "The user's unique identifier"],
    status: Annotated[str, "Filter: 'all', 'pending', or 'completed'"] = "all",
) -> str:
    """List all tasks for the user via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool(
            name="list_tasks",
            arguments={
                "user_id": user_id,
                "status": status,
            }
        )
        return str(result.data) if hasattr(result, 'data') else str(result)


@function_tool
async def complete_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to mark complete"],
) -> str:
    """Mark a task as completed via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool(
            name="complete_task",
            arguments={
                "user_id": user_id,
                "task_id": task_id,
            }
        )
        return str(result.data) if hasattr(result, 'data') else str(result)


@function_tool
async def delete_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to delete"],
) -> str:
    """Delete a task via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool(
            name="delete_task",
            arguments={
                "user_id": user_id,
                "task_id": task_id,
            }
        )
        return str(result.data) if hasattr(result, 'data') else str(result)


@function_tool
async def update_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to update"],
    title: Annotated[str, "New title for the task"] = None,
    description: Annotated[str, "New description for the task"] = None,
) -> str:
    """Update a task's title and/or description via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool(
            name="update_task",
            arguments={
                "user_id": user_id,
                "task_id": task_id,
                "title": title,
                "description": description,
            }
        )
        return str(result.data) if hasattr(result, 'data') else str(result)


# Export all MCP tools
ALL_MCP_TOOLS = [add_task, list_tasks, complete_task, delete_task, update_task]
```

### 3. Lifecycle Hooks (`hooks.py`)

```python
# backend/src/agents/hooks.py
"""
Lifecycle hooks for Agent and Runner.
Use for logging, monitoring, and custom pre/post processing.
"""
from agents import AgentHooks, RunHooks, RunContextWrapper, Agent, Tool
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class TodoAgentHooks(AgentHooks):
    """Hooks for agent lifecycle events."""

    async def on_start(self, context: RunContextWrapper, agent: Agent) -> None:
        logger.info(f"[{datetime.now(timezone.utc).isoformat()}] Agent '{agent.name}' starting")

    async def on_end(self, context: RunContextWrapper, agent: Agent, output: str) -> None:
        logger.info(f"[{datetime.now(timezone.utc).isoformat()}] Agent '{agent.name}' finished")

    async def on_tool_start(self, context: RunContextWrapper, agent: Agent, tool: Tool) -> None:
        logger.info(f"[{datetime.now(timezone.utc).isoformat()}] MCP Tool '{tool.name}' calling...")

    async def on_tool_end(self, context: RunContextWrapper, agent: Agent, tool: Tool, result: str) -> None:
        preview = result[:100] + "..." if len(result) > 100 else result
        logger.info(f"[{datetime.now(timezone.utc).isoformat()}] MCP Tool '{tool.name}' returned: {preview}")


class TodoRunHooks(RunHooks):
    """Hooks for Runner lifecycle events."""

    async def on_run_start(self, context: RunContextWrapper) -> None:
        logger.info("[RUN START] Beginning agent run")

    async def on_run_end(self, context: RunContextWrapper, output: str) -> None:
        logger.info(f"[RUN END] Completed. Output length: {len(output)} chars")
```

### 4. Agent Definition (`todo_agent.py`)

```python
# backend/src/agents/todo_agent.py
"""
Todo Assistant Agent definition.
Uses Gemini model + MCP tools via OpenAI Agents SDK.
"""
from agents import Agent
from .gemini_config import get_gemini_model
from .mcp_tools import ALL_MCP_TOOLS  # MCP tools, not local tools!
from .hooks import TodoAgentHooks

TODO_AGENT_INSTRUCTIONS = """You are a helpful todo management assistant.
Help users manage their tasks through natural language conversation.

## Your Capabilities (via MCP Tools):
- **add_task**: Create new tasks with title and optional description
- **list_tasks**: Show all tasks, or filter by status (pending/completed)
- **complete_task**: Mark tasks as done
- **delete_task**: Remove tasks permanently
- **update_task**: Modify task title or description

## Guidelines:
1. Always confirm actions after completing them
2. When listing tasks, format them clearly and readably
3. If a user mentions a task by name, use list_tasks first to find its ID
4. Be friendly and encouraging about task completion
5. If an error occurs, explain it clearly and suggest alternatives
6. Keep responses concise but informative

## Important:
- The user_id is provided in the context [User ID: xxx] - extract and use it
- Always use the appropriate MCP tool for each action
- Don't make up task IDs - use list_tasks to find them first
"""


def create_todo_agent(model_name: str | None = None) -> Agent:
    """Create the Todo management agent with MCP tools."""
    return Agent(
        name="TodoAssistant",
        instructions=TODO_AGENT_INSTRUCTIONS,
        model=get_gemini_model(model_name),
        tools=ALL_MCP_TOOLS,  # These call MCP server!
        hooks=TodoAgentHooks(),
    )


# Pre-configured agent instance
todo_agent = create_todo_agent()
```

### 5. Runner Execution (`runner.py`)

```python
# backend/src/agents/runner.py
"""
Agent runner for executing the Todo agent.
Handles conversation history and context management.
"""
from agents import Runner
from .todo_agent import todo_agent
from .hooks import TodoRunHooks
from typing import Any
import logging

logger = logging.getLogger(__name__)


async def run_todo_agent(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
    max_turns: int = 10,
) -> dict[str, Any]:
    """
    Execute the todo agent with a user message.

    The agent will call MCP tools which connect to the FastMCP server.
    """
    input_messages = []

    if conversation_history:
        for msg in conversation_history:
            input_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

    # Embed user_id so agent can extract it for MCP tool calls
    enhanced_message = f"[User ID: {user_id}]\n{user_message}"
    input_messages.append({
        "role": "user",
        "content": enhanced_message
    })

    input_data = input_messages if conversation_history else enhanced_message

    try:
        result = await Runner.run(
            todo_agent,
            input=input_data,
            hooks=TodoRunHooks(),
            max_turns=max_turns,
        )

        return {
            "response": result.final_output,
            "new_items": result.new_items,
            "usage": {
                "input_tokens": getattr(result, 'input_tokens', 0),
                "output_tokens": getattr(result, 'output_tokens', 0),
            }
        }

    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        raise
```

### 6. Package Init (`__init__.py`)

```python
# backend/src/agents/__init__.py
"""
Todo AI Agent package.
Agent uses MCP tools to interact with FastMCP server.
"""
from .gemini_config import get_gemini_client, get_gemini_model
from .mcp_tools import (
    add_task,
    list_tasks,
    complete_task,
    delete_task,
    update_task,
    ALL_MCP_TOOLS,
)
from .hooks import TodoAgentHooks, TodoRunHooks
from .todo_agent import create_todo_agent, todo_agent, TODO_AGENT_INSTRUCTIONS
from .runner import run_todo_agent

__all__ = [
    "get_gemini_client",
    "get_gemini_model",
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
    "ALL_MCP_TOOLS",
    "TodoAgentHooks",
    "TodoRunHooks",
    "create_todo_agent",
    "todo_agent",
    "TODO_AGENT_INSTRUCTIONS",
    "run_todo_agent",
]
```

---

## Alternative: Direct Gemini + MCP Integration

For simpler setups, you can use Gemini SDK directly with FastMCP Client session:

```python
# Alternative approach using Gemini SDK directly
from fastmcp import Client
from google import genai
import asyncio

mcp_client = Client("http://localhost:8001/mcp")
gemini_client = genai.Client()

async def chat_with_mcp(user_message: str):
    async with mcp_client:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_message,
            config=genai.types.GenerateContentConfig(
                temperature=0,
                tools=[mcp_client.session],  # Pass MCP session as tool
            ),
        )
        return response.text
```

---

## Quick Start

### 1. Start MCP Server First
```bash
cd backend
uv run python -m src.mcp_server.server
# Running on http://localhost:8001
```

### 2. Test Agent with MCP
```python
import asyncio
from src.agents import run_todo_agent

async def main():
    result = await run_todo_agent(
        user_message="Add a task to buy groceries",
        user_id="test-user-123"
    )
    print(result["response"])

asyncio.run(main())
```

---

## Verification Checklist

- [ ] `openai-agents` and `fastmcp` packages installed
- [ ] `GEMINI_API_KEY` set in environment
- [ ] `MCP_SERVER_URL` set in environment
- [ ] FastMCP server running and accessible
- [ ] MCP tools wrapper calls server successfully
- [ ] Agent correctly extracts user_id from context
- [ ] Runner executes without errors

---

## Environment Variables

```env
# Required
GEMINI_API_KEY=your_api_key_here
MCP_SERVER_URL=http://localhost:8001/mcp

# Optional
GEMINI_MODEL=gemini-2.5-flash
```

---

## See Also

- [REFERENCE.md](./REFERENCE.md) - Detailed API documentation
- [examples.md](./examples.md) - Complete code examples
- [scripts/](./scripts/) - Validation and setup scripts
- [fastmcp-server-setup](../fastmcp-server-setup/) - MCP server setup
