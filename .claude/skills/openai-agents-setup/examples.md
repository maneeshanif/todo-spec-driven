# OpenAI Agents SDK Examples with Gemini

Complete code examples for the Todo AI Chatbot using Gemini models.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## Example 1: Complete Agents Folder Structure

### File: `backend/src/agents/__init__.py`

```python
"""
Todo AI Agent package.
Provides the agent, tools, and runner for the AI chatbot.
"""
from .gemini_config import get_gemini_client, get_gemini_model, gemini_model
from .tools import (
    add_task,
    list_tasks,
    complete_task,
    delete_task,
    update_task,
    ALL_TOOLS,
)
from .hooks import TodoAgentHooks, TodoRunHooks
from .todo_agent import create_todo_agent, todo_agent, TODO_AGENT_INSTRUCTIONS
from .runner import run_todo_agent, run_streaming

__all__ = [
    # Gemini config
    "get_gemini_client",
    "get_gemini_model",
    "gemini_model",
    # Tools
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
    "ALL_TOOLS",
    # Hooks
    "TodoAgentHooks",
    "TodoRunHooks",
    # Agent
    "create_todo_agent",
    "todo_agent",
    "TODO_AGENT_INSTRUCTIONS",
    # Runner
    "run_todo_agent",
    "run_streaming",
]
```

### File: `backend/src/agents/gemini_config.py`

```python
"""
Gemini model configuration for OpenAI Agents SDK.
Uses AsyncOpenAI client with Gemini's OpenAI-compatible endpoint.

Reference: https://github.com/panaversity/learn-agentic-ai
"""
import os
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel

# Gemini's OpenAI-compatible API endpoint
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def get_gemini_client() -> AsyncOpenAI:
    """
    Create AsyncOpenAI client configured for Gemini API.

    Returns:
        AsyncOpenAI: Configured client for Gemini

    Raises:
        ValueError: If GEMINI_API_KEY is not set
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")

    return AsyncOpenAI(
        api_key=api_key,
        base_url=GEMINI_BASE_URL,
    )


def get_gemini_model(model_name: str | None = None) -> OpenAIChatCompletionsModel:
    """
    Create OpenAIChatCompletionsModel wrapper for Gemini.

    Args:
        model_name: Optional model name override. Defaults to GEMINI_MODEL env var.

    Returns:
        OpenAIChatCompletionsModel: Model wrapper compatible with Agents SDK
    """
    client = get_gemini_client()
    model = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    return OpenAIChatCompletionsModel(
        model=model,
        openai_client=client,
    )


# Pre-configured model instance for convenience
# Note: This creates a new client each time the module is imported
# For production, consider lazy initialization
try:
    gemini_model = get_gemini_model()
except ValueError:
    # Allow import without API key for development
    gemini_model = None
```

### File: `backend/src/agents/tools.py`

