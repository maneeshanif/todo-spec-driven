"""Event schemas for Phase 5 Dapr Pub/Sub integration.

This module defines CloudEvents-compatible schemas for event-driven communication
across microservices via Kafka and Dapr Pub/Sub.

Event Topics:
- task-events: Task lifecycle events (CREATED, UPDATED, COMPLETED, DELETED)
- reminder-events: Reminder scheduling and due notifications
- task-updates: Real-time synchronization events for WebSocket service

CloudEvents Specification:
All events follow CloudEvents v1.0 specification for interoperability.
See: https://cloudevents.io/
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any
from enum import Enum
import uuid


# ============================================================================
# Task Events (topic: task-events)
# ============================================================================

class TaskEventType(str, Enum):
    """Task lifecycle event types.

    Published to: task-events
    Consumed by: Audit Service, Notification Service, Search Indexer
    """
    CREATED = "task.created"
    UPDATED = "task.updated"
    COMPLETED = "task.completed"
    DELETED = "task.deleted"


class TaskEventData(BaseModel):
    """Task data payload within event.

    Contains the current state of the task after the event occurred.
    """
    title: str = Field(description="Task title")
    description: Optional[str] = Field(default=None, description="Task description")
    completed: bool = Field(description="Completion status")
    priority: str = Field(description="Priority: low, medium, high")
    due_date: Optional[datetime] = Field(default=None, description="Due date/time")
    tags: list[str] = Field(default_factory=list, description="Task tags/categories")
    recurring_pattern: Optional[str] = Field(
        default=None,
        description="Recurrence pattern: daily, weekly, monthly, yearly"
    )
    next_occurrence: Optional[datetime] = Field(
        default=None,
        description="Next occurrence time for recurring tasks"
    )


class TaskEvent(BaseModel):
    """CloudEvents envelope for task lifecycle events.

    Topic: task-events
    Dapr Component: pubsub-kafka

    Example Usage:
        # Publishing via Dapr Pub/Sub
        event = TaskEvent(
            event_type=TaskEventType.CREATED,
            task_id=123,
            user_id="user-456",
            task_data=TaskEventData(
                title="Buy groceries",
                completed=False,
                priority="high",
                tags=["shopping", "personal"]
            )
        )

        # Publish to Dapr
        requests.post(
            f"http://localhost:3500/v1.0/publish/pubsub-kafka/task-events",
            json=event.model_dump(mode='json')
        )
    """
    event_type: TaskEventType = Field(description="Type of task event")
    task_id: int = Field(description="Task database ID")
    user_id: str = Field(description="User who owns the task")
    task_data: TaskEventData = Field(description="Task state snapshot")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Event occurrence time (UTC)"
    )
    correlation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique ID for tracing event flow"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "task.created",
                "task_id": 123,
                "user_id": "user-456",
                "task_data": {
                    "title": "Buy groceries",
                    "description": "Milk, bread, eggs",
                    "completed": False,
                    "priority": "high",
                    "due_date": "2026-01-15T14:00:00Z",
                    "tags": ["shopping", "personal"],
                    "recurring_pattern": None,
                    "next_occurrence": None
                },
                "timestamp": "2026-01-14T10:30:00Z",
                "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


# ============================================================================
# Reminder Events (topic: reminder-events)
# ============================================================================

class ReminderEventType(str, Enum):
    """Reminder lifecycle event types.

    Published to: reminder-events
    Consumed by: Notification Service
    """
    SCHEDULED = "reminder.scheduled"  # New reminder created
    DUE = "reminder.due"              # Reminder time arrived
    CANCELLED = "reminder.cancelled"  # Reminder cancelled/deleted


class ReminderEvent(BaseModel):
    """CloudEvents envelope for reminder events.

    Topic: reminder-events
    Dapr Component: pubsub-kafka

    Workflow:
    1. Backend schedules reminder → SCHEDULED event → Dapr Jobs API registers job
    2. Dapr Jobs API triggers callback at remind_at → DUE event → Notification Service
    3. User cancels reminder → CANCELLED event → Dapr Jobs API cancels job

    Example Usage:
        # Schedule reminder
        event = ReminderEvent(
            event_type=ReminderEventType.SCHEDULED,
            reminder_id=789,
            task_id=123,
            user_id="user-456",
            title="Submit report reminder",
            due_at=datetime(2026, 1, 15, 14, 0),
            remind_at=datetime(2026, 1, 15, 13, 0)  # 1 hour before
        )
    """
    event_type: ReminderEventType = Field(description="Type of reminder event")
    reminder_id: int = Field(description="Reminder database ID")
    task_id: int = Field(description="Associated task ID")
    user_id: str = Field(description="User to notify")
    title: str = Field(description="Task title for notification")
    due_at: Optional[datetime] = Field(default=None, description="Task due time")
    remind_at: datetime = Field(description="When to send reminder")
    correlation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique ID for tracing"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "reminder.due",
                "reminder_id": 789,
                "task_id": 123,
                "user_id": "user-456",
                "title": "Submit project report",
                "due_at": "2026-01-15T14:00:00Z",
                "remind_at": "2026-01-15T13:00:00Z",
                "correlation_id": "660e9500-f30c-52e5-b827-557766551111"
            }
        }


# ============================================================================
# Task Update Events (topic: task-updates) - WebSocket Real-time Sync
# ============================================================================

class TaskUpdateEventType(str, Enum):
    """Task update event types for real-time synchronization.

    Published to: task-updates
    Consumed by: WebSocket Service (for broadcasting to connected clients)
    """
    SYNC = "task.sync"           # General task state change
    REMINDER = "task.reminder"   # Reminder notification


class TaskUpdateAction(str, Enum):
    """Action that triggered the update.

    Used by WebSocket clients to determine how to update their local state.
    """
    CREATED = "created"
    UPDATED = "updated"
    COMPLETED = "completed"
    DELETED = "deleted"
    REMINDER = "reminder"


class TaskUpdateEvent(BaseModel):
    """CloudEvents envelope for real-time task synchronization.

    Topic: task-updates
    Dapr Component: pubsub-kafka

    Purpose:
    - Notify WebSocket Service of task changes
    - WebSocket Service broadcasts to all connected clients of same user
    - Clients update UI in real-time without polling

    Flow:
    1. Backend publishes TaskEvent to task-events (audit/persistence)
    2. Backend publishes TaskUpdateEvent to task-updates (real-time sync)
    3. WebSocket Service consumes task-updates
    4. WebSocket Service broadcasts to user's connected clients via WebSocket

    Example Usage:
        # Backend publishes after task creation
        update_event = TaskUpdateEvent(
            event_type=TaskUpdateEventType.SYNC,
            task_id=123,
            user_id="user-456",
            action=TaskUpdateAction.CREATED,
            changes={
                "title": "Buy groceries",
                "priority": "high",
                "tags": ["shopping"]
            },
            source_client="web-abc123"  # Originating client (skip broadcast to this)
        )

        # WebSocket Service receives and broadcasts
        # All clients except web-abc123 receive the update
    """
    event_type: TaskUpdateEventType = Field(description="Type of update event")
    task_id: int = Field(description="Task ID that changed")
    user_id: str = Field(description="User ID (for routing to correct clients)")
    action: TaskUpdateAction = Field(description="What happened to the task")
    changes: dict[str, Any] = Field(
        default_factory=dict,
        description="Changed fields (for optimistic UI updates)"
    )
    source_client: str = Field(
        default="api",
        description="Client ID that initiated change (to avoid echo)"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Update timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "task.sync",
                "task_id": 123,
                "user_id": "user-456",
                "action": "updated",
                "changes": {
                    "priority": "high",
                    "tags": ["urgent", "work"]
                },
                "source_client": "web-abc123",
                "timestamp": "2026-01-14T10:35:00Z"
            }
        }


# ============================================================================
# Event Publishing Utilities (Optional - for convenience)
# ============================================================================

class EventMetadata(BaseModel):
    """Standard metadata for all events.

    Can be used to wrap events with additional context for tracing/debugging.
    """
    service_name: str = Field(description="Service that published event")
    service_version: str = Field(default="1.0.0", description="Service version")
    environment: str = Field(default="production", description="Environment")
    trace_id: Optional[str] = Field(default=None, description="Distributed trace ID")
    span_id: Optional[str] = Field(default=None, description="Span ID")


# ============================================================================
# Type Aliases for Documentation
# ============================================================================

# All event types that can be published to Kafka via Dapr
EventUnion = TaskEvent | ReminderEvent | TaskUpdateEvent

# Topic-to-event mapping for reference
TOPIC_EVENT_MAP = {
    "task-events": TaskEvent,
    "reminder-events": ReminderEvent,
    "task-updates": TaskUpdateEvent,
}


# ============================================================================
# Usage Guidelines
# ============================================================================

"""
Publishing Events via Dapr Pub/Sub:

