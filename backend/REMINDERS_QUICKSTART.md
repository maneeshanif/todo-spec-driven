# Reminders API - Quick Start Guide

## Prerequisites

1. PostgreSQL database running (Neon or local)
2. Database migrations applied:
   ```bash
   cd backend
   alembic upgrade head
   ```

## Without Dapr (Local Development)

### Start Backend

```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

### Test Reminders API

```bash
# Get JWT token by logging in
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.access_token')

# Get user ID from token
USER_ID=$(echo $TOKEN | jwt decode - | jq -r '.sub')

# Create a task first
TASK_RESPONSE=$(curl -X POST "http://localhost:8000/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task with Reminder",
    "description": "Testing reminders",
    "priority": "high",
    "due_date": "2026-01-15T14:00:00Z"
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.task.id')

# Create reminder (1 hour before due date)
curl -X POST "http://localhost:8000/api/users/$USER_ID/reminders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK_ID,
    \"remind_at\": \"2026-01-15T13:00:00Z\"
  }" | jq

# List all reminders
curl "http://localhost:8000/api/users/$USER_ID/reminders" \
  -H "Authorization: Bearer $TOKEN" | jq

# List pending reminders only
curl "http://localhost:8000/api/users/$USER_ID/reminders?status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get specific reminder
REMINDER_ID=1
curl "http://localhost:8000/api/users/$USER_ID/reminders/$REMINDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Update reminder time
curl -X PATCH "http://localhost:8000/api/users/$USER_ID/reminders/$REMINDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remind_at": "2026-01-15T12:00:00Z"
  }' | jq

# Delete reminder
curl -X DELETE "http://localhost:8000/api/users/$USER_ID/reminders/$REMINDER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Without Dapr, reminders are stored but won't be delivered automatically.

## With Dapr (Production-like)

### Prerequisites

1. Install Dapr CLI:
   ```bash
   wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
   ```

2. Initialize Dapr:
   ```bash
   dapr init
   ```

3. Install Kafka (or use Docker):
   ```bash
   docker run -d --name kafka \
     -p 9092:9092 \
     -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
     confluentinc/cp-kafka:latest
   ```

### Create Dapr Components

```bash
mkdir -p backend/dapr/components
```

**`backend/dapr/components/pubsub-kafka.yaml`:**
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

**`backend/dapr/components/statestore.yaml`:**
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

### Start Backend with Dapr

```bash
cd backend

dapr run \
  --app-id todo-backend \
  --app-port 8000 \
  --dapr-http-port 3500 \
  --components-path ./dapr/components \
  -- uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Verify Dapr is Running

```bash
# Check Dapr health
curl http://localhost:3500/v1.0/healthz

# List components
dapr components list

# Check app health via Dapr
curl http://localhost:3500/v1.0/invoke/todo-backend/method/api/health
```

### Test Reminders with Dapr

```bash
# Same as above, but now Dapr jobs will be scheduled!

# Create reminder
curl -X POST "http://localhost:8000/api/users/$USER_ID/reminders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK_ID,
    \"remind_at\": \"2026-01-15T13:00:00Z\"
  }" | jq

# Check if job was scheduled in Dapr
curl http://localhost:3500/v1.0-alpha1/jobs | jq

# Get specific job
curl http://localhost:3500/v1.0-alpha1/jobs/reminder-1 | jq
```

### Manually Trigger Reminder Callback (For Testing)

```bash
# Simulate Dapr calling the callback when job is due
curl -X POST http://localhost:8000/api/dapr/jobs/reminder \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"reminder_id\": 1,
      \"task_id\": $TASK_ID,
      \"user_id\": \"$USER_ID\"
    }
  }" | jq
```

### View Dapr Logs

```bash
# View Dapr sidecar logs
dapr logs --app-id todo-backend

# View app logs
tail -f ~/.dapr/logs/todo-backend.log
```

## Check Reminder Status

```bash
# List reminders by status
curl "http://localhost:8000/api/users/$USER_ID/reminders?status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq

curl "http://localhost:8000/api/users/$USER_ID/reminders?status=sent" \
  -H "Authorization: Bearer $TOKEN" | jq

curl "http://localhost:8000/api/users/$USER_ID/reminders?status=failed" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Query Database Directly

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# View reminders
SELECT id, task_id, remind_at, status, sent_at, dapr_job_name, created_at
FROM reminders
ORDER BY created_at DESC;

# View reminders with task info
SELECT
  r.id,
  r.remind_at,
  r.status,
  t.title as task_title,
  t.due_date as task_due_date
FROM reminders r
JOIN tasks t ON r.task_id = t.id
WHERE r.user_id = 'your-user-id';
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/{user_id}/reminders` | List reminders (filter by task_id, status) |
| POST | `/api/users/{user_id}/reminders` | Create reminder |
| GET | `/api/users/{user_id}/reminders/{id}` | Get reminder |
| PATCH | `/api/users/{user_id}/reminders/{id}` | Update reminder time |
| DELETE | `/api/users/{user_id}/reminders/{id}` | Delete reminder |
| POST | `/api/dapr/jobs/reminder` | Dapr callback (no auth) |
| GET | `/api/dapr/health` | Dapr health check |

## Common Issues

### Issue: "Dapr sidecar not available"

**Solution**: Start backend with Dapr:
```bash
dapr run --app-id todo-backend --app-port 8000 -- uvicorn src.main:app
```

### Issue: "Task not found"

**Solution**: Create task first, then use its ID for reminder:
```bash
# Create task
TASK_ID=$(curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "priority": "high"}' \
  | jq -r '.task.id')

# Create reminder
curl -X POST http://localhost:8000/api/users/$USER_ID/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"task_id\": $TASK_ID, \"remind_at\": \"2026-01-15T10:00:00Z\"}"
```

### Issue: "Reminder time must be in the future"

**Solution**: Use a future timestamp:
```bash
# Get tomorrow's date
TOMORROW=$(date -d tomorrow -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:8000/api/users/$USER_ID/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"task_id\": $TASK_ID, \"remind_at\": \"$TOMORROW\"}"
```

## Next Steps

1. ✅ **Reminders Backend** - Implemented (Part A)
2. ⏳ **Notification Service** - Create microservice to consume reminder events (Part B)
3. ⏳ **WebSocket Service** - Broadcast notifications to connected clients
4. ⏳ **Frontend Integration** - Display reminders in UI

## Documentation

- Full API docs: `backend/docs/REMINDERS_API.md`
- Implementation details: `backend/REMINDERS_IMPLEMENTATION.md`
- OpenAPI (Swagger): http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
