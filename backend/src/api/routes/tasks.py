"""Task routes."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.deps import get_current_user
from src.core.errors import NotFoundError
from src.schemas.task import TaskPublic, TaskListResponse, TaskCreate, TaskUpdate
from src.services.task_service import TaskService
from src.models.user import User
from src.core.logging import get_logger
from src.utils.caching import generate_etag, check_etag_match, set_cache_headers, no_cache

logger = get_logger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=TaskListResponse,
    summary="Get all tasks",
    description="Get all tasks for the authenticated user with optional filtering and pagination."
)
async def get_tasks(
    request: Request,
    response: Response,
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page (max 100)"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all tasks for the current user.

    - **completed**: Optional filter by completion status (true/false)
    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 50, max 100)

    Returns paginated list of tasks sorted by creation date (newest first).

    **Caching**: Results are cached for 60 seconds with ETag support.
    """
    tasks = await TaskService.get_tasks(
        session=session,
        user_id=current_user.id,
        completed=completed,
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
    description="Create a new task for the authenticated user."
)
async def create_task(
    task_data: TaskCreate,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new task.

    - **title**: Task title (required, max 200 chars)
    - **description**: Task description (optional, max 1000 chars)

    Returns the created task.
    """
    task = await TaskService.create_task(
        session=session,
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description
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
    current_user: User = Depends(get_current_user),
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
        user_id=current_user.id
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
    description="Update a task's title, description, or completion status."
)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a task.

    - **title**: New task title (optional)
    - **description**: New task description (optional)
    - **completed**: New completion status (optional)

    Returns the updated task. Returns 404 if task not found or not owned by current user.
    """
    task = await TaskService.get_task_by_id(
        session=session,
        task_id=task_id,
        user_id=current_user.id
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    updated_task = await TaskService.update_task(
        session=session,
        task=task,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed
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
    current_user: User = Depends(get_current_user),
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
        user_id=current_user.id
    )

    if not task:
        raise NotFoundError("Task", f"Task with ID {task_id} not found")

    await TaskService.delete_task(session=session, task=task)

    # Disable caching for mutations
    no_cache(response)

    return None
