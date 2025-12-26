"""FastMCP Server for Todo operations.

This server handles ALL database operations for the AI agent.
The OpenAI Agent calls these tools via FastMCP Client.

Runs on port 8001 (configurable via MCP_SERVER_PORT) separately from the main FastAPI app.

Usage:
    python -m src.mcp_server.server
    OR
    uv run python -m src.mcp_server.server
"""

import logging
import os
from datetime import datetime
from typing import Optional

# Configure logging for MCP server
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_request
from sqlmodel import Session, create_engine, select
from sqlalchemy.pool import NullPool

from src.models.task import Task, utcnow


def get_user_id_from_request() -> str:
    """Extract user_id from the HTTP request query parameters.

    This provides task isolation by getting the user_id from the MCP
    server URL, which is set by the agent runner for each user session.

    Returns:
        str: The user_id from query params

    Raises:
        ValueError: If user_id is not provided in the request
    """
    try:
        request = get_http_request()
        user_id = request.query_params.get("user_id")
        if not user_id:
            logger.error("No user_id provided in MCP request")
            raise ValueError("user_id is required for task operations")
        logger.debug(f"Extracted user_id from request: {user_id}")
        return user_id
    except RuntimeError as e:
        # get_http_request() raises RuntimeError if not in HTTP context
        logger.error(f"Failed to get HTTP request context: {e}")
        raise ValueError("Cannot determine user context - not in HTTP request")

# Create synchronous database engine for MCP server
# Convert asyncpg URL to psycopg2 URL for sync operations
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if DATABASE_URL:
    # Replace asyncpg with psycopg2 for sync operations
    SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    # Remove ssl=require from query string (psycopg2 uses sslmode instead)
    # and replace with sslmode=require
    if "?ssl=require" in SYNC_DATABASE_URL:
        SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace("?ssl=require", "?sslmode=require")
    elif "&ssl=require" in SYNC_DATABASE_URL:
        SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace("&ssl=require", "&sslmode=require")
else:
    SYNC_DATABASE_URL = "postgresql://localhost/todoapp"

# Create sync engine with NullPool for serverless (Neon)
# Each request gets a fresh connection that's closed after use
sync_engine = create_engine(
    SYNC_DATABASE_URL,
    echo=False,
    poolclass=NullPool,  # Disable connection pooling for serverless
)

# Create FastMCP server instance
mcp = FastMCP("Todo MCP Server")


