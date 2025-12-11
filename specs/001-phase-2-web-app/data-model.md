# Data Model: Todo Web Application - Phase 2

**Feature**: Todo Web Application - Phase 2
**Date**: 2025-12-11
**Status**: Complete
**Database**: PostgreSQL (Neon Serverless)
**ORM**: SQLModel 0.0.24+

---

## Overview

This document defines the complete database schema for the Todo Web Application Phase 2. The schema supports multi-user authentication and task management with proper isolation, indexing, and relationships.

**Design Principles**:
- User isolation: All tasks are scoped to a specific user via `user_id` foreign key
- Soft timestamps: All entities track `created_at` and `updated_at`
- Indexed lookups: Foreign keys and frequently queried fields have indexes
- Type safety: SQLModel provides Pydantic validation + SQLAlchemy ORM

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK, UUID)   │───┐
│ email (UNIQUE)  │   │
│ name            │   │
│ hashed_password │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │ 1:N
                      │
                      ▼
                ┌─────────────────┐
                │     tasks       │
                │─────────────────│
                │ id (PK, INT)    │
                │ user_id (FK)    │◄──── Indexed
                │ title           │
                │ description     │
                │ completed       │◄──── Indexed
                │ created_at      │
                │ updated_at      │
                └─────────────────┘
```

---

## Entities

### 1. User Entity

**Purpose**: Represents application user accounts managed by Better Auth

**Table Name**: `users`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (String) | PRIMARY KEY | Unique user identifier (Better Auth format) |
| `email` | String(255) | UNIQUE, NOT NULL, INDEX | User email address for login |
| `name` | String(255) | NOT NULL | User display name |
| `hashed_password` | String(255) | NOT NULL | Bcrypt hashed password (Better Auth) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

**Relationships**:
- One user has many tasks (1:N)

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True)  # UUID from Better Auth
    email: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=255)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    tasks: list["Task"] = Relationship(back_populates="user")
```

**Notes**:
- Better Auth manages user creation and authentication
- Password is hashed with bcrypt (never stored in plain text)
- Email is used as primary login identifier

---

### 2. Task Entity

**Purpose**: Represents a todo item owned by a user

**Table Name**: `tasks`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | PRIMARY KEY, AUTO_INCREMENT | Unique task identifier |
| `user_id` | String (UUID) | FOREIGN KEY → users.id, NOT NULL, INDEX | Owner of the task |
| `title` | String(200) | NOT NULL | Task title (required) |
| `description` | Text (1000) | NULLABLE | Optional task description |
| `completed` | Boolean | NOT NULL, DEFAULT FALSE, INDEX | Completion status |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Task creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `user_id` (for user isolation queries)
- INDEX on `completed` (for filtering complete/incomplete)
- COMPOSITE INDEX on (`user_id`, `created_at`) for sorted user queries

**Relationships**:
- Many tasks belong to one user (N:1)

**SQLModel Definition**:
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    user: Optional["User"] = Relationship(back_populates="tasks")
```

**Constraints**:
- `user_id` references `users.id` with CASCADE on delete (when user is deleted, tasks are deleted)
- `title` must be 1-200 characters
- `description` max 1000 characters

**Notes**:
- Tasks are sorted by `created_at DESC` (newest first) in queries
- `completed` index enables fast filtering
- `user_id` index ensures fast user isolation

---

## Pydantic Schemas (Request/Response Models)

### Task Schemas

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Base schema with shared fields
class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

# Request schema for creating a task
class TaskCreate(TaskBase):
    pass  # Inherits title and description

# Request schema for updating a task
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None

# Response schema (what the API returns)
class TaskPublic(TaskBase):
    id: int
    user_id: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode

# Paginated response
class TaskListResponse(BaseModel):
    tasks: list[TaskPublic]
    total: int
    page: int
    page_size: int
    has_next: bool
```

### User Schemas

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Base schema
class UserBase(BaseModel):
    email: EmailStr
    name: str

# Request schema for signup
class UserCreate(UserBase):
    password: str = Field(min_length=8)

