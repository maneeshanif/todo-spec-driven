# Backend Guidelines - Todo AI Chatbot Phase 3

**Project**: Todo AI Chatbot Application - Backend
**Phase**: Phase 3 - AI-Powered Todo Chatbot
**Technology**: Python FastAPI + SQLModel + OpenAI Agents SDK + FastMCP

---

## 🚨 ABSOLUTE REQUIREMENTS - READ FIRST

### ⛔ STOP! Before ANY Backend Work

**You MUST complete these steps IN ORDER:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: READ ROOT CLAUDE.md                                            │
│  → ../CLAUDE.md contains project-wide rules                             │
│  → All rules from root apply here                                       │
│                                                                         │
│  STEP 2: INVOKE SKILL (MANDATORY)                                       │
│  → Skill(skill: "matching-skill-name")                                  │
│  → See Skill Matching Table below                                       │
│                                                                         │
│  STEP 3: FETCH CONTEXT7 DOCS (MANDATORY)                                │
│  → mcp__context7__resolve-library-id                                    │
│  → mcp__context7__get-library-docs                                      │
│                                                                         │
│  STEP 4: DELEGATE TO SUBAGENT (MANDATORY)                               │
│  → Task(subagent_type: "agent-name", prompt: "...")                     │
│  → NEVER write backend code directly                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**VIOLATION OF THESE STEPS IS FORBIDDEN. NO EXCEPTIONS.**

---

## Coupling with Root CLAUDE.md

This file extends the root `../CLAUDE.md`. **ALWAYS read the root file first** for:
- Project overview and phase information
- Available agents and skills
- Spec-driven development workflow
- PHR and ADR requirements

**Parent Files (Read in Order):**
1. `../CLAUDE.md` - Root project rules
2. `../constitution-prompt-phase-3.md` - Phase 3 constitution
3. `../spec-prompt-phase-3.md` - Phase 3 specifications
4. `../plan-prompt-phase-3.md` - Phase 3 implementation plan

---

## 🎯 BACKEND SKILL INVOCATION - MANDATORY

### Skill Matching Table - USE FOR EVERY BACKEND TASK

| When User Asks About... | INVOKE SKILL | Then Use Agent |
|-------------------------|--------------|----------------|
| FastAPI setup, project init, routes | `fastapi-setup` | `backend-api-builder` |
| Database setup, Neon, PostgreSQL | `neon-db-setup` | `database-designer` |
| Authentication, Better Auth, JWT | `better-auth-integration` | `backend-api-builder` |
| OpenAI Agents SDK, AI agent, Gemini | `openai-agents-setup` | `ai-agent-builder` |
| FastMCP server, MCP tools | `fastmcp-server-setup` | `mcp-server-builder` |
| Chat API, chat endpoint | `chat-api-integration` | `backend-api-builder` |
| SSE streaming, real-time responses | `streaming-sse-setup` | `backend-api-builder` |

### Backend Skills Reference

| Skill Name | Path | Purpose |
|------------|------|---------|
| `fastapi-setup` | `../.claude/skills/fastapi-setup/SKILL.md` | FastAPI project initialization |
| `neon-db-setup` | `../.claude/skills/neon-db-setup/SKILL.md` | Neon PostgreSQL configuration |
| `better-auth-integration` | `../.claude/skills/better-auth-integration/SKILL.md` | Better Auth implementation |
| `openai-agents-setup` | `../.claude/skills/openai-agents-setup/SKILL.md` | OpenAI Agents + Gemini |
| `fastmcp-server-setup` | `../.claude/skills/fastmcp-server-setup/SKILL.md` | FastMCP server creation |
| `chat-api-integration` | `../.claude/skills/chat-api-integration/SKILL.md` | Chat API endpoint |
| `streaming-sse-setup` | `../.claude/skills/streaming-sse-setup/SKILL.md` | SSE streaming setup |

---

## 🤖 BACKEND AGENT DELEGATION - MANDATORY

### ABSOLUTE RULE: NEVER WRITE BACKEND CODE DIRECTLY

**All backend code generation MUST be delegated to a specialized subagent:**

