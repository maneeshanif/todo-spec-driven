"""Demonstration of Phase 5 Event Schemas for Dapr Pub/Sub.

This example shows how to create and use event schemas for:
1. Task lifecycle events (task-events topic)
2. Reminder events (reminder-events topic)
3. Real-time sync events (task-updates topic)

Run with: uv run python examples/event_schemas_demo.py
"""

import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.schemas.events import (
    TaskEvent,
    TaskEventType,
    TaskEventData,
    ReminderEvent,
    ReminderEventType,
    TaskUpdateEvent,
    TaskUpdateEventType,
    TaskUpdateAction,
)


def demo_task_events():
    """Demonstrate task lifecycle events."""
    print("=" * 60)
    print("TASK LIFECYCLE EVENTS (topic: task-events)")
    print("=" * 60)

    # 1. Task Created Event
    created_event = TaskEvent(
        event_type=TaskEventType.CREATED,
        task_id=123,
        user_id="user-456",
        task_data=TaskEventData(
            title="Buy groceries",
            description="Milk, bread, eggs",
            completed=False,
            priority="high",
            due_date=datetime.utcnow() + timedelta(hours=24),
            tags=["shopping", "personal"],
        )
    )

    print("\n1. TASK CREATED EVENT:")
    print(json.dumps(created_event.model_dump(mode='json'), indent=2, default=str))

    # 2. Task Updated Event
    updated_event = TaskEvent(
        event_type=TaskEventType.UPDATED,
        task_id=123,
        user_id="user-456",
        task_data=TaskEventData(
            title="Buy groceries",
            description="Milk, bread, eggs, cheese",  # Updated description
            completed=False,
            priority="urgent",  # Changed priority
            tags=["shopping", "personal", "urgent"],  # Added tag
        )
    )

    print("\n2. TASK UPDATED EVENT:")
    print(json.dumps(updated_event.model_dump(mode='json'), indent=2, default=str))

    # 3. Task Completed Event
    completed_event = TaskEvent(
        event_type=TaskEventType.COMPLETED,
        task_id=123,
        user_id="user-456",
        task_data=TaskEventData(
            title="Buy groceries",
            description="Milk, bread, eggs, cheese",
            completed=True,  # Marked complete
            priority="high",
            tags=["shopping", "personal"],
        )
    )

    print("\n3. TASK COMPLETED EVENT:")
    print(json.dumps(completed_event.model_dump(mode='json'), indent=2, default=str))

    # 4. Recurring Task Event
    recurring_event = TaskEvent(
        event_type=TaskEventType.CREATED,
        task_id=789,
        user_id="user-456",
        task_data=TaskEventData(
            title="Weekly team standup",
            description="Monday morning standup meeting",
            completed=False,
            priority="medium",
            recurring_pattern="weekly",
            next_occurrence=datetime.utcnow() + timedelta(days=7),
            tags=["work", "meeting"],
        )
    )

    print("\n4. RECURRING TASK EVENT:")
    print(json.dumps(recurring_event.model_dump(mode='json'), indent=2, default=str))


def demo_reminder_events():
    """Demonstrate reminder events."""
    print("\n\n" + "=" * 60)
    print("REMINDER EVENTS (topic: reminder-events)")
    print("=" * 60)

    # 1. Reminder Scheduled
    scheduled_event = ReminderEvent(
        event_type=ReminderEventType.SCHEDULED,
        reminder_id=999,
        task_id=123,
        user_id="user-456",
        title="Submit project report",
        due_at=datetime.utcnow() + timedelta(hours=24),
        remind_at=datetime.utcnow() + timedelta(hours=23),  # 1 hour before
    )

    print("\n1. REMINDER SCHEDULED:")
    print(json.dumps(scheduled_event.model_dump(mode='json'), indent=2, default=str))

    # 2. Reminder Due
    due_event = ReminderEvent(
        event_type=ReminderEventType.DUE,
        reminder_id=999,
        task_id=123,
        user_id="user-456",
        title="Submit project report",
        due_at=datetime.utcnow() + timedelta(hours=1),
        remind_at=datetime.utcnow(),  # Now!
    )

    print("\n2. REMINDER DUE:")
    print(json.dumps(due_event.model_dump(mode='json'), indent=2, default=str))

    # 3. Reminder Cancelled
    cancelled_event = ReminderEvent(
        event_type=ReminderEventType.CANCELLED,
        reminder_id=999,
        task_id=123,
        user_id="user-456",
        title="Submit project report",
        remind_at=datetime.utcnow() + timedelta(hours=23),
    )

    print("\n3. REMINDER CANCELLED:")
    print(json.dumps(cancelled_event.model_dump(mode='json'), indent=2, default=str))


