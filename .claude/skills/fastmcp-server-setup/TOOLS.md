# MCP Tool Definition Patterns

Patterns for defining MCP tools with FastMCP.

## Tool Schema

Every MCP tool has:
- **name**: Unique identifier (auto-generated from function name)
- **description**: From docstring
- **inputSchema**: From type hints
- **outputSchema**: Optional, from return type

## Basic Patterns

### Simple Tool

```python
@mcp.tool()
def greet(name: str) -> str:
    """Greet a user by name."""
    return f"Hello, {name}!"
```

Generated schema:
```json
{
  "name": "greet",
  "description": "Greet a user by name.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {"type": "string"}
    },
    "required": ["name"]
  }
}
```

### Tool with Optional Parameters

```python
@mcp.tool()
def search(
    query: str,
    limit: int = 10,
    include_completed: bool = False
) -> list:
    """Search for items.

    Args:
        query: Search query string
        limit: Maximum results to return
        include_completed: Include completed items
    """
    pass
```

Generated schema:
```json
{
  "name": "search",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string"},
      "limit": {"type": "integer", "default": 10},
      "include_completed": {"type": "boolean", "default": false}
    },
    "required": ["query"]
  }
}
```

### Tool with Enum/Choices

```python
from typing import Literal

@mcp.tool()
def set_priority(
    task_id: int,
    priority: Literal["low", "medium", "high"]
) -> dict:
    """Set task priority.

    Args:
        task_id: The task ID
        priority: Priority level (low, medium, high)
    """
    pass
```

## CRUD Tool Patterns

### Create

```python
@mcp.tool()
def create_task(
    user_id: str,
    title: str,
    description: str = None,
    priority: str = "medium",
    due_date: str = None
) -> dict:
    """Create a new task.

    Args:
        user_id: Owner's user ID
        title: Task title (required)
        description: Optional detailed description
        priority: Priority level (low, medium, high)
        due_date: Optional due date (ISO format)

    Returns:
        Created task with ID and status
    """
    with Session(engine) as session:
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        return {
            "status": "created",
            "task": {
                "id": task.id,
                "title": task.title,
                "priority": task.priority
            }
        }
```

### Read (List)

```python
@mcp.tool()
def list_tasks(
    user_id: str,
    status: str = "all",
    priority: str = None,
    limit: int = 50
) -> dict:
    """List tasks for a user.

    Args:
        user_id: User's ID
        status: Filter by 'all', 'pending', or 'completed'
        priority: Filter by priority level
        limit: Maximum tasks to return

    Returns:
        List of tasks matching criteria
    """
    with Session(engine) as session:
        query = select(Task).where(Task.user_id == user_id)

        if status == "pending":
            query = query.where(Task.completed == False)
        elif status == "completed":
            query = query.where(Task.completed == True)

        if priority:
            query = query.where(Task.priority == priority)

        query = query.limit(limit)
        tasks = session.exec(query).all()

        return {
            "status": "success",
            "count": len(tasks),
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "completed": t.completed,
                    "priority": t.priority
                }
                for t in tasks
            ]
        }
```

### Read (Single)

```python
@mcp.tool()
def get_task(user_id: str, task_id: int) -> dict:
    """Get a single task by ID.

    Args:
        user_id: User's ID (for authorization)
        task_id: Task ID to retrieve

    Returns:
        Task details or error if not found
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {"status": "error", "message": "Task not found"}

        return {
            "status": "success",
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority,
                "created_at": task.created_at.isoformat()
            }
        }
```

### Update

```python
@mcp.tool()
def update_task(
    user_id: str,
    task_id: int,
    title: str = None,
    description: str = None,
    priority: str = None,
    due_date: str = None
) -> dict:
    """Update a task's details.

    Args:
        user_id: User's ID (for authorization)
        task_id: Task ID to update
        title: New title (optional)
        description: New description (optional)
        priority: New priority (optional)
        due_date: New due date (optional)

    Returns:
        Updated task or error
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {"status": "error", "message": "Task not found"}

        # Only update provided fields
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if priority is not None:
            task.priority = priority
        if due_date is not None:
            task.due_date = due_date

        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "status": "updated",
            "task": {
                "id": task.id,
                "title": task.title,
                "priority": task.priority
            }
        }
```

### Delete

```python
@mcp.tool()
def delete_task(user_id: str, task_id: int) -> dict:
    """Delete a task.

    Args:
        user_id: User's ID (for authorization)
        task_id: Task ID to delete

    Returns:
        Confirmation or error
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {"status": "error", "message": "Task not found"}

        title = task.title
        session.delete(task)
        session.commit()

        return {
            "status": "deleted",
            "task_id": task_id,
            "title": title
        }
```

### Toggle Status

```python
@mcp.tool()
def toggle_task(user_id: str, task_id: int) -> dict:
    """Toggle a task's completion status.

    Args:
        user_id: User's ID
        task_id: Task ID to toggle

    Returns:
        Task with new status
    """
    with Session(engine) as session:
        task = session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)
        ).first()

        if not task:
            return {"status": "error", "message": "Task not found"}

        task.completed = not task.completed
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()

        return {
            "status": "toggled",
            "task": {
                "id": task.id,
                "title": task.title,
                "completed": task.completed
            }
        }
```

## Response Patterns

### Success Response

```python
return {
    "status": "success",
    "data": {...}
}
```

### Error Response

```python
return {
    "status": "error",
    "message": "Human-readable error message",
    "code": "ERROR_CODE"  # Optional
}
```

### List Response

```python
return {
    "status": "success",
    "count": len(items),
    "items": [...]
}
```

## Authorization Pattern

Always verify user owns the resource:

```python
@mcp.tool()
def protected_operation(user_id: str, resource_id: int) -> dict:
    """Operation requiring authorization."""
    with Session(engine) as session:
        resource = session.exec(
            select(Resource)
            .where(Resource.id == resource_id)
            .where(Resource.user_id == user_id)  # Authorization check
        ).first()

        if not resource:
            return {
                "status": "error",
                "message": "Resource not found or access denied"
            }

        # Proceed with operation
```
