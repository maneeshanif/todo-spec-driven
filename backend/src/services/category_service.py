"""Category service for category-related operations."""
from typing import List, Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.category import TaskCategory
from src.core.errors import NotFoundError, ConflictError
from src.core.logging import get_logger

logger = get_logger(__name__)


class CategoryService:
    """Service for category operations."""

    @staticmethod
    async def get_categories(session: AsyncSession, user_id: str) -> List[TaskCategory]:
        """
        Get all categories for a user.

        Args:
            session: Database session
            user_id: User ID

        Returns:
            List of categories
        """
        statement = select(TaskCategory).where(TaskCategory.user_id == user_id).order_by(TaskCategory.name)
        result = await session.exec(statement)
        categories = result.all()

        logger.info(f"Retrieved {len(categories)} categories", extra={"user_id": user_id})
        return list(categories)

    @staticmethod
    async def get_category(session: AsyncSession, user_id: str, category_id: int) -> TaskCategory:
        """
        Get a specific category.

        Args:
            session: Database session
            user_id: User ID
            category_id: Category ID

        Returns:
            Category object

        Raises:
            NotFoundError: If category not found
        """
        statement = select(TaskCategory).where(
            TaskCategory.id == category_id,
            TaskCategory.user_id == user_id
        )
        result = await session.exec(statement)
        category = result.first()

        if not category:
            logger.warning(f"Category not found", extra={"user_id": user_id, "category_id": category_id})
            raise NotFoundError("Category", category_id)

        return category

    @staticmethod
    async def create_category(
        session: AsyncSession,
        user_id: str,
        name: str,
        color: str = "#6366f1"
    ) -> TaskCategory:
        """
        Create a new category.

        Args:
            session: Database session
            user_id: User ID
            name: Category name
            color: Category color (hex)

        Returns:
            Created category

        Raises:
            ConflictError: If category with same name already exists
        """
        # Check if category with same name exists
        statement = select(TaskCategory).where(
            TaskCategory.user_id == user_id,
            TaskCategory.name == name
        )
        result = await session.exec(statement)
        existing = result.first()

        if existing:
            logger.warning(f"Category already exists", extra={"user_id": user_id, "name": name})
            raise ConflictError("Category", f"Category with name '{name}' already exists")

        # Create category
        category = TaskCategory(
            user_id=user_id,
            name=name,
            color=color
        )

        session.add(category)
        await session.commit()
        await session.refresh(category)

        logger.info(f"Category created", extra={"user_id": user_id, "category_id": category.id, "name": name})
        return category

    @staticmethod
    async def update_category(
        session: AsyncSession,
        user_id: str,
        category_id: int,
        name: Optional[str] = None,
        color: Optional[str] = None
    ) -> TaskCategory:
        """
        Update a category.

        Args:
            session: Database session
            user_id: User ID
            category_id: Category ID
            name: New name (optional)
            color: New color (optional)

        Returns:
            Updated category

        Raises:
            NotFoundError: If category not found
            ConflictError: If new name already exists
        """
        # Get category
        category = await CategoryService.get_category(session, user_id, category_id)

        # Check name conflict if changing name
        if name and name != category.name:
            statement = select(TaskCategory).where(
                TaskCategory.user_id == user_id,
                TaskCategory.name == name,
                TaskCategory.id != category_id
            )
            result = await session.exec(statement)
            existing = result.first()

            if existing:
                logger.warning(f"Category name conflict", extra={"user_id": user_id, "name": name})
                raise ConflictError("Category", f"Category with name '{name}' already exists")

            category.name = name

        if color:
            category.color = color

        await session.commit()
        await session.refresh(category)

        logger.info(f"Category updated", extra={"user_id": user_id, "category_id": category_id})
        return category

    @staticmethod
    async def delete_category(session: AsyncSession, user_id: str, category_id: int) -> None:
        """
        Delete a category.

        Args:
            session: Database session
            user_id: User ID
            category_id: Category ID

        Raises:
            NotFoundError: If category not found
        """
        category = await CategoryService.get_category(session, user_id, category_id)

        await session.delete(category)
        await session.commit()

        logger.info(f"Category deleted", extra={"user_id": user_id, "category_id": category_id})

    @staticmethod
    async def get_default_categories(session: AsyncSession, user_id: str) -> List[TaskCategory]:
        """
        Create default categories for a new user.

        Args:
            session: Database session
            user_id: User ID

        Returns:
            List of created default categories
        """
        default_categories = [
            {"name": "Work", "color": "#3b82f6"},  # Blue
            {"name": "Personal", "color": "#10b981"},  # Green
            {"name": "Shopping", "color": "#f59e0b"},  # Amber
            {"name": "Health", "color": "#ef4444"},  # Red
            {"name": "Finance", "color": "#8b5cf6"},  # Purple
        ]

        categories = []
        for cat_data in default_categories:
            try:
                category = await CategoryService.create_category(
                    session, user_id, cat_data["name"], cat_data["color"]
                )
                categories.append(category)
            except ConflictError:
                # Skip if already exists
                pass

        logger.info(f"Created default categories", extra={"user_id": user_id, "count": len(categories)})
        return categories
