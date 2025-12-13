"""Statistics service for dashboard stats."""
from typing import Dict
from datetime import datetime, timedelta
from sqlmodel import select, func, and_
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.task import Task
from src.models.category import TaskCategory
from src.core.logging import get_logger

logger = get_logger(__name__)


class StatsService:
    """Service for calculating user statistics."""

    @staticmethod
    async def get_user_stats(session: AsyncSession, user_id: str) -> Dict:
        """
        Get comprehensive statistics for a user.

        Args:
            session: Database session
            user_id: User ID

        Returns:
            Dictionary with statistics
        """
        # Total tasks
        total_stmt = select(func.count(Task.id)).where(Task.user_id == user_id)
        total_result = await session.exec(total_stmt)
        total_tasks = total_result.one()

        # Completed tasks
        completed_stmt = select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed == True
        )
        completed_result = await session.exec(completed_stmt)
        completed_tasks = completed_result.one()

        # Pending tasks
        pending_tasks = total_tasks - completed_tasks

        # Tasks by priority
        priority_stmt = select(Task.priority, func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed == False
        ).group_by(Task.priority)
        priority_result = await session.exec(priority_stmt)
        priority_counts = {priority: count for priority, count in priority_result}

        # Overdue tasks (pending tasks with due_date in the past)
        now = datetime.utcnow()
        overdue_stmt = select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed == False,
            Task.due_date < now
        )
        overdue_result = await session.exec(overdue_stmt)
        overdue_tasks = overdue_result.one()

        # Tasks due today
        today_start = datetime(now.year, now.month, now.day)
        today_end = today_start + timedelta(days=1)
        today_stmt = select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed == False,
            Task.due_date >= today_start,
            Task.due_date < today_end
        )
        today_result = await session.exec(today_stmt)
        due_today = today_result.one()

        # Tasks due this week
        week_end = today_start + timedelta(days=7)
        week_stmt = select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed == False,
            Task.due_date >= today_start,
            Task.due_date < week_end
        )
        week_result = await session.exec(week_stmt)
        due_this_week = week_result.one()

        # Total categories
        categories_stmt = select(func.count(TaskCategory.id)).where(
            TaskCategory.user_id == user_id
        )
        categories_result = await session.exec(categories_stmt)
        total_categories = categories_result.one()

        # Completion rate
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

        stats = {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "completion_rate": round(completion_rate, 1),
            "overdue_tasks": overdue_tasks,
            "due_today": due_today,
            "due_this_week": due_this_week,
            "total_categories": total_categories,
            "tasks_by_priority": {
                "high": priority_counts.get("high", 0),
                "medium": priority_counts.get("medium", 0),
                "low": priority_counts.get("low", 0)
            }
        }

        logger.info(f"Statistics calculated", extra={"user_id": user_id, "stats": stats})
        return stats