| Code Type | DELEGATE TO AGENT | subagent_type |
|-----------|-------------------|---------------|
| FastAPI endpoints, routes | Backend API Builder | `backend-api-builder` |
| FastAPI services, middleware | Backend API Builder | `backend-api-builder` |
| JWT validation, auth middleware | Backend API Builder | `backend-api-builder` |
| SQLModel models, schemas | Database Designer | `database-designer` |
| Alembic migrations | Database Designer | `database-designer` |
| OpenAI Agents SDK code | AI Agent Builder | `ai-agent-builder` |
| Gemini/LiteLLM configuration | AI Agent Builder | `ai-agent-builder` |
| @function_tool wrappers | AI Agent Builder | `ai-agent-builder` |
| FastMCP server | MCP Server Builder | `mcp-server-builder` |
| @mcp.tool() definitions | MCP Server Builder | `mcp-server-builder` |

### Agent Invocation Pattern

```
Task(
  subagent_type: "backend-api-builder",
  prompt: "Create a FastAPI endpoint for...",
  description: "Create API endpoint"
)
```

---

## 🔍 CONTEXT7 MCP - MANDATORY DOCUMENTATION LOOKUP

### BEFORE Writing ANY Backend Code

**You MUST fetch latest docs using Context7:**

```
# Phase 2 (Foundation)
1. mcp__context7__resolve-library-id(libraryName: "fastapi")
2. mcp__context7__resolve-library-id(libraryName: "sqlmodel")
3. mcp__context7__resolve-library-id(libraryName: "pydantic")

# Phase 3 (AI Chatbot)
4. mcp__context7__resolve-library-id(libraryName: "openai-agents-sdk")
5. mcp__context7__resolve-library-id(libraryName: "fastmcp")
6. mcp__context7__resolve-library-id(libraryName: "litellm")
7. mcp__context7__resolve-library-id(libraryName: "sse-starlette")
```

**NEVER ASSUME API PATTERNS - ALWAYS VERIFY WITH CONTEXT7!**

---

## 📋 SPEC READING - MANDATORY

### Required Spec Reading Before Implementation

| Spec | Path | Purpose |
|------|------|--------|
| API Endpoints | `../specs/api/rest-endpoints.md` | Task API docs |
| Chat Endpoints | `../specs/api/chat-endpoints.md` | Chat API docs |
| Database Schema | `../specs/database/schema.md` | Tables, indexes |
| Chat Schema | `../specs/database/chat-schema.md` | Conversation/Message |
| Chatbot Feature | `../specs/features/chatbot.md` | AI chatbot requirements |

---

## 🔄 COMPLETE BACKEND WORKFLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANDATORY BACKEND WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. IDENTIFY TASK TYPE                                                  │
│     └─ API endpoint? Database model? AI agent? MCP tool?                │
│                                                                         │
│  2. INVOKE SKILL                                                        │
│     └─ Skill(skill: "matching-skill-name")                              │
│     └─ Read examples and patterns from SKILL.md                         │
│                                                                         │
│  3. FETCH CONTEXT7 DOCS                                                 │
│     └─ Fetch docs for FastAPI, SQLModel, etc.                           │
│     └─ For AI: fetch OpenAI Agents SDK, FastMCP, LiteLLM                │
│                                                                         │
│  4. READ RELEVANT SPECS                                                 │
│     └─ API spec, database schema, feature spec                          │
│                                                                         │
│  5. DELEGATE TO SUBAGENT                                                │
│     └─ Task(subagent_type: "backend-api-builder", prompt: "...")        │
│     └─ Or Task(subagent_type: "database-designer", prompt: "...")       │
│     └─ Or Task(subagent_type: "ai-agent-builder", prompt: "...")        │
│     └─ Or Task(subagent_type: "mcp-server-builder", prompt: "...")      │
│                                                                         │
│  6. VERIFY & TEST                                                       │
│     └─ Run tests, check types, verify functionality                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Example: User asks "Create a chat endpoint"

