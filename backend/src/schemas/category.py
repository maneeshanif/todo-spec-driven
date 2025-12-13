"""Category schemas for API requests and responses."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#6366f1", max_length=20)


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, max_length=20)


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryWithTaskCount(CategoryResponse):
    """Category response with task count."""
    task_count: int = 0
