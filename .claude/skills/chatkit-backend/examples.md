# ChatKit Backend Examples

Complete code examples for implementing ChatKit backend in FastAPI.

---

## Example 1: Complete ChatKit Router

Full implementation with all features:

```python
# backend/src/routers/chatkit.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from src.database import get_session
from src.middleware.auth import verify_jwt
from src.models.conversation import Conversation
from src.models.message import Message
from src.agents.runner import run_todo_agent_streaming
from datetime import datetime
import json
import logging

router = APIRouter(tags=["chatkit"])
logger = logging.getLogger(__name__)


@router.post("/chatkit")
async def chatkit_endpoint(
    request: Request,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """
    ChatKit SSE streaming endpoint.

    Request:
    {
        "message": "Show my tasks",
        "thread_id": 123  // optional
    }

    Response: SSE stream with events:
    - {"type": "thinking", "content": "..."}
    - {"type": "text", "content": "..."}
    - {"type": "tool_call", "name": "...", "args": {...}}
    - {"type": "tool_result", "name": "...", "result": {...}}
    - [DONE]
    """
    user_id = current_user["id"]

    # Parse request
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    message = body.get("message", "").strip()
    thread_id = body.get("thread_id")

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    # Get or create conversation
    conversation = await _get_or_create_conversation(
        session, user_id, thread_id, message
    )

    # Load history
    history = await _load_history(session, conversation.id)

    # Store user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=message,
    )
    session.add(user_msg)
    session.commit()

    async def generate():
        response_content = ""
        tool_calls_json = []

        try:
            async for event in run_todo_agent_streaming(
                user_message=message,
                user_id=user_id,
                conversation_history=history,
            ):
                event_type = event.get("type")

                # Accumulate text content
                if event_type == "text":
                    response_content += event.get("content", "")

                # Track tool calls
                if event_type == "tool_call":
                    tool_calls_json.append({
                        "name": event.get("name"),
                        "args": event.get("args"),
                    })

                # Send event to client
                yield f"data: {json.dumps(event)}\n\n"

            # Store assistant message
            if response_content:
                assistant_msg = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=response_content,
                    tool_calls=json.dumps(tool_calls_json) if tool_calls_json else None,
                )
                session.add(assistant_msg)

                # Update conversation
                conversation.updated_at = datetime.utcnow()
                if not conversation.title:
                    conversation.title = message[:50]
                session.add(conversation)
                session.commit()

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.exception(f"ChatKit error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Processing failed'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _get_or_create_conversation(
    session: Session,
    user_id: str,
    thread_id: int | None,
    message: str,
) -> Conversation:
    """Get existing or create new conversation."""
    if thread_id:
        conv = session.exec(
            select(Conversation).where(
                Conversation.id == thread_id,
                Conversation.user_id == user_id,
            )
        ).first()
        if conv:
            return conv

    # Create new
    conv = Conversation(
        user_id=user_id,
        title=message[:50] + "..." if len(message) > 50 else message,
    )
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


async def _load_history(session: Session, conversation_id: int) -> list[dict]:
    """Load conversation history."""
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    return [{"role": m.role, "content": m.content} for m in messages]
```

---

## Example 2: Streaming Agent Runner

Agent runner with tool event streaming:

```python
# backend/src/agents/runner.py
from typing import AsyncGenerator
from agents import Runner, Agent
from .todo_agent import todo_agent
from .hooks import StreamingHooks
import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_todo_agent_streaming(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream agent execution events for ChatKit.

    Yields events:
    - {"type": "thinking", "content": "..."}
    - {"type": "text", "content": "..."}
    - {"type": "tool_call", "name": "...", "args": {...}}
    - {"type": "tool_result", "name": "...", "result": {...}}
    """
    # Add user context to message
    enhanced_message = f"[User ID: {user_id}]\n{user_message}"

    # Build input
    input_data = []
    if conversation_history:
        input_data.extend(conversation_history)
    input_data.append({"role": "user", "content": enhanced_message})

    try:
        # Initial thinking
        yield {"type": "thinking", "content": "Processing your request..."}

        # Run agent
        result = await Runner.run(
            todo_agent,
            input=input_data if conversation_history else enhanced_message,
            max_turns=10,
        )

        # Stream response text
        text = result.final_output
        chunk_size = 20

        for i in range(0, len(text), chunk_size):
            chunk = text[i:i + chunk_size]
            yield {"type": "text", "content": chunk}
            await asyncio.sleep(0.02)

    except Exception as e:
        logger.exception(f"Agent error: {e}")
        yield {"type": "error", "message": str(e)}


async def run_todo_agent_streaming_with_tools(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream with real-time tool call events.
    Uses Runner.run_streamed for live events.
    """
    enhanced_message = f"[User ID: {user_id}]\n{user_message}"

    input_data = []
    if conversation_history:
        input_data.extend(conversation_history)
    input_data.append({"role": "user", "content": enhanced_message})

    try:
        yield {"type": "thinking", "content": "Analyzing..."}

        async with Runner.run_streamed(
            todo_agent,
            input=input_data,
        ) as stream:
            async for event in stream:
                # Text streaming
                if event.type == "raw_model_stream_event":
                    if hasattr(event.data, "delta") and event.data.delta:
                        yield {"type": "text", "content": event.data.delta}

                # Tool call started
                elif event.type == "tool_call_start":
                    yield {
                        "type": "tool_call",
                        "id": event.call_id,
                        "name": event.tool.name,
                        "args": event.arguments,
                    }

                # Tool call completed
                elif event.type == "tool_call_end":
                    yield {
                        "type": "tool_result",
                        "id": event.call_id,
                        "name": event.tool.name,
                        "result": event.result if hasattr(event, "result") else {},
                    }

    except Exception as e:
        logger.exception(f"Streaming error: {e}")
        yield {"type": "error", "message": str(e)}
```

