# Gentleman Guardian Angel Coding Standards

**Project**: Evolution of Todo - Full-Stack Application
**Phase**: Phase 5 - Advanced Cloud Deployment
**Last Updated**: 2025-12-31

---

## Overview

This document defines the coding standards and review criteria for AI agents reviewing code in this project. It is based on the project constitution and applies to all code changes.

---

## General Principles

### Spec-Driven Development
- **Rule**: Code must implement approved specifications only
- **Verification**: Check if code matches documented specs in `/specs/`
- **Violation**: Code without corresponding spec must be flagged

### Test-First Development
- **Rule**: Tests must exist for all new features
- **Coverage**: Minimum 80% backend, 70% frontend
- **Verification**: Run tests and verify they pass

### Security First
- **Rule**: Never expose secrets, validate all inputs, enforce user isolation
- **Verification**: Check for hardcoded credentials, missing auth, SQL injection risks

---

## Backend Standards (Python / FastAPI)

### Code Style

```python
# Use type hints consistently
from typing import Optional
from datetime import datetime

def get_task(task_id: int, user_id: str) -> Optional[Task]:
    """Retrieve a task by ID with user ownership check."""
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
```

### Required Patterns

| Pattern | Implementation | Review Check |
|---------|---------------|--------------|
| **Dependency Injection** | FastAPI Depends() | Verify all services injected via Depends |
| **Pydantic Validation** | All API inputs validated | Check schemas for validation rules |
| **User Isolation** | user_id in all queries | Verify no cross-user data access |
| **Error Handling** | HTTPException with status codes | Check proper error responses |
| **Async Operations** | async/await for I/O | Verify database calls are async |

### Forbidden Patterns

```python
# FORBIDDEN: Hardcoded secrets
API_KEY = "sk-12345"  # ❌

# FORBIDDEN: SQL strings
db.execute(f"SELECT * FROM tasks WHERE id = {task_id}")  # ❌

# FORBIDDEN: Missing user isolation
def get_task(task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()  # ❌

# FORBIDDEN: Raw logging of sensitive data
logger.info(f"Password: {password}")  # ❌
```

### Required Practices

1. **Use SQLModel ORM** - Never raw SQL
2. **Alembic Migrations** - All schema changes via migrations
3. **Structured Logging** - JSON format with request IDs
4. **JWT Validation** - All protected routes require auth
5. **Rate Limiting** - Apply to auth and chat endpoints

### API Response Format

```python
# Correct API response
{
    "success": true,
    "data": { ... },
    "error": null
}

# Error response
{
    "success": false,
    "data": null,
    "error": {
        "code": "TASK_NOT_FOUND",
        "message": "Task not found"
    }
}
```

---

## Frontend Standards (TypeScript / Next.js)

### Code Style

```typescript
// Use functional components with hooks
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/task-store';

export function TaskList({ userId }: { userId: string }) {
    const { tasks, fetchTasks } = useTaskStore();

    useEffect(() => {
        fetchTasks(userId);
    }, [userId]);

    return (
        <div className="space-y-2">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    );
}
```

### Required Patterns

| Pattern | Implementation | Review Check |
|---------|---------------|--------------|
| **TypeScript Strict** | All files .tsx/.ts, no `any` | Verify strict types |
| **Zustand State** | Use Zustand for global state | No React Context for state |
| **Axios for API** | Use api/ modules | No fetch() for API calls |
| **Shadcn/ui Components** | Use pre-built components | No custom primitives |
| **Loading States** | Show loading for async ops | Check for loading indicators |

### Forbidden Patterns

```typescript
// FORBIDDEN: Use fetch() for API
fetch('/api/tasks')  // ❌ - Use axios from api/tasks instead

// FORBIDDEN: React Context for state management
const TaskContext = createContext();  // ❌ - Use Zustand

// FORBIDDEN: Type any
const data: any = response.data;  // ❌ - Use proper types

// FORBIDDEN: Direct style objects
<div style={{ color: 'red' }}>  // ❌ - Use Tailwind classes
```

### Required Practices

1. **Tailwind CSS** - All styling via utility classes
2. **Responsive Design** - Mobile-first approach
3. **Dark Mode** - All components support dark theme
4. **Error Boundaries** - Wrap routes with error handling
5. **Optimistic UI** - Update UI before API response where appropriate

