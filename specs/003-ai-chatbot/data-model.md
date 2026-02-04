# Data Model: AI-Powered Todo Chatbot

**Feature**: 002-ai-chatbot
**Date**: 2025-12-17
**Status**: Design Complete

---

## Entity Overview

| Entity | Purpose | New/Existing |
|--------|---------|--------------|
| Conversation | Chat thread between user and assistant | NEW |
| Message | Single message in a conversation | NEW |
| Task | Todo item (unchanged) | Existing (Phase 2) |
| User | Application user (unchanged) | Existing (Phase 2) |

---

## Entity: Conversation

### Purpose
Represents a chat conversation thread between a user and the AI assistant.

### SQLModel Definition

```python
# backend/src/models/conversation.py
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .message import Message
    from .user import User

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    title: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="conversations")
    messages: list["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "user_id": "user_abc123",
                "title": "Add task to buy groceries",
                "created_at": "2025-12-17T10:00:00Z",
                "updated_at": "2025-12-17T10:05:00Z"
            }
        }
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | int | PK, auto-increment | Unique conversation identifier |
| user_id | str | FK -> users.id, NOT NULL, indexed | Owner of the conversation |
| title | str | max 255, nullable | Auto-generated from first message |
| created_at | datetime | NOT NULL, default NOW | Creation timestamp |
| updated_at | datetime | NOT NULL, default NOW | Last update timestamp |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| idx_conversations_user_id | user_id | Fast lookup by user |
| idx_conversations_updated_at | updated_at DESC | Sort by recent for landing page |

### Constraints

- `user_id` must reference existing user
- User can only access their own conversations (enforced at service layer)
- Deleting conversation cascades to delete all messages

### State Transitions

```
[Created] -> [Active] -> [Deleted]
     |           |
     v           v
  (first msg)  (rename)
```

- **Created**: New conversation with no messages
- **Active**: Has at least one message
- **Deleted**: Soft delete not implemented; hard delete cascades messages

---

## Entity: Message

### Purpose
Represents a single message within a conversation, including user input, assistant responses, and tool call records.

### SQLModel Definition

```python
# backend/src/models/message.py
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .conversation import Conversation

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True, nullable=False)
    role: MessageRole = Field(nullable=False)
    content: str = Field(nullable=False)
    tool_calls: Optional[dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "conversation_id": 1,
                "role": "user",
                "content": "Add a task to buy groceries",
                "tool_calls": None,
                "created_at": "2025-12-17T10:00:00Z"
            }
        }
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | int | PK, auto-increment | Unique message identifier |
| conversation_id | int | FK -> conversations.id, NOT NULL, indexed | Parent conversation |
| role | enum | NOT NULL, one of: user/assistant/system | Message sender type |
| content | text | NOT NULL | Message text content |
| tool_calls | JSONB | nullable | Tool invocation records (clarified) |
| created_at | datetime | NOT NULL, default NOW | Creation timestamp |

### tool_calls JSONB Schema

```json
{
  "type": "object",
  "properties": {
    "calls": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "description": "Unique call identifier"},
          "tool": {"type": "string", "description": "Tool name (e.g., add_task)"},
          "arguments": {"type": "object", "description": "Tool input parameters"},
          "result": {"type": "object", "description": "Tool execution result"}
        },
        "required": ["id", "tool", "arguments"]
      }
    }
  }
}
```

**Example**:
```json
{
  "calls": [
    {
      "id": "call_abc123",
      "tool": "add_task",
      "arguments": {
        "user_id": "user_xyz",
        "title": "Buy groceries",
        "description": "Milk, eggs, bread"
      },
      "result": {
        "task_id": 42,
        "status": "created",
        "title": "Buy groceries"
      }
    }
  ]
}
```

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| idx_messages_conversation_id | conversation_id | Fast lookup by conversation |
| idx_messages_created_at | created_at | Sort messages chronologically |

### Constraints

- `conversation_id` must reference existing conversation
- Messages are immutable once created (no updates)
- Deleting conversation cascades message deletion

