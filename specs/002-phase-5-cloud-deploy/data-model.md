# Data Model: Phase 5 - Advanced Cloud Deployment

**Branch**: `002-phase-5-cloud-deploy` | **Date**: 2025-12-30
**Source**: Feature specification entities + research findings

---

## Entity Overview

Phase 5 introduces new entities and extends existing ones:

| Entity | Type | Purpose |
|--------|------|---------|
| Task | UPDATED | Add priority, due_date, recurring fields |
| Tag | NEW | Category/label for task organization |
| TaskTag | NEW (Junction) | Many-to-many relationship |
| Reminder | NEW | Scheduled reminder for task |
| TaskEvent | NEW (Event) | Kafka event schema |
| ReminderEvent | NEW (Event) | Kafka event schema |
| TaskUpdateEvent | NEW (Event) | Real-time sync event schema |
| AuditLog | NEW | Audit trail storage |

---

## Database Entities

### Task Entity (UPDATED)

**Table Name**: `tasks`

**Existing Fields (Phase 2)**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Task identifier |
| user_id | VARCHAR(36) | NOT NULL, INDEX | Owner (FK to users.id) |
| title | VARCHAR(200) | NOT NULL | Task title |
| description | VARCHAR(1000) | NULLABLE | Task description |
| completed | BOOLEAN | DEFAULT FALSE | Completion status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW(), ON UPDATE | Last update timestamp |

**New Fields (Phase 5)**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | Task priority level |
| due_date | TIMESTAMP | NULLABLE | When task is due |
| reminder_at | TIMESTAMP | NULLABLE | When to send reminder |
| recurring_pattern | VARCHAR(20) | NULLABLE | Recurrence: daily/weekly/monthly |
| next_occurrence | TIMESTAMP | NULLABLE | Next recurring date (computed) |

**Indexes**:
- `idx_tasks_user_id` (user_id)
- `idx_tasks_user_completed` (user_id, completed)
- `idx_tasks_user_priority` (user_id, priority)
- `idx_tasks_user_due_date` (user_id, due_date)

**SQLModel Definition**:
```python
from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign keys
    user_id: str = Field(index=True, max_length=36)

    # Core fields (Phase 2)
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)

    # Phase 5 fields
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)
    reminder_at: Optional[datetime] = Field(default=None)
    recurring_pattern: Optional[str] = Field(default=None, max_length=20)
    next_occurrence: Optional[datetime] = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tags: list["Tag"] = Relationship(
        back_populates="tasks",
        link_model="TaskTag"
    )
    reminders: list["Reminder"] = Relationship(back_populates="task")
```

---

### Tag Entity (NEW)

**Table Name**: `tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Tag identifier |
| user_id | VARCHAR(36) | NOT NULL, INDEX | Owner (FK to users.id) |
| name | VARCHAR(50) | NOT NULL | Tag name |
| color | VARCHAR(7) | DEFAULT '#808080' | Hex color code |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_tags_user_id` (user_id)
- `idx_tags_user_name` UNIQUE (user_id, name)

**Constraints**:
- Maximum 100 tags per user
- Tag names unique per user

**SQLModel Definition**:
```python
class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign keys
    user_id: str = Field(index=True, max_length=36)

    # Fields
    name: str = Field(max_length=50)
    color: str = Field(default="#808080", max_length=7)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: list["Task"] = Relationship(
        back_populates="tags",
        link_model="TaskTag"
    )

    class Config:
        # Unique constraint on (user_id, name)
        pass
```

---

### TaskTag Entity (NEW - Junction Table)

**Table Name**: `task_tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| task_id | INTEGER | PRIMARY KEY, FK tasks.id | Task reference |
| tag_id | INTEGER | PRIMARY KEY, FK tags.id | Tag reference |

**Indexes**:
- Primary key on (task_id, tag_id)
- `idx_task_tags_tag_id` (tag_id)

**SQLModel Definition**:
```python
class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"

    task_id: int = Field(
        foreign_key="tasks.id",
        primary_key=True,
        ondelete="CASCADE"
    )
    tag_id: int = Field(
        foreign_key="tags.id",
        primary_key=True,
        ondelete="CASCADE"
    )
