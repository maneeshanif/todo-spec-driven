"""Task service for task-related operations."""
from typing import List, Optional
from datetime import datetime, timezone
from sqlmodel import select, desc, asc, or_, and_, col
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from src.models.task import Task
from src.models.category import TaskCategoryMapping
from src.models.task_tag import TaskTag
from src.core.logging import get_logger

logger = get_logger(__name__)


class TaskService:
    """Service for task operations."""

    @staticmethod
    async def get_tasks(
        session: AsyncSession,
        user_id: str,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        category_id: Optional[int] = None,
        tag_ids: Optional[List[int]] = None,
        search: Optional[str] = None,
        due_date_start: Optional[datetime] = None,
        due_date_end: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 50
    ) -> List[Task]:
        """
        Get tasks for a user with filtering, search, sorting, and pagination.

        Args:
            session: Database session
            user_id: User ID to filter tasks
            completed: Optional filter by completion status
            priority: Optional filter by priority (low, medium, high)
            category_id: Optional filter by category ID
            tag_ids: Optional filter by tag IDs (tasks with ANY of these tags)
            search: Optional search term for title/description
            due_date_start: Optional filter by due date range start
            due_date_end: Optional filter by due date range end
            sort_by: Field to sort by (created_at, due_date, priority, title, updated_at)
            sort_order: Sort order (asc or desc)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            List of Task objects
        """
        # Build base query with eager loading for relationships
        statement = (
            select(Task)
            .where(Task.user_id == user_id)
            .options(selectinload(Task.tags))
        )

        # Apply completed filter
        if completed is not None:
            statement = statement.where(Task.completed == completed)

        # Apply priority filter
        if priority:
            statement = statement.where(Task.priority == priority)

        # Apply category filter (join with TaskCategoryMapping)
        if category_id:
            statement = statement.join(TaskCategoryMapping).where(
                TaskCategoryMapping.category_id == category_id
            )

        # Apply tag filter (join with TaskTag)
        if tag_ids:
            statement = statement.join(TaskTag).where(
                TaskTag.tag_id.in_(tag_ids)
            )

        # Apply search filter (search in title and description)
        if search:
            search_pattern = f"%{search}%"
            statement = statement.where(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern)
                )
            )

        # Apply due date range filter
        if due_date_start:
            statement = statement.where(Task.due_date >= due_date_start)
        if due_date_end:
            statement = statement.where(Task.due_date <= due_date_end)

        # Apply sorting
        sort_column = {
            "created_at": Task.created_at,
            "updated_at": Task.updated_at,
            "due_date": Task.due_date,
            "priority": Task.priority,
            "title": Task.title
        }.get(sort_by, Task.created_at)

        if sort_order == "asc":
            statement = statement.order_by(asc(sort_column))
        else:
            statement = statement.order_by(desc(sort_column))

        # Apply pagination
        offset = (page - 1) * page_size
        statement = statement.offset(offset).limit(page_size)

        # Execute query
        result = await session.exec(statement)
        tasks = result.unique().all()

        # Explicitly load tags for each task to avoid async lazy loading issues
        # We query tags separately and attach them to the task's internal dict
        from src.models.tag import Tag
        for task in tasks:
            tag_stmt = (
                select(Tag)
                .join(TaskTag)
                .where(TaskTag.task_id == task.id)
            )
            tag_result = await session.exec(tag_stmt)
            loaded_tags = list(tag_result.all())

            # Store tags in SQLAlchemy's internal state to make them accessible
            # without triggering lazy loading
            from sqlalchemy.orm.attributes import set_committed_value
            set_committed_value(task, "tags", loaded_tags)

        logger.info(
            f"Retrieved tasks for user",
            extra={
                "user_id": user_id,
                "count": len(tasks),
                "filters": {
                    "completed": completed,
                    "priority": priority,
                    "category_id": category_id,
                    "tag_ids": tag_ids,
                    "search": search,
                    "sort_by": sort_by,
                    "sort_order": sort_order
                },
                "page": page,
            }
        )

        return list(tasks)
    
    @staticmethod
    async def get_task_by_id(
        session: AsyncSession,
        task_id: int,
        user_id: str
    ) -> Optional[Task]:
        """
        Get a specific task by ID (with user isolation).

        Args:
            session: Database session
            task_id: Task ID
            user_id: User ID for ownership verification

        Returns:
            Task object if found and owned by user, None otherwise
        """
        statement = (
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
            .options(selectinload(Task.tags))
        )
        result = await session.exec(statement)
        task = result.first()

        if task:
            # Explicitly load tags to avoid async lazy loading issues
            from src.models.tag import Tag
            tag_stmt = (
                select(Tag)
                .join(TaskTag)
                .where(TaskTag.task_id == task.id)
            )
            tag_result = await session.exec(tag_stmt)
            loaded_tags = list(tag_result.all())
            from sqlalchemy.orm.attributes import set_committed_value
            set_committed_value(task, "tags", loaded_tags)
            logger.info(f"Task retrieved", extra={"task_id": task_id, "user_id": user_id})
        else:
            logger.warning(f"Task not found or access denied", extra={"task_id": task_id, "user_id": user_id})

        return task
    
    @staticmethod
    async def create_task(
        session: AsyncSession,
        user_id: str,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        due_date: Optional[datetime] = None,
        category_ids: Optional[List[int]] = None,
        tag_ids: Optional[List[int]] = None,
        is_recurring: bool = False,
        recurrence_pattern: Optional[str] = None,
        recurrence_data: Optional[dict] = None
    ) -> Task:
        """
        Create a new task.

        Args:
            session: Database session
            user_id: User ID who owns the task
            title: Task title
            description: Optional task description
            priority: Task priority (low, medium, high)
            due_date: Optional due date
            category_ids: Optional list of category IDs to associate
            tag_ids: Optional list of tag IDs to associate
            is_recurring: Whether task is recurring
            recurrence_pattern: Optional recurrence pattern (daily, weekly, monthly, yearly)
            recurrence_data: Optional additional recurrence configuration

        Returns:
            Created Task object
        """
        # Normalize due_date - remove timezone since DB columns are WITHOUT TIME ZONE
        if due_date is not None:
            if due_date.tzinfo is not None:
                # Convert to UTC and remove timezone
                due_date = due_date.astimezone(timezone.utc).replace(tzinfo=None)

        # Calculate next_occurrence for recurring tasks
        next_occurrence = None
        if is_recurring and recurrence_pattern:
            from src.services.recurring_service import RecurringService

            # Use due_date as base, fallback to current time
            base_date = due_date if due_date else datetime.now(timezone.utc).replace(tzinfo=None)

            try:
                next_occurrence = RecurringService.calculate_next_occurrence(
                    base_date, recurrence_pattern, recurrence_data
                )
            except ValueError as e:
                logger.warning(f"Failed to calculate next_occurrence: {e}")

        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False,
            priority=priority,
            due_date=due_date,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern,
            recurrence_data=recurrence_data,
            next_occurrence=next_occurrence
        )

        session.add(task)
        await session.commit()
        await session.refresh(task)

        # Associate categories if provided
        if category_ids:
            from src.models.category import TaskCategoryMapping
            for category_id in category_ids:
                mapping = TaskCategoryMapping(
                    task_id=task.id,
                    category_id=category_id
                )
                session.add(mapping)
            await session.commit()
            await session.refresh(task)

        # Associate tags if provided
        if tag_ids:
            for tag_id in tag_ids:
                mapping = TaskTag(
                    task_id=task.id,
                    tag_id=tag_id
                )
                session.add(mapping)
            await session.commit()
            await session.refresh(task)

        # Explicitly load tags to avoid async lazy loading issues
        from src.models.tag import Tag
        tag_stmt = (
            select(Tag)
            .join(TaskTag)
            .where(TaskTag.task_id == task.id)
        )
        tag_result = await session.exec(tag_stmt)
        loaded_tags = list(tag_result.all())
        from sqlalchemy.orm.attributes import set_committed_value
        set_committed_value(task, "tags", loaded_tags)

        logger.info(
            f"Task created",
            extra={
                "task_id": task.id,
                "user_id": user_id,
                "title": title,
                "priority": priority,
                "categories": category_ids or [],
                "tags": tag_ids or []
            }
        )

        return task

    @staticmethod
    async def update_task(
        session: AsyncSession,
        task: Task,
        title: Optional[str] = None,
        description: Optional[str] = None,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        due_date: Optional[datetime] = None,
        category_ids: Optional[List[int]] = None,
        tag_ids: Optional[List[int]] = None,
        is_recurring: Optional[bool] = None,
        recurrence_pattern: Optional[str] = None,
        recurrence_data: Optional[dict] = None
    ) -> Task:
        """
        Update an existing task.

        Args:
            session: Database session
            task: Task object to update
            title: Optional new title
            description: Optional new description
            completed: Optional new completion status
            priority: Optional new priority
            due_date: Optional new due date
            category_ids: Optional new list of category IDs
            tag_ids: Optional new list of tag IDs
            is_recurring: Optional new recurring status
            recurrence_pattern: Optional new recurrence pattern
            recurrence_data: Optional new recurrence configuration

        Returns:
            Updated Task object
        """
        # Track if recurrence fields changed
        recurrence_changed = False

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if completed is not None:
            task.completed = completed
        if priority is not None:
            task.priority = priority
        if due_date is not None:
            # Normalize due_date - remove timezone since DB columns are WITHOUT TIME ZONE
            if due_date.tzinfo is not None:
                # Convert to UTC and remove timezone
                due_date = due_date.astimezone(timezone.utc).replace(tzinfo=None)
            task.due_date = due_date
            recurrence_changed = True
        if is_recurring is not None:
            task.is_recurring = is_recurring
            recurrence_changed = True
        if recurrence_pattern is not None:
            task.recurrence_pattern = recurrence_pattern
            recurrence_changed = True
        if recurrence_data is not None:
            task.recurrence_data = recurrence_data
            recurrence_changed = True

        # Recalculate next_occurrence if recurrence changed
        if recurrence_changed and task.is_recurring and task.recurrence_pattern:
            from src.services.recurring_service import RecurringService

            # Use current due_date or fallback to current time
            base_date = task.due_date if task.due_date else datetime.now(timezone.utc).replace(tzinfo=None)

            try:
                task.next_occurrence = RecurringService.calculate_next_occurrence(
                    base_date, task.recurrence_pattern, task.recurrence_data
                )
            except ValueError as e:
                logger.warning(f"Failed to recalculate next_occurrence: {e}")

        # Update categories if provided
        if category_ids is not None:
            from src.models.category import TaskCategoryMapping

            # Delete existing mappings
            delete_stmt = select(TaskCategoryMapping).where(
                TaskCategoryMapping.task_id == task.id
            )
            existing_mappings = await session.exec(delete_stmt)
            for mapping in existing_mappings:
                await session.delete(mapping)

            # Create new mappings
            for category_id in category_ids:
                mapping = TaskCategoryMapping(
                    task_id=task.id,
                    category_id=category_id
                )
                session.add(mapping)

        # Update tags if provided
        if tag_ids is not None:
            # Delete existing tag mappings
            delete_stmt = select(TaskTag).where(
                TaskTag.task_id == task.id
            )
            existing_tag_mappings = await session.exec(delete_stmt)
            for mapping in existing_tag_mappings:
                await session.delete(mapping)

            # Create new tag mappings
            for tag_id in tag_ids:
                mapping = TaskTag(
                    task_id=task.id,
                    tag_id=tag_id
                )
                session.add(mapping)

        session.add(task)
        await session.commit()
        await session.refresh(task)

        # Explicitly load tags to avoid async lazy loading issues
        from src.models.tag import Tag
        tag_stmt = (
            select(Tag)
            .join(TaskTag)
            .where(TaskTag.task_id == task.id)
        )
        tag_result = await session.exec(tag_stmt)
        loaded_tags = list(tag_result.all())
        from sqlalchemy.orm.attributes import set_committed_value
        set_committed_value(task, "tags", loaded_tags)

        logger.info(
            f"Task updated",
            extra={"task_id": task.id, "user_id": task.user_id}
        )

        return task

    @staticmethod
    async def delete_task(
        session: AsyncSession,
        task: Task
    ) -> None:
        """
        Delete a task.
        
        Args:
            session: Database session
            task: Task object to delete
        """
        task_id = task.id
        user_id = task.user_id
        
        await session.delete(task)
        await session.commit()
        
        logger.info(
            f"Task deleted",
            extra={"task_id": task_id, "user_id": user_id}
        )