```python
"""
Function tools for the Todo AI Agent.
These tools are called by the agent to perform task operations.

Each tool follows these patterns:
1. Uses @function_tool decorator
2. Has Annotated type hints for parameter descriptions
3. Has a docstring (used as tool description by LLM)
4. Returns a string result
5. Is async for non-blocking execution
"""
from agents import function_tool
from typing import Annotated
from sqlmodel import Session, select
from src.database import engine
from src.models.task import Task


@function_tool
async def add_task(
    user_id: Annotated[str, "The user's unique identifier"],
    title: Annotated[str, "The task title (required)"],
    description: Annotated[str, "Optional task description"] = "",
) -> str:
    """Create a new task for the user. Returns confirmation with task details."""
    try:
        with Session(engine) as session:
            task = Task(
                user_id=user_id,
                title=title,
                description=description or None,
                completed=False,
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            return f"Created task '{task.title}' (ID: {task.id})"

    except Exception as e:
        return f"Error creating task: {str(e)}"


@function_tool
async def list_tasks(
    user_id: Annotated[str, "The user's unique identifier"],
    status: Annotated[str, "Filter: 'all', 'pending', or 'completed'"] = "all",
) -> str:
    """List all tasks for the user. Can filter by status (all/pending/completed)."""
    try:
        with Session(engine) as session:
            query = select(Task).where(Task.user_id == user_id)

            if status == "pending":
                query = query.where(Task.completed == False)
            elif status == "completed":
                query = query.where(Task.completed == True)

            tasks = session.exec(query).all()

            if not tasks:
                return f"No {status} tasks found."

            # Format tasks for display
            lines = [f"Found {len(tasks)} {status} task(s):"]
            for task in tasks:
                status_icon = "[x]" if task.completed else "[ ]"
                lines.append(f"  {status_icon} {task.title} (ID: {task.id})")
                if task.description:
                    lines.append(f"      {task.description}")

            return "\n".join(lines)

    except Exception as e:
        return f"Error listing tasks: {str(e)}"


@function_tool
async def complete_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to mark complete"],
) -> str:
    """Mark a specific task as completed."""
    try:
        with Session(engine) as session:
            task = session.exec(
                select(Task)
                .where(Task.id == task_id)
                .where(Task.user_id == user_id)
            ).first()

            if not task:
                return f"Task {task_id} not found or doesn't belong to you."

            if task.completed:
                return f"Task '{task.title}' is already completed."

            task.completed = True
            session.add(task)
            session.commit()

            return f"Completed task '{task.title}' (ID: {task.id})"

    except Exception as e:
        return f"Error completing task: {str(e)}"


@function_tool
async def delete_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to delete"],
) -> str:
    """Permanently delete a task. This cannot be undone."""
    try:
        with Session(engine) as session:
            task = session.exec(
                select(Task)
                .where(Task.id == task_id)
                .where(Task.user_id == user_id)
            ).first()

            if not task:
                return f"Task {task_id} not found or doesn't belong to you."

            title = task.title
            session.delete(task)
            session.commit()

            return f"Deleted task '{title}' (ID: {task_id})"

    except Exception as e:
        return f"Error deleting task: {str(e)}"


@function_tool
async def update_task(
    user_id: Annotated[str, "The user's unique identifier"],
    task_id: Annotated[int, "The ID of the task to update"],
    title: Annotated[str, "New title for the task"] = None,
    description: Annotated[str, "New description for the task"] = None,
) -> str:
    """Update a task's title and/or description."""
    try:
        if not title and not description:
            return "Please provide a new title or description to update."

        with Session(engine) as session:
            task = session.exec(
                select(Task)
                .where(Task.id == task_id)
                .where(Task.user_id == user_id)
            ).first()

            if not task:
                return f"Task {task_id} not found or doesn't belong to you."

            updates = []
            if title:
                task.title = title
                updates.append(f"title='{title}'")
            if description:
                task.description = description
                updates.append(f"description='{description}'")

            session.add(task)
            session.commit()

            return f"Updated task {task_id}: {', '.join(updates)}"

    except Exception as e:
        return f"Error updating task: {str(e)}"


# Export all tools as a list for easy import
ALL_TOOLS = [add_task, list_tasks, complete_task, delete_task, update_task]
```

### File: `backend/src/agents/hooks.py`