---

## Example 3: Database Models

SQLModel models for conversations:

```python
# backend/src/models/conversation.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .message import Message


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    messages: list["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

```python
# backend/src/models/message.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .conversation import Conversation


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(
        foreign_key="conversations.id",
        index=True,
        nullable=False,
    )
    role: str = Field(max_length=20, nullable=False)  # user, assistant, system
    content: str = Field(nullable=False)
    tool_calls: Optional[str] = Field(default=None)  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    conversation: "Conversation" = Relationship(back_populates="messages")
```

---

## Example 4: Conversation CRUD Router

```python
# backend/src/routers/conversations.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, desc
from src.database import get_session
from src.middleware.auth import verify_jwt
from src.models.conversation import Conversation
from src.models.message import Message
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# Schemas
class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: list[dict]


class ConversationUpdate(BaseModel):
    title: str


# Endpoints
@router.get("/", response_model=list[ConversationResponse])
async def list_conversations(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """List user's conversations ordered by most recent."""
    conversations = session.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user["id"])
        .order_by(desc(Conversation.updated_at))
        .offset(offset)
        .limit(limit)
    ).all()
    return conversations


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """Get conversation with messages."""
    conversation = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user["id"],
        )
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    )


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """Rename conversation."""
    conversation = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user["id"],
        )
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.title = data.title
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)
    session.commit()
    session.refresh(conversation)

    return conversation


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """Delete conversation and all messages."""
    conversation = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user["id"],
        )
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Cascade delete handles messages
    session.delete(conversation)
    session.commit()

    return {"status": "deleted", "id": conversation_id}


@router.get("/recent/first")
async def get_most_recent(
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """Get most recent conversation."""
    conversation = session.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user["id"])
        .order_by(desc(Conversation.updated_at))
        .limit(1)
    ).first()

    if not conversation:
        return None

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )
```

---

## Example 5: Main App Setup

```python
# backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import tasks, chatkit, conversations
from src.database import create_db_and_tables

app = FastAPI(
    title="Todo AI API",
    version="2.0.0",
    description="Todo API with AI chatbot powered by ChatKit",
)

# CORS for ChatKit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    create_db_and_tables()

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Routers
app.include_router(tasks.router)
app.include_router(chatkit.router)
app.include_router(conversations.router)
```

---

## Example 6: Alembic Migration

```python
# backend/alembic/versions/xxx_add_conversations.py
"""Add conversations and messages tables

Revision ID: xxx
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision = 'xxx'
down_revision = 'previous'
branch_labels = None
depends_on = None


def upgrade():
    # Conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])

    # Messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tool_calls', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])


def downgrade():
    op.drop_table('messages')
    op.drop_table('conversations')
```

---

## Example 7: Test Client

```python
# backend/tests/test_chatkit.py
import pytest
from httpx import AsyncClient
from src.main import app


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_chatkit_endpoint(client, auth_headers):
    """Test ChatKit SSE endpoint."""
    response = await client.post(
        "/chatkit",
        json={"message": "Hello"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    # Parse SSE events
    events = []
    for line in response.text.split("\n"):
        if line.startswith("data: "):
            data = line[6:]
            if data != "[DONE]":
                events.append(json.loads(data))

    # Should have at least thinking and text events
    assert any(e["type"] == "thinking" for e in events)
    assert any(e["type"] == "text" for e in events)


@pytest.mark.asyncio
async def test_conversation_crud(client, auth_headers):
    """Test conversation CRUD operations."""
    # List (initially empty)
    response = await client.get("/api/conversations", headers=auth_headers)
    assert response.status_code == 200

    # Create via chatkit
    response = await client.post(
        "/chatkit",
        json={"message": "Create a test task"},
        headers=auth_headers,
    )
    assert response.status_code == 200

    # List again (should have one)
    response = await client.get("/api/conversations", headers=auth_headers)
    conversations = response.json()
    assert len(conversations) >= 1

    conv_id = conversations[0]["id"]

    # Get detail
    response = await client.get(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 200
    assert "messages" in response.json()

    # Rename
    response = await client.patch(
        f"/api/conversations/{conv_id}",
        json={"title": "Renamed"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Renamed"

    # Delete
    response = await client.delete(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 200
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [REFERENCE.md](./REFERENCE.md) - SSE format reference
- [chatkit-frontend skill](../chatkit-frontend/) - Frontend integration
