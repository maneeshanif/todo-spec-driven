# Database Schema Specification

**Database**: Neon PostgreSQL (Serverless)  
**ORM**: SQLModel (SQLAlchemy + Pydantic)  
**Migration Tool**: Alembic  
**Phase**: Phase 2  
**Date**: December 2024

---

## Overview

This document specifies the database schema for the Todo Web Application, including tables, relationships, indexes, and migration strategy.

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

### users

Stores user account information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | uuid_generate_v4() | Primary key |
| email | VARCHAR(255) | NO | - | Unique email |
| password_hash | VARCHAR(255) | NO | - | Bcrypt hash |
| name | VARCHAR(100) | NO | - | Display name |
| created_at | TIMESTAMP | NO | NOW() | Creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Constraints:**
- `pk_users` PRIMARY KEY (`id`)
- `uq_users_email` UNIQUE (`email`)

**SQLModel:**
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import uuid4

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        max_length=36
    )
    email: str = Field(
        unique=True,
        index=True,
        max_length=255
    )
    password_hash: str = Field(max_length=255)
    name: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

### tasks

Stores user tasks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | auto | Primary key |
| user_id | VARCHAR(36) | NO | - | Foreign key to users |
| title | VARCHAR(200) | NO | - | Task title |
| description | TEXT | YES | NULL | Task description |
| completed | BOOLEAN | NO | FALSE | Completion status |
| created_at | TIMESTAMP | NO | NOW() | Creation time |
| updated_at | TIMESTAMP | NO | NOW() | Last update |

**Indexes:**
```sql
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

**Constraints:**
- `pk_tasks` PRIMARY KEY (`id`)
- `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

**SQLModel:**
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        max_length=36
    )
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

### sessions (Optional)

Stores active user sessions for token management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(36) | NO | uuid_generate_v4() | Primary key |
| user_id | VARCHAR(36) | NO | - | Foreign key to users |
| token_hash | VARCHAR(255) | NO | - | Hashed refresh token |
| expires_at | TIMESTAMP | NO | - | Expiration time |
| created_at | TIMESTAMP | NO | NOW() | Creation time |

**Indexes:**
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Constraints:**
- `pk_sessions` PRIMARY KEY (`id`)
- `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────┐
│                       users                          │
├─────────────────────────────────────────────────────┤
│ id (PK)         VARCHAR(36)                         │
│ email           VARCHAR(255)  UNIQUE                │
│ password_hash   VARCHAR(255)                        │
│ name            VARCHAR(100)                        │
│ created_at      TIMESTAMP                           │
│ updated_at      TIMESTAMP                           │
└─────────────────────────────────────────────────────┘
                           │
                           │ 1:N
                           ▼
┌─────────────────────────────────────────────────────┐
│                       tasks                          │
├─────────────────────────────────────────────────────┤
│ id (PK)         SERIAL                              │
│ user_id (FK)    VARCHAR(36)  → users.id             │
│ title           VARCHAR(200)                        │
│ description     TEXT                                │
│ completed       BOOLEAN      DEFAULT FALSE          │
│ created_at      TIMESTAMP                           │
│ updated_at      TIMESTAMP                           │
└─────────────────────────────────────────────────────┘
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
