"""Statistics API routes."""
from fastapi import APIRouter, Depends, Request, Response
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.deps import get_current_user
from src.models.user import User
from src.schemas.stats import UserStatsResponse
from src.services.stats_service import StatsService
from src.core.logging import get_logger
from src.utils.caching import generate_etag, check_etag_match, set_cache_headers

logger = get_logger(__name__)

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get(
    "/",
    response_model=UserStatsResponse,
    summary="Get user statistics",
    description="Get comprehensive statistics for the authenticated user's tasks"
)
async def get_user_stats(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get comprehensive statistics for the current user.

    Returns:
    - **total_tasks**: Total number of tasks
    - **completed_tasks**: Number of completed tasks
    - **pending_tasks**: Number of pending tasks
    - **completion_rate**: Completion rate as a percentage
    - **overdue_tasks**: Number of overdue tasks
    - **due_today**: Number of tasks due today
    - **due_this_week**: Number of tasks due this week
    - **total_categories**: Total number of categories
    - **tasks_by_priority**: Task counts broken down by priority (high, medium, low)

    **Caching**: Results are cached for 60 seconds with ETag support.
    """
    stats = await StatsService.get_user_stats(session, current_user.id)

    # Generate ETag from result
    etag = generate_etag(stats)

    # Check if client has current version
    if check_etag_match(request, etag):
        return Response(status_code=304)

    # Set cache headers (60 second private cache)
    set_cache_headers(response, max_age=60, private=True, etag=etag)

    return UserStatsResponse(**stats)
