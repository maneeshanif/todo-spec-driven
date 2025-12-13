"""Statistics schemas for API responses."""
from pydantic import BaseModel, Field


class PriorityStats(BaseModel):
    """Statistics by priority level."""
    high: int = Field(0, description="Number of high priority tasks")
    medium: int = Field(0, description="Number of medium priority tasks")
    low: int = Field(0, description="Number of low priority tasks")


class UserStatsResponse(BaseModel):
    """User statistics response schema."""
    total_tasks: int = Field(..., description="Total number of tasks")
    completed_tasks: int = Field(..., description="Number of completed tasks")
    pending_tasks: int = Field(..., description="Number of pending tasks")
    completion_rate: float = Field(..., description="Completion rate percentage")
    overdue_tasks: int = Field(..., description="Number of overdue tasks")
    due_today: int = Field(..., description="Number of tasks due today")
    due_this_week: int = Field(..., description="Number of tasks due this week")
    total_categories: int = Field(..., description="Total number of categories")
    tasks_by_priority: PriorityStats = Field(..., description="Task counts by priority")

    class Config:
        json_schema_extra = {
            "example": {
                "total_tasks": 50,
                "completed_tasks": 30,
                "pending_tasks": 20,
                "completion_rate": 60.0,
                "overdue_tasks": 5,
                "due_today": 3,
                "due_this_week": 8,
                "total_categories": 5,
                "tasks_by_priority": {
                    "high": 5,
                    "medium": 10,
                    "low": 5
                }
            }
        }
