"""Task routes."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.core.errors import NotFoundError
from src.schemas.task import TaskPublic, TaskListResponse, TaskCreate, TaskUpdate
from src.schemas.events import (
    TaskEvent, TaskEventType, TaskEventData,
    TaskUpdateEvent, TaskUpdateAction
)
from src.services.task_service import TaskService
from src.services.recurring_service import RecurringService
from src.services.dapr_client import DaprClient
from src.core.logging import get_logger
from src.utils.caching import generate_etag, check_etag_match, set_cache_headers, no_cache

logger = get_logger(__name__)

# Dapr pub/sub component name
PUBSUB_NAME = "pubsub-kafka"


async def _extract_task_data(task) -> TaskEventData:
    """Extract task data from Task model for event payload.

    Args:
        task: Task model instance

    Returns:
        TaskEventData with task state
    """
    # Extract tags from relationships
    tags = []
    if hasattr(task, 'tags') and task.tags:
        tags = [tag.name for tag in task.tags]

    return TaskEventData(
        title=task.title,
        description=task.description,
        completed=task.completed,
        priority=task.priority,
        due_date=task.due_date,
        tags=tags,
        recurring_pattern=task.recurrence_pattern,
        next_occurrence=task.next_occurrence
    )


async def _publish_task_event(
    event_type: TaskEventType,
    task_id: int,
    user_id: str,
    task
) -> None:
    """Publish task lifecycle event to task-events topic.

    Args:
        event_type: Type of event (CREATED, UPDATED, COMPLETED, DELETED)
        task_id: Task database ID
        user_id: User who owns the task
        task: Task model instance (or None for deleted)
    """
    try:
        task_data = await _extract_task_data(task) if task else TaskEventData(
            title="", completed=False, priority="medium"
        )

        event = TaskEvent(
            event_type=event_type,
            task_id=task_id,
            user_id=user_id,
            task_data=task_data
        )

        await DaprClient.publish_event(
            pubsub_name=PUBSUB_NAME,
            topic="task-events",
            data=event.model_dump(mode='json')
        )
        logger.debug(
            f"Published {event_type} event for task {task_id}",
            extra={"task_id": task_id, "user_id": user_id, "event_type": event_type}
        )
    except Exception as e:
        # Log error but don't fail the request
        logger.error(
            f"Failed to publish task event: {e}",
            extra={"task_id": task_id, "user_id": user_id, "event_type": event_type},
            exc_info=True
        )


async def _publish_task_update(
    task_id: int,
    user_id: str,
    action: TaskUpdateAction,
    changes: dict,
    source_client: str = "api"
) -> None:
    """Publish task update event to task-updates topic for real-time sync.

    Args:
        task_id: Task database ID
        user_id: User who owns the task
        action: Action that triggered the update
        changes: Changed fields for optimistic UI updates
        source_client: Client ID that initiated the change
    """
    try:
        event = TaskUpdateEvent(
            event_type="task.sync",
            task_id=task_id,
            user_id=user_id,
            action=action,
            changes=changes,
            source_client=source_client
        )

        await DaprClient.publish_event(
            pubsub_name=PUBSUB_NAME,
            topic="task-updates",
            data=event.model_dump(mode='json')
        )
        logger.debug(
            f"Published task.sync event for task {task_id}",
            extra={"task_id": task_id, "user_id": user_id, "action": action}
        )
    except Exception as e:
        # Log error but don't fail the request
        logger.error(
            f"Failed to publish task update: {e}",
            extra={"task_id": task_id, "user_id": user_id},
            exc_info=True
        )

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=TaskListResponse,
    summary="Get all tasks",
    description="Get all tasks for the authenticated user with optional filtering, search, sorting, and pagination."
)
async def get_tasks(
    request: Request,
    response: Response,
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    tag_ids: Optional[str] = Query(None, description="Filter by tag IDs (comma-separated)"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    due_date_start: Optional[datetime] = Query(None, description="Filter by due date range start"),
    due_date_end: Optional[datetime] = Query(None, description="Filter by due date range end"),
    sort_by: str = Query("created_at", description="Sort by field (created_at, due_date, priority, title, updated_at)"),
    sort_order: str = Query("desc", description="Sort order (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)"),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all tasks for the current user with comprehensive filtering and sorting.

    **Filters:**
    - **completed**: Filter by completion status (true/false)
    - **priority**: Filter by priority level (low, medium, high)
    - **category_id**: Filter by category ID
    - **tag_ids**: Filter by tag IDs (comma-separated, e.g., "1,2,3")
    - **search**: Search term for title and description
    - **due_date_start**: Filter tasks due after this date
    - **due_date_end**: Filter tasks due before this date

    **Sorting:**
    - **sort_by**: Field to sort by (created_at, due_date, priority, title, updated_at)
    - **sort_order**: Sort order (asc or desc)

    **Pagination:**
    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 50, max 100)

    **Caching**: Results are cached for 60 seconds with ETag support.
    """
    # Parse tag_ids from comma-separated string
    tag_id_list = None
    if tag_ids:
        try:
            tag_id_list = [int(tid.strip()) for tid in tag_ids.split(",")]
        except ValueError:
            pass  # Ignore invalid tag_ids

    tasks = await TaskService.get_tasks(
        session=session,
        user_id=current_user['id'],
        completed=completed,
        priority=priority,
        category_id=category_id,
        tag_ids=tag_id_list,
        search=search,
        due_date_start=due_date_start,
        due_date_end=due_date_end,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

    # Convert to response format
    task_list = [TaskPublic.model_validate(task) for task in tasks]
    result = TaskListResponse(
        tasks=task_list,
        total=len(task_list),
        page=page,
        page_size=page_size
    )

    # Generate ETag from result
    etag = generate_etag(result.model_dump())

    # Check if client has current version
    if check_etag_match(request, etag):
        return Response(status_code=304)

    # Set cache headers (60 second private cache)
    set_cache_headers(response, max_age=60, private=True, etag=etag)

    return result


@router.post(
    "",
    response_model=TaskPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new task for the authenticated user with all supported fields."
)
async def create_task(
    task_data: TaskCreate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new task.

    - **title**: Task title (required, max 200 chars)
    - **description**: Task description (optional, max 1000 chars)
    - **priority**: Task priority (low, medium, high) - default: medium
    - **due_date**: Due date (optional)
    - **category_ids**: List of category IDs to associate (optional)
    - **tag_ids**: List of tag IDs to associate (optional)
    - **is_recurring**: Whether task is recurring (default: false)
    - **recurrence_pattern**: Recurrence pattern if recurring (daily, weekly, monthly, yearly)

    Returns the created task.
    """
    task = await TaskService.create_task(
        session=session,
        user_id=current_user['id'],
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        category_ids=task_data.category_ids,
        tag_ids=task_data.tag_ids,
        is_recurring=task_data.is_recurring,
        recurrence_pattern=task_data.recurrence_pattern,
        recurrence_data=task_data.recurrence_data
    )

    # Publish events asynchronously
    await _publish_task_event(
        event_type=TaskEventType.CREATED,
        task_id=task.id,
        user_id=current_user['id'],
        task=task
    )
    await _publish_task_update(
        task_id=task.id,
        user_id=current_user['id'],
        action=TaskUpdateAction.CREATED,
        changes={
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "completed": task.completed
        }
    )

    # Disable caching for mutations
    no_cache(response)

    return TaskPublic.model_validate(task)


@router.get(
    "/{task_id}",
    response_model=TaskPublic,
    summary="Get a specific task",
    description="Get a specific task by ID (must be owned by authenticated user)."
)
async def get_task(
    task_id: int,
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get a specific task by ID.

    Returns 404 if task not found or not owned by current user.

    **Caching**: Result is cached for 60 seconds with ETag support.
    """
    task = await TaskService.get_task_by_id(
        session=session,
        task_id=task_id,
        user_id=current_user['id']
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    result = TaskPublic.model_validate(task)

    # Generate ETag from result
    etag = generate_etag(result.model_dump())

    # Check if client has current version
    if check_etag_match(request, etag):
        return Response(status_code=304)

    # Set cache headers (60 second private cache)
    set_cache_headers(response, max_age=60, private=True, etag=etag)

    return result


@router.patch(
    "/{task_id}",
    response_model=TaskPublic,
    summary="Update a task",
    description="Update any task fields including title, description, completion status, priority, due date, and categories."
)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a task.

    - **title**: New task title (optional)
    - **description**: New task description (optional)
    - **completed**: New completion status (optional)
    - **priority**: New priority (low, medium, high) (optional)
    - **due_date**: New due date (optional)
    - **category_ids**: New list of category IDs (optional)
    - **tag_ids**: New list of tag IDs (optional)
    - **is_recurring**: New recurring status (optional)
    - **recurrence_pattern**: New recurrence pattern (optional)

    Returns the updated task. Returns 404 if task not found or not owned by current user.
    """
    task = await TaskService.get_task_by_id(
        session=session,
        task_id=task_id,
        user_id=current_user['id']
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    # Track changes for event payload
    changes = {}
    if task_data.title is not None:
        changes["title"] = task_data.title
    if task_data.description is not None:
        changes["description"] = task_data.description
    if task_data.completed is not None:
        changes["completed"] = task_data.completed
    if task_data.priority is not None:
        changes["priority"] = task_data.priority
    if task_data.due_date is not None:
        changes["due_date"] = task_data.due_date.isoformat() if task_data.due_date else None

    updated_task = await TaskService.update_task(
        session=session,
        task=task,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed,
        priority=task_data.priority,
        due_date=task_data.due_date,
        category_ids=task_data.category_ids,
        tag_ids=task_data.tag_ids,
        is_recurring=task_data.is_recurring,
        recurrence_pattern=task_data.recurrence_pattern,
        recurrence_data=task_data.recurrence_data
    )

    # Publish events asynchronously
    await _publish_task_event(
        event_type=TaskEventType.UPDATED,
        task_id=task_id,
        user_id=current_user['id'],
        task=updated_task
    )
    await _publish_task_update(
        task_id=task_id,
        user_id=current_user['id'],
        action=TaskUpdateAction.UPDATED,
        changes=changes
    )

    # Disable caching for mutations
    no_cache(response)

    return TaskPublic.model_validate(updated_task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Delete a task by ID."
)
async def delete_task(
    task_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a task.

    Returns 204 No Content on success.
    Returns 404 if task not found or not owned by current user.
    """
    task = await TaskService.get_task_by_id(
        session=session,
        task_id=task_id,
        user_id=current_user['id']
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    # Publish events before deletion
    await _publish_task_event(
        event_type=TaskEventType.DELETED,
        task_id=task_id,
        user_id=current_user['id'],
        task=task
    )
    await _publish_task_update(
        task_id=task_id,
        user_id=current_user['id'],
        action=TaskUpdateAction.DELETED,
        changes={}
    )

    await TaskService.delete_task(session=session, task=task)

    # Disable caching for mutations
    no_cache(response)

    return None


@router.patch(
    "/{task_id}/complete",
    response_model=TaskPublic,
    summary="Mark a task as complete",
    description="Mark a task as completed. Publishes task.completed event."
)
async def complete_task(
    task_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Mark a task as completed.

    Returns the updated task. Returns 404 if task not found or not owned by current user.

    Events published:
    - task-events: task.completed (for audit, recurring, WebSocket consumption)
    - task-updates: task.sync with action=completed (for real-time sync)
    """
    task = await TaskService.get_task_by_id(
        session=session,
        task_id=task_id,
        user_id=current_user['id']
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    # Check if already completed
    if task.completed:
        # Already completed, just return the task
        return TaskPublic.model_validate(task)

    # Mark as completed
    updated_task = await TaskService.update_task(
        session=session,
        task=task,
        completed=True
    )

    # Publish events
    await _publish_task_event(
        event_type=TaskEventType.COMPLETED,
        task_id=task_id,
        user_id=current_user['id'],
        task=updated_task
    )
    await _publish_task_update(
        task_id=task_id,
        user_id=current_user['id'],
        action=TaskUpdateAction.COMPLETED,
        changes={"completed": True}
    )

    # Disable caching for mutations
    no_cache(response)

    return TaskPublic.model_validate(updated_task)


@router.get(
    "/recurring",
    response_model=TaskListResponse,
    summary="Get recurring tasks",
    description="Get all recurring tasks for the authenticated user, optionally filtered by pattern."
)
async def get_recurring_tasks(
    request: Request,
    response: Response,
    pattern: Optional[str] = Query(None, description="Filter by recurrence pattern (daily, weekly, monthly, yearly)"),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all recurring tasks for the current user.

    **Filters:**
    - **pattern**: Filter by recurrence pattern (daily, weekly, monthly, yearly)

    Returns tasks ordered by next_occurrence date.

    **Caching**: Results are cached for 60 seconds with ETag support.
    """
    try:
        tasks = await RecurringService.get_recurring_tasks(
            session=session,
            user_id=current_user['id'],
            pattern=pattern
        )
    except ValueError as e:
        # Invalid pattern
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

    # Convert to response format
    task_list = [TaskPublic.model_validate(task) for task in tasks]
    result = TaskListResponse(
        tasks=task_list,
        total=len(task_list),
        page=1,
        page_size=len(task_list)
    )

    # Generate ETag from result
    etag = generate_etag(result.model_dump())

    # Check if client has current version
    if check_etag_match(request, etag):
        return Response(status_code=304)

    # Set cache headers (60 second private cache)
    set_cache_headers(response, max_age=60, private=True, etag=etag)

    return result