---

## Relationships

```
┌─────────┐       ┌──────────────┐       ┌─────────┐
│  User   │ 1───n │ Conversation │ 1───n │ Message │
└─────────┘       └──────────────┘       └─────────┘
     │                                        │
     │                                        │
     │            ┌─────────┐                 │
     └─────1───n──│  Task   │←────────────────┘
                  └─────────┘   (via MCP tools)
```

- **User → Conversation**: One user has many conversations
- **Conversation → Message**: One conversation has many messages
- **User → Task**: One user has many tasks (existing Phase 2)
- **Message → Task**: Messages can contain tool_calls that operate on tasks

---

## Validation Rules

### Conversation
- `title` auto-generated from first user message (truncate to 50 chars)
- `title` can be manually renamed (via PUT endpoint)
- `user_id` must match authenticated user

### Message
- `content` max length: 4000 characters (per NFR-SEC-003)
- `role` must be valid enum value
- `tool_calls` must be valid JSON if present
- Messages cannot be edited or deleted individually

---

## Pydantic Schemas

### Conversation Schemas

```python
# backend/src/schemas/conversation.py
from datetime import datetime
from pydantic import BaseModel, Field

class ConversationCreate(BaseModel):
    title: str | None = None

class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class ConversationResponse(BaseModel):
    id: int
    user_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True

class ConversationWithMessages(ConversationResponse):
    messages: list["MessageResponse"]
```

### Message Schemas

```python
# backend/src/schemas/message.py
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from src.models.message import MessageRole

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: MessageRole
    content: str
    tool_calls: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True
```

### Chat Schemas

```python
# backend/src/schemas/chat.py
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    conversation_id: int | None = None
    message: str = Field(..., min_length=1, max_length=4000)

class ChatResponse(BaseModel):
    conversation_id: int
    message_id: int
    response: str
    tool_calls: list[dict] | None = None
```

---

## Migration

### Alembic Migration Script

```python
"""Add conversations and messages tables

Revision ID: xxx
Revises: previous_revision
Create Date: 2025-12-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(255), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('idx_conversations_updated_at', 'conversations', ['updated_at'], postgresql_using='btree')

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tool_calls', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("role IN ('user', 'assistant', 'system')", name='ck_messages_role')
    )
    op.create_index('idx_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('idx_messages_created_at', 'messages', ['created_at'])

def downgrade():
    op.drop_table('messages')
    op.drop_table('conversations')
```

### Migration Commands

```bash
cd backend
uv run alembic revision --autogenerate -m "Add conversations and messages tables"
uv run alembic upgrade head
```

---

## Data Volume Estimates

| Entity | Per User Limit | Storage Estimate |
|--------|----------------|------------------|
| Conversations | 1,000 max | ~100KB per user |
| Messages | 10,000 max | ~5MB per user |
| tool_calls JSON | ~1KB average | Included in message |

### Pagination

- Conversations: 20 per page, sorted by updated_at DESC
- Messages: 50 per page, sorted by created_at ASC

---

## Service Interface

```python
# backend/src/services/conversation_service.py
class ConversationService:
    async def create_conversation(self, user_id: str, title: str | None = None) -> Conversation
    async def get_conversation(self, conversation_id: int, user_id: str) -> Conversation | None
    async def list_conversations(self, user_id: str, limit: int = 20, offset: int = 0) -> list[Conversation]
    async def get_most_recent(self, user_id: str) -> Conversation | None  # For landing page
    async def update_title(self, conversation_id: int, user_id: str, title: str) -> Conversation
    async def delete_conversation(self, conversation_id: int, user_id: str) -> bool
    async def add_message(self, conversation_id: int, role: str, content: str, tool_calls: dict | None = None) -> Message
    async def get_messages(self, conversation_id: int, limit: int = 50, offset: int = 0) -> list[Message]
    async def auto_generate_title(self, conversation_id: int, first_message: str) -> str
```

---

**Status**: Ready for implementation
**Next**: API contracts (contracts/)