```python
"""
Lifecycle hooks for Agent and Runner.
Use these for logging, monitoring, and custom pre/post processing.

AgentHooks: Attached to individual Agent instances
RunHooks: Applied to the entire Runner execution
"""
from agents import AgentHooks, RunHooks, RunContextWrapper, Agent, Tool
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class TodoAgentHooks(AgentHooks):
    """
    Hooks for agent lifecycle events.
    Attached to individual Agent instances for fine-grained control.
    """

    async def on_start(self, context: RunContextWrapper, agent: Agent) -> None:
        """Called when agent starts processing a request."""
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(f"[{timestamp}] Agent '{agent.name}' starting")

    async def on_end(self, context: RunContextWrapper, agent: Agent, output: str) -> None:
        """Called when agent finishes processing."""
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(
            f"[{timestamp}] Agent '{agent.name}' finished. "
            f"Output length: {len(output)} chars"
        )

    async def on_tool_start(
        self, context: RunContextWrapper, agent: Agent, tool: Tool
    ) -> None:
        """Called before a tool executes."""
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(f"[{timestamp}] Tool '{tool.name}' starting")

    async def on_tool_end(
        self, context: RunContextWrapper, agent: Agent, tool: Tool, result: str
    ) -> None:
        """Called after a tool executes."""
        timestamp = datetime.now(timezone.utc).isoformat()
        # Truncate long results for logging
        preview = result[:100] + "..." if len(result) > 100 else result
        logger.info(f"[{timestamp}] Tool '{tool.name}' completed: {preview}")

    async def on_handoff(
        self, context: RunContextWrapper, agent: Agent, target: Agent
    ) -> None:
        """Called when agent hands off to another agent."""
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info(
            f"[{timestamp}] Handoff: '{agent.name}' -> '{target.name}'"
        )


class TodoRunHooks(RunHooks):
    """
    Hooks for Runner lifecycle events.
    These apply to the entire run, spanning multiple agent turns.
    """

    async def on_run_start(self, context: RunContextWrapper) -> None:
        """Called when the entire run begins."""
        logger.info("[RUN START] Beginning new agent run")

    async def on_run_end(self, context: RunContextWrapper, output: str) -> None:
        """Called when the entire run completes."""
        logger.info(f"[RUN END] Completed. Final output: {len(output)} chars")

    async def on_agent_start(self, context: RunContextWrapper, agent: Agent) -> None:
        """Called when any agent in the run starts a turn."""
        logger.debug(f"[RUN] Agent '{agent.name}' starting turn")

    async def on_agent_end(
        self, context: RunContextWrapper, agent: Agent, output: str
    ) -> None:
        """Called when any agent in the run ends a turn."""
        logger.debug(f"[RUN] Agent '{agent.name}' completed turn")
```

### File: `backend/src/agents/todo_agent.py`

```python
"""
Todo Assistant Agent definition.
Uses Gemini model via OpenAI Agents SDK.
"""
from agents import Agent
from .gemini_config import get_gemini_model
from .tools import ALL_TOOLS
from .hooks import TodoAgentHooks


# System instructions for the agent
TODO_AGENT_INSTRUCTIONS = """You are a helpful todo management assistant.
Help users manage their tasks through natural language conversation.

## Your Capabilities:
- **Add tasks**: Create new tasks with title and optional description
- **List tasks**: Show all tasks, or filter by status (pending/completed)
- **Complete tasks**: Mark tasks as done
- **Delete tasks**: Remove tasks permanently
- **Update tasks**: Modify task title or description

## Guidelines:
1. Always confirm actions after completing them
2. When listing tasks, present them in a clear, readable format
3. If a user mentions a task by name, use list_tasks first to find its ID
4. Be friendly and encouraging about task completion
5. If an error occurs, explain it clearly and suggest alternatives
6. Keep responses concise but informative

## Important:
- Extract the user_id from the message context [User ID: xxx]
- Always use the appropriate tool for each action
- Don't make up task IDs - use list_tasks to find them first
- Handle edge cases gracefully (no tasks, task not found, etc.)
"""


def create_todo_agent(model_name: str | None = None) -> Agent:
    """
    Create and configure the Todo management agent.

    Args:
        model_name: Optional model override (defaults to gemini-2.5-flash)

    Returns:
        Agent: Configured agent ready for use with Runner
    """
    return Agent(
        name="TodoAssistant",
        instructions=TODO_AGENT_INSTRUCTIONS,
        model=get_gemini_model(model_name),
        tools=ALL_TOOLS,
        hooks=TodoAgentHooks(),
    )


# Pre-configured agent instance for convenience
# Re-created per request in production for fresh model instance
todo_agent = create_todo_agent()
```

### File: `backend/src/agents/runner.py`

