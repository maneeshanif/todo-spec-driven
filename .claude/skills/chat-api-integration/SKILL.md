---
name: chat-api-integration
description: Connect OpenAI Agents with MCP tools in FastAPI. Builds the chat endpoint, conversation models, and agent execution flow. Use when implementing the chat API for Phase 3.
allowed-tools: Bash, Write, Read, Edit, Glob
---

# Chat API Integration

Quick reference for building the FastAPI chat endpoint that connects the frontend to the OpenAI Agents SDK agent.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                          │
│                    POST /api/{user_id}/chat                        │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                             │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Chat Router                                 │  │
│  │  POST /api/{user_id}/chat                                    │  │
│  │  ├─ Validate JWT                                             │  │
│  │  ├─ Load conversation history from DB                        │  │
│  │  ├─ Run agent with message + history                         │  │
│  │  ├─ Store message + response in DB                           │  │
│  │  └─ Return response (STATELESS!)                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   OpenAI Agents SDK                          │  │
│  │  Agent + Gemini Model + MCP Tools                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   FastMCP Client                              │  │
│  │  Calls MCP Server tools (add_task, list_tasks, etc.)         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Key Insight**: The chat API is STATELESS. Conversation history is loaded from database on each request and stored after response.

---

## Project Structure

```
backend/src/
├── routers/
│   └── chat.py               # Chat endpoint (NEW!)
│
├── models/
│   ├── task.py               # Task model (from Phase 2)
│   ├── conversation.py       # Conversation model (NEW!)
│   └── message.py            # Message model (NEW!)
│
├── schemas/
│   └── chat.py               # Chat request/response schemas (NEW!)
│
├── services/
│   └── chat_service.py       # Chat business logic (NEW!)
│
├── agents/                   # OpenAI Agents (from openai-agents-setup)
│   ├── gemini_config.py
│   ├── mcp_tools.py
│   ├── hooks.py
│   ├── todo_agent.py
│   └── runner.py
│
└── main.py                   # Add chat router
```

---

## Database Models

### Conversation Model

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

    # Relationship to messages
    messages: list["Message"] = Relationship(back_populates="conversation")
```

### Message Model

```python
# backend/src/models/message.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from .conversation import Conversation

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    conversation: "Conversation" = Relationship(back_populates="messages")
```

---

## Chat Schemas

```python
# backend/src/schemas/chat.py
from pydantic import BaseModel
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

class ChatResponse(BaseModel):
    success: bool
    data: dict

class ChatData(BaseModel):
    response: str
    conversation_id: int
    message_id: int
```

---

## Chat Router

```python
# backend/src/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from src.database import get_session
from src.middleware.auth import verify_jwt
from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import ChatRequest, ChatResponse
from src.agents import run_todo_agent
from datetime import datetime

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """
    Handle chat messages - STATELESS endpoint.

    1. Validate user owns the conversation (if conversation_id provided)
    2. Load conversation history from database
    3. Run agent with message + history
    4. Store user message + agent response
    5. Return response
    """
    # CRITICAL: Enforce user isolation
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get or create conversation
    if request.conversation_id:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == user_id
            )
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conversation = Conversation(
            user_id=user_id,
            title=request.message[:50] + "..." if len(request.message) > 50 else request.message
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # Load conversation history
    history_messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    ).all()

    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history_messages
    ]

    # Store user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    session.add(user_message)
    session.commit()
    session.refresh(user_message)

    try:
        # Run the agent
        result = await run_todo_agent(
            user_message=request.message,
            user_id=user_id,
            conversation_history=conversation_history,
        )

        agent_response = result["response"]

        # Store agent response
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=agent_response,
        )
        session.add(assistant_message)

        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        session.add(conversation)
        session.commit()
        session.refresh(assistant_message)

        return ChatResponse(
            success=True,
            data={
                "response": agent_response,
                "conversation_id": conversation.id,
                "message_id": assistant_message.id,
            }
        )

    except Exception as e:
        # Log the error
        import logging
        logging.error(f"Agent execution failed: {e}")

        return ChatResponse(
            success=False,
            data={
                "error": "Failed to process message. Please try again.",
                "conversation_id": conversation.id,
            }
        )