```
1. IDENTIFY: API endpoint + AI agent integration
2. SKILLS:
   - Skill(skill: "chat-api-integration")
   - Skill(skill: "streaming-sse-setup")
3. CONTEXT7: Fetch FastAPI, SSE-Starlette docs
4. SPECS: Read specs/api/chat-endpoints.md
5. DELEGATE: Task(subagent_type: "backend-api-builder", prompt: "...")
```

### Example: User asks "Add MCP tool for task creation"

```
1. IDENTIFY: MCP tool definition
2. SKILL: Skill(skill: "fastmcp-server-setup")
3. CONTEXT7: Fetch FastMCP docs
4. SPECS: Read specs/features/chatbot.md
5. DELEGATE: Task(subagent_type: "mcp-server-builder", prompt: "...")
```

---

## Technology Stack

### Phase 2 (Foundation)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.13+ | Programming language |
| FastAPI | 0.115+ | Web framework |
| SQLModel | 0.0.24+ | ORM (SQLAlchemy + Pydantic) |
| Pydantic | 2.0+ | Data validation |
| PostgreSQL | 16+ | Database (Neon Serverless) |
| UV | Latest | Package manager |
| pytest | 8.0+ | Testing framework |
| Alembic | 1.13+ | Database migrations |

### Phase 3 (AI Chatbot)

| Technology | Version | Purpose |
|------------|---------|---------|
| openai-agents | 0.1.0+ | AI agent orchestration |
| fastmcp | Latest | MCP server framework |
| litellm | Latest | Multi-LLM support (Gemini) |
| sse-starlette | Latest | Server-Sent Events |
| httpx | Latest | Async HTTP client |

---

## Project Structure (Phase 3)

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry
│   ├── config.py                # Configuration & settings
│   ├── database.py              # Database connection
│   │
│   ├── models/                  # SQLModel models
│   │   ├── __init__.py
│   │   ├── task.py             # Task model (Phase 2)
│   │   ├── category.py         # Category model (Phase 2)
│   │   ├── conversation.py     # Conversation model (Phase 3)
│   │   └── message.py          # Message model (Phase 3)
│   │
│   ├── routers/api/routes/      # API endpoints
│   │   ├── __init__.py
│   │   ├── tasks.py            # Task CRUD (Phase 2)
│   │   ├── categories.py       # Category CRUD (Phase 2)
│   │   ├── stats.py            # Analytics (Phase 2)
│   │   └── chat.py             # Chat endpoint (Phase 3)
│   │
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── task_service.py     # Task operations
│   │   ├── category_service.py # Category operations
│   │   ├── stats_service.py    # Analytics
│   │   └── conversation_service.py  # Conversation CRUD (Phase 3)
│   │
│   ├── agents/                  # AI Agent code (Phase 3)
│   │   ├── __init__.py
│   │   ├── config.py           # Gemini/LiteLLM configuration
│   │   ├── tools.py            # @function_tool wrappers for MCP
│   │   ├── hooks.py            # AgentHooks and RunHooks
│   │   ├── todo_agent.py       # Agent definition with system prompt
│   │   └── runner.py           # Agent execution utilities
│   │
│   ├── mcp_server/              # FastMCP Server (Phase 3)
│   │   ├── __init__.py
│   │   ├── server.py           # FastMCP server instance
│   │   └── tools/              # Tool implementations
│   │       ├── __init__.py
│   │       ├── add_task.py
│   │       ├── list_tasks.py
│   │       ├── complete_task.py
│   │       ├── delete_task.py
│   │       └── update_task.py
│   │
│   ├── middleware/              # Middleware
│   │   ├── __init__.py
│   │   └── auth.py             # JWT validation
│   │
│   ├── schemas/                 # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── task.py             # Task schemas
│   │   ├── chat.py             # Chat request/response (Phase 3)
│   │   └── conversation.py     # Conversation schemas (Phase 3)
│   │
│   └── utils/                   # Utilities
│       ├── __init__.py
│       ├── jwt.py              # JWT utilities
│       └── sse.py              # SSE utilities (Phase 3)
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── test_tasks.py           # Task API tests
│   ├── test_chat.py            # Chat API tests (Phase 3)
│   └── test_agent.py           # Agent tests (Phase 3)
│
├── alembic/
│   ├── versions/               # Migration files
│   ├── env.py
│   └── script.py.mako
│
├── alembic.ini
├── pyproject.toml              # UV configuration
├── requirements.txt
├── .env.example
└── Dockerfile
```

---

## Phase 3 Code Patterns

### AI Agent Configuration

```python
# agents/config.py
from agents.extensions.models.litellm import LitellmModel
from src.core.config import settings