```python
"""
Agent runner for executing the Todo agent.
Handles conversation history and context management.
"""
from agents import Runner
from .todo_agent import create_todo_agent, todo_agent
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

    Args:
        user_message: The user's input message
        user_id: The authenticated user's ID
        conversation_history: Previous messages [{"role": "...", "content": "..."}]
        max_turns: Maximum conversation turns before stopping

    Returns:
        dict with keys:
            - response: The agent's response text
            - new_items: New conversation items generated
            - usage: Token usage statistics
    """
    # Build input with history
    input_messages = []

    # Add conversation history if available
    if conversation_history:
        for msg in conversation_history:
            input_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

    # Add current user message with user_id context
    # The user_id is embedded so the agent can extract it for tools
    enhanced_message = f"[User ID: {user_id}]\n{user_message}"
    input_messages.append({
        "role": "user",
        "content": enhanced_message
    })

    # Use message list if we have history, otherwise just the string
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


async def run_streaming(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
):
    """
    Stream agent response for real-time UI updates.

    Yields:
        Response chunks as they're generated
    """
    input_messages = []

    if conversation_history:
        input_messages.extend(conversation_history)

    enhanced_message = f"[User ID: {user_id}]\n{user_message}"
    input_messages.append({"role": "user", "content": enhanced_message})

    input_data = input_messages if conversation_history else enhanced_message

    result = Runner.run_streamed(
        todo_agent,
        input=input_data,
        hooks=TodoRunHooks(),
    )

    async for event in result.stream_events():
        if event.type == "raw_response_event" and hasattr(event, 'data'):
            yield event.data
```

---

## Example 2: Chat Service Integration

```python
# backend/src/services/chat_service.py
"""
Chat service for managing conversations and agent interactions.
Persists conversation history to database for stateless operation.
"""
from sqlmodel import Session, select
from src.agents import run_todo_agent
from src.models.conversation import Conversation, Message
from src.database import engine
from datetime import datetime, timezone


class ChatService:
    """Service for chat operations with the AI agent."""

    def __init__(self, user_id: str):
        self.user_id = user_id

    async def process_message(
        self,
        message: str,
        conversation_id: int | None = None
    ) -> dict:
        """
        Process a user message and return AI response.

        Args:
            message: User's input message
            conversation_id: Optional existing conversation ID

        Returns:
            dict with conversation_id and response
        """
        with Session(engine) as session:
            # Get or create conversation
            if conversation_id:
                conversation = session.get(Conversation, conversation_id)
                if not conversation or conversation.user_id != self.user_id:
                    raise ValueError("Conversation not found")
            else:
                conversation = Conversation(
                    user_id=self.user_id,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(conversation)
                session.commit()
                session.refresh(conversation)

            # Load conversation history
            messages = session.exec(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.created_at)
            ).all()

            # Convert to agent input format
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]

            # Save user message
            user_msg = Message(
                conversation_id=conversation.id,
                user_id=self.user_id,
                role="user",
                content=message,
                created_at=datetime.now(timezone.utc),
            )
            session.add(user_msg)
            session.commit()

            # Run the agent
            result = await run_todo_agent(
                user_message=message,
                user_id=self.user_id,
                conversation_history=history,
            )

            # Save assistant response
            assistant_msg = Message(
                conversation_id=conversation.id,
                user_id=self.user_id,
                role="assistant",
                content=result["response"],
                created_at=datetime.now(timezone.utc),
            )
            session.add(assistant_msg)
            session.commit()

            return {
                "conversation_id": conversation.id,
                "response": result["response"],
                "usage": result.get("usage", {}),
            }

    def get_conversations(self, limit: int = 20) -> list[dict]:
        """Get user's recent conversations."""
        with Session(engine) as session:
            conversations = session.exec(
                select(Conversation)
                .where(Conversation.user_id == self.user_id)
                .order_by(Conversation.updated_at.desc())
                .limit(limit)
            ).all()

            return [
                {
                    "id": c.id,
                    "created_at": c.created_at.isoformat(),
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None,
                }
                for c in conversations
            ]

    def get_conversation_messages(self, conversation_id: int) -> list[dict]:
        """Get all messages in a conversation."""
        with Session(engine) as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation or conversation.user_id != self.user_id:
                raise ValueError("Conversation not found")

            messages = session.exec(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)
            ).all()

            return [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg in messages
            ]
```

---

## Example 3: FastAPI Chat Router

