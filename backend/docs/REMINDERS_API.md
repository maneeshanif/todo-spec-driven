# Reminders API Documentation

## Overview

The Reminders API provides endpoints for scheduling task notifications using Dapr Jobs API. Reminders are scheduled for specific times and delivered via the Notification Service through Kafka pub/sub.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Reminder Flow                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User creates reminder via API                                  │
│     POST /api/users/{user_id}/reminders                             │
│                                                                     │
│  2. ReminderService stores reminder in PostgreSQL                  │
│     - Status: PENDING                                              │
│     - remind_at: scheduled time                                     │
│                                                                     │
│  3. DaprClient schedules job via Dapr Jobs API                     │
│     POST http://localhost:3500/v1.0-alpha1/jobs/reminder-{id}      │
│     - dueTime: remind_at (ISO 8601)                                │
│     - repeats: 0 (one-time)                                        │
│                                                                     │
│  4. Dapr triggers callback at scheduled time                        │
│     POST /api/dapr/jobs/reminder                                    │
│                                                                     │
│  5. Callback publishes ReminderEvent to Kafka                      │
│     Topic: reminders                                                │
│     Consumer: Notification Service                                  │
│                                                                     │
│  6. Reminder marked as SENT                                         │
│     - sent_at: current timestamp                                    │
│     - status: SENT                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### List Reminders

**GET** `/api/users/{user_id}/reminders`

Get all reminders for the authenticated user with optional filters.

**Query Parameters:**
- `task_id` (integer, optional): Filter by task ID
- `status` (string, optional): Filter by status (`pending`, `sent`, `failed`)

