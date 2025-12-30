"""Tag routes."""
from fastapi import APIRouter, Depends, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.core.errors import NotFoundError
from src.schemas.tag import TagPublic, TagListResponse, TagCreate, TagUpdate
from src.services.tag_service import TagService
from src.core.logging import get_logger
from src.utils.caching import no_cache

logger = get_logger(__name__)

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get(
    "",
    response_model=TagListResponse,
    summary="Get all tags",
    description="Get all tags for the authenticated user."
)
async def get_tags(
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all tags for the current user.

    Returns a list of all tags with their names and colors, sorted alphabetically.
    """
    tags = await TagService.get_tags(
        session=session,
        user_id=current_user['id']
    )

    # Convert to response format
    tag_list = [TagPublic.model_validate(tag) for tag in tags]
    result = TagListResponse(
        tags=tag_list,
        total=len(tag_list)
    )

    # Tags change frequently, so disable caching
    no_cache(response)

    return result


@router.post(
    "",
    response_model=TagPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new tag",
    description="Create a new tag for the authenticated user."
)
async def create_tag(
    tag_data: TagCreate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new tag.

    - **name**: Tag name (required, max 50 chars, must be unique per user)
    - **color**: Hex color code (default: #808080 gray)

    Returns the created tag.

    Raises 409 Conflict if a tag with the same name already exists for this user.
    """
    tag = await TagService.create_tag(
        session=session,
        user_id=current_user['id'],
        name=tag_data.name,
        color=tag_data.color
    )

    # Disable caching for mutations
    no_cache(response)

    return TagPublic.model_validate(tag)


@router.get(
    "/{tag_id}",
    response_model=TagPublic,
    summary="Get a specific tag",
    description="Get a specific tag by ID (must be owned by authenticated user)."
)
async def get_tag(
    tag_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get a specific tag by ID.

    Returns 404 if tag not found or not owned by current user.
    """
    tag = await TagService.get_tag_by_id(
        session=session,
        tag_id=tag_id,
        user_id=current_user['id']
    )

    if not tag:
        raise NotFoundError("Tag", f"Tag with ID {tag_id} not found")

    # Disable caching
    no_cache(response)

    return TagPublic.model_validate(tag)


@router.patch(
    "/{tag_id}",
    response_model=TagPublic,
    summary="Update a tag",
    description="Update a tag's name or color."
)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a tag.

    - **name**: New tag name (optional, must be unique per user)
    - **color**: New hex color code (optional)

    Returns the updated tag. Returns 404 if tag not found or not owned by current user.
    Raises 409 Conflict if new name conflicts with existing tag.
    """
    tag = await TagService.get_tag_by_id(
        session=session,
        tag_id=tag_id,
        user_id=current_user['id']
    )

    if not tag:
        raise NotFoundError("Tag", f"Tag with ID {tag_id} not found")

    updated_tag = await TagService.update_tag(
        session=session,
        tag=tag,
        name=tag_data.name,
        color=tag_data.color
    )

    # Disable caching for mutations
    no_cache(response)

    return TagPublic.model_validate(updated_tag)


@router.delete(
    "/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a tag",
    description="Delete a tag by ID. All task-tag associations will also be removed."
)
async def delete_tag(
    tag_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a tag.

    Returns 204 No Content on success.
    Returns 404 if tag not found or not owned by current user.

    All task-tag associations will be automatically removed due to CASCADE delete.
    """
    tag = await TagService.get_tag_by_id(
        session=session,
        tag_id=tag_id,
        user_id=current_user['id']
    )

    if not tag:
        raise NotFoundError("Tag", f"Tag with ID {tag_id} not found")

    await TagService.delete_tag(session=session, tag=tag)

    # Disable caching for mutations
    no_cache(response)

    return None