```

---

### Reminder Entity (NEW)

**Table Name**: `reminders`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Reminder identifier |
| task_id | INTEGER | NOT NULL, FK tasks.id | Task reference |
| user_id | VARCHAR(36) | NOT NULL, INDEX | Owner (denormalized for query) |
| remind_at | TIMESTAMP | NOT NULL | When to send reminder |
| status | ENUM('pending','sent','failed') | DEFAULT 'pending' | Reminder status |
| sent_at | TIMESTAMP | NULLABLE | When notification was sent |
| dapr_job_name | VARCHAR(100) | NULLABLE | Dapr Jobs API reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_reminders_task_id` (task_id)
- `idx_reminders_user_id` (user_id)
- `idx_reminders_status` (status)
- `idx_reminders_remind_at` (remind_at) WHERE status = 'pending'

**SQLModel Definition**:
```python
class ReminderStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Reminder(SQLModel, table=True):
    __tablename__ = "reminders"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign keys
    task_id: int = Field(foreign_key="tasks.id")
    user_id: str = Field(index=True, max_length=36)

    # Fields
    remind_at: datetime
    status: ReminderStatus = Field(default=ReminderStatus.PENDING)
    sent_at: Optional[datetime] = Field(default=None)
    dapr_job_name: Optional[str] = Field(default=None, max_length=100)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    task: "Task" = Relationship(back_populates="reminders")
```

---

### AuditLog Entity (NEW)

**Table Name**: `audit_logs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO INCREMENT | Log entry identifier |
| user_id | VARCHAR(36) | NOT NULL, INDEX | User who performed action |
| entity_type | VARCHAR(50) | NOT NULL | Entity type (task, tag, etc.) |
| entity_id | INTEGER | NOT NULL | Entity identifier |
| action | VARCHAR(20) | NOT NULL | Action: created, updated, deleted, completed |
| old_values | JSONB | NULLABLE | Previous state |
| new_values | JSONB | NULLABLE | New state |
| correlation_id | VARCHAR(36) | INDEX | Request tracing ID |
| timestamp | TIMESTAMP | DEFAULT NOW() | When action occurred |

**Indexes**:
- `idx_audit_logs_user_id` (user_id)
- `idx_audit_logs_entity` (entity_type, entity_id)
- `idx_audit_logs_timestamp` (timestamp)
- `idx_audit_logs_correlation` (correlation_id)

**SQLModel Definition**:
```python
from typing import Any


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Fields
    user_id: str = Field(index=True, max_length=36)
    entity_type: str = Field(max_length=50)
    entity_id: int
    action: str = Field(max_length=20)
    old_values: Optional[dict[str, Any]] = Field(default=None, sa_type=JSONB)
    new_values: Optional[dict[str, Any]] = Field(default=None, sa_type=JSONB)
    correlation_id: Optional[str] = Field(default=None, max_length=36, index=True)

    # Timestamps
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

---

## Event Schemas (Kafka)

### TaskEvent Schema

**Topic**: `task-events`

**CloudEvents Envelope**:
```json
{
  "specversion": "1.0",
  "type": "com.evolution-todo.task.<event_type>",
  "source": "/backend",
  "id": "<uuid>",
  "time": "2026-01-10T14:30:00Z",
  "datacontenttype": "application/json",
  "data": { ... }
}
```

**Event Types**: `created`, `updated`, `completed`, `deleted`

**Data Schema**:
```json
{
  "event_type": "created | updated | completed | deleted",
  "task_id": 123,
  "user_id": "user-uuid-here",
  "task_data": {
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "high | medium | low",
    "due_date": "2026-01-15T10:00:00Z",
    "tags": ["work", "urgent"],
    "recurring_pattern": "weekly",
    "next_occurrence": "2026-01-22T10:00:00Z"
  },
  "timestamp": "2026-01-10T14:30:00Z",
  "correlation_id": "uuid-for-tracing"
}
```

**Pydantic Schema**:
```python
class TaskEventType(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    COMPLETED = "completed"
    DELETED = "deleted"


class TaskEventData(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool
    priority: Priority
    due_date: Optional[datetime] = None
    tags: list[str] = []
    recurring_pattern: Optional[str] = None
    next_occurrence: Optional[datetime] = None


class TaskEvent(BaseModel):
    event_type: TaskEventType
    task_id: int
    user_id: str
    task_data: TaskEventData
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str = Field(default_factory=lambda: str(uuid4()))
```

