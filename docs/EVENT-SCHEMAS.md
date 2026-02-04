# Event Schemas

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T174

## Task Events

### TaskEvent Schema

```python
class TaskEvent(BaseModel):
    event_type: TaskEventType  # created, updated, deleted, completed
    task_id: int
    user_id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: Optional[Priority]
    due_date: Optional[datetime]
    tags: List[str]
    timestamp: datetime
```

### Example

```json
{
  "event_type": "created",
  "task_id": 123,
  "user_id": "user-456",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-01-15T10:00:00Z",
  "tags": ["personal", "shopping"],
  "timestamp": "2026-01-01T12:00:00Z"
}
```

## Reminder Events

### ReminderEvent Schema

```python
class ReminderEvent(BaseModel):
    event_type: ReminderEventType  # scheduled, due, cancelled
    reminder_id: int
    task_id: int
    user_id: str
    title: str
    remind_at: datetime
    due_at: Optional[datetime]
    timestamp: datetime
```

## Task Update Events

For WebSocket real-time sync:

```python
class TaskUpdateEvent(BaseModel):
    event_type: str  # task.created, task.updated, task.deleted
    task_id: int
    user_id: str
    data: dict
    timestamp: datetime
```

## CloudEvents Format

All events follow CloudEvents v1.0 specification when published via Dapr:

```json
{
  "specversion": "1.0",
  "type": "com.evolutiontodo.task.created",
  "source": "backend-service",
  "id": "uuid-123",
  "time": "2026-01-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": { ... }
}
```

