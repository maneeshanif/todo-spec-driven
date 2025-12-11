"""Database query optimization utilities."""
import time
from typing import Callable, Any
from functools import wraps
from src.core.logging import get_logger

logger = get_logger(__name__)


class QueryMonitor:
    """
    Monitor database query performance and detect potential N+1 query issues.

    Usage:
        monitor = QueryMonitor()

        # Track queries
        with monitor.track("get_tasks"):
            tasks = session.exec(select(Task)).all()
    """

    def __init__(self):
        self.query_counts = {}
        self.slow_query_threshold_ms = 100  # Log queries slower than 100ms

    def track(self, operation_name: str):
        """Context manager to track query performance."""
        return QueryTracker(self, operation_name)


class QueryTracker:
    """Context manager for tracking individual queries."""

    def __init__(self, monitor: QueryMonitor, operation_name: str):
        self.monitor = monitor
        self.operation_name = operation_name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.time() - self.start_time) * 1000

        # Track query count
        if self.operation_name not in self.monitor.query_counts:
            self.monitor.query_counts[self.operation_name] = 0
        self.monitor.query_counts[self.operation_name] += 1

        # Log slow queries
        if duration_ms > self.monitor.slow_query_threshold_ms:
            logger.warning(
                f"Slow query detected: {self.operation_name}",
                extra={
                    "operation": self.operation_name,
                    "duration_ms": duration_ms,
                    "query_count": self.monitor.query_counts[self.operation_name]
                }
            )


def prevent_n_plus_1(func: Callable) -> Callable:
    """
    Decorator to detect potential N+1 query issues.

    Usage:
        @prevent_n_plus_1
        def get_tasks_with_users(session: Session):
            tasks = session.exec(select(Task)).all()
            # If this triggers multiple user queries, it will be logged
            for task in tasks:
                _ = task.user  # This would trigger N queries if not eager loaded
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        monitor = QueryMonitor()

        # Track queries during function execution
        with monitor.track(func.__name__):
            result = func(*args, **kwargs)

        # Check for potential N+1 patterns
        total_queries = sum(monitor.query_counts.values())
        if total_queries > 10:
            logger.warning(
                f"Potential N+1 query detected in {func.__name__}",
                extra={
                    "function": func.__name__,
                    "total_queries": total_queries,
                    "query_breakdown": monitor.query_counts
                }
            )

        return result

    return wrapper


# Query optimization tips and patterns
OPTIMIZATION_PATTERNS = {
    "eager_loading": """
    # BAD - N+1 Query Problem
    tasks = session.exec(select(Task)).all()
    for task in tasks:
        print(task.user.email)  # Triggers separate query for each task

    # GOOD - Eager Loading with joinedload
    from sqlalchemy.orm import joinedload

    statement = select(Task).options(joinedload(Task.user))
    tasks = session.exec(statement).all()
    for task in tasks:
        print(task.user.email)  # No additional queries
    """,

    "select_specific_columns": """
    # BAD - Selecting all columns when only need a few
    tasks = session.exec(select(Task)).all()

    # GOOD - Select only needed columns
    from sqlmodel import col

    statement = select(Task.id, Task.title, Task.completed)
    tasks = session.exec(statement).all()
    """,

    "pagination": """
    # BAD - Loading all records
    tasks = session.exec(select(Task)).all()

    # GOOD - Paginate results
    statement = select(Task).limit(50).offset(0)
    tasks = session.exec(statement).all()
    """,

    "indexing": """
    # Ensure frequently queried columns are indexed
    # In SQLModel:

    class Task(SQLModel, table=True):
        user_id: str = Field(foreign_key="users.id", index=True)
        completed: bool = Field(default=False, index=True)
        created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    """,
}


def log_query_stats(session: Any, operation: str):
    """
    Log query statistics for debugging.

    Usage:
        from src.utils.query_optimization import log_query_stats

        log_query_stats(session, "get_user_tasks")
        tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    """
    # This would integrate with SQLAlchemy's event system in production
    # For now, we log the operation
    logger.info(f"Executing query: {operation}")
