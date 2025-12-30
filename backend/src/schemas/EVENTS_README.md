# Phase 5 Event Schemas for Dapr Pub/Sub

**Status**: Ready for Implementation
**Created**: December 30, 2025
**Version**: 1.0.0

---

## Overview

This document describes the event schemas for Phase 5's event-driven architecture using Dapr Pub/Sub with Kafka.

**Architecture Pattern**: CloudEvents v1.0 specification for maximum interoperability.

---

## Event Topics

| Topic Name | Purpose | Publishers | Subscribers |
|------------|---------|------------|-------------|
| `task-events` | Task lifecycle events | Backend API | Audit Service, Notification Service, Search Indexer |
| `reminder-events` | Reminder scheduling/notifications | Backend API, Dapr Jobs API | Notification Service |
| `task-updates` | Real-time synchronization | Backend API | WebSocket Service |

---

## Event Schemas

### 1. Task Events (`task-events`)

#### TaskEvent Schema

```python
from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

event = TaskEvent(
    event_type=TaskEventType.CREATED,
    task_id=123,
    user_id="user-456",
    task_data=TaskEventData(
        title="Buy groceries",
        description="Milk, bread, eggs",
        completed=False,
        priority="high",
        due_date=datetime.utcnow(),
        tags=["shopping", "personal"]
    )
)
```

#### Event Types

- `task.created` - New task created
- `task.updated` - Task modified
- `task.completed` - Task marked complete
- `task.deleted` - Task deleted

#### Example JSON

```json
{
  "event_type": "task.created",
  "task_id": 123,
  "user_id": "user-456",
  "task_data": {
    "title": "Buy groceries",
    "description": "Milk, bread, eggs",
    "completed": false,
    "priority": "high",
    "due_date": "2026-01-15T14:00:00Z",
    "tags": ["shopping", "personal"],
    "recurring_pattern": null,
    "next_occurrence": null
  },
  "timestamp": "2026-01-14T10:30:00Z",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 2. Reminder Events (`reminder-events`)

#### ReminderEvent Schema

```python
from src.schemas.events import ReminderEvent, ReminderEventType

event = ReminderEvent(
    event_type=ReminderEventType.SCHEDULED,
    reminder_id=789,
    task_id=123,
    user_id="user-456",
    title="Submit report reminder",
    due_at=datetime(2026, 1, 15, 14, 0),
    remind_at=datetime(2026, 1, 15, 13, 0)  # 1 hour before
)
```

#### Event Types

- `reminder.scheduled` - New reminder created (triggers Dapr Jobs API registration)
- `reminder.due` - Reminder time arrived (from Dapr Jobs API callback)
- `reminder.cancelled` - Reminder cancelled/deleted

#### Example JSON

```json
{
  "event_type": "reminder.due",
  "reminder_id": 789,
  "task_id": 123,
  "user_id": "user-456",
  "title": "Submit project report",
  "due_at": "2026-01-15T14:00:00Z",
  "remind_at": "2026-01-15T13:00:00Z",
  "correlation_id": "660e9500-f30c-52e5-b827-557766551111"
}
```

---

### 3. Task Update Events (`task-updates`)

#### TaskUpdateEvent Schema

```python
from src.schemas.events import TaskUpdateEvent, TaskUpdateEventType, TaskUpdateAction

event = TaskUpdateEvent(
    event_type=TaskUpdateEventType.SYNC,
    task_id=123,
    user_id="user-456",
    action=TaskUpdateAction.UPDATED,
    changes={
        "priority": "urgent",
        "tags": ["shopping", "urgent"]
    },
    source_client="web-abc123"
)
```

#### Event Types

- `task.sync` - Task state change for synchronization
- `task.reminder` - Reminder notification

#### Actions

- `created` - Task created
- `updated` - Task updated
- `completed` - Task completed
- `deleted` - Task deleted
- `reminder` - Reminder notification

#### Example JSON

```json
{
  "event_type": "task.sync",
  "task_id": 123,
  "user_id": "user-456",
  "action": "updated",
  "changes": {
    "priority": "urgent",
    "tags": ["shopping", "urgent"]
  },
  "source_client": "web-abc123",
  "timestamp": "2026-01-14T10:35:00Z"
}
```

---

## Publishing Events

### Via Dapr HTTP API

```python
import requests
from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

# Create event
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

# Publish to Dapr sidecar
response = requests.post(
    "http://localhost:3500/v1.0/publish/pubsub-kafka/task-events",
    json=event.model_dump(mode='json')
)

if response.status_code == 204:
    print("Event published successfully")
```

### Via Dapr Python SDK

```python
from dapr.clients import DaprClient
from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

event = TaskEvent(
    event_type=TaskEventType.CREATED,
    task_id=123,
    user_id="user-456",
    task_data=TaskEventData(title="Buy groceries", completed=False, priority="high")
)

with DaprClient() as client:
    client.publish_event(
        pubsub_name="pubsub-kafka",
        topic_name="task-events",
        data=event.model_dump_json(),
        data_content_type="application/json"
    )
```

---

## Subscribing to Events

### FastAPI Subscription

```python
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

