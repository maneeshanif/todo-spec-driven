"""Task request/response schemas."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator
from src.schemas.category import CategoryResponse


class TagShort(BaseModel):
    """Short tag representation for task responses."""
    id: int = Field(..., description="Tag ID")
    name: str = Field(..., description="Tag name")
    color: str = Field(..., description="Hex color code")

    class Config:
        from_attributes = True


class TaskPublic(BaseModel):
    """Public task information schema."""
    id: int = Field(..., description="Task ID")
    user_id: str = Field(..., description="User ID who owns the task")
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    completed: bool = Field(..., description="Completion status")
    priority: str = Field(default="medium", description="Task priority (low, medium, high)")
    due_date: Optional[datetime] = Field(None, description="Due date")
    is_recurring: bool = Field(default=False, description="Is recurring task")
    recurrence_pattern: Optional[str] = Field(None, description="Recurrence pattern")
    next_occurrence: Optional[datetime] = Field(None, description="Next occurrence date for recurring tasks")
    tags: List[TagShort] = Field(default=[], description="Associated tags")
    reminder_at: Optional[datetime] = Field(None, description="Scheduled reminder time")
    has_reminder: bool = Field(default=False, description="Whether task has pending reminder")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
                "completed": False,
                "priority": "high",
                "due_date": "2024-01-20T18:00:00",
                "is_recurring": False,
                "reminder_at": "2024-01-20T16:00:00",
                "has_reminder": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }


class TaskListResponse(BaseModel):
    """Response schema for task list."""
    tasks: list[TaskPublic] = Field(..., description="List of tasks")
    total: int = Field(..., description="Total number of tasks")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")

    class Config:
        json_schema_extra = {
            "example": {
                "tasks": [
                    {
                        "id": 1,
                        "user_id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Buy groceries",
                        "description": "Milk, eggs, bread",
                        "completed": False,
                        "created_at": "2024-01-15T10:30:00",
                        "updated_at": "2024-01-15T10:30:00"
                    }
                ],
                "total": 1,
                "page": 1,
                "page_size": 50
            }
        }


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    priority: str = Field(default="medium", description="Task priority (low, medium, high)")
    due_date: Optional[datetime] = Field(None, description="Due date")
    category_ids: List[int] = Field(default=[], description="Category IDs to associate")
    tag_ids: List[int] = Field(default=[], description="Tag IDs to associate")
    is_recurring: bool = Field(default=False, description="Is recurring task")
    recurrence_pattern: Optional[str] = Field(None, description="Recurrence pattern (daily, weekly, monthly, yearly)")
    recurrence_data: Optional[dict] = Field(None, description="Additional recurrence configuration (e.g., {'every': 2})")

    @field_validator('recurrence_pattern')
    @classmethod
    def validate_recurrence_pattern(cls, v):
        """Validate that recurrence_pattern is one of the valid values."""
        if v is not None:
            valid_patterns = ['daily', 'weekly', 'monthly', 'yearly']
            if v not in valid_patterns:
                raise ValueError(f'recurrence_pattern must be one of: {", ".join(valid_patterns)}')
        return v

    @model_validator(mode='after')
    def validate_recurring_requires_pattern(self):
        """Validate that is_recurring=True requires recurrence_pattern."""
        if self.is_recurring and not self.recurrence_pattern:
            raise ValueError('recurrence_pattern is required when is_recurring is True')
        return self


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    completed: Optional[bool] = Field(None, description="Completion status")
    priority: Optional[str] = Field(None, description="Task priority (low, medium, high)")
    due_date: Optional[datetime] = Field(None, description="Due date")
    category_ids: Optional[List[int]] = Field(None, description="Category IDs to associate")
    tag_ids: Optional[List[int]] = Field(None, description="Tag IDs to associate")
    is_recurring: Optional[bool] = Field(None, description="Is recurring task")
    recurrence_pattern: Optional[str] = Field(None, description="Recurrence pattern")
    recurrence_data: Optional[dict] = Field(None, description="Additional recurrence configuration")

    @field_validator('recurrence_pattern')
    @classmethod
    def validate_recurrence_pattern(cls, v):
        """Validate that recurrence_pattern is one of the valid values."""
        if v is not None:
            valid_patterns = ['daily', 'weekly', 'monthly', 'yearly']
            if v not in valid_patterns:
                raise ValueError(f'recurrence_pattern must be one of: {", ".join(valid_patterns)}')
        return v
