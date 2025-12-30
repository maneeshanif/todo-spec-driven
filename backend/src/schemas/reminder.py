"""Reminder request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ReminderStatus(str, Enum):
    """Reminder status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class ReminderCreate(BaseModel):
    """Schema for creating a reminder."""
    task_id: int = Field(..., description="Task to set reminder for")
    remind_at: datetime = Field(..., description="When to send reminder (UTC)")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 123,
                "remind_at": "2026-01-15T09:00:00Z"
            }
        }


class ReminderUpdate(BaseModel):
    """Schema for updating a reminder."""
    remind_at: Optional[datetime] = Field(None, description="New reminder time")

    class Config:
        json_schema_extra = {
            "example": {
                "remind_at": "2026-01-16T10:00:00Z"
            }
        }


class ReminderPublic(BaseModel):
    """Public reminder response."""
    id: int = Field(..., description="Reminder ID")
    task_id: int = Field(..., description="Associated task ID")
    user_id: str = Field(..., description="Owner user ID")
    remind_at: datetime = Field(..., description="Scheduled reminder time (UTC)")
    status: ReminderStatus = Field(..., description="Reminder status")
    sent_at: Optional[datetime] = Field(None, description="When reminder was sent (UTC)")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "task_id": 123,
                "user_id": "user-uuid-123",
                "remind_at": "2026-01-15T09:00:00Z",
                "status": "pending",
                "sent_at": None,
                "created_at": "2026-01-10T10:00:00Z"
            }
        }


class ReminderListResponse(BaseModel):
    """Response for reminder list."""
    reminders: List[ReminderPublic] = Field(..., description="List of reminders")
    total: int = Field(..., description="Total number of reminders")

    class Config:
        json_schema_extra = {
            "example": {
                "reminders": [
                    {
                        "id": 1,
                        "task_id": 123,
                        "user_id": "user-uuid-123",
                        "remind_at": "2026-01-15T09:00:00Z",
                        "status": "pending",
                        "sent_at": None,
                        "created_at": "2026-01-10T10:00:00Z"
                    }
                ],
                "total": 1
            }
        }


class ReminderResponse(BaseModel):
    """Single reminder response wrapper."""
    reminder: ReminderPublic = Field(..., description="Reminder data")

    class Config:
        json_schema_extra = {
            "example": {
                "reminder": {
                    "id": 1,
                    "task_id": 123,
                    "user_id": "user-uuid-123",
                    "remind_at": "2026-01-15T09:00:00Z",
                    "status": "pending",
                    "sent_at": None,
                    "created_at": "2026-01-10T10:00:00Z"
                }
            }
        }
