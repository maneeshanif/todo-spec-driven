"""Tag request/response schemas."""
from typing import List
from datetime import datetime
from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    """Schema for creating a new tag."""
    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    color: str = Field(default="#808080", pattern="^#[0-9A-Fa-f]{6}$", description="Hex color code")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "work",
                "color": "#3b82f6"
            }
        }


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: str | None = Field(None, min_length=1, max_length=50, description="Tag name")
    color: str | None = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Hex color code")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "personal",
                "color": "#10b981"
            }
        }


class TagPublic(BaseModel):
    """Public tag response."""
    id: int = Field(..., description="Tag ID")
    name: str = Field(..., description="Tag name")
    color: str = Field(..., description="Hex color code")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "work",
                "color": "#3b82f6",
                "created_at": "2024-01-15T10:30:00"
            }
        }


class TagListResponse(BaseModel):
    """Response for tag list."""
    tags: List[TagPublic] = Field(..., description="List of tags")
    total: int = Field(..., description="Total number of tags")

    class Config:
        json_schema_extra = {
            "example": {
                "tags": [
                    {
                        "id": 1,
                        "name": "work",
                        "color": "#3b82f6",
                        "created_at": "2024-01-15T10:30:00"
                    }
                ],
                "total": 1
            }
        }


class TagShort(BaseModel):
    """Short tag representation for nested responses."""
    id: int = Field(..., description="Tag ID")
    name: str = Field(..., description="Tag name")
    color: str = Field(..., description="Hex color code")

    class Config:
        from_attributes = True