---

### ReminderEvent Schema

**Topic**: `reminders`

**Event Types**: `scheduled`, `due`, `cancelled`

**Data Schema**:
```json
{
  "event_type": "scheduled | due | cancelled",
  "reminder_id": 456,
  "task_id": 123,
  "user_id": "user-uuid-here",
  "title": "Task title for notification",
  "due_at": "2026-01-15T10:00:00Z",
  "remind_at": "2026-01-15T09:00:00Z",
  "correlation_id": "uuid-for-tracing"
}
```

**Pydantic Schema**:
```python
class ReminderEventType(str, Enum):
    SCHEDULED = "scheduled"
    DUE = "due"
    CANCELLED = "cancelled"


class ReminderEvent(BaseModel):
    event_type: ReminderEventType
    reminder_id: int
    task_id: int
    user_id: str
    title: str
    due_at: Optional[datetime] = None
    remind_at: datetime
    correlation_id: str = Field(default_factory=lambda: str(uuid4()))
```

---

### TaskUpdateEvent Schema

**Topic**: `task-updates`

**Purpose**: Real-time sync across connected clients

**Data Schema**:
```json
{
  "event_type": "sync | reminder",
  "task_id": 123,
  "user_id": "user-uuid-here",
  "action": "created | updated | completed | deleted | reminder",
  "changes": {
    "completed": true
  },
  "source_client": "web | mobile | api | notification",
  "timestamp": "2026-01-10T14:30:00Z"
}
```

