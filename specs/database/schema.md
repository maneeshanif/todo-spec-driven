# Database Schema Specification

**Database**: Neon PostgreSQL (Serverless)
**ORM**: SQLModel (SQLAlchemy + Pydantic)
**Migration Tool**: Alembic
**Authentication**: Better Auth (manages its own tables)
**Phase**: Phase 2
**Date**: December 2024

---

## Overview

This document specifies the database schema for the Todo Web Application, including tables, relationships, indexes, and migration strategy.

### Implementation Status: ✅ COMPLETE

**Note**: User authentication is handled by Better Auth, which manages its own tables (`user`, `session`, `account`, `verification`). The application's `tasks` table references `user.id` from Better Auth.

---

## Database Configuration

### Connection Settings

| Setting | Development | Production |
|---------|-------------|------------|
| Host | Neon serverless | Neon serverless |
| SSL | Required | Required |
| Pool Size | 5 | 10 |
| Max Overflow | 10 | 20 |
| Pool Pre-Ping | Enabled | Enabled |

### Connection URLs

```env
# Pooled connection (for application)
DATABASE_URL=postgresql://user:password@ep-xyz.region.aws.neon.tech/dbname?sslmode=require

# Direct connection (for migrations)
DATABASE_URL_DIRECT=postgresql://user:password@ep-xyz.region.aws.neon.tech/dbname?sslmode=require
```

---

## Tables

### user (Better Auth)

**Managed by Better Auth** - User account information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | uuid | Primary key |
| email | VARCHAR(255) | NO | - | Unique email |
| emailVerified | BOOLEAN | NO | FALSE | Email verified |
| name | VARCHAR(100) | YES | - | Display name |
| image | TEXT | YES | - | Profile image URL |
| createdAt | TIMESTAMP | NO | NOW() | Creation time |
| updatedAt | TIMESTAMP | NO | NOW() | Last update |

**Note**: This table is created and managed by Better Auth. Do NOT modify directly.

---

### session (Better Auth)

**Managed by Better Auth** - User sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | uuid | Primary key |
| userId | VARCHAR(36) | NO | - | FK to user.id |
| token | TEXT | NO | - | Session token |
| expiresAt | TIMESTAMP | NO | - | Expiration time |
| ipAddress | VARCHAR(45) | YES | - | Client IP |
| userAgent | TEXT | YES | - | Browser info |
| createdAt | TIMESTAMP | NO | NOW() | Creation time |
| updatedAt | TIMESTAMP | NO | NOW() | Last update |

---

### account (Better Auth)

**Managed by Better Auth** - OAuth accounts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | uuid | Primary key |
| userId | VARCHAR(36) | NO | - | FK to user.id |
| accountId | VARCHAR(255) | NO | - | Provider account ID |
| providerId | VARCHAR(255) | NO | - | OAuth provider |
| accessToken | TEXT | YES | - | OAuth access token |
| refreshToken | TEXT | YES | - | OAuth refresh token |
| expiresAt | TIMESTAMP | YES | - | Token expiration |
| password | TEXT | YES | - | Hashed password (email auth) |
| createdAt | TIMESTAMP | NO | NOW() | Creation time |
| updatedAt | TIMESTAMP | NO | NOW() | Last update |

---

### tasks

Stores user tasks (references Better Auth `user` table).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | Foreign key to user.id (Better Auth) |
| title | VARCHAR(200) | NO | - | Task title |
| description | TEXT | YES | NULL | Task description |
| completed | BOOLEAN | NO | FALSE | Completion status |
| priority | VARCHAR(10) | NO | 'medium' | Priority level (low, medium, high) |
| due_date | TIMESTAMP | YES | NULL | Task due date |
| is_recurring | BOOLEAN | NO | FALSE | Is recurring task |
| recurrence_pattern | VARCHAR(20) | YES | NULL | Recurrence pattern |
| created_at | TIMESTAMP | NO | NOW() | Creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update |

**Indexes:**
```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

**Constraints:**
- `pk_tasks` PRIMARY KEY (`id`)
- `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE

