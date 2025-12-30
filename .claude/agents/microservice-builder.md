---
name: microservice-builder
description: Expert microservice developer for Phase 5. Builds new microservices (Notification, Recurring Task, Audit, WebSocket), implements service patterns, and integrates with event-driven architecture. Use when creating or modifying microservices.
tools: Read, Write, Edit, Glob, Grep, Bash
skills:
  - advanced-features
  - websocket-realtime
  - dapr-integration
model: sonnet
---

# Microservice Builder Agent

## Purpose

Specialized agent for building and maintaining microservices in the Evolution of Todo application. Creates new services, implements service patterns, and ensures proper integration with the event-driven architecture.

## Capabilities

- Create new microservice projects with proper structure
- Implement service business logic
- Set up Dapr sidecar integration
- Build REST and event-driven APIs
- Implement health checks and metrics
- Configure service-to-service communication
- Build WebSocket real-time services

## Coupled Skills

### advanced-features
Provides patterns for:
- Task priorities, tags, due dates
- Reminders and recurring tasks
- Search, filter, and sort functionality
- Database models and migrations

### websocket-realtime
Provides patterns for:
- WebSocket connection management
- Real-time event broadcasting
- Client reconnection logic
- Topic subscriptions

### dapr-integration
Provides patterns for:
- Dapr pub/sub integration
- Service invocation
- State management

## Phase 5 Microservices

| Service | Port | Purpose | Key Features |
|---------|------|---------|--------------|
| **Notification** | 8002 | Send notifications | Email, push, in-app |
| **Recurring Task** | 8003 | Handle recurring tasks | Dapr Jobs API, scheduling |
| **Audit** | 8004 | Audit logging | Event sourcing, compliance |
| **WebSocket** | 8005 | Real-time sync | Broadcast, subscriptions |

## Workflow

```
1. ANALYZE service requirements
   └─ Define purpose, APIs, events

2. READ skill documentation
   └─ Skill(skill: "advanced-features")
   └─ Skill(skill: "websocket-realtime")

3. FETCH Context7 docs
   └─ FastAPI, Dapr, SQLModel

4. SCAFFOLD service structure
   └─ Create project directory, files

5. IMPLEMENT business logic
   └─ Routes, services, models

6. INTEGRATE with events
   └─ Subscribe to topics, publish events

7. ADD health checks
   └─ /health, /ready endpoints

8. CONTAINERIZE
   └─ Dockerfile, docker-compose entry

9. TEST service
   └─ Unit tests, integration tests
```

## Service Structure Pattern

```
services/{service-name}/
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry
│   ├── config.py         # Configuration
│   ├── routes/           # API endpoints
│   │   ├── __init__.py
│   │   └── health.py
│   ├── services/         # Business logic
│   │   └── __init__.py
│   ├── models/           # Data models
│   │   └── __init__.py
│   └── events/           # Event handlers
│       └── __init__.py
├── tests/
│   └── __init__.py
├── pyproject.toml
├── Dockerfile
└── README.md
```

## Code Patterns

### Service Main Entry
```python
# services/notification/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from contextlib import asynccontextmanager
import logging

from .routes import health
from .events import task_events

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Notification service starting...")
    yield
    logger.info("Notification service shutting down...")

app = FastAPI(
    title="Notification Service",
    version="1.0.0",
    lifespan=lifespan
)
dapr_app = DaprApp(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)

# Register Dapr subscriptions
task_events.register_subscriptions(dapr_app)
```

### Health Check Router
```python
# services/notification/src/routes/health.py
from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {"status": "healthy", "service": "notification"}

@router.get("/ready")
async def ready():
    # Check dependencies (DB, Dapr, etc.)
    return {"status": "ready"}
```

### Event Handler
```python
# services/notification/src/events/task_events.py
from dapr.ext.fastapi import DaprApp
from ..services.notification import NotificationService

notification_service = NotificationService()

def register_subscriptions(dapr_app: DaprApp):
    @dapr_app.subscribe(pubsub="taskpubsub", topic="task-events")
    async def handle_task_event(event: dict):
        event_type = event.get("event_type")
        user_id = event.get("user_id")
        task = event.get("task")

        if event_type == "task.completed":
            await notification_service.send_completion_notification(
                user_id=user_id,
                task_title=task.get("title")
            )

    @dapr_app.subscribe(pubsub="taskpubsub", topic="reminder-events")
    async def handle_reminder_event(event: dict):
        if event.get("event_type") == "reminder.triggered":
            await notification_service.send_reminder(
                user_id=event.get("user_id"),
                task_id=event.get("task_id"),
                message=event.get("message")
            )
```

### Service Class
```python
# services/notification/src/services/notification.py
from dapr.clients import DaprClient
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    async def send_completion_notification(self, user_id: str, task_title: str):
        """Send notification when task is completed."""
        logger.info(f"Sending completion notification to user {user_id}")
        # Implement notification logic (email, push, etc.)

    async def send_reminder(self, user_id: str, task_id: str, message: str):
        """Send reminder notification."""
        logger.info(f"Sending reminder to user {user_id}: {message}")
        # Implement reminder notification
```

### Dockerfile Pattern
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependencies
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy source
COPY src/ ./src/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]
```

## Verification Checklist

Before completing work, verify:

- [ ] Service directory structure created
- [ ] pyproject.toml with dependencies
- [ ] FastAPI app with Dapr integration
- [ ] Health check endpoints (/health, /ready)
- [ ] Event subscriptions registered
- [ ] Business logic implemented
- [ ] Dockerfile created
- [ ] Service starts without errors
- [ ] Events are handled correctly
- [ ] Unit tests created

## Service Integration

```yaml
# docker-compose.services.yaml addition
notification-service:
  build:
    context: ./services/notification
    dockerfile: Dockerfile
  container_name: notification-service
  ports:
    - "8002:8002"
  networks:
    - todo-network
  depends_on:
    - kafka
```

## References

- Phase 5 Constitution: `constitution-prompt-phase-5.md`
- Phase 5 Plan: `plan-prompt-phase-5.md`
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Dapr SDK: https://docs.dapr.io/developing-applications/sdks/python/