**Response:**
```json
{
  "reminders": [
    {
      "id": 1,
      "task_id": 123,
      "user_id": "user-uuid-123",
      "remind_at": "2026-01-15T09:00:00Z",
      "status": "pending",
      "sent_at": null,
      "created_at": "2026-01-10T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Create Reminder

**POST** `/api/users/{user_id}/reminders`

Create a new reminder for a task.

**Request Body:**
```json
{
  "task_id": 123,
  "remind_at": "2026-01-15T09:00:00Z"
}
```

**Validation:**
- Task must exist and belong to the authenticated user
- `remind_at` must be in the future (UTC)
- Automatically schedules Dapr job if available

**Response:**
```json
{
  "reminder": {
    "id": 1,
    "task_id": 123,
    "user_id": "user-uuid-123",
    "remind_at": "2026-01-15T09:00:00Z",
    "status": "pending",
    "sent_at": null,
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

### Get Reminder

**GET** `/api/users/{user_id}/reminders/{reminder_id}`

Get a single reminder by ID.

**Response:**
```json
{
  "reminder": {
    "id": 1,
    "task_id": 123,
    "user_id": "user-uuid-123",
    "remind_at": "2026-01-15T09:00:00Z",
    "status": "pending",
    "sent_at": null,
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

### Update Reminder

**PATCH** `/api/users/{user_id}/reminders/{reminder_id}`

Update reminder time. Only pending reminders can be updated.

**Request Body:**
```json
{
  "remind_at": "2026-01-16T10:00:00Z"
}
```

**Behavior:**
- Cancels existing Dapr job
- Schedules new Dapr job with updated time
- Only works for reminders with `status: pending`

**Response:**
```json
{
  "reminder": {
    "id": 1,
    "task_id": 123,
    "user_id": "user-uuid-123",
    "remind_at": "2026-01-16T10:00:00Z",
    "status": "pending",
    "sent_at": null,
    "created_at": "2026-01-10T10:00:00Z"
  }
}
```

### Delete Reminder

**DELETE** `/api/users/{user_id}/reminders/{reminder_id}`

Cancel and delete a reminder.

**Behavior:**
- Cancels Dapr job if it exists
- Removes reminder from database

**Response:** `204 No Content`

## Dapr Integration

### Job Scheduling

Reminders are scheduled using the Dapr Jobs API:

```http
POST http://localhost:3500/v1.0-alpha1/jobs/reminder-{id}
Content-Type: application/json

{
  "data": {
    "reminder_id": 123,
    "task_id": 456,
    "user_id": "user-uuid-123"
  },
  "dueTime": "2026-01-15T09:00:00Z",
  "repeats": 0,
  "ttl": "1h"
}
```

**Job Naming:** `reminder-{reminder_id}` (e.g., `reminder-123`)

### Callback Endpoint

**POST** `/api/dapr/jobs/reminder`

Dapr calls this endpoint when a reminder job is due.

**Request Payload:**
```json
{
  "data": {
    "reminder_id": 123,
    "task_id": 456,
    "user_id": "user-uuid-123"
  }
}
```

**Callback Actions:**
1. Get reminder from database
2. Publish `ReminderEvent` to Kafka topic `reminders`
3. Mark reminder as `SENT` with `sent_at` timestamp
4. Return success/failure status to Dapr

### Pub/Sub Integration

Reminder events are published to Kafka via Dapr:

```http
POST http://localhost:3500/v1.0/publish/kafka-pubsub/reminders
Content-Type: application/json

{
  "event_type": "reminder.due",
  "reminder_id": 123,
  "task_id": 456,
  "user_id": "user-uuid-123",
  "title": "Task title",
  "due_at": "2026-01-15T14:00:00Z",
  "remind_at": "2026-01-15T09:00:00Z",
  "correlation_id": "uuid-here"
}
```

**Topic:** `reminders`
**Consumer:** Notification Service (delivers in-app notifications via WebSocket)

## Graceful Degradation

The Reminders API works with or without Dapr:

### With Dapr (Production)
- ✅ Reminders stored in database
- ✅ Dapr jobs scheduled for automatic delivery
- ✅ Events published to Kafka
- ✅ Notification Service delivers notifications

### Without Dapr (Local Dev)
- ✅ Reminders stored in database
- ⚠️ Dapr jobs NOT scheduled (logged as warning)
- ⚠️ Reminders created but won't be delivered
- ℹ️ Manual polling or cron job needed for delivery

**Check Dapr Availability:**
```bash
curl http://localhost:3500/v1.0/healthz
```

## Environment Variables

```env
# Dapr Configuration
DAPR_HTTP_PORT=3500
DAPR_HOST=localhost
DAPR_PUBSUB_NAME=kafka-pubsub
```

## Running with Dapr

### Start Backend with Dapr Sidecar

```bash
dapr run \
  --app-id todo-backend \
  --app-port 8000 \
  --dapr-http-port 3500 \
  --components-path ./dapr/components \
  -- uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Dapr Components Required

**`dapr/components/pubsub-kafka.yaml`:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "localhost:9092"
  - name: consumerGroup
    value: "todo-backend"
```

**`dapr/components/statestore.yaml`:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
  - name: redisHost
    value: "localhost:6379"
```

## Security

### Authentication
- All reminder endpoints require JWT authentication
- User can only access their own reminders
- Task ownership verified before creating reminder

### Validation
- `remind_at` must be in the future
- Task must exist and belong to user
- Only pending reminders can be updated

### Dapr Callbacks
- Callback endpoint `/api/dapr/jobs/reminder` is **public** (no auth)
- Dapr sidecar is trusted (runs on localhost)
- In Kubernetes, use NetworkPolicies to restrict access

## Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "type": "https://api.todo.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Reminder time must be in the future"
}
```

**404 Not Found:**
```json
{
  "type": "https://api.todo.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task 123 not found or access denied"
}
```

**403 Forbidden:**
```json
{
  "type": "https://api.todo.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access denied to this resource"
}
```

## Testing

### Manual Testing

```bash
# Create a reminder
curl -X POST http://localhost:8000/api/users/user-123/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 1,
    "remind_at": "2026-01-15T09:00:00Z"
  }'

# List reminders
curl http://localhost:8000/api/users/user-123/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update reminder
curl -X PATCH http://localhost:8000/api/users/user-123/reminders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remind_at": "2026-01-16T10:00:00Z"
  }'

# Delete reminder
curl -X DELETE http://localhost:8000/api/users/user-123/reminders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Dapr Job Status

```bash
# List scheduled jobs (if Dapr dashboard is running)
curl http://localhost:3500/v1.0-alpha1/jobs

# Check specific job
curl http://localhost:3500/v1.0-alpha1/jobs/reminder-1
```

## Database Schema

```sql
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    dapr_job_name VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    INDEX idx_reminders_user_id (user_id),
    INDEX idx_reminders_task_id (task_id),
    INDEX idx_reminders_remind_at (remind_at),
    INDEX idx_reminders_status (status)
);
```

## See Also

- [Dapr Jobs API Documentation](https://docs.dapr.io/reference/api/jobs_api/)
- [Dapr Pub/Sub Documentation](https://docs.dapr.io/reference/api/pubsub_api/)
- [Phase 5 Events Schema](../src/schemas/events.py)
- [Phase 5 Specification](../../spec-prompt-phase-5.md)