def demo_realtime_sync_events():
    """Demonstrate real-time synchronization events."""
    print("\n\n" + "=" * 60)
    print("REAL-TIME SYNC EVENTS (topic: task-updates)")
    print("=" * 60)

    # 1. Task Created - Sync to WebSocket clients
    sync_created = TaskUpdateEvent(
        event_type=TaskUpdateEventType.SYNC,
        task_id=123,
        user_id="user-456",
        action=TaskUpdateAction.CREATED,
        changes={
            "title": "Buy groceries",
            "priority": "high",
            "tags": ["shopping", "personal"],
        },
        source_client="web-abc123",
    )

    print("\n1. SYNC - TASK CREATED:")
    print(json.dumps(sync_created.model_dump(mode='json'), indent=2, default=str))

    # 2. Task Updated - Sync priority change
    sync_updated = TaskUpdateEvent(
        event_type=TaskUpdateEventType.SYNC,
        task_id=123,
        user_id="user-456",
        action=TaskUpdateAction.UPDATED,
        changes={
            "priority": "urgent",
            "tags": ["shopping", "personal", "urgent"],
        },
        source_client="mobile-xyz789",
    )

    print("\n2. SYNC - TASK UPDATED:")
    print(json.dumps(sync_updated.model_dump(mode='json'), indent=2, default=str))

    # 3. Reminder Notification
    reminder_notification = TaskUpdateEvent(
        event_type=TaskUpdateEventType.REMINDER,
        task_id=123,
        user_id="user-456",
        action=TaskUpdateAction.REMINDER,
        changes={
            "title": "Submit project report",
            "message": "Due in 1 hour!",
        },
        source_client="notification-service",
    )

    print("\n3. REMINDER NOTIFICATION:")
    print(json.dumps(reminder_notification.model_dump(mode='json'), indent=2, default=str))


def demo_dapr_publishing():
    """Show example Dapr Pub/Sub publishing code."""
    print("\n\n" + "=" * 60)
    print("DAPR PUB/SUB PUBLISHING EXAMPLE")
    print("=" * 60)

    example_code = """
# Publishing to Dapr via HTTP API
import requests
from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

event = TaskEvent(
    event_type=TaskEventType.CREATED,
    task_id=123,
    user_id="user-456",
    task_data=TaskEventData(
        title="Buy groceries",
        completed=False,
        priority="high",
        tags=["shopping"]
    )
)

# Publish to task-events topic via Dapr sidecar
response = requests.post(
    "http://localhost:3500/v1.0/publish/pubsub-kafka/task-events",
    json=event.model_dump(mode='json')
)

print(f"Event published: {response.status_code}")


# Or using Dapr Python SDK
from dapr.clients import DaprClient

with DaprClient() as client:
    client.publish_event(
        pubsub_name="pubsub-kafka",
        topic_name="task-events",
        data=event.model_dump_json(),
        data_content_type="application/json"
    )
    """

    print(example_code)


def demo_dapr_subscription():
    """Show example Dapr subscription code."""
    print("\n" + "=" * 60)
    print("DAPR PUB/SUB SUBSCRIPTION EXAMPLE")
    print("=" * 60)

    example_code = """
# Subscribing to Dapr Pub/Sub
from fastapi import FastAPI
from src.schemas.events import TaskEvent, TaskEventType

app = FastAPI()

# Register subscription endpoint
@app.post('/dapr/subscribe')
def subscribe():
    return [
        {
            'pubsubname': 'pubsub-kafka',
            'topic': 'task-events',
            'route': '/events/task'
        }
    ]

# Handle incoming task events
@app.post('/events/task')
async def handle_task_event(event_data: dict):
    # Dapr wraps event in CloudEvents envelope
    event = TaskEvent(**event_data['data'])

    if event.event_type == TaskEventType.CREATED:
        print(f"New task created: {event.task_data.title}")
        # Index task for search
        # Send notification
        # Update analytics

    elif event.event_type == TaskEventType.COMPLETED:
        print(f"Task completed: {event.task_data.title}")
        # Trigger recurring task creation if applicable
        # Update user stats

    return {"success": True}
    """

    print(example_code)


if __name__ == "__main__":
    demo_task_events()
    demo_reminder_events()
    demo_realtime_sync_events()
    demo_dapr_publishing()
    demo_dapr_subscription()

    print("\n" + "=" * 60)
    print("EVENT SCHEMA DEMO COMPLETE")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Configure Dapr components (components/pubsub-kafka.yaml)")
    print("2. Deploy Kafka/Redpanda (Strimzi for Minikube, Redpanda Cloud for production)")
    print("3. Implement event publishers in task routes")
    print("4. Create consumer services (Notification, Audit, WebSocket)")
    print("5. Test event flow with Dapr sidecar")