@mcp.tool
def add_task(
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    due_date: Optional[str] = None,
    is_recurring: bool = False,
    recurrence_pattern: Optional[str] = None,
) -> dict:
    """Add a new task for the current user.

    Creates a new task with full details including priority, due date, and recurrence.
    The user is automatically identified from the session context.

    Args:
        title: The task title (required, max 200 chars)
        description: Task description (optional, max 1000 chars)
        priority: Task priority - "low", "medium", or "high" (default: "medium")
        due_date: Due date in ISO format like "2024-12-25" or "2024-12-25T18:00:00" (optional)
        is_recurring: Whether the task repeats (default: False)
        recurrence_pattern: How often it repeats - "daily", "weekly", "monthly", "yearly" (optional)

    Returns:
        dict with task details including task_id, title, priority, due_date
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()
        # Validate priority
        valid_priorities = ["low", "medium", "high"]
        if priority not in valid_priorities:
            return {"status": "error", "message": f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"}

        # Validate recurrence_pattern
        valid_patterns = ["daily", "weekly", "monthly", "yearly"]
        if recurrence_pattern and recurrence_pattern not in valid_patterns:
            return {"status": "error", "message": f"Invalid recurrence pattern. Must be one of: {', '.join(valid_patterns)}"}

        # Parse due_date if provided
        parsed_due_date = None
        if due_date:
            try:
                # Try ISO format with time
                parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                # Remove timezone for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
                parsed_due_date = parsed_due_date.replace(tzinfo=None)
            except ValueError:
                return {"status": "error", "message": "Invalid due_date format. Use ISO format like '2024-12-25' or '2024-12-25T18:00:00'"}

        with Session(sync_engine) as session:
            task = Task(
                user_id=user_id,
                title=title,
                description=description,
                priority=priority,
                due_date=parsed_due_date,
                is_recurring=is_recurring,
                recurrence_pattern=recurrence_pattern if is_recurring else None,
            )
            session.add(task)
            session.commit()
            session.refresh(task)
            return {
                "status": "created",
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "is_recurring": task.is_recurring,
                "recurrence_pattern": task.recurrence_pattern,
            }
    except Exception as e:
        logger.error(f"Tool error in add_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def list_tasks(
    status: str = "all",
    priority: Optional[str] = None,
) -> dict:
    """List tasks for the current user with optional filters.

    The user is automatically identified from the session context.

    Args:
        status: Filter by "all", "pending", or "completed" (default: "all")
        priority: Filter by "low", "medium", or "high" (optional)

    Returns:
        dict with tasks list and summary counts
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()
        with Session(sync_engine) as session:
            query = select(Task).where(Task.user_id == user_id)

            # Filter by status
            if status == "pending":
                query = query.where(Task.completed == False)  # noqa: E712
            elif status == "completed":
                query = query.where(Task.completed == True)  # noqa: E712

            # Filter by priority
            if priority and priority in ["low", "medium", "high"]:
                query = query.where(Task.priority == priority)

            # Order by due_date (nulls last), then by created_at
            query = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())

            tasks = session.exec(query).all()

            # Count tasks by status
            pending_count = sum(1 for t in tasks if not t.completed)
            completed_count = sum(1 for t in tasks if t.completed)

            return {
                "status": "success",
                "total": len(tasks),
                "pending_count": pending_count,
                "completed_count": completed_count,
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "description": t.description,
                        "completed": t.completed,
                        "priority": t.priority,
                        "due_date": t.due_date.isoformat() if t.due_date else None,
                        "is_recurring": t.is_recurring,
                        "recurrence_pattern": t.recurrence_pattern,
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in tasks
                ],
            }
    except Exception as e:
        logger.error(f"Tool error in list_tasks: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again.", "tasks": []}


