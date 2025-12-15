"""Task routes."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.core.errors import NotFoundError
from src.schemas.task import TaskPublic, TaskListResponse, TaskCreate, TaskUpdate
from src.services.task_service import TaskService
from src.core.logging import get_logger
from src.utils.caching import generate_etag, check_etag_match, set_cache_headers, no_cache

logger = get_logger(__name__)

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
    tasks = await TaskService.get_tasks(
        session=session,
        user_id=current_user['id'],
        completed=completed,
        priority=priority,
        category_id=category_id,
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
        is_recurring=task_data.is_recurring,
        recurrence_pattern=task_data.recurrence_pattern
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

    updated_task = await TaskService.update_task(
        session=session,
        task=task,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed,
        priority=task_data.priority,
        due_date=task_data.due_date,
        category_ids=task_data.category_ids,
        is_recurring=task_data.is_recurring,
        recurrence_pattern=task_data.recurrence_pattern
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

    await TaskService.delete_task(session=session, task=task)

    # Disable caching for mutations
    no_cache(response)

    return None