```python
# backend/src/routers/chat.py
"""
Chat API endpoints for the AI assistant.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.services.chat_service import ChatService
from src.middleware.auth import get_current_user
from src.models.user import User

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    conversation_id: int
    response: str


class ConversationListResponse(BaseModel):
    conversations: list[dict]


class MessagesResponse(BaseModel):
    messages: list[dict]


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI assistant.

    - **message**: The user's message
    - **conversation_id**: Optional ID to continue existing conversation
    """
    # Verify user access
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        service = ChatService(user_id=user_id)
        result = await service.process_message(
            message=request.message,
            conversation_id=request.conversation_id,
        )
        return ChatResponse(
            conversation_id=result["conversation_id"],
            response=result["response"],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """List user's conversations."""
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    service = ChatService(user_id=user_id)
    return {"conversations": service.get_conversations()}


@router.get("/{user_id}/conversations/{conversation_id}", response_model=MessagesResponse)
async def get_conversation(
    user_id: str,
    conversation_id: int,
    current_user: User = Depends(get_current_user),
):
    """Get all messages in a conversation."""
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        service = ChatService(user_id=user_id)
        return {"messages": service.get_conversation_messages(conversation_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

---

## Example 4: Testing the Agent

```python
# backend/tests/test_agents.py
"""
Tests for the Todo AI Agent.
"""
import pytest
import asyncio
from unittest.mock import patch, MagicMock
from src.agents import run_todo_agent, create_todo_agent
from src.agents.gemini_config import get_gemini_model


@pytest.fixture
def mock_gemini_model():
    """Mock the Gemini model for testing."""
    with patch('src.agents.gemini_config.get_gemini_client') as mock:
        mock.return_value = MagicMock()
        yield mock


@pytest.mark.asyncio
async def test_agent_creation():
    """Test that agent is created correctly."""
    with patch('src.agents.todo_agent.get_gemini_model') as mock_model:
        mock_model.return_value = MagicMock()
        agent = create_todo_agent()

        assert agent.name == "TodoAssistant"
        assert len(agent.tools) == 5  # 5 tools
        assert agent.hooks is not None


@pytest.mark.asyncio
async def test_run_agent_simple():
    """Test basic agent execution."""
    with patch('src.agents.runner.Runner.run') as mock_run:
        # Mock the result
        mock_result = MagicMock()
        mock_result.final_output = "Hello! How can I help?"
        mock_result.new_items = []
        mock_result.input_tokens = 10
        mock_result.output_tokens = 5
        mock_run.return_value = mock_result

        result = await run_todo_agent(
            user_message="Hello",
            user_id="test-user-123",
        )

        assert "response" in result
        assert result["response"] == "Hello! How can I help?"


@pytest.mark.asyncio
async def test_run_agent_with_history():
    """Test agent with conversation history."""
    with patch('src.agents.runner.Runner.run') as mock_run:
        mock_result = MagicMock()
        mock_result.final_output = "Here are your tasks..."
        mock_result.new_items = []
        mock_run.return_value = mock_result

        history = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"},
        ]

        result = await run_todo_agent(
            user_message="Show my tasks",
            user_id="test-user-123",
            conversation_history=history,
        )

        # Verify Runner.run was called with history
        call_args = mock_run.call_args
        assert len(call_args[1]["input"]) == 3  # 2 history + 1 new


@pytest.mark.asyncio
async def test_agent_error_handling():
    """Test agent handles errors gracefully."""
    with patch('src.agents.runner.Runner.run') as mock_run:
        mock_run.side_effect = Exception("API Error")

        with pytest.raises(Exception) as exc_info:
            await run_todo_agent(
                user_message="Hello",
                user_id="test-user",
            )

        assert "API Error" in str(exc_info.value)
```

---

## Example 5: Environment Configuration

```bash
# backend/.env
# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Alternative models (uncomment to use):
# GEMINI_MODEL=gemini-2.0-flash-exp
# GEMINI_MODEL=gemini-1.5-pro
# GEMINI_MODEL=gemini-1.5-flash
```

---

## Quick Test Script

```python
# backend/test_gemini.py
"""Quick test to verify Gemini integration works."""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    from src.agents import run_todo_agent

    print("Testing Gemini integration...")
    print(f"Using model: {os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')}")

    result = await run_todo_agent(
        user_message="Hello! What can you help me with?",
        user_id="test-user-123",
    )

    print("\n--- Agent Response ---")
    print(result["response"])
    print("\n--- Usage ---")
    print(result.get("usage", "N/A"))


if __name__ == "__main__":
    asyncio.run(main())
```

Run with:
```bash
cd backend
uv run python test_gemini.py
```