# Handle incoming events
@app.post('/events/task')
async def handle_task_event(event_data: dict):
    # Dapr wraps event in CloudEvents envelope
    event = TaskEvent(**event_data['data'])

    if event.event_type == TaskEventType.CREATED:
        # Handle task creation
        print(f"New task: {event.task_data.title}")
        # Index for search, send notification, etc.

    elif event.event_type == TaskEventType.COMPLETED:
        # Handle task completion
        if event.task_data.recurring_pattern:
            # Trigger recurring task creation
            pass

    return {"success": True}
```

---

## Event Flow Diagrams

### Task Creation Flow

```
┌─────────────┐
│ User creates│
│    task     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Backend API      │
│ 1. Save to DB    │
│ 2. Publish events│
└────┬─────────┬───┘
     │         │
     │         │ task-events: TaskEvent(CREATED)
     │         ▼
     │    ┌────────────────┐
     │    │ Audit Service  │
     │    │ - Store event  │
     │    └────────────────┘
     │
     │ task-updates: TaskUpdateEvent(SYNC)
     ▼
┌────────────────────┐
│ WebSocket Service  │
│ - Broadcast to     │
│   connected clients│
└────────────────────┘
```

### Reminder Flow

```
┌─────────────────┐
│ User sets       │
│ reminder        │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ Backend API                │
│ 1. Save reminder           │
│ 2. Publish SCHEDULED event │
└────────┬───────────────────┘
         │
         │ reminder-events: ReminderEvent(SCHEDULED)
         ▼
┌────────────────────────────┐
│ Dapr Jobs API              │
│ - Schedule job for         │
│   remind_at time           │
└────────┬───────────────────┘
         │
         │ (Time arrives)
         ▼
┌────────────────────────────┐
│ Dapr Jobs API Callback     │
│ - Publish DUE event        │
└────────┬───────────────────┘
         │
         │ reminder-events: ReminderEvent(DUE)
         ▼
┌────────────────────────────┐
│ Notification Service       │
│ - Send in-app notification │
│ - (Optional) Email/Push    │
└────────────────────────────┘
```

---

## Event Ordering & Idempotency

### Ordering Guarantees

- **Within partition**: Kafka guarantees order
- **Across partitions**: No ordering guarantee
- **Partitioning key**: Use `user_id` for user-specific order

### Idempotency

All event handlers should be idempotent:

```python
@app.post('/events/task')
async def handle_task_event(event_data: dict):
    event = TaskEvent(**event_data['data'])

    # Check if already processed (use correlation_id)
    if await is_event_processed(event.correlation_id):
        return {"success": True, "status": "already_processed"}

    # Process event
    await process_event(event)

    # Mark as processed
    await mark_event_processed(event.correlation_id)

    return {"success": True}
```

---

## Error Handling

### Dead Letter Queue

Configure Dapr Pub/Sub with DLQ for failed events:

```yaml
# components/pubsub-kafka.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub-kafka
spec:
  type: pubsub.kafka
  metadata:
    - name: brokers
      value: "localhost:9092"
    - name: consumerGroup
      value: "task-events-group"
    - name: deadLetterTopic
      value: "task-events-dlq"
```

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def process_event(event: TaskEvent):
    """Process event with automatic retries."""
    # Processing logic
    pass
```

---

## Testing

### Unit Test Example

```python
import pytest
from src.schemas.events import TaskEvent, TaskEventType, TaskEventData

def test_task_event_creation():
    event = TaskEvent(
        event_type=TaskEventType.CREATED,
        task_id=123,
        user_id="user-456",
        task_data=TaskEventData(
            title="Test task",
            completed=False,
            priority="high"
        )
    )

    assert event.event_type == TaskEventType.CREATED
    assert event.task_id == 123
    assert event.task_data.title == "Test task"
    assert event.correlation_id is not None

def test_event_serialization():
    event = TaskEvent(
        event_type=TaskEventType.UPDATED,
        task_id=456,
        user_id="user-789",
        task_data=TaskEventData(title="Updated", completed=True, priority="low")
    )

    # Serialize to JSON
    json_data = event.model_dump(mode='json')

    assert json_data['event_type'] == 'task.updated'
    assert json_data['task_id'] == 456
    assert json_data['task_data']['completed'] is True
```

---

## Demo

Run the event schemas demo:

```bash
cd backend
uv run python examples/event_schemas_demo.py
```

This will show:
- Task lifecycle events
- Reminder events
- Real-time sync events
- Publishing examples
- Subscription examples

---

## Next Steps

1. **Dapr Components**: Create `components/pubsub-kafka.yaml`
2. **Kafka Deployment**: Deploy Strimzi Kafka (local) or Redpanda Cloud (production)
3. **Event Publishers**: Add event publishing to task routes
4. **Consumer Services**: Create Notification, Audit, WebSocket services
5. **Integration Tests**: Test full event flow with Dapr sidecar

---

## References

- [CloudEvents Specification](https://cloudevents.io/)
- [Dapr Pub/Sub Building Block](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Kafka Component](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-apache-kafka/)
- [Phase 5 Constitution](../../../constitution-prompt-phase-5.md)
- [Phase 5 Specification](../../../spec-prompt-phase-5.md)
