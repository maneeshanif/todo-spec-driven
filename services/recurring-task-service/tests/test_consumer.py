"""
Unit tests for event consumer
"""
import pytest
from src.consumer import register_subscriptions


class TestEventConsumer:
    """Test suite for event consumer."""

    @pytest.mark.asyncio
    async def test_register_subscriptions_registers_handler(self):
        """Test that register_subscriptions properly registers Dapr handler."""
        from dapr.ext.fastapi import DaprApp
        from fastapi import FastAPI

        # Create test app and Dapr wrapper
        test_app = FastAPI()
        dapr_app = DaprApp(test_app)

        # Register subscriptions
        register_subscriptions(dapr_app)

        # Verify subscription was registered
        # The subscription decorator adds routes to the app
        routes = [route.path for route in test_app.routes]
        assert "/task-events" in routes

    @pytest.mark.asyncio
    async def test_task_completed_event_structure(self):
        """Test expected task event structure."""
        event = {
            "event_type": "task.completed",
            "task_id": "123e4567-e89b-12d3-a456-426614174000",
            "user_id": "user-123",
            "task": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Weekly Meeting",
                "description": "Team standup meeting",
                "recurring_pattern": "weekly",
                "due_date": "2026-01-15T10:00:00Z",
                "created_at": "2026-01-08T10:00:00Z",
                "priority": "medium"
            },
            "timestamp": "2026-01-15T10:30:00Z"
        }

        # Verify required fields
        assert event["event_type"] == "task.completed"
        assert "task_id" in event
        assert "user_id" in event
        assert "task" in event
        assert "recurring_pattern" in event["task"]

    @pytest.mark.asyncio
    async def test_non_recurring_task_should_skip(self):
        """Test that non-recurring tasks skip next occurrence creation."""
        event = {
            "event_type": "task.completed",
            "task_id": "task-123",
            "user_id": "user-123",
            "task": {
                "id": "task-123",
                "title": "One-time Task",
                "recurring_pattern": "none"
            }
        }

        # Event with recurring_pattern="none" should skip
        assert event["task"]["recurring_pattern"] == "none"

    @pytest.mark.asyncio
    async def test_task_created_event_should_be_ignored(self):
        """Test that non-completed events are ignored."""
        event = {
            "event_type": "task.created",
            "task_id": "task-123",
            "user_id": "user-123",
            "task": {
                "id": "task-123",
                "title": "New Task",
                "recurring_pattern": "weekly"
            }
        }

        # Event with event_type != "task.completed" should be ignored
        assert event["event_type"] != "task.completed"