def get_gemini_model():
    """Create Gemini model via LiteLLM."""
    return LitellmModel(
        model="gemini/gemini-2.5-flash",
        api_key=settings.gemini_api_key
    )
```

### Function Tool Wrappers

```python
# agents/tools.py
from agents import function_tool, RunContextWrapper
import httpx

@function_tool
async def add_task(
    ctx: RunContextWrapper,
    user_id: str,
    title: str,
    description: str = ""
) -> str:
    """Add a new task for the user.

    Args:
        user_id: The user's ID
        title: Task title (required)
        description: Task description (optional)

    Returns:
        JSON string with task_id, status, title
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.mcp_server_url}/tools/add_task",
            json={
                "user_id": user_id,
                "title": title,
                "description": description
            }
        )
        return response.text
```

### Agent Definition

```python
# agents/todo_agent.py
from agents import Agent
from src.agents.config import get_gemini_model
from src.agents.tools import add_task, list_tasks, complete_task, delete_task, update_task

SYSTEM_PROMPT = """
You are a helpful todo assistant. You help users manage their tasks through natural language.

Available actions:
- Add new tasks (add_task)
- List tasks - all, pending, or completed (list_tasks)
- Mark tasks as complete (complete_task)
- Delete tasks (delete_task)
- Update task details (update_task)

Guidelines:
- Always confirm actions with the user
- Provide helpful, friendly responses
- If unsure which task the user means, ask for clarification
- When listing tasks, format them clearly with status indicators
- Handle errors gracefully with helpful suggestions
"""

def create_todo_agent(user_id: str) -> Agent:
    """Create a todo agent for the specified user."""
    return Agent(
        name="TodoBot",
        instructions=SYSTEM_PROMPT,
        model=get_gemini_model(),
        tools=[add_task, list_tasks, complete_task, delete_task, update_task]
    )
```

### MCP Server Tools

```python
# mcp_server/server.py
from fastmcp import FastMCP
from sqlmodel import Session, select
from src.core.database import get_session
from src.models.task import Task

mcp = FastMCP("Todo MCP Server")

@mcp.tool()
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the user.

    Args:
        user_id: The user's ID
        title: Task title (required)
        description: Task description (optional)

    Returns:
        dict with task_id, status, and title
    """
    async with get_session() as session:
        task = Task(user_id=user_id, title=title, description=description)
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title
        }

@mcp.tool()
async def list_tasks(user_id: str, status: str = "all") -> list:
    """List user's tasks, optionally filtered by status.

    Args:
        user_id: The user's ID
        status: Filter - "all", "pending", or "completed"

    Returns:
        List of task objects
    """
    async with get_session() as session:
        statement = select(Task).where(Task.user_id == user_id)
        if status == "pending":
            statement = statement.where(Task.completed == False)
        elif status == "completed":
            statement = statement.where(Task.completed == True)

        tasks = (await session.exec(statement)).all()
        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "created_at": t.created_at.isoformat()
            }
            for t in tasks
        ]

@mcp.tool()
async def complete_task(user_id: str, task_id: int) -> dict:
    """Mark a task as complete."""
    async with get_session() as session:
        task = await session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return {"error": "Task not found"}
        task.completed = True
        await session.commit()
        return {"task_id": task.id, "status": "completed", "title": task.title}

@mcp.tool()
async def delete_task(user_id: str, task_id: int) -> dict:
    """Delete a task."""
    async with get_session() as session:
        task = await session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return {"error": "Task not found"}
        await session.delete(task)
        await session.commit()
        return {"task_id": task_id, "status": "deleted", "title": task.title}

@mcp.tool()
async def update_task(
    user_id: str,
    task_id: int,
    title: str = None,
    description: str = None
) -> dict:
    """Update a task's title or description."""
    async with get_session() as session:
        task = await session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return {"error": "Task not found"}
        if title:
            task.title = title
        if description is not None:
            task.description = description
        await session.commit()
        return {"task_id": task.id, "status": "updated", "title": task.title}
