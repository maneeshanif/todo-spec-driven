"""Task service for task-related operations."""
from typing import List, Optional
from sqlmodel import select, desc
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.task import Task
from src.core.logging import get_logger

logger = get_logger(__name__)


class TaskService:
    """Service for task operations."""
    
    @staticmethod
    async def get_tasks(
        session: AsyncSession,
        user_id: str,
        completed: Optional[bool] = None,
        page: int = 1,
        page_size: int = 50
    ) -> List[Task]:
        """
        Get tasks for a user with filtering and pagination.
        
        Args:
            session: Database session
            user_id: User ID to filter tasks
            completed: Optional filter by completion status
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            List of Task objects
        """
        # Build query
        statement = select(Task).where(Task.user_id == user_id)
        
        # Apply completed filter if provided
        if completed is not None:
            statement = statement.where(Task.completed == completed)
        
        # Sort by created_at descending (newest first)
        statement = statement.order_by(desc(Task.created_at))
        
        # Apply pagination
        offset = (page - 1) * page_size
        statement = statement.offset(offset).limit(page_size)
        
        # Execute query
        result = await session.exec(statement)
        tasks = result.all()
        
        logger.info(
            f"Retrieved tasks for user",
            extra={
                "user_id": user_id,
                "count": len(tasks),
                "completed_filter": completed,
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
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        result = await session.exec(statement)
        task = result.first()
        
        if task:
            logger.info(f"Task retrieved", extra={"task_id": task_id, "user_id": user_id})
        else:
            logger.warning(f"Task not found or access denied", extra={"task_id": task_id, "user_id": user_id})
        
        return task
    
    @staticmethod
    async def create_task(
        session: AsyncSession,
        user_id: str,
        title: str,
        description: Optional[str] = None
    ) -> Task:
        """
        Create a new task.
        
        Args:
            session: Database session
            user_id: User ID who owns the task
            title: Task title
            description: Optional task description
            
        Returns:
            Created Task object
        """
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False
        )
        
        session.add(task)
        await session.commit()
        await session.refresh(task)
        
        logger.info(
            f"Task created",
            extra={"task_id": task.id, "user_id": user_id, "title": title}
        )
        
        return task
    
    @staticmethod
    async def update_task(
        session: AsyncSession,
        task: Task,
        title: Optional[str] = None,
        description: Optional[str] = None,
        completed: Optional[bool] = None
    ) -> Task:
        """
        Update an existing task.
        
        Args:
            session: Database session
            task: Task object to update
            title: Optional new title
            description: Optional new description
            completed: Optional new completion status
            
        Returns:
            Updated Task object
        """
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if completed is not None:
            task.completed = completed
        
        session.add(task)
        await session.commit()
        await session.refresh(task)
        
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