# Response schema (public, no password)
class UserPublic(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
```

---

## Database Migrations (Alembic)

### Initial Migration

**File**: `alembic/versions/001_initial_schema.py`

```python
"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_completed'), 'tasks', ['completed'], unique=False)
    op.create_index(op.f('ix_tasks_user_id_created_at'), 'tasks', ['user_id', 'created_at'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_user_id_created_at'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_completed'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
```

---

## Query Patterns

### Get All Tasks for a User (with pagination)

```python
from sqlmodel import select, Session

def get_user_tasks(
    session: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    completed: Optional[bool] = None
) -> tuple[list[Task], int]:
    # Build query
    query = select(Task).where(Task.user_id == user_id)

    # Filter by completion status if specified
    if completed is not None:
        query = query.where(Task.completed == completed)

    # Order by newest first
    query = query.order_by(Task.created_at.desc())

    # Count total (before pagination)
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute
    tasks = session.exec(query).all()

    return tasks, total
```

### Create Task with Auto-Timestamps

```python
def create_task(session: Session, task_data: TaskCreate, user_id: str) -> Task:
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

### Update Task with Auto-Timestamp

```python
def update_task(session: Session, task_id: int, user_id: str, task_data: TaskUpdate) -> Optional[Task]:
    # Fetch task with user isolation
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()

    if not task:
        return None

    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed

    # Update timestamp
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

---

## Performance Considerations

### Indexes Strategy

1. **Primary Keys**: Auto-indexed by database
2. **Foreign Keys**: Indexed for JOIN performance (`user_id`)
3. **Filter Fields**: Indexed for WHERE clauses (`completed`)
4. **Composite Indexes**: For combined queries (`user_id`, `created_at`)

### Expected Query Performance

| Query Type | Index Used | Expected Time |
|------------|------------|---------------|
| Get user's tasks | `ix_tasks_user_id` | < 50ms |
| Filter by completed | `ix_tasks_completed` | < 50ms |
| User tasks sorted by date | `ix_tasks_user_id_created_at` | < 50ms |
| Single task lookup | `PRIMARY KEY` | < 10ms |

### Scalability

- **10,000 tasks per user**: Pagination with cursor-based approach
- **1,000 concurrent users**: Connection pooling (min=10, max=100)
- **Database size**: Tasks table ~1MB per 10,000 records

---

## Data Integrity Rules

### Constraints

1. **User Email Uniqueness**: Enforced by UNIQUE constraint
2. **Task Owner**: Foreign key CASCADE ensures orphaned tasks are deleted
3. **Title Required**: NOT NULL constraint on `tasks.title`
4. **Title Length**: Application-level validation (1-200 chars)
5. **Description Length**: Application-level validation (max 1000 chars)

### Validation Rules (Pydantic)

```python
# Title validation
title: str = Field(min_length=1, max_length=200)

# Email validation
email: EmailStr  # Validates format

# Password strength (Better Auth)
password: str = Field(min_length=8)  # At signup
```

---

## Security Considerations

### User Isolation

All task queries MUST include `user_id` filter:
```python
# ✅ CORRECT - User isolation enforced
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
).first()

# ❌ WRONG - Security vulnerability!
task = session.exec(
    select(Task).where(Task.id == task_id)
).first()
```

### SQL Injection Prevention

- SQLModel/SQLAlchemy uses parameterized queries automatically
- Never concatenate user input into SQL strings

### Password Hashing

- Better Auth handles password hashing with bcrypt
- Never store plain text passwords
- Minimum 8 characters enforced

---

## Testing Data Fixtures

### Sample User

```python
sample_user = User(
    id="usr_12345",
    email="john.doe@example.com",
    name="John Doe",
    hashed_password="$2b$12$...",  # Bcrypt hash
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
)
```

### Sample Tasks

```python
sample_tasks = [
    Task(
        id=1,
        user_id="usr_12345",
        title="Buy groceries",
        description="Milk, eggs, bread",
        completed=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    ),
    Task(
        id=2,
        user_id="usr_12345",
        title="Finish project report",
        description=None,
        completed=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
]
```

---

## Future Enhancements (Out of Scope for Phase 2)

These schema extensions are NOT implemented in Phase 2:

- [ ] Task priorities (low, medium, high)
- [ ] Task tags/categories
- [ ] Due dates and reminders
- [ ] Recurring tasks
- [ ] Task attachments
- [ ] Task sharing/collaboration
- [ ] Soft delete with `deleted_at` field
- [ ] Task history/audit log

---

**Status**: Schema design complete ✅
**Next Step**: Create API contracts in `contracts/` directory
**Last Updated**: 2025-12-11
