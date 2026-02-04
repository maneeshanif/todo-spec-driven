# Microservices & Event-Driven Testing Guide (Local Development)

**Date**: February 3, 2026  
**Status**: Phase 5 - Event-Driven Architecture

---

## Current Status

### ✅ What's Implemented (Backend Only)

The backend already has event-driven capabilities built in:

1. **Reminder Service** (in backend)
   - Create/update/delete reminders
   - Schedule jobs via Dapr (if available)
   - Publishes reminder events to Kafka
   - Location: `backend/src/services/reminder_service.py`

2. **Audit Service** (in backend)
   - Logs all user actions
   - Tracks task CRUD operations
   - Location: `backend/src/services/audit_service.py`

3. **Dapr Integration** (in backend)
   - Dapr HTTP client for pub/sub
   - Job scheduling API
   - Graceful degradation when Dapr unavailable
   - Location: `backend/src/services/dapr_client.py`

### 🚧 What's NOT Deployed Yet

The standalone microservices exist as code but are NOT deployed:

- `services/notification-service/` - Listens for reminder events, sends notifications
- `services/recurring-task-service/` - Auto-creates task occurrences
- `services/audit-service/` - Standalone audit log consumer
- `services/websocket-service/` - Real-time updates via WebSocket

**Reason**: Requires Kafka + Dapr running in Kubernetes, which consumes too much memory.

---

## Testing Without Kubernetes/Kafka

Since Minikube + monitoring pods consume too much resources, here's how to test locally:

### Option 1: Test Backend Reminders (No Dapr Required)

The backend gracefully degrades when Dapr is unavailable.

#### Step 1: Start Backend Only

```bash
cd /home/maneeshanif/Desktop/code\ /python-prjs/claude-cli/todo-web-hackthon/backend

# Activate your Python environment
source venv/bin/activate  # or your virtualenv

# Run backend
uvicorn src.main:app --reload --port 8000
```

#### Step 2: Test Reminder Endpoints

```bash
# 1. Get JWT token (login first via frontend at localhost:3000)
# Copy the bearer_token from browser localStorage

export TOKEN="your-jwt-token-here"

# 2. Create a reminder
curl -X POST http://localhost:8000/api/users/YOUR_USER_ID/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 1,
    "remind_at": "2026-02-03T16:00:00Z",
    "message": "Finish your task!"
  }'

# 3. List reminders
curl http://localhost:8000/api/users/YOUR_USER_ID/reminders \
  -H "Authorization: Bearer $TOKEN"

# 4. Get single reminder
curl http://localhost:8000/api/users/YOUR_USER_ID/reminders/1 \
  -H "Authorization: Bearer $TOKEN"

# 5. Update reminder
curl -X PATCH http://localhost:8000/api/users/YOUR_USER_ID/reminders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remind_at": "2026-02-03T17:00:00Z"
  }'

# 6. Delete reminder
curl -X DELETE http://localhost:8000/api/users/YOUR_USER_ID/reminders/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Behavior Without Dapr**:
- ✅ Reminders are saved to database
- ⚠️ Dapr job scheduling fails gracefully (logged as warning)
- ✅ Reminder records still created and retrievable
- ❌ No actual notification sent (requires notification-service)

#### Step 3: Check Backend Logs

Look for these log messages:

```
[ReminderService] Dapr unavailable, skipping job scheduling
[DaprClient] Dapr sidecar not available at http://localhost:3500
```

This is **expected** and **correct** - the backend works without Dapr.

---

### Option 2: Test with Docker Compose (Lightweight)

Run only backend + frontend + postgres (no Kafka/Dapr):

```bash
cd /home/maneeshanif/Desktop/code\ /python-prjs/claude-cli/todo-web-hackthon

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Test via frontend at http://localhost:3000
```

**What Works**:
- ✅ Login/Signup
- ✅ Create/read/update/delete tasks
- ✅ Create reminders (saved to DB)
- ✅ Audit logs (saved to DB)
- ❌ No real-time notifications
- ❌ No recurring tasks
- ❌ No WebSocket updates

---

### Option 3: Full Event-Driven Testing (Heavy - Not Recommended Now)

**Requirements**:
- Minikube running
- Kafka deployed
- Dapr installed
- All microservices deployed

**Memory Cost**: ~4-6 GB RAM

**Only do this if you have ≥16GB RAM available.**

---

## Testing Date/Time Issues

You mentioned date/time is not accurate. Let's test this:

### Issue 1: Timezone Problems

Backend uses UTC by default. Check your task `due_date` and `reminder_at` fields:

```bash
# Create task with due date
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Due Date",
    "due_date": "2026-02-04T10:00:00Z",
    "priority": "high"
  }'

# Response should show same timezone
```

**Expected**: Date should be stored as UTC in database.

**Frontend Display**: Should convert to user's local timezone.

### Issue 2: Reminder Scheduling

```bash
# Create reminder 1 hour in future
FUTURE_TIME=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:8000/api/users/YOUR_USER_ID/reminders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": 1,
    \"remind_at\": \"$FUTURE_TIME\",
    \"message\": \"Time to work!\"
  }"
