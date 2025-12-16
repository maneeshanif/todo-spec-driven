# FastMCP Examples

Complete examples for building MCP servers.

## Example 1: Complete Todo MCP Server

```python
# backend/src/mcp_server/server.py
"""
Todo MCP Server - Exposes task operations as MCP tools.

Run: uv run python src/mcp_server/server.py
"""

from datetime import datetime
from typing import Literal
from mcp.server.fastmcp import FastMCP
from sqlmodel import Session, select
from src.database import engine
from src.models.task import Task

# Create server with JSON responses
mcp = FastMCP("Todo MCP Server", json_response=True)


@mcp.tool()
def add_task(
    user_id: str,
    title: str,
    description: str = None,
    priority: Literal["low", "medium", "high"] = "medium"
) -> dict:
    """Create a new task for a user.

    Args:
        user_id: The user's unique identifier
        title: Task title (required)
        description: Optional detailed description
        priority: Task priority level
    """
    with Session(engine) as session:
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            completed=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "status": "created",
            "message": f"Task '{title}' created successfully",
            "task": {
                "id": task.id,
                "title": task.title,
                "priority": task.priority
            }
        }


@mcp.tool()
def list_tasks(
    user_id: str,
    status: Literal["all", "pending", "completed"] = "all",
    priority: Literal["low", "medium", "high", None] = None,
    limit: int = 50
) -> dict:
    """List tasks for a user with optional filters.

    Args:
        user_id: The user's unique identifier
        status: Filter by completion status
        priority: Filter by priority level
        limit: Maximum number of tasks to return
    """
    with Session(engine) as session:
        query = select(Task).where(Task.user_id == user_id)

        if status == "pending":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

        if priority:
            query = query.where(Task.priority == priority)

        query = query.order_by(Task.created_at.desc()).limit(limit)
        tasks = session.exec(query).all()

        return {
            "status": "success",
            "count": len(tasks),
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                    "priority": t.priority,
                    "created_at": t.created_at.isoformat()
                }
                for t in tasks
            ]
        }


@mcp.tool()
def complete_task(user_id: str, task_id: int) -> dict:
    """Mark a task as completed.

    Args:
        user_id: The user's unique identifier
        task_id: ID of the task to complete
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {
                "status": "error",
                "message": f"Task {task_id} not found"
            }

        if task.completed:
            return {
                "status": "info",
                "message": f"Task '{task.title}' is already completed"
            }

        task.completed = True
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "status": "completed",
            "message": f"Task '{task.title}' marked as complete",
            "task": {
                "id": task.id,
                "title": task.title,
                "completed": True
            }
        }


@mcp.tool()
def delete_task(user_id: str, task_id: int) -> dict:
    """Delete a task permanently.

    Args:
        user_id: The user's unique identifier
        task_id: ID of the task to delete
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {
                "status": "error",
                "message": f"Task {task_id} not found"
            }

        title = task.title
        session.delete(task)
        session.commit()

        return {
            "status": "deleted",
            "message": f"Task '{title}' has been deleted",
            "task_id": task_id
        }


@mcp.tool()
def update_task(
    user_id: str,
    task_id: int,
    title: str = None,
    description: str = None,
    priority: Literal["low", "medium", "high", None] = None
) -> dict:
    """Update a task's details.

    Args:
        user_id: The user's unique identifier
        task_id: ID of the task to update
        title: New title (optional)
        description: New description (optional)
        priority: New priority level (optional)
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {
                "status": "error",
                "message": f"Task {task_id} not found"
            }

        updates = []
        if title is not None:
            task.title = title
            updates.append("title")
        if description is not None:
            task.description = description
            updates.append("description")
        if priority is not None:
            task.priority = priority
            updates.append("priority")

        if not updates:
            return {
                "status": "info",
                "message": "No updates provided"
            }

        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "status": "updated",
            "message": f"Task updated: {', '.join(updates)}",
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority
            }
        }


# Entry point
if __name__ == "__main__":
    print("Starting Todo MCP Server...")
    mcp.run(transport="streamable-http", port=8001)
```

## Example 2: Testing MCP Server

