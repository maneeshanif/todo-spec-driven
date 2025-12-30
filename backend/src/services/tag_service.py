"""Tag service for tag-related operations."""
from typing import List, Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import IntegrityError
from src.models.tag import Tag
from src.core.logging import get_logger
from src.core.errors import ConflictError

logger = get_logger(__name__)


class TagService:
    """Service for tag operations."""

    @staticmethod
    async def get_tags(
        session: AsyncSession,
        user_id: str
    ) -> List[Tag]:
        """
        Get all tags for a user.

        Args:
            session: Database session
            user_id: User ID to filter tags

        Returns:
            List of Tag objects
        """
        statement = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name)
        result = await session.exec(statement)
        tags = list(result.all())

        logger.info(
            f"Retrieved tags for user",
            extra={
                "user_id": user_id,
                "count": len(tags)
            }
        )

        return tags

    @staticmethod
    async def get_tag_by_id(
        session: AsyncSession,
        tag_id: int,
        user_id: str
    ) -> Optional[Tag]:
        """
        Get a specific tag by ID (with user isolation).

        Args:
            session: Database session
            tag_id: Tag ID
            user_id: User ID for ownership verification

        Returns:
            Tag object if found and owned by user, None otherwise
        """
        statement = select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == user_id
        )
        result = await session.exec(statement)
        tag = result.first()

        if tag:
            logger.info(f"Tag retrieved", extra={"tag_id": tag_id, "user_id": user_id})
        else:
            logger.warning(f"Tag not found or access denied", extra={"tag_id": tag_id, "user_id": user_id})

        return tag

    @staticmethod
    async def check_unique_name(
        session: AsyncSession,
        user_id: str,
        name: str,
        exclude_id: Optional[int] = None
    ) -> bool:
        """
        Check if tag name is unique for user.

        Args:
            session: Database session
            user_id: User ID
            name: Tag name to check
            exclude_id: Tag ID to exclude from check (for updates)

        Returns:
            True if name is unique, False if duplicate exists
        """
        statement = select(Tag).where(
            Tag.user_id == user_id,
            Tag.name == name
        )

        if exclude_id:
            statement = statement.where(Tag.id != exclude_id)

        result = await session.exec(statement)
        existing_tag = result.first()

        return existing_tag is None

    @staticmethod
    async def create_tag(
        session: AsyncSession,
        user_id: str,
        name: str,
        color: str = "#808080"
    ) -> Tag:
        """
        Create a new tag.

        Args:
            session: Database session
            user_id: User ID who owns the tag
            name: Tag name
            color: Hex color code (default: gray)

        Returns:
            Created Tag object

        Raises:
            ConflictError: If tag name already exists for user
        """
        # Check for unique name
        is_unique = await TagService.check_unique_name(session, user_id, name)
        if not is_unique:
            raise ConflictError(
                resource="Tag",
                detail=f"A tag with the name '{name}' already exists"
            )

        tag = Tag(
            user_id=user_id,
            name=name,
            color=color
        )

        session.add(tag)

        try:
            await session.commit()
            await session.refresh(tag)

            logger.info(
                f"Tag created",
                extra={
                    "tag_id": tag.id,
                    "user_id": user_id,
                    "name": name,
                    "color": color
                }
            )

            return tag

        except IntegrityError as e:
            await session.rollback()
            logger.error(f"Database integrity error creating tag", extra={"error": str(e)})
            raise ConflictError(
                resource="Tag",
                detail=f"A tag with the name '{name}' already exists"
            )

    @staticmethod
    async def update_tag(
        session: AsyncSession,
        tag: Tag,
        name: Optional[str] = None,
        color: Optional[str] = None
    ) -> Tag:
        """
        Update an existing tag.

        Args:
            session: Database session
            tag: Tag object to update
            name: Optional new name
            color: Optional new color

        Returns:
            Updated Tag object

        Raises:
            ConflictError: If new name conflicts with existing tag
        """
        if name is not None and name != tag.name:
            # Check for unique name (excluding current tag)
            is_unique = await TagService.check_unique_name(
                session, tag.user_id, name, exclude_id=tag.id
            )
            if not is_unique:
                raise ConflictError(
                    resource="Tag",
                    detail=f"A tag with the name '{name}' already exists"
                )
            tag.name = name

        if color is not None:
            tag.color = color

        session.add(tag)

        try:
            await session.commit()
            await session.refresh(tag)

            logger.info(
                f"Tag updated",
                extra={"tag_id": tag.id, "user_id": tag.user_id}
            )

            return tag

        except IntegrityError as e:
            await session.rollback()
            logger.error(f"Database integrity error updating tag", extra={"error": str(e)})
            raise ConflictError(
                resource="Tag",
                detail=f"A tag with the name '{name}' already exists"
            )

    @staticmethod
    async def delete_tag(
        session: AsyncSession,
        tag: Tag
    ) -> None:
        """
        Delete a tag.

        Args:
            session: Database session
            tag: Tag object to delete
        """
        tag_id = tag.id
        user_id = tag.user_id

        await session.delete(tag)
        await session.commit()

        logger.info(
            f"Tag deleted",
            extra={"tag_id": tag_id, "user_id": user_id}
        )