@mcp.tool
def complete_task(task_id: int) -> dict:
    """Mark a task as completed.

    The user is automatically identified from the session context.

    Args:
        task_id: The ID of the task to mark complete

    Returns:
        dict with status and task_id
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()
        with Session(sync_engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            task.completed = True
            session.add(task)
            session.commit()
            return {
                "status": "completed",
                "task_id": task.id,
                "title": task.title,
            }
    except Exception as e:
        logger.error(f"Tool error in complete_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def delete_task(task_id: int) -> dict:
    """Delete a task permanently.

    The user is automatically identified from the session context.

    Args:
        task_id: The ID of the task to delete

    Returns:
        dict with status and deleted task_id
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()
        with Session(sync_engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            title = task.title
            session.delete(task)
            session.commit()
            return {
                "status": "deleted",
                "task_id": task_id,
                "title": title,
            }
    except Exception as e:
        logger.error(f"Tool error in delete_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def update_task(
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
    completed: Optional[bool] = None,
    is_recurring: Optional[bool] = None,
    recurrence_pattern: Optional[str] = None,
) -> dict:
    """Update a task's details.

    The user is automatically identified from the session context.

    Args:
        task_id: The ID of the task to update
        title: New title for the task (optional)
        description: New description for the task (optional)
        priority: New priority - "low", "medium", or "high" (optional)
        due_date: New due date in ISO format, or "clear" to remove (optional)
        completed: Set completion status True/False (optional)
        is_recurring: Whether the task repeats (optional)
        recurrence_pattern: How often it repeats - "daily", "weekly", "monthly", "yearly" (optional)

    Returns:
        dict with status and updated task info
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()
        # Validate priority if provided
        if priority and priority not in ["low", "medium", "high"]:
            return {"status": "error", "message": "Invalid priority. Must be one of: low, medium, high"}

        # Validate recurrence_pattern if provided
        if recurrence_pattern and recurrence_pattern not in ["daily", "weekly", "monthly", "yearly"]:
            return {"status": "error", "message": "Invalid recurrence pattern. Must be one of: daily, weekly, monthly, yearly"}

        with Session(sync_engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            # Update fields if provided
            if title is not None:
                task.title = title
            if description is not None:
                task.description = description
            if priority is not None:
                task.priority = priority
            if completed is not None:
                task.completed = completed
            if is_recurring is not None:
                task.is_recurring = is_recurring
            if recurrence_pattern is not None:
                task.recurrence_pattern = recurrence_pattern

            # Handle due_date
            if due_date is not None:
                if due_date.lower() == "clear":
                    task.due_date = None
                else:
                    try:
                        parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                        task.due_date = parsed_due_date.replace(tzinfo=None)
                    except ValueError:
                        return {"status": "error", "message": "Invalid due_date format. Use ISO format or 'clear'"}

            # Update timestamp
            task.updated_at = utcnow()

            session.add(task)
            session.commit()
            session.refresh(task)
            return {
                "status": "updated",
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "completed": task.completed,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "is_recurring": task.is_recurring,
                "recurrence_pattern": task.recurrence_pattern,
            }
    except Exception as e:
        logger.error(f"Tool error in update_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


def run_server() -> None:
    """Run the MCP server with HTTP transport and health endpoint."""
    import uvicorn
    from starlette.applications import Starlette
    from starlette.routing import Route, Mount
    from starlette.responses import JSONResponse

    # Get port from environment or use default
    port = int(os.environ.get("MCP_SERVER_PORT", "8001"))

    async def health_endpoint(request):
        """Health check endpoint for Docker/Kubernetes.

        Returns JSON with service status, name, and version.
        This endpoint is used by container orchestration for liveness/readiness probes.
        """
        return JSONResponse(
            {
                "status": "healthy",
                "service": "todo-mcp-server",
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

    # Create MCP app with Streamable HTTP transport
    # Required for OpenAI Agents SDK's MCPServerStreamableHttp client
    try:
        from fastmcp.server.http import create_streamable_http_app

        # Create Streamable HTTP app - single endpoint for requests/responses
        # Path "/" means endpoint is at mount point (/mcp)
        mcp_app = create_streamable_http_app(mcp, streamable_http_path="/")

        # IMPORTANT: Must pass lifespan from mcp_app to parent Starlette app
        # This initializes the StreamableHTTPSessionManager task group
        app = Starlette(
            routes=[
                Route("/health", health_endpoint, methods=["GET"]),
                Mount("/mcp", app=mcp_app),
            ],
            lifespan=mcp_app.lifespan,  # Required for FastMCP!
        )

        print(f"🚀 Starting Todo MCP Server on http://0.0.0.0:{port}")
        print(f"📦 Database: {SYNC_DATABASE_URL[:50]}..." if len(SYNC_DATABASE_URL) > 50 else f"📦 Database: {SYNC_DATABASE_URL}")
        print("🔧 Available tools: add_task, list_tasks, complete_task, delete_task, update_task")
        print(f"🏥 Health check: http://0.0.0.0:{port}/health")
        print(f"🔌 MCP endpoint: http://0.0.0.0:{port}/mcp (Streamable HTTP)")

        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

    except ImportError:
        # Fallback to mcp.run() with streamable-http transport
        logger.warning("create_streamable_http_app not available, using mcp.run()")

        print(f"🚀 Starting Todo MCP Server on http://0.0.0.0:{port}")
        print(f"📦 Database: {SYNC_DATABASE_URL[:50]}..." if len(SYNC_DATABASE_URL) > 50 else f"📦 Database: {SYNC_DATABASE_URL}")
        print("🔧 Available tools: add_task, list_tasks, complete_task, delete_task, update_task")
        print("⚠️  Health check: Configure at ingress/proxy level")

        mcp.run(
            transport="streamable-http",
            host="0.0.0.0",
            port=port,
        )


if __name__ == "__main__":
    run_server()
