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
import re
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
from sqlmodel import Session, create_engine, select, or_
from sqlalchemy import asc, desc
from sqlalchemy.pool import NullPool

from src.models.task import Task, utcnow
from src.models.tag import Tag
from src.models.task_tag import TaskTag
from src.models.reminder import Reminder, ReminderStatus


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


def validate_hex_color(color: str) -> bool:
    """Validate hex color format.

    Args:
        color: Color string to validate

    Returns:
        bool: True if valid hex color format (#RRGGBB)
    """
    pattern = r'^#[0-9A-Fa-f]{6}$'
    return bool(re.match(pattern, color))

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
    tag_ids: Optional[list[int]] = None,
    is_recurring: bool = False,
    recurrence_pattern: Optional[str] = None,
) -> dict:
    """Add a new task for the current user.

    Creates a new task with full details including priority, due date, tags, and recurrence.
    The user is automatically identified from the session context.

    Args:
        title: The task title (required, max 200 chars)
        description: Task description (optional, max 1000 chars)
        priority: Task priority - "low", "medium", or "high" (default: "medium")
        due_date: Due date in ISO format like "2024-12-25" or "2024-12-25T18:00:00" (optional)
        tag_ids: List of tag IDs to apply to this task (optional)
        is_recurring: Whether the task repeats (default: False)
        recurrence_pattern: How often it repeats - "daily", "weekly", "monthly", "yearly" (optional)

    Returns:
        dict with task details including task_id, title, priority, due_date, tags
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
            # Verify all tags belong to user if tag_ids provided
            if tag_ids:
                for tag_id in tag_ids:
                    tag = session.exec(
                        select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
                    ).first()
                    if not tag:
                        return {"status": "error", "message": f"Tag ID {tag_id} not found or access denied"}

            # Create task
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

            # Add tag associations if provided
            applied_tags = []
            if tag_ids:
                for tag_id in tag_ids:
                    task_tag = TaskTag(task_id=task.id, tag_id=tag_id)
                    session.add(task_tag)
                    # Get tag details for response
                    tag = session.exec(select(Tag).where(Tag.id == tag_id)).first()
                    if tag:
                        applied_tags.append({"id": tag.id, "name": tag.name, "color": tag.color})
                session.commit()

            return {
                "status": "created",
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "tags": applied_tags,
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
    tag_ids: Optional[list[int]] = None,
    search: Optional[str] = None,
    sort_by: str = "due_date",
    sort_order: str = "asc",
) -> dict:
    """List tasks for the current user with optional filters, search, and sorting.

    The user is automatically identified from the session context.

    Args:
        status: Filter by "all", "pending", or "completed" (default: "all")
        priority: Filter by "low", "medium", or "high" (optional)
        tag_ids: Filter by tag IDs - returns tasks that have ANY of these tags (optional)
        search: Search term to filter by title and description (optional)
        sort_by: Field to sort by - "due_date", "priority", "created_at", "title", "updated_at" (default: "due_date")
        sort_order: Sort order - "asc" or "desc" (default: "asc")

    Returns:
        dict with tasks list, summary counts, and sort info
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

            # Filter by tags if provided
            if tag_ids:
                # Join with task_tags to filter by tags
                query = query.join(TaskTag).where(TaskTag.tag_id.in_(tag_ids)).distinct()

            # Apply search filter (title and description)
            if search:
                search_pattern = f"%{search}%"
                query = query.where(
                    or_(
                        Task.title.ilike(search_pattern),
                        Task.description.ilike(search_pattern)
                    )
                )

            # Apply sorting
            sort_column = {
                "due_date": Task.due_date,
                "priority": Task.priority,
                "created_at": Task.created_at,
                "title": Task.title,
                "updated_at": Task.updated_at,
            }.get(sort_by, Task.created_at)

            # Sort order (asc or desc)
            if sort_order == "asc":
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))

            tasks = session.exec(query).all()

            # Count tasks by status
            pending_count = sum(1 for t in tasks if not t.completed)
            completed_count = sum(1 for t in tasks if t.completed)

            # Get tags for each task
            task_list = []
            for t in tasks:
                # Get tags for this task
                tag_query = (
                    select(Tag)
                    .join(TaskTag)
                    .where(TaskTag.task_id == t.id)
                )
                task_tags = session.exec(tag_query).all()

                task_list.append({
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                    "priority": t.priority,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "tags": [{"id": tag.id, "name": tag.name, "color": tag.color} for tag in task_tags],
                    "is_recurring": t.is_recurring,
                    "recurrence_pattern": t.recurrence_pattern,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                })

            return {
                "status": "success",
                "total": len(tasks),
                "pending_count": pending_count,
                "completed_count": completed_count,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "search": search,
                "tasks": task_list,
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


@mcp.tool
def add_tag(
    name: str,
    color: str = "#808080"
) -> dict:
    """Create a new tag for organizing tasks.

    The user is automatically identified from the session context.

    Args:
        name: Tag name (max 50 chars, must be unique per user)
        color: Hex color code like "#3b82f6" (default: gray #808080)

    Returns:
        dict with tag_id, name, color, and status
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        # Validate color format
        if not validate_hex_color(color):
            return {"status": "error", "message": "Invalid color format. Use hex format like '#3b82f6'"}

        # Validate name length
        if len(name) > 50:
            return {"status": "error", "message": "Tag name must be 50 characters or less"}

        if not name.strip():
            return {"status": "error", "message": "Tag name cannot be empty"}

        with Session(sync_engine) as session:
            # Check for duplicate tag name for this user
            existing_tag = session.exec(
                select(Tag).where(Tag.user_id == user_id, Tag.name == name)
            ).first()

            if existing_tag:
                return {"status": "error", "message": f"Tag '{name}' already exists"}

            # Create tag
            tag = Tag(user_id=user_id, name=name, color=color)
            session.add(tag)
            session.commit()
            session.refresh(tag)

            return {
                "status": "created",
                "tag_id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "created_at": tag.created_at.isoformat() if tag.created_at else None,
            }
    except Exception as e:
        logger.error(f"Tool error in add_tag: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def list_tags() -> dict:
    """List all tags for the current user.

    The user is automatically identified from the session context.

    Returns:
        dict with tags list and total count
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        with Session(sync_engine) as session:
            query = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name)
            tags = session.exec(query).all()

            return {
                "status": "success",
                "total": len(tags),
                "tags": [
                    {
                        "id": t.id,
                        "name": t.name,
                        "color": t.color,
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in tags
                ],
            }
    except Exception as e:
        logger.error(f"Tool error in list_tags: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again.", "tags": []}


@mcp.tool
def delete_tag(tag_id: int) -> dict:
    """Delete a tag. Tasks won't be deleted, just untagged.

    The user is automatically identified from the session context.
    CASCADE deletes will automatically remove task_tags associations.

    Args:
        tag_id: ID of the tag to delete

    Returns:
        dict with status and deleted tag info
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        with Session(sync_engine) as session:
            # Verify tag belongs to user
            tag = session.exec(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
            ).first()

            if not tag:
                return {"status": "error", "message": "Tag not found"}

            tag_name = tag.name
            # Delete tag (CASCADE removes task_tags associations)
            session.delete(tag)
            session.commit()

            return {
                "status": "deleted",
                "tag_id": tag_id,
                "name": tag_name,
            }
    except Exception as e:
        logger.error(f"Tool error in delete_tag: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def tag_task(
    task_id: int,
    tag_ids: list[int]
) -> dict:
    """Add tags to a task.

    The user is automatically identified from the session context.

    Args:
        task_id: ID of the task to tag
        tag_ids: List of tag IDs to add

    Returns:
        dict with status and updated task info with tags
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        if not tag_ids:
            return {"status": "error", "message": "No tag IDs provided"}

        with Session(sync_engine) as session:
            # Verify task belongs to user
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            # Verify all tags belong to user
            added_tags = []
            for tag_id in tag_ids:
                tag = session.exec(
                    select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
                ).first()

                if not tag:
                    return {"status": "error", "message": f"Tag ID {tag_id} not found or access denied"}

                # Check if association already exists
                existing = session.exec(
                    select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
                ).first()

                if not existing:
                    # Add TaskTag association
                    task_tag = TaskTag(task_id=task_id, tag_id=tag_id)
                    session.add(task_tag)
                    added_tags.append({"id": tag.id, "name": tag.name, "color": tag.color})

            session.commit()

            # Get all current tags for the task
            tag_query = (
                select(Tag)
                .join(TaskTag)
                .where(TaskTag.task_id == task_id)
            )
            all_tags = session.exec(tag_query).all()

            return {
                "status": "updated",
                "task_id": task.id,
                "title": task.title,
                "added_tags": added_tags,
                "all_tags": [{"id": t.id, "name": t.name, "color": t.color} for t in all_tags],
            }
    except Exception as e:
        logger.error(f"Tool error in tag_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def untag_task(
    task_id: int,
    tag_ids: list[int]
) -> dict:
    """Remove tags from a task.

    The user is automatically identified from the session context.

    Args:
        task_id: ID of the task
        tag_ids: List of tag IDs to remove

    Returns:
        dict with status and updated task info
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        if not tag_ids:
            return {"status": "error", "message": "No tag IDs provided"}

        with Session(sync_engine) as session:
            # Verify task belongs to user
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            # Remove specified TaskTag associations
            removed_tags = []
            for tag_id in tag_ids:
                # Verify tag ownership
                tag = session.exec(
                    select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
                ).first()

                if not tag:
                    return {"status": "error", "message": f"Tag ID {tag_id} not found or access denied"}

                # Delete the association
                task_tag = session.exec(
                    select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
                ).first()

                if task_tag:
                    session.delete(task_tag)
                    removed_tags.append({"id": tag.id, "name": tag.name, "color": tag.color})

            session.commit()

            # Get remaining tags for the task
            tag_query = (
                select(Tag)
                .join(TaskTag)
                .where(TaskTag.task_id == task_id)
            )
            remaining_tags = session.exec(tag_query).all()

            return {
                "status": "updated",
                "task_id": task.id,
                "title": task.title,
                "removed_tags": removed_tags,
                "remaining_tags": [{"id": t.id, "name": t.name, "color": t.color} for t in remaining_tags],
            }
    except Exception as e:
        logger.error(f"Tool error in untag_task: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def schedule_reminder(
    task_id: int,
    remind_at: str
) -> dict:
    """Schedule a reminder for a task.

    Creates a reminder that will notify the user at the specified time.
    The user is automatically identified from the session context.

    Args:
        task_id: ID of the task to set reminder for
        remind_at: When to remind in ISO format like "2025-01-15T09:00:00"

    Returns:
        dict with reminder_id, task_id, task_title, remind_at, status
    """
    try:
        # Get user_id from request context for task isolation
        user_id = get_user_id_from_request()

        # Parse remind_at datetime
        try:
            # Parse ISO format and handle timezone
            parsed_remind_at = datetime.fromisoformat(remind_at.replace("Z", "+00:00"))
            # Remove timezone for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
            parsed_remind_at = parsed_remind_at.replace(tzinfo=None)
        except ValueError:
            return {
                "status": "error",
                "message": "Invalid remind_at format. Use ISO format like '2025-01-15T09:00:00'"
            }

        # Validate reminder is in the future
        if parsed_remind_at <= utcnow():
            return {
                "status": "error",
                "message": "Reminder time must be in the future"
            }

        with Session(sync_engine) as session:
            # Verify task exists and belongs to user
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            # Check if reminder already exists for this task
            existing_reminder = session.exec(
                select(Reminder).where(
                    Reminder.task_id == task_id,
                    Reminder.user_id == user_id,
                    Reminder.status == ReminderStatus.PENDING
                )
            ).first()

            if existing_reminder:
                return {
                    "status": "error",
                    "message": f"A pending reminder already exists for this task (reminder_id: {existing_reminder.id})"
                }

            # Create reminder
            reminder = Reminder(
                task_id=task_id,
                user_id=user_id,
                remind_at=parsed_remind_at,
                status=ReminderStatus.PENDING
            )
            session.add(reminder)
            session.commit()
            session.refresh(reminder)

            return {
                "status": "created",
                "reminder_id": reminder.id,
                "task_id": task.id,
                "task_title": task.title,
                "remind_at": reminder.remind_at.isoformat(),
                "reminder_status": reminder.status.value,
            }
    except Exception as e:
        logger.error(f"Tool error in schedule_reminder: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def list_reminders(
    task_id: Optional[int] = None,
    status: Optional[str] = None
) -> dict:
    """List reminders for the current user.

    The user is automatically identified from the session context.

    Args:
        task_id: Filter by task ID (optional)
        status: Filter by status - "pending", "sent", "failed" (optional)

    Returns:
        dict with reminders list including task details
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        # Validate status if provided
        if status and status not in ["pending", "sent", "failed"]:
            return {
                "status": "error",
                "message": "Invalid status. Must be one of: pending, sent, failed"
            }

        with Session(sync_engine) as session:
            # Build query
            query = select(Reminder).where(Reminder.user_id == user_id)

            # Filter by task_id
            if task_id is not None:
                # Verify task belongs to user
                task = session.exec(
                    select(Task).where(Task.id == task_id, Task.user_id == user_id)
                ).first()
                if not task:
                    return {"status": "error", "message": "Task not found"}

                query = query.where(Reminder.task_id == task_id)

            # Filter by status
            if status:
                reminder_status = ReminderStatus(status)
                query = query.where(Reminder.status == reminder_status)

            # Order by remind_at (earliest first)
            query = query.order_by(Reminder.remind_at.asc())

            reminders = session.exec(query).all()

            # Get task details for each reminder
            reminder_list = []
            for r in reminders:
                task = session.exec(select(Task).where(Task.id == r.task_id)).first()
                reminder_list.append({
                    "reminder_id": r.id,
                    "task_id": r.task_id,
                    "task_title": task.title if task else "Unknown Task",
                    "task_completed": task.completed if task else None,
                    "remind_at": r.remind_at.isoformat(),
                    "status": r.status.value,
                    "sent_at": r.sent_at.isoformat() if r.sent_at else None,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })

            return {
                "status": "success",
                "total": len(reminders),
                "reminders": reminder_list,
            }
    except Exception as e:
        logger.error(f"Tool error in list_reminders: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again.", "reminders": []}


@mcp.tool
def cancel_reminder(reminder_id: int) -> dict:
    """Cancel and delete a reminder.

    The user is automatically identified from the session context.

    Args:
        reminder_id: ID of the reminder to cancel

    Returns:
        dict with status and cancelled reminder info
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        with Session(sync_engine) as session:
            # Verify reminder exists and belongs to user
            reminder = session.exec(
                select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id)
            ).first()

            if not reminder:
                return {"status": "error", "message": "Reminder not found"}

            # Get task details before deleting
            task = session.exec(select(Task).where(Task.id == reminder.task_id)).first()
            task_title = task.title if task else "Unknown Task"
            remind_at = reminder.remind_at.isoformat()
            reminder_status = reminder.status.value

            # Delete the reminder
            session.delete(reminder)
            session.commit()

            return {
                "status": "deleted",
                "reminder_id": reminder_id,
                "task_id": reminder.task_id,
                "task_title": task_title,
                "remind_at": remind_at,
                "previous_status": reminder_status,
            }
    except Exception as e:
        logger.error(f"Tool error in cancel_reminder: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def get_upcoming_reminders(hours: int = 24) -> dict:
    """Get reminders due within the next N hours.

    Returns pending reminders sorted by remind_at time.
    The user is automatically identified from the session context.

    Args:
        hours: Number of hours to look ahead (default: 24)

    Returns:
        dict with upcoming reminders sorted by remind_at
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        # Validate hours parameter
        if hours < 1:
            return {"status": "error", "message": "Hours must be at least 1"}

        if hours > 168:  # 7 days max
            return {"status": "error", "message": "Hours cannot exceed 168 (7 days)"}

        # Calculate time window
        from datetime import timedelta
        now = utcnow()
        end_time = now + timedelta(hours=hours)

        with Session(sync_engine) as session:
            # Query pending reminders within timeframe
            query = select(Reminder).where(
                Reminder.user_id == user_id,
                Reminder.status == ReminderStatus.PENDING,
                Reminder.remind_at >= now,
                Reminder.remind_at <= end_time
            ).order_by(Reminder.remind_at.asc())

            reminders = session.exec(query).all()

            # Get task details for each reminder
            reminder_list = []
            for r in reminders:
                task = session.exec(select(Task).where(Task.id == r.task_id)).first()

                # Calculate hours until reminder
                time_diff = r.remind_at - now
                hours_until = round(time_diff.total_seconds() / 3600, 1)

                reminder_list.append({
                    "reminder_id": r.id,
                    "task_id": r.task_id,
                    "task_title": task.title if task else "Unknown Task",
                    "task_priority": task.priority if task else None,
                    "task_completed": task.completed if task else None,
                    "remind_at": r.remind_at.isoformat(),
                    "hours_until": hours_until,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                })

            return {
                "status": "success",
                "total": len(reminders),
                "hours_ahead": hours,
                "current_time": now.isoformat(),
                "window_end": end_time.isoformat(),
                "reminders": reminder_list,
            }
    except Exception as e:
        logger.error(f"Tool error in get_upcoming_reminders: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again.", "reminders": []}


@mcp.tool
def list_recurring(
    pattern: Optional[str] = None
) -> dict:
    """List all recurring tasks for the current user.

    The user is automatically identified from the session context.

    Args:
        pattern: Optional filter by recurrence pattern - "daily", "weekly", "monthly", "yearly"

    Returns:
        dict with recurring tasks list and total count
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        # Validate pattern if provided
        if pattern and pattern not in ["daily", "weekly", "monthly", "yearly"]:
            return {
                "status": "error",
                "message": "Invalid pattern. Must be one of: daily, weekly, monthly, yearly"
            }

        with Session(sync_engine) as session:
            # Build query for recurring tasks
            query = select(Task).where(
                Task.user_id == user_id,
                Task.is_recurring == True
            )

            # Filter by pattern if provided
            if pattern:
                query = query.where(Task.recurrence_pattern == pattern)

            # Order by next_occurrence (nulls last), then created_at
            query = query.order_by(Task.next_occurrence.asc().nullslast(), Task.created_at.desc())

            tasks = session.exec(query).all()

            return {
                "status": "success",
                "total": len(tasks),
                "pattern_filter": pattern,
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "description": t.description,
                        "priority": t.priority,
                        "completed": t.completed,
                        "recurrence_pattern": t.recurrence_pattern,
                        "next_occurrence": t.next_occurrence.isoformat() if t.next_occurrence else None,
                        "due_date": t.due_date.isoformat() if t.due_date else None,
                        "tags": [],
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in tasks
                ],
            }
    except Exception as e:
        logger.error(f"Tool error in list_recurring: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again.", "tasks": []}


@mcp.tool
def skip_occurrence(
    task_id: int
) -> dict:
    """Skip the next occurrence of a recurring task.

    Marks the current occurrence as completed and generates the next occurrence.
    The user is automatically identified from the session context.

    Args:
        task_id: The ID of the recurring task to skip

    Returns:
        dict with status and updated task info including new occurrence
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        # Import recurring service for date calculation
        from src.services.recurring_service import RecurringService

        with Session(sync_engine) as session:
            # Verify task exists, belongs to user, and is recurring
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            if not task.is_recurring:
                return {"status": "error", "message": "This is not a recurring task"}

            # Calculate next occurrence
            current_occurrence = task.next_occurrence or task.due_date or task.created_at
            next_occurrence = RecurringService.calculate_next_occurrence(
                current_occurrence,
                task.recurrence_pattern
            )

            # Update task with new next_occurrence
            task.next_occurrence = next_occurrence
            task.completed = False  # Reset completion for next occurrence
            task.updated_at = utcnow()
            session.add(task)
            session.commit()
            session.refresh(task)

            # Format pattern description
            pattern_desc = RecurringService.format_pattern_description(task.recurrence_pattern)

            return {
                "status": "skipped",
                "task_id": task.id,
                "title": task.title,
                "pattern": task.recurrence_pattern,
                "pattern_description": pattern_desc,
                "previous_occurrence": current_occurrence.isoformat() if current_occurrence else None,
                "next_occurrence": next_occurrence.isoformat(),
            }
    except Exception as e:
        logger.error(f"Tool error in skip_occurrence: {e}", exc_info=True)
        return {"status": "error", "message": "An unexpected error occurred. Please try again."}


@mcp.tool
def stop_recurrence(
    task_id: int
) -> dict:
    """Stop a recurring task by marking it as non-recurring.

    Converts a recurring task to a one-time task while preserving current state.
    The user is automatically identified from the session context.

    Args:
        task_id: The ID of the recurring task to stop

    Returns:
        dict with status and updated task info
    """
    try:
        # Get user_id from request context
        user_id = get_user_id_from_request()

        with Session(sync_engine) as session:
            # Verify task exists, belongs to user, and is recurring
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()

            if not task:
                return {"status": "error", "message": "Task not found"}

            if not task.is_recurring:
                return {"status": "error", "message": "This is already not a recurring task"}

            # Store pattern before removing
            old_pattern = task.recurrence_pattern
            old_pattern_desc = RecurringService.format_pattern_description(old_pattern)

            # Stop recurrence by clearing is_recurring and recurrence_pattern
            task.is_recurring = False
            task.recurrence_pattern = None
            task.next_occurrence = None
            task.updated_at = utcnow()
            session.add(task)
            session.commit()
            session.refresh(task)

            return {
                "status": "stopped",
                "task_id": task.id,
                "title": task.title,
                "old_pattern": old_pattern,
                "old_pattern_description": old_pattern_desc,
                "is_recurring": False,
            }
    except Exception as e:
        logger.error(f"Tool error in stop_recurrence: {e}", exc_info=True)
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
        print("🔧 Available tools:")
        print("   Tasks: add_task, list_tasks, complete_task, delete_task, update_task")
        print("   Tags: add_tag, list_tags, delete_tag, tag_task, untag_task")
        print("   Reminders: schedule_reminder, list_reminders, cancel_reminder, get_upcoming_reminders")
        print("   Recurring: list_recurring, skip_occurrence, stop_recurrence")
        print(f"🏥 Health check: http://0.0.0.0:{port}/health")
        print(f"🔌 MCP endpoint: http://0.0.0.0:{port}/mcp (Streamable HTTP)")

        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

    except ImportError:
        # Fallback to mcp.run() with streamable-http transport
        logger.warning("create_streamable_http_app not available, using mcp.run()")

        print(f"🚀 Starting Todo MCP Server on http://0.0.0.0:{port}")
        print(f"📦 Database: {SYNC_DATABASE_URL[:50]}..." if len(SYNC_DATABASE_URL) > 50 else f"📦 Database: {SYNC_DATABASE_URL}")
        print("🔧 Available tools:")
        print("   Tasks: add_task, list_tasks, complete_task, delete_task, update_task")
        print("   Tags: add_tag, list_tags, delete_tag, tag_task, untag_task")
        print("   Reminders: schedule_reminder, list_reminders, cancel_reminder, get_upcoming_reminders")
        print("⚠️  Health check: Configure at ingress/proxy level")

        mcp.run(
            transport="streamable-http",
            host="0.0.0.0",
            port=port,
        )


if __name__ == "__main__":
    run_server()