**SQLModel:**
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        foreign_key="user.id",  # References Better Auth user table
        index=True,
        max_length=36
    )
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)
    priority: str = Field(default="medium", max_length=10)
    due_date: Optional[datetime] = Field(default=None)
    is_recurring: bool = Field(default=False)
    recurrence_pattern: Optional[str] = Field(default=None, max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## Entity Relationship Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                    BETTER AUTH TABLES                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────┐    ┌─────────────────────────┐   │
│  │          user               │    │        session          │   │
│  ├─────────────────────────────┤    ├─────────────────────────┤   │
│  │ id (PK)     VARCHAR(36)     │◄───│ userId (FK) VARCHAR(36) │   │
│  │ email       VARCHAR(255)    │    │ token       TEXT        │   │
│  │ name        VARCHAR(100)    │    │ expiresAt   TIMESTAMP   │   │
│  │ createdAt   TIMESTAMP       │    └─────────────────────────┘   │
│  │ updatedAt   TIMESTAMP       │                                  │
│  └─────────────────────────────┘    ┌─────────────────────────┐   │
│                │                     │        account          │   │
│                │                     ├─────────────────────────┤   │
│                └────────────────────►│ userId (FK) VARCHAR(36) │   │
│                                      │ providerId  VARCHAR(255)│   │
│                                      │ password    TEXT        │   │
│                                      └─────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
                           │
                           │ 1:N (user.id → tasks.user_id)
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                    APPLICATION TABLE                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                         tasks                                │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ id (PK)              SERIAL                                  │  │
│  │ user_id (FK)         VARCHAR(36)  → user.id                  │  │
│  │ title                VARCHAR(200)                            │  │
│  │ description          TEXT                                    │  │
│  │ completed            BOOLEAN      DEFAULT FALSE              │  │
│  │ priority             VARCHAR(10)  DEFAULT 'medium'           │  │
│  │ due_date             TIMESTAMP    NULLABLE                   │  │
│  │ is_recurring         BOOLEAN      DEFAULT FALSE              │  │
│  │ recurrence_pattern   VARCHAR(20)  NULLABLE                   │  │
│  │ created_at           TIMESTAMP                               │  │
│  │ updated_at           TIMESTAMP                               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Migrations

### Initial Migration

Create initial tables:

```python
# alembic/versions/001_initial_schema.py
"""Initial schema

Revision ID: 001
Create Date: 2024-12-01
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None

def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    
    # Tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])
    op.create_index('idx_tasks_user_completed', 'tasks', ['user_id', 'completed'])

def downgrade():
    op.drop_table('tasks')
    op.drop_table('users')
```

### Migration Commands

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Show current revision
alembic current

# Show migration history
alembic history
```

---

## Query Patterns

### Common Queries

**Get all tasks for user:**
```python
from sqlmodel import select

statement = select(Task).where(Task.user_id == user_id)
tasks = session.exec(statement).all()
```

**Get tasks with filters:**
```python
statement = (
    select(Task)
    .where(Task.user_id == user_id)
    .where(Task.completed == completed)
    .order_by(Task.created_at.desc())
    .offset(offset)
    .limit(limit)
)
```

**Count tasks:**
```python
from sqlmodel import func

statement = select(func.count(Task.id)).where(Task.user_id == user_id)
count = session.exec(statement).one()
```

---

## Performance Considerations

### Index Strategy

| Access Pattern | Index |
|----------------|-------|
| User login by email | `idx_users_email` (unique) |
| List user's tasks | `idx_tasks_user_id` |
| Filter tasks by completion | `idx_tasks_user_completed` |
| Sort tasks by date | `idx_tasks_user_created` |

### Query Optimization

1. Always filter by `user_id` first (index prefix)
2. Use `SELECT` only needed columns for large result sets
3. Use pagination (LIMIT/OFFSET) for list endpoints
4. Consider using covering indexes for read-heavy queries

### Connection Pooling

Neon uses serverless pooling. Configure accordingly:

```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Validate connections
    pool_size=5,             # Base pool size
    max_overflow=10,         # Extra connections allowed
    pool_recycle=300,        # Recycle connections after 5 min
)
```

---

## Data Integrity

### Cascade Deletes

When a user is deleted, all their tasks are automatically deleted:

```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### Soft Deletes (Future)

If soft deletes are needed, add:

```sql
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at) WHERE deleted_at IS NULL;
```

---

## Backup & Recovery

### Neon Features

- Point-in-time recovery (up to 7 days)
- Automatic backups
- Branching for testing/development

### Best Practices

1. Test migrations on branch before production
2. Always create backup before major migrations
3. Use transactions for data migrations
4. Monitor query performance after schema changes

---

## Security

### Password Storage

- Use bcrypt with 12 salt rounds
- Never store plain text passwords
- Never log password values

### Data Access

- All queries MUST include `user_id` filter
- Never expose internal IDs in error messages
- Use parameterized queries (SQLModel handles this)

### Audit Trail (Future)

For audit requirements, consider adding:

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```