```python
# backend/tests/test_mcp_server.py
import pytest
from mcp.client.session import ClientSession
from mcp.shared.memory import create_connected_server_and_client_session

from src.mcp_server.server import mcp

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def client_session():
    async with create_connected_server_and_client_session(
        mcp._app,
        raise_exceptions=True
    ) as session:
        yield session

@pytest.mark.anyio
async def test_list_tools(client_session: ClientSession):
    """Test that all tools are registered."""
    tools = await client_session.list_tools()
    tool_names = [t.name for t in tools.tools]

    assert "add_task" in tool_names
    assert "list_tasks" in tool_names
    assert "complete_task" in tool_names
    assert "delete_task" in tool_names
    assert "update_task" in tool_names

@pytest.mark.anyio
async def test_add_task(client_session: ClientSession):
    """Test adding a task."""
    result = await client_session.call_tool("add_task", {
        "user_id": "test-user",
        "title": "Test Task",
        "description": "A test task"
    })

    assert result.content[0].text
    # Parse JSON response
    import json
    data = json.loads(result.content[0].text)
    assert data["status"] == "created"

@pytest.mark.anyio
async def test_list_tasks(client_session: ClientSession):
    """Test listing tasks."""
    result = await client_session.call_tool("list_tasks", {
        "user_id": "test-user"
    })

    import json
    data = json.loads(result.content[0].text)
    assert data["status"] == "success"
    assert "tasks" in data
```

## Example 3: MCP Server with Resources

```python
# backend/src/mcp_server/server_with_resources.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Todo Server with Resources")

# Dynamic resource - user's task summary
@mcp.resource("summary://{user_id}")
def get_user_summary(user_id: str) -> str:
    """Get task summary for a user."""
    with Session(engine) as session:
        total = session.exec(
            select(func.count(Task.id))
            .where(Task.user_id == user_id)
        ).one()

        completed = session.exec(
            select(func.count(Task.id))
            .where(Task.user_id == user_id)
            .where(Task.completed == True)
        ).one()

        return f"""
Task Summary for {user_id}:
- Total tasks: {total}
- Completed: {completed}
- Pending: {total - completed}
"""

# Prompt template
@mcp.prompt()
def task_analysis_prompt(user_id: str) -> str:
    """Generate a prompt for analyzing user's tasks."""
    return f"""
Analyze the tasks for user {user_id} and provide:
1. A summary of their productivity
2. Suggestions for task prioritization
3. Recommendations for task completion
"""
```

## Example 4: Connecting Agent to MCP Server

```python
# backend/src/services/mcp_client.py
"""Client to connect OpenAI Agent to MCP Server."""

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client

class MCPClient:
    def __init__(self, server_url: str = "http://localhost:8001"):
        self.server_url = server_url
        self.session = None

    async def connect(self):
        """Connect to MCP server."""
        transport = await streamablehttp_client(self.server_url)
        self.session = ClientSession(*transport)
        await self.session.initialize()

    async def call_tool(self, name: str, arguments: dict) -> dict:
        """Call an MCP tool."""
        result = await self.session.call_tool(name, arguments)
        return result

    async def list_tools(self) -> list:
        """List available tools."""
        tools = await self.session.list_tools()
        return [
            {
                "name": t.name,
                "description": t.description,
                "schema": t.inputSchema
            }
            for t in tools.tools
        ]

    async def close(self):
        """Close the connection."""
        if self.session:
            await self.session.close()
```

## Example 5: MCP Tools as OpenAI Agent Tools

```python
# backend/src/agents/mcp_tools.py
"""Convert MCP tools to OpenAI Agent function tools."""

from agents import function_tool
from src.services.mcp_client import MCPClient

mcp_client = MCPClient()

@function_tool
async def mcp_add_task(user_id: str, title: str, description: str = None) -> dict:
    """Add a task using MCP server."""
    result = await mcp_client.call_tool("add_task", {
        "user_id": user_id,
        "title": title,
        "description": description
    })
    return result

@function_tool
async def mcp_list_tasks(user_id: str, status: str = "all") -> dict:
    """List tasks using MCP server."""
    result = await mcp_client.call_tool("list_tasks", {
        "user_id": user_id,
        "status": status
    })
    return result

# ... similar wrappers for other tools
```
