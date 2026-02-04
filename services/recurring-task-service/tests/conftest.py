"""
Pytest configuration and fixtures for Recurring Task Service
"""
import pytest
from src.config import Settings


@pytest.fixture
def settings():
    """Provide Settings instance for tests."""
    return Settings()


@pytest.fixture
def sample_task_event():
    """Provide sample task event for testing."""
    return {
        "event_type": "task.completed",
        "task_id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "user-123",
        "task": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "title": "Weekly Standup",
            "description": "Team standup meeting",
            "recurring_pattern": "weekly",
            "due_date": "2026-01-15T10:00:00Z",
            "created_at": "2026-01-08T10:00:00Z",
            "priority": "medium",
            "tags": ["work", "meeting"]
        },
        "timestamp": "2026-01-15T10:30:00Z"
    }
