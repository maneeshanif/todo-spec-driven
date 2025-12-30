"""Pydantic schemas for request/response validation."""
# Note: Authentication schemas removed - using Better Auth

# Phase 5: Event schemas for Dapr Pub/Sub
from src.schemas.events import (
    # Task Events
    TaskEventType,
    TaskEventData,
    TaskEvent,
    # Reminder Events
    ReminderEventType,
    ReminderEvent,
    # Real-time Sync Events
    TaskUpdateEventType,
    TaskUpdateAction,
    TaskUpdateEvent,
    # Utilities
    EventMetadata,
    EventUnion,
    TOPIC_EVENT_MAP,
)

__all__ = [
    # Task Events
    "TaskEventType",
    "TaskEventData",
    "TaskEvent",
    # Reminder Events
    "ReminderEventType",
    "ReminderEvent",
    # Real-time Sync Events
    "TaskUpdateEventType",
    "TaskUpdateAction",
    "TaskUpdateEvent",
    # Utilities
    "EventMetadata",
    "EventUnion",
    "TOPIC_EVENT_MAP",
]
