# Chat API Integration Examples

Complete code examples for implementing the chat API endpoint.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## Complete Chat Router Implementation

```python
# backend/src/routers/chat.py
"""
Chat API endpoint for AI-powered todo assistant.
Handles conversation management and agent execution.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
import logging

from src.database import get_session
from src.middleware.auth import verify_jwt
from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import ChatRequest, ChatResponse
from src.agents import run_todo_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """
    Process a chat message and return AI response.

    This endpoint is STATELESS - conversation history is loaded from
    database on each request and stored after response.
    """
    # 1. Enforce user isolation
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. Get or create conversation
    conversation = await _get_or_create_conversation(
        session, user_id, request.message, request.conversation_id
    )

    # 3. Load conversation history
    history = _load_conversation_history(session, conversation.id)

    # 4. Store user message
    user_msg = _store_message(session, conversation.id, "user", request.message)

    try:
        # 5. Run the agent
        result = await run_todo_agent(
            user_message=request.message,
            user_id=user_id,
            conversation_history=history,
        )

        agent_response = result["response"]

        # 6. Store agent response
        assistant_msg = _store_message(
            session, conversation.id, "assistant", agent_response
        )

        # 7. Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        session.add(conversation)
        session.commit()

        return ChatResponse(
            success=True,
            data={
                "response": agent_response,
                "conversation_id": conversation.id,
                "message_id": assistant_msg.id,
            }
        )

    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        return ChatResponse(
            success=False,
            data={
                "error": "Failed to process message. Please try again.",
                "conversation_id": conversation.id,
            }
        )


async def _get_or_create_conversation(
    session: Session,
    user_id: str,
    message: str,
    conversation_id: int | None
) -> Conversation:
    """Get existing conversation or create new one."""
    if conversation_id:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation

    # Create new conversation with title from first message
    title = message[:50] + "..." if len(message) > 50 else message
    conversation = Conversation(user_id=user_id, title=title)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


def _load_conversation_history(session: Session, conversation_id: int) -> list[dict]:
    """Load all messages for a conversation."""
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()
    return [{"role": msg.role, "content": msg.content} for msg in messages]


def _store_message(
    session: Session,
    conversation_id: int,
    role: str,
    content: str
) -> Message:
    """Store a message in the database."""
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg
```

---

## Database Models

```python
# backend/src/models/conversation.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .message import Message


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str | None = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    messages: list["Message"] = Relationship(back_populates="conversation")
```

```python
# backend/src/models/message.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .conversation import Conversation


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    conversation: "Conversation" = Relationship(back_populates="messages")
```

---

## Pydantic Schemas

```python
# backend/src/schemas/chat.py
from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    success: bool
    data: dict


class MessageResponse(BaseModel):
    """Single message representation."""
    id: int
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    """Conversation summary."""
    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime
```

---

## Register Router in main.py

```python
# backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import tasks, chat

app = FastAPI(
    title="Todo API",
    description="AI-powered Todo application API",
    version="2.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

## Alembic Migration

```python
# alembic/versions/xxx_add_conversations_messages.py
"""Add conversations and messages tables

Revision ID: xxx
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


def upgrade():
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'])
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])


def downgrade():
    op.drop_index('ix_messages_conversation_id', table_name='messages')
    op.drop_table('messages')
    op.drop_index('ix_conversations_user_id', table_name='conversations')
    op.drop_table('conversations')
```

---

## Testing the Chat Endpoint

```python
# backend/tests/test_chat.py
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from src.main import app
from src.database import get_session
from src.middleware.auth import verify_jwt


# Test fixtures
@pytest.fixture
def session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(session):
    def get_session_override():
        return session

    def verify_jwt_override():
        return {"id": "test-user-123"}

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[verify_jwt] = verify_jwt_override
    return TestClient(app)


# Tests
def test_chat_new_conversation(client):
    """Test starting a new conversation."""
    response = client.post(
        "/api/test-user-123/chat",
        json={"message": "Hello, can you help me?"},
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "response" in data["data"]
    assert "conversation_id" in data["data"]


def test_chat_continue_conversation(client):
    """Test continuing an existing conversation."""
    # First message
    response1 = client.post(
        "/api/test-user-123/chat",
        json={"message": "Add a task to buy milk"},
        headers={"Authorization": "Bearer test-token"}
    )
    conversation_id = response1.json()["data"]["conversation_id"]

    # Second message
    response2 = client.post(
        "/api/test-user-123/chat",
        json={
            "message": "What tasks do I have?",
            "conversation_id": conversation_id
        },
        headers={"Authorization": "Bearer test-token"}
    )
    assert response2.status_code == 200
    assert response2.json()["data"]["conversation_id"] == conversation_id


def test_chat_user_isolation(client):
    """Test that users cannot access other users' conversations."""
    # Create conversation as test-user-123
    response = client.post(
        "/api/test-user-123/chat",
        json={"message": "Hello"},
        headers={"Authorization": "Bearer test-token"}
    )
    conversation_id = response.json()["data"]["conversation_id"]

    # Try to access as different user (should fail)
    response = client.post(
        "/api/other-user/chat",
        json={
            "message": "Hello",
            "conversation_id": conversation_id
        },
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 403
```

---

## Frontend Integration Example

```typescript
// frontend/src/lib/chatApi.ts
import axios from './api';

interface ChatRequest {
  message: string;
  conversation_id?: number;
}

interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    conversation_id: number;
    message_id: number;
  };
}

export async function sendChatMessage(
  userId: string,
  request: ChatRequest
): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(
    `/api/${userId}/chat`,
    request
  );
  return response.data;
}
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [REFERENCE.md](./REFERENCE.md) - API reference
- [openai-agents-setup](../openai-agents-setup/) - Agent configuration