1. Import the schema:
   from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

2. Create event:
   event = TaskEvent(
       event_type=TaskEventType.CREATED,
       task_id=task.id,
       user_id=user_id,
       task_data=TaskEventData(
           title=task.title,
           description=task.description,
           completed=task.completed,
           priority=task.priority,
           due_date=task.due_date,
           tags=task.tags or []
       )
   )

3. Publish via Dapr HTTP API:
   import requests

   response = requests.post(
       f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/pubsub-kafka/task-events",
       json=event.model_dump(mode='json')
   )

4. Or publish via Dapr Python SDK:
   from dapr.clients import DaprClient

   with DaprClient() as client:
       client.publish_event(
           pubsub_name="pubsub-kafka",
           topic_name="task-events",
           data=event.model_dump_json(),
           data_content_type="application/json"
       )

Consuming Events:

1. Subscribe to topic via Dapr:
   @app.post('/dapr/subscribe')
   def subscribe():
       return [
           {
               'pubsubname': 'pubsub-kafka',
               'topic': 'task-events',
               'route': '/events/task'
           }
       ]

2. Handle incoming event:
   @app.post('/events/task')
   async def handle_task_event(event_data: dict):
       event = TaskEvent(**event_data['data'])

       if event.event_type == TaskEventType.CREATED:
           # Handle task creation
           pass
       elif event.event_type == TaskEventType.COMPLETED:
           # Handle task completion
           pass
"""