---

## Dapr & Event-Driven Standards (Phase 5)

### Dapr Integration

```python
# Correct: Use Dapr Pub/Sub via sidecar
import httpx

async def publish_task_event(event: TaskEvent):
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:3500/v1.0/publish/pubsub.kafka/task-events",
            json=event
        )
```

### Required Patterns

| Pattern | Review Check |
|---------|--------------|
| **No Direct Kafka** | Use Dapr Pub/Sub, not kafka-python |
| **Event Immutable** | Never modify published events |
| **Correlation IDs** | All events have tracing ID |
| **Async Consumption** | No blocking event handlers |

### Event Schema Validation

```json
// Correct event structure
{
    "event_type": "created | updated | completed | deleted",
    "task_id": 123,
    "user_id": "user-uuid",
    "timestamp": "2026-01-10T14:30:00Z",
    "correlation_id": "uuid-for-tracing"
}
```

---

## Kubernetes & Deployment Standards

### Helm Chart Standards

```yaml
# Required: All values configurable
replicaCount: 1
image:
  repository: evolution-todo/backend
  tag: "latest"
  pullPolicy: IfNotPresent

# Required: Resource limits
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
```

### Required Patterns

| Pattern | Review Check |
|---------|--------------|
| **GitOps** | All K8s changes via Git/Helm |
| **Health Checks** | Liveness and readiness probes |
| **Resource Limits** | CPU and memory limits defined |
| **Secrets Management** | No secrets in manifests |
| **Labels/Annotations** | Proper metadata for tracking |

---

## Security Checklist

### Must Review Every Change

- [ ] No hardcoded secrets or API keys
- [ ] User data isolation enforced (user_id filtering)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (ORM usage)
- [ ] XSS prevention (React auto-escapes, verify)
- [ ] Authentication required on protected routes
- [ ] Authorization checks for data access
- [ ] CORS properly configured
- [ ] Rate limiting on auth/chat endpoints
- [ ] Sensitive data never logged

---

## Phase 5 Specific Requirements

### Event-Driven Architecture
- All task CRUD publishes to `task-events` topic
- Reminders use `reminders` topic
- Real-time sync uses `task-updates` topic
- Events are immutable facts

### Dapr Building Blocks
- Pub/Sub: Use for all Kafka communication
- State: Use for conversation state
- Service Invocation: Inter-service calls
- Secrets: API keys via Dapr secrets store
- Jobs API: Scheduled reminders

### Microservices
- **Notification Service** (8002): Consumes reminders
- **Recurring Task Service** (8003): Auto-create occurrences
- **Audit Service** (8004): Log all operations
- **WebSocket Service** (8005): Real-time sync

---

## Common Anti-Patterns to Flag

### Backend
```python
# Anti-pattern: Direct SQL
cursor.execute("SELECT * FROM tasks")  # ❌

# Anti-pattern: Missing user check
def get_task(task_id):  # ❌ No user_id

# Anti-pattern: Synchronous I/O in async context
def process():  # ❌ Should be async
    time.sleep(1)
```

### Frontend
```typescript
// Anti-pattern: fetch() for API
fetch('/api/tasks')  // ❌ Use axios

// Anti-pattern: Any type
const data: any = ...  // ❌ Use proper types

// Anti-pattern: React Context for state
const StoreContext = createContext()  // ❌ Use Zustand
```

---

## Review Output Format

When reviewing code, structure feedback as:

```markdown
## Summary
[Brief overview of review findings]

## Critical Issues
[Must fix before merge]

## Security Concerns
[Any security issues found]

## Code Quality Issues
[Style, maintainability, performance]

## Suggestions
[Optional improvements]

## Compliance Check
- [ ] Spec-driven implementation
- [ ] Test coverage adequate
- [ ] Security requirements met
- [ ] Phase 5 requirements met (if applicable)
```

---

## References

- [Phase 5 Constitution](./constitution-prompt-phase-5.md)
- [Phase 4 Constitution](./constitution-prompt-phase-4.md)
- [Phase 3 Constitution](./constitution-prompt-phase-3.md)
- [CLAUDE.md](./CLAUDE.md)