```

---

## Chat Service (Optional - for complex logic)

```python
# backend/src/services/chat_service.py
from sqlmodel import Session, select
from src.models.conversation import Conversation
from src.models.message import Message
from src.agents import run_todo_agent
from datetime import datetime


class ChatService:
    def __init__(self, session: Session):
        self.session = session

    async def process_message(
        self,
        user_id: str,
        message: str,
        conversation_id: int | None = None,
    ) -> dict:
        """Process a chat message and return the response."""
        conversation = self._get_or_create_conversation(user_id, message, conversation_id)
        history = self._load_conversation_history(conversation.id)

        # Store user message
        user_msg = self._store_message(conversation.id, "user", message)

        # Run agent
        result = await run_todo_agent(
            user_message=message,
            user_id=user_id,
            conversation_history=history,
        )

        # Store response
        assistant_msg = self._store_message(
            conversation.id, "assistant", result["response"]
        )

        # Update conversation
        conversation.updated_at = datetime.utcnow()
        self.session.add(conversation)
        self.session.commit()

        return {
            "response": result["response"],
            "conversation_id": conversation.id,
            "message_id": assistant_msg.id,
        }

    def _get_or_create_conversation(
        self, user_id: str, message: str, conversation_id: int | None
    ) -> Conversation:
        if conversation_id:
            conv = self.session.exec(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                )
            ).first()
            if conv:
                return conv

        # Create new
        conv = Conversation(
            user_id=user_id,
            title=message[:50]
        )
        self.session.add(conv)
        self.session.commit()
        self.session.refresh(conv)
        return conv

    def _load_conversation_history(self, conversation_id: int) -> list[dict]:
        messages = self.session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        ).all()
        return [{"role": m.role, "content": m.content} for m in messages]

    def _store_message(self, conversation_id: int, role: str, content: str) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )
        self.session.add(msg)
        self.session.commit()
        self.session.refresh(msg)
        return msg
```

---

## Register Router in main.py

```python
# backend/src/main.py
from fastapi import FastAPI
from src.routers import tasks, chat  # Add chat

app = FastAPI(title="Todo API")

# Include routers
app.include_router(tasks.router)
app.include_router(chat.router)  # Add this
```

---

## Database Migration

```bash
# Create migration for new tables
cd backend
alembic revision --autogenerate -m "Add conversations and messages tables"
alembic upgrade head
```

---

## API Contract

### POST /api/{user_id}/chat

**Request:**
```json
{
  "message": "Add a task to buy groceries",
  "conversation_id": null
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "response": "I've added a new task 'buy groceries' for you!",
    "conversation_id": 123,
    "message_id": 456
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "data": {
    "error": "Failed to process message. Please try again.",
    "conversation_id": 123
  }
}
```

---

## Verification Checklist

- [ ] Conversation model created
- [ ] Message model created
- [ ] Chat schemas defined
- [ ] Chat router implemented
- [ ] JWT validation on endpoint
- [ ] User isolation enforced
- [ ] Conversation history loaded from DB
- [ ] Messages stored in DB
- [ ] Agent integration working
- [ ] Error handling implemented
- [ ] Database migration applied

---

## Environment Variables

```env
# From Phase 2
DATABASE_URL=postgresql://user:pass@host/db
BETTER_AUTH_SECRET=your_auth_secret

# From Phase 3
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001/mcp
```

---

## See Also

- [openai-agents-setup](../openai-agents-setup/) - Agent setup
- [fastmcp-server-setup](../fastmcp-server-setup/) - MCP server setup
- [backend-api-builder](../../agents/backend-api-builder.md) - Backend patterns
- Reference Repository: https://github.com/panaversity/learn-agentic-ai
