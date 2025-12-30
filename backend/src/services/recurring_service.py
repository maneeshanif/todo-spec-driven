"""Recurring task service for managing recurring task logic."""
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dateutil.relativedelta import relativedelta
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.task import Task
from src.core.logging import get_logger

logger = get_logger(__name__)


class RecurringService:
    """Utilities for recurring task management."""

    VALID_PATTERNS = ["daily", "weekly", "monthly", "yearly"]

    PATTERN_MAP = {
        "daily": DAILY,
        "weekly": WEEKLY,
        "monthly": MONTHLY,
        "yearly": YEARLY
    }

    @staticmethod
    def validate_pattern(pattern: str) -> bool:
        """Validate recurrence pattern.

        Args:
            pattern: Recurrence pattern string (daily, weekly, monthly, yearly)

        Returns:
            True if pattern is valid, False otherwise
        """
        return pattern in RecurringService.VALID_PATTERNS

    @staticmethod
    def calculate_next_occurrence(
        current_date: datetime,
        pattern: str,
        recurrence_data: Optional[Dict] = None
    ) -> datetime:
        """Calculate the next occurrence based on pattern.

        Args:
            current_date: Starting date (UTC datetime without timezone)
            pattern: Recurrence pattern (daily, weekly, monthly, yearly)
            recurrence_data: Optional custom config (e.g., {"every": 2} for every 2 weeks)

        Returns:
            Next occurrence datetime (UTC without timezone)

        Raises:
            ValueError: If pattern is invalid

        Examples:
            >>> from datetime import datetime
            >>> current = datetime(2025, 1, 15, 10, 0, 0)
            >>> RecurringService.calculate_next_occurrence(current, "daily")
            datetime(2025, 1, 16, 10, 0, 0)
            >>> RecurringService.calculate_next_occurrence(current, "weekly", {"every": 2})
            datetime(2025, 1, 29, 10, 0, 0)
        """
        if not RecurringService.validate_pattern(pattern):
            raise ValueError(f"Invalid pattern: {pattern}. Must be one of: {', '.join(RecurringService.VALID_PATTERNS)}")

        # Get interval (default 1)
        interval = 1
        if recurrence_data and "every" in recurrence_data:
            interval = recurrence_data["every"]
            if not isinstance(interval, int) or interval < 1:
                raise ValueError("'every' must be a positive integer")

        # Calculate next occurrence
        if pattern == "daily":
            return current_date + timedelta(days=interval)
        elif pattern == "weekly":
            return current_date + timedelta(weeks=interval)
        elif pattern == "monthly":
            # Use relativedelta to handle month-end edge cases (e.g., Jan 31 -> Feb 28)
            return current_date + relativedelta(months=interval)
        elif pattern == "yearly":
            # Use relativedelta to handle leap years (e.g., Feb 29 -> Feb 28)
            return current_date + relativedelta(years=interval)

        # This should never be reached due to validate_pattern check above
        raise ValueError(f"Unexpected pattern: {pattern}")

    @staticmethod
    def get_occurrences_until(
        start_date: datetime,
        end_date: datetime,
        pattern: str,
        recurrence_data: Optional[Dict] = None,
        max_count: int = 100
    ) -> List[datetime]:
        """Get all occurrences between start and end dates.

        Useful for calendar view or generating future instances.

        Args:
            start_date: Starting date (UTC datetime without timezone)
            end_date: Ending date (UTC datetime without timezone)
            pattern: Recurrence pattern (daily, weekly, monthly, yearly)
            recurrence_data: Optional custom config (e.g., {"every": 2})
            max_count: Maximum number of occurrences to return (default 100)

        Returns:
            List of datetime objects representing occurrences

        Raises:
            ValueError: If pattern is invalid or dates are invalid

        Examples:
            >>> from datetime import datetime
            >>> start = datetime(2025, 1, 1, 10, 0, 0)
            >>> end = datetime(2025, 1, 10, 10, 0, 0)
            >>> occurrences = RecurringService.get_occurrences_until(start, end, "daily")
            >>> len(occurrences)
            10
        """
        if not RecurringService.validate_pattern(pattern):
            raise ValueError(f"Invalid pattern: {pattern}")

        if start_date >= end_date:
            raise ValueError("start_date must be before end_date")

        # Get interval (default 1)
        interval = 1
        if recurrence_data and "every" in recurrence_data:
            interval = recurrence_data["every"]
            if not isinstance(interval, int) or interval < 1:
                raise ValueError("'every' must be a positive integer")

        # Use rrule for efficient date generation
        freq = RecurringService.PATTERN_MAP[pattern]

        occurrences = list(rrule(
            freq=freq,
            dtstart=start_date,
            until=end_date,
            interval=interval,
            count=max_count  # Safety limit
        ))

        logger.info(
            f"Generated recurring occurrences",
            extra={
                "pattern": pattern,
                "interval": interval,
                "count": len(occurrences),
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        )

        return occurrences

    @staticmethod
    def format_pattern_description(
        pattern: str,
        recurrence_data: Optional[Dict] = None
    ) -> str:
        """Human-readable description of the recurrence pattern.

        Args:
            pattern: Recurrence pattern (daily, weekly, monthly, yearly)
            recurrence_data: Optional custom config

        Returns:
            Human-readable string describing the pattern

        Examples:
            >>> RecurringService.format_pattern_description("daily")
            'Every day'
            >>> RecurringService.format_pattern_description("weekly", {"every": 2})
            'Every 2 weeks'
            >>> RecurringService.format_pattern_description("monthly", {"day": 15})
            'Monthly on the 15th'
        """
        if not RecurringService.validate_pattern(pattern):
            return "Invalid pattern"

        interval = 1
        if recurrence_data and "every" in recurrence_data:
            interval = recurrence_data["every"]

        # Base descriptions
        if pattern == "daily":
            if interval == 1:
                return "Every day"
            return f"Every {interval} days"
        elif pattern == "weekly":
            if interval == 1:
                return "Every week"
            return f"Every {interval} weeks"
        elif pattern == "monthly":
            if recurrence_data and "day" in recurrence_data:
                day = recurrence_data["day"]
                suffix = "th"
                if day in [1, 21, 31]:
                    suffix = "st"
                elif day in [2, 22]:
                    suffix = "nd"
                elif day in [3, 23]:
                    suffix = "rd"
                return f"Monthly on the {day}{suffix}"
            if interval == 1:
                return "Every month"
            return f"Every {interval} months"
        elif pattern == "yearly":
            if interval == 1:
                return "Every year"
            return f"Every {interval} years"

        return "Unknown pattern"

    @staticmethod
    async def get_recurring_tasks(
        session: AsyncSession,
        user_id: str,
        pattern: Optional[str] = None
    ) -> List[Task]:
        """Get all recurring tasks for a user.

        Args:
            session: Database session
            user_id: User ID
            pattern: Optional filter by pattern (daily, weekly, monthly, yearly)

        Returns:
            List of recurring Task objects

        Raises:
            ValueError: If pattern is provided but invalid
        """
        # Validate pattern if provided
        if pattern and not RecurringService.validate_pattern(pattern):
            raise ValueError(f"Invalid pattern: {pattern}")

        # Build query
        statement = select(Task).where(
            Task.user_id == user_id,
            Task.is_recurring == True
        )

        # Apply pattern filter if provided
        if pattern:
            statement = statement.where(Task.recurrence_pattern == pattern)

        # Order by next_occurrence (nulls last)
        statement = statement.order_by(Task.next_occurrence)

        # Execute query
        result = await session.exec(statement)
        tasks = list(result.all())

        logger.info(
            f"Retrieved recurring tasks",
            extra={
                "user_id": user_id,
                "pattern": pattern,
                "count": len(tasks)
            }
        )

        return tasks

    @staticmethod
    async def get_tasks_needing_generation(
        session: AsyncSession,
        current_time: datetime
    ) -> List[Task]:
        """Get recurring tasks that need their next occurrence generated.

        This will be used by the Recurring Task Service (Part B) to generate
        next task instances when next_occurrence <= current_time.

        Args:
            session: Database session
            current_time: Current UTC datetime without timezone

        Returns:
            List of Task objects needing next occurrence generation
        """
        statement = select(Task).where(
            Task.is_recurring == True,
            Task.next_occurrence != None,
            Task.next_occurrence <= current_time
        )

        result = await session.exec(statement)
        tasks = list(result.all())

        logger.info(
            f"Found tasks needing generation",
            extra={
                "count": len(tasks),
                "current_time": current_time.isoformat()
            }
        )

        return tasks
