"""Category API routes."""
from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List

from src.core.database import get_session
from src.core.auth_deps import get_current_user
from src.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from src.services.category_service import CategoryService
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "/",
    response_model=List[CategoryResponse],
    summary="Get all categories",
    description="Retrieve all categories for the authenticated user"
)
async def get_categories(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get all categories for the current user."""
    categories = await CategoryService.get_categories(session, current_user['id'])
    return categories


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a category",
    description="Create a new category"
)
async def create_category(
    data: CategoryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Create a new category."""
    category = await CategoryService.create_category(
        session,
        current_user['id'],
        data.name,
        data.color
    )
    return category


@router.get(
    "/defaults",
    response_model=List[CategoryResponse],
    summary="Create default categories",
    description="Create default categories for the user if they don't exist"
)
async def create_default_categories(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Create default categories for the user."""
    categories = await CategoryService.get_default_categories(session, current_user['id'])
    return categories


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get a category",
    description="Retrieve a specific category by ID"
)
async def get_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific category."""
    category = await CategoryService.get_category(session, current_user['id'], category_id)
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update a category",
    description="Update a category's name or color"
)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Update a category."""
    category = await CategoryService.update_category(
        session,
        current_user['id'],
        category_id,
        data.name,
        data.color
    )
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category",
    description="Delete a category (tasks will be unassigned from this category)"
)
async def delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    """Delete a category."""
    await CategoryService.delete_category(session, current_user['id'], category_id)
    return None