**Pydantic Schema**:
```python
class TaskUpdateEventType(str, Enum):
    SYNC = "sync"
    REMINDER = "reminder"


class TaskUpdateAction(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    COMPLETED = "completed"
    DELETED = "deleted"
    REMINDER = "reminder"


class TaskUpdateEvent(BaseModel):
    event_type: TaskUpdateEventType
    task_id: int
    user_id: str
    action: TaskUpdateAction
    changes: dict[str, Any] = {}
    source_client: str = "api"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENTITY RELATIONSHIP DIAGRAM                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                   │
│  │   User   │ (External - Better Auth)                          │
│  │   id     │                                                   │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ 1:N                                                     │
│       │                                                          │
│  ┌────▼─────┐      N:M      ┌──────────┐                       │
│  │   Task   │───────────────│   Tag    │                       │
│  │   id     │    TaskTag    │   id     │                       │
│  │  user_id │               │  user_id │                       │
│  │ priority │               │   name   │                       │
│  │ due_date │               │   color  │                       │
│  │recurring │               └──────────┘                       │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ 1:N                                                     │
│       │                                                          │
│  ┌────▼─────┐                                                   │
│  │ Reminder │                                                   │
│  │   id     │                                                   │
│  │ task_id  │                                                   │
│  │ user_id  │                                                   │
│  │remind_at │                                                   │
│  │  status  │                                                   │
│  └──────────┘                                                   │
│                                                                  │
│  ┌──────────┐                                                   │
│  │AuditLog  │ (Independent - Event Sourced)                     │
│  │   id     │                                                   │
│  │ user_id  │                                                   │
│  │entity_id │                                                   │
│  │  action  │                                                   │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Task Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| title | 1-200 characters | "Title must be 1-200 characters" |
| description | 0-1000 characters | "Description must be under 1000 characters" |
| priority | Must be valid enum | "Priority must be high, medium, or low" |
| due_date | Must be valid datetime | "Invalid due date format" |
| recurring_pattern | Must be daily/weekly/monthly or null | "Pattern must be daily, weekly, or monthly" |

### Tag Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| name | 1-50 characters | "Tag name must be 1-50 characters" |
| name | Unique per user | "Tag already exists" |
| color | Valid hex code | "Color must be valid hex (#RRGGBB)" |
| count | Max 100 per user | "Maximum 100 tags allowed" |

### Reminder Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| remind_at | Must be valid datetime | "Invalid reminder time format" |
| remind_at | If in past, fire immediately | (handled by system, not rejected) |
| task_id | Must exist and belong to user | "Task not found" |

---

## State Transitions

### Task State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                     TASK STATE TRANSITIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    update()    ┌──────────┐                       │
│  │ PENDING  │───────────────▶│ PENDING  │                       │
│  │completed=│                │completed=│                       │
│  │  false   │◀───────────────│  false   │                       │
│  └────┬─────┘    uncomplete()└──────────┘                       │
│       │                                                          │
│       │ complete()                                              │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │COMPLETED │                                                   │
│  │completed=│                                                   │
│  │  true    │                                                   │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ if recurring:                                           │
│       │ Recurring Task Service creates next occurrence          │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │ NEW TASK │ (next occurrence)                                 │
│  │completed=│                                                   │
│  │  false   │                                                   │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Reminder State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   REMINDER STATE TRANSITIONS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                   │
│  │ PENDING  │                                                   │
│  │status=   │                                                   │
│  │'pending' │                                                   │
│  └────┬─────┘                                                   │
│       │                                                          │
│       │ Dapr Job fires at remind_at                             │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐ notification    ┌──────────┐                      │
│  │PROCESSING│───success──────▶│   SENT   │                      │
│  └────┬─────┘                 │status=   │                      │
│       │                       │ 'sent'   │                      │
│       │                       └──────────┘                      │
│       │ notification                                            │
│       │ failed                                                  │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │  FAILED  │ (retry with exponential backoff)                  │
│  │status=   │                                                   │
│  │'failed'  │                                                   │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Plan

### Alembic Migration: Phase 5 Schema

```python
"""Add Phase 5 models: priority, due_date, recurring, tags, reminders, audit

Revision ID: xxx_add_phase5_models
Revises: [previous_revision]
Create Date: 2025-12-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'xxx_add_phase5_models'
down_revision = '[previous]'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create Priority enum
    priority_enum = postgresql.ENUM('high', 'medium', 'low', name='priority')
    priority_enum.create(op.get_bind(), checkfirst=True)

    # Create ReminderStatus enum
    reminder_status_enum = postgresql.ENUM('pending', 'sent', 'failed', name='reminderstatus')
    reminder_status_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to tasks table
    op.add_column('tasks', sa.Column('priority', sa.Enum('high', 'medium', 'low', name='priority'), server_default='medium'))
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('reminder_at', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('recurring_pattern', sa.String(20), nullable=True))
    op.add_column('tasks', sa.Column('next_occurrence', sa.DateTime(), nullable=True))

    # Create indexes on tasks
    op.create_index('idx_tasks_user_priority', 'tasks', ['user_id', 'priority'])
    op.create_index('idx_tasks_user_due_date', 'tasks', ['user_id', 'due_date'])

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('color', sa.String(7), server_default='#808080'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'name', name='uq_tags_user_name')
    )

    # Create task_tags junction table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.Integer(), sa.ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('tag_id', sa.Integer(), sa.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
    )
    op.create_index('idx_task_tags_tag_id', 'task_tags', ['tag_id'])

    # Create reminders table
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('task_id', sa.Integer(), sa.ForeignKey('tasks.id'), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('remind_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'sent', 'failed', name='reminderstatus'), server_default='pending'),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('dapr_job_name', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('idx_reminders_task_id', 'reminders', ['task_id'])
    op.create_index('idx_reminders_status', 'reminders', ['status'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), primary_key=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('old_values', postgresql.JSONB(), nullable=True),
        sa.Column('new_values', postgresql.JSONB(), nullable=True),
        sa.Column('correlation_id', sa.String(36), nullable=True, index=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('idx_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    # Drop audit_logs table
    op.drop_table('audit_logs')

    # Drop reminders table
    op.drop_table('reminders')

    # Drop task_tags table
    op.drop_table('task_tags')

    # Drop tags table
    op.drop_table('tags')

    # Remove new columns from tasks
    op.drop_index('idx_tasks_user_due_date', 'tasks')
    op.drop_index('idx_tasks_user_priority', 'tasks')
    op.drop_column('tasks', 'next_occurrence')
    op.drop_column('tasks', 'recurring_pattern')
    op.drop_column('tasks', 'reminder_at')
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'priority')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS reminderstatus')
    op.execute('DROP TYPE IF EXISTS priority')
```

---

**Data Model Version**: 1.0.0
**Created**: 2025-12-30
**Next Step**: Generate API contracts in /contracts/