```

**Without Dapr**: Reminder saved, but won't trigger at scheduled time.

**With Dapr**: Job scheduled, callback fires at `remind_at` time.

---

## How Microservices Work (Architecture)

```
┌─────────────┐
│  Frontend   │
│ (Next.js)   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────┐
│       Backend (FastAPI)             │
│  ┌────────────┐  ┌───────────────┐ │
│  │ Task API   │  │ Reminder API  │ │
│  └──────┬─────┘  └───────┬───────┘ │
│         │                 │         │
│         │ Publishes Events│         │
│         ▼                 ▼         │
│    ┌─────────────────────────┐     │
│    │   Dapr Pub/Sub (Kafka)  │     │
│    └──────────┬──────────────┘     │
└───────────────┼────────────────────┘
                │
        ┌───────┴────────┬──────────────┬──────────────┐
        ▼                ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│Notification  │ │ Recurring    │ │  Audit   │ │WebSocket │
│Service       │ │ Task Service │ │ Service  │ │Service   │
│(Port 8002)   │ │ (Port 8003)  │ │(Port 8004)││(Port 8005)│
└──────────────┘ └──────────────┘ └──────────┘ └──────────┘
     │                  │               │            │
     │ Sends Email      │ Creates       │ Logs to    │ Pushes to
     │ /SMS/Push        │ Occurrences   │ Database   │ Clients
     ▼                  ▼               ▼            ▼
```

### Event Flow Example: Create Task with Reminder

1. **User creates task** → Frontend POST `/api/tasks`
2. **Backend saves task** → Database
3. **Backend publishes event** → `task-events` topic
   ```json
   {
     "event_type": "created",
     "task_id": 123,
     "user_id": "user-uuid",
     "timestamp": "2026-02-03T12:00:00Z"
   }
   ```

4. **User creates reminder** → POST `/api/users/{id}/reminders`
5. **Backend schedules Dapr job** → Dapr Jobs API
6. **At reminder time**:
   - Dapr calls → `POST /dapr/jobs/reminder`
   - Backend publishes → `reminder-events` topic
   - Notification service consumes → Sends email/push notification

7. **Audit service** (always listening):
   - Consumes `task-events`
   - Logs to audit table
   - Tracks who did what, when

---

## Quick Health Checks

### Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "healthy",
  "dapr_available": false
}
```

### Check Dapr Health (if running)

```bash
curl http://localhost:3500/v1.0/healthz
```

Expected: `200 OK`

### Check Database

```bash
# From backend directory
python -c "
from sqlmodel import create_engine, Session
from src.core.config import settings
engine = create_engine(str(settings.DATABASE_URL))
with Session(engine) as session:
    print('Database connected!')
"
```

---

## Recommended Testing Order (For Now)

Since Kubernetes is too heavy:

1. **✅ Test Backend Reminders** (Option 1 above)
   - Verify CRUD operations work
   - Check database records created
   - Confirm graceful Dapr degradation

2. **✅ Test Frontend Integration**
   - Login via localhost:3000
   - Create tasks with due dates
   - Verify dates display correctly in UI

3. **✅ Test Audit Logging**
   ```sql
   -- Check audit_logs table
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

4. **⏸️ Skip Kafka/Dapr Testing** (until you have more resources)

5. **📅 Later: Deploy to Cloud**
   - Use managed Kafka (Confluent Cloud, AWS MSK)
   - Use cloud resources instead of local minikube
   - Much lighter on local machine

---

## Date/Time Fix

If dates are showing incorrectly, check:

### Backend: Ensure UTC Storage

```python
# backend/src/models/task.py
class Task(SQLModel, table=True):
    due_date: Optional[datetime] = Field(default=None)  # Should be UTC
    
    # Always save as UTC
    if due_date:
        due_date = due_date.replace(tzinfo=timezone.utc)
```

### Frontend: Display in Local Time

```typescript
// frontend/components/tasks/TaskCard.tsx
import { formatDistanceToNow, format } from 'date-fns';

// Convert UTC to local
const localDate = new Date(task.due_date);
const displayDate = format(localDate, 'MMM d, yyyy h:mm a');
```

### Fix Timezone Issues

Update backend to always use timezone-aware datetimes:

```python
from datetime import datetime, timezone

# Always use timezone-aware
now = datetime.now(timezone.utc)

# When parsing from frontend
from_frontend = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
```

---

## Next Steps

1. **Fix Date/Time Issues First**
   - Test task creation with due dates
   - Verify correct display in frontend
   - Check database stores UTC

2. **Test Reminders Without Dapr**
   - Use Option 1 above
   - Verify CRUD operations
   - Check database records

3. **When Ready for Full Event-Driven**:
   - Deploy to cloud (DigitalOcean, AWS, etc.)
   - Use managed Kafka
   - Deploy microservices to cloud K8s
   - Much lighter on your laptop!

---

## Quick Commands Reference

```bash
# Start backend only (no Dapr)
cd backend && uvicorn src.main:app --reload

# Start frontend only
cd frontend && npm run dev

# Start with Docker Compose (no Kafka)
docker-compose up -d

# Stop everything
docker-compose down

# Check backend logs
docker-compose logs -f backend

# Check database
docker-compose exec postgres psql -U postgres -d todo_db -c "SELECT * FROM reminders;"
```

---

## Summary

**For Now (Low Memory)**:
- ✅ Test backend reminders locally (no Dapr)
- ✅ Fix date/time issues first
- ✅ Use Docker Compose for basic testing
- ❌ Skip Kafka/Dapr/microservices

**Later (When Ready)**:
- Deploy to cloud for full event-driven testing
- Kafka + Dapr + all microservices
- Real-time notifications
- WebSocket updates

The backend is designed to work **both** with and without Dapr, so you can test core functionality now!