```

### Chat Endpoint with SSE

```python
# routers/api/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import json

from src.core.auth_deps import get_current_user, verify_user_access
from src.services.conversation_service import ConversationService
from src.agents.todo_agent import create_todo_agent
from src.agents.runner import run_agent_streamed
from src.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])

@router.post("/")
async def chat(
    user_id: str,
    request: ChatRequest,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Chat with the AI assistant (non-streaming)."""
    verify_user_access(current_user, user_id)

    # Get or create conversation
    conversation = await conversation_service.get_or_create(
        user_id, request.conversation_id
    )

    # Get message history
    history = await conversation_service.get_messages(conversation.id)

    # Store user message
    await conversation_service.add_message(
        conversation.id, "user", request.message
    )

    # Run agent
    agent = create_todo_agent(user_id)
    response = await run_agent(agent, history, request.message)

    # Store assistant response
    await conversation_service.add_message(
        conversation.id, "assistant", response.content,
        tool_calls=response.tool_calls
    )

    return ChatResponse(
        conversation_id=conversation.id,
        response=response.content,
        tool_calls=response.tool_calls
    )

@router.post("/stream")
async def chat_stream(
    user_id: str,
    request: ChatRequest,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Chat with the AI assistant (SSE streaming)."""
    verify_user_access(current_user, user_id)

    conversation = await conversation_service.get_or_create(
        user_id, request.conversation_id
    )
    history = await conversation_service.get_messages(conversation.id)
    await conversation_service.add_message(
        conversation.id, "user", request.message
    )

    agent = create_todo_agent(user_id)

    async def generate():
        full_response = ""
        tool_calls = []

        async for event in run_agent_streamed(agent, history, request.message):
            if event.type == "token":
                full_response += event.content
                yield {
                    "event": "token",
                    "data": json.dumps({"content": event.content})
                }
            elif event.type == "tool_call":
                tool_calls.append(event.data)
                yield {
                    "event": "tool_call",
                    "data": json.dumps(event.data)
                }
            elif event.type == "tool_result":
                yield {
                    "event": "tool_result",
                    "data": json.dumps(event.data)
                }

        # Store complete response
        await conversation_service.add_message(
            conversation.id, "assistant", full_response,
            tool_calls=tool_calls if tool_calls else None
        )

        yield {
            "event": "done",
            "data": json.dumps({
                "conversation_id": conversation.id,
                "message_id": await conversation_service.get_last_message_id(conversation.id)
            })
        }

    return EventSourceResponse(generate())
```

### Conversation Service

```python
# services/conversation_service.py
from sqlmodel import Session, select
from src.models.conversation import Conversation
from src.models.message import Message
import json

class ConversationService:
    def __init__(self, session: Session):
        self.session = session

    async def get_or_create(
        self, user_id: str, conversation_id: int | None
    ) -> Conversation:
        """Get existing conversation or create new one."""
        if conversation_id:
            conversation = await self.session.get(Conversation, conversation_id)
            if conversation and conversation.user_id == user_id:
                return conversation

        # Create new conversation
        conversation = Conversation(user_id=user_id)
        self.session.add(conversation)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def get_messages(self, conversation_id: int) -> list[dict]:
        """Get message history for agent context."""
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        messages = (await self.session.exec(statement)).all()
        return [
            {"role": m.role, "content": m.content}
            for m in messages
        ]

    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        tool_calls: list | None = None
    ) -> Message:
        """Add message to conversation."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls=json.dumps(tool_calls) if tool_calls else None
        )
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)

        # Update conversation title from first user message
        if role == "user":
            conversation = await self.session.get(Conversation, conversation_id)
            if not conversation.title:
                conversation.title = content[:100]
                await self.session.commit()

        return message
```

---

## Database Models (Phase 3)

### Conversation Model

```python
# models/conversation.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    title: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    messages: List["Message"] = Relationship(back_populates="conversation")
```

### Message Model

```python
# models/message.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # 'user' | 'assistant' | 'system'
    content: str = Field()
    tool_calls: Optional[str] = Field(default=None)  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)

    conversation: Optional["Conversation"] = Relationship(back_populates="messages")
```

---

## API Conventions

### Chat Endpoints

| Method | Pattern | Action |
|--------|---------|--------|
| POST | `/api/{user_id}/chat` | Send message (non-streaming) |
| POST | `/api/{user_id}/chat/stream` | Send message (SSE streaming) |
| GET | `/api/{user_id}/conversations` | List conversations |
| GET | `/api/{user_id}/conversations/{id}` | Get conversation with messages |
| DELETE | `/api/{user_id}/conversations/{id}` | Delete conversation |

### Chat Request/Response

**Request:**
```json
{
  "conversation_id": 123,  // optional
  "message": "Add a task to buy groceries"
}
```

**Response (non-streaming):**
```json
{
  "success": true,
  "data": {
    "conversation_id": 123,
    "message_id": 456,
    "response": "I've added 'Buy groceries' to your task list.",
    "tool_calls": [
      {
        "tool": "add_task",
        "args": {"title": "Buy groceries"},
        "result": {"task_id": 789, "status": "created"}
      }
    ]
  }
}
```

### SSE Event Format

```
event: token
data: {"content": "I've "}

event: tool_call
data: {"tool": "add_task", "args": {"title": "Buy groceries"}}

event: tool_result
data: {"task_id": 789, "status": "created"}

event: done
data: {"conversation_id": 123, "message_id": 456}
```

---

## Security Requirements

### JWT Authentication

All chat endpoints MUST:
1. Require valid JWT token in `Authorization: Bearer <token>` header
2. Validate token signature and expiration
3. Extract user_id from token payload
4. Enforce user isolation for conversations

### Conversation Security

```python
def verify_conversation_access(
    current_user: CurrentUser,
    conversation: Conversation
):
    """Verify user owns the conversation."""
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
```

### MCP Tool Security

All MCP tools MUST:
1. Accept user_id as first parameter
2. Verify user_id matches resource ownership
3. Return error dict if access denied
4. Never expose internal errors

---

## Environment Variables (Phase 3)

```env
# Existing Phase 2 variables
DATABASE_URL=postgresql+asyncpg://...
BETTER_AUTH_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

# Phase 3 AI/Agent variables
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001
MCP_SERVER_PORT=8001
```

---

## Quick Commands

```bash
# Development
cd backend

# Install Phase 3 dependencies
uv add openai-agents fastmcp litellm sse-starlette httpx

# Run FastAPI server
uv run uvicorn src.main:app --reload --port 8000

# Run MCP server (separate terminal)
uv run python -m src.mcp_server.server

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=src --cov-report=html

# Create migration
uv run alembic revision --autogenerate -m "Add conversations and messages tables"

# Apply migrations
uv run alembic upgrade head
```

---

## Testing Strategy (Phase 3)

| Type | Tool | What to Test |
|------|------|--------------|
| Unit | pytest | Agent tools, MCP handlers, services |
| Integration | pytest + httpx | Chat API, conversation CRUD |
| E2E | pytest | Full chat flow with agent |

**Target Coverage**: 80%

### Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_chat_creates_task(client: AsyncClient, auth_token: str):
    response = await client.post(
        "/api/test-user/chat",
        json={"message": "Add a task to buy groceries"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "conversation_id" in data
    assert "Buy groceries" in data["response"].lower() or "groceries" in str(data["tool_calls"])
```

---

## Quality Checklist

Before considering Phase 3 backend work complete:

- [ ] OpenAI Agents SDK configured with Gemini
- [ ] All 5 MCP tools implemented and tested
- [ ] Chat endpoint working (non-streaming)
- [ ] Chat endpoint working (SSE streaming)
- [ ] Conversation/Message models created
- [ ] Conversation service with CRUD
- [ ] JWT validation on all chat endpoints
- [ ] User isolation enforced
- [ ] SSE events follow spec format
- [ ] Error handling implemented
- [ ] Tests written and passing (>80%)
- [ ] Environment variables documented
- [ ] Database migrations created
