# Todo AI Chatbot - Spec-Driven Development

A modern, AI-powered todo application built using **Spec-Driven Development** with Claude Code and Spec-Kit Plus.

## Current Phase: Phase 3 - AI-Powered Todo Chatbot

Transform the Phase 2 web application into an AI-powered chatbot interface with natural language task management.

### Phase 3 Features

- **AI Chatbot Interface** - Natural language task management through conversation
- **OpenAI Agents SDK** - Gemini 2.5 Flash-powered AI assistant
- **MCP Server** - FastMCP with 5 task operation tools
- **SSE Streaming** - Real-time response streaming with token-by-token display
- **Conversation History** - Persistent chat storage with sidebar navigation
- **Modern UI** - Responsive chat interface with markdown support
- **Loading Indicators** - Visual feedback during AI processing
- **Auto-scroll** - Automatic scrolling to new messages
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for newline
- **Error Handling** - Graceful error messages for failures
- **Security** - Rate limiting, input sanitization, and prompt injection protection

### Hybrid Voice + AI Chat Interface

The Voice Assistant page now features a **Hybrid UI** that combines voice commands with real AI chat:

- **Real AI Integration** - Voice commands are processed by the Gemini-powered AI agent (not dummy responses)
- **Multi-stage Speech Feedback** - Hear "Thinking...", tool notifications, and final responses
- **Streaming Responses** - Real-time token streaming with visual indicators
- **Task List Cards** - Beautiful card-based UI for task lists with priority badges
- **Conversation History Panel** - Toggle sidebar to view chat history
- **New Chat Button** - Start fresh conversations while preserving history
- **Verbose Mode Toggle** - Switch between verbose/compact streaming indicators
- **Example Commands** - Clickable command suggestions for quick testing
- **Context Awareness** - Follow-up questions maintain conversation context

### Natural Language Commands

Talk to the AI assistant naturally to manage your tasks:

| Intent | Example Commands |
|--------|------------------|
| **Add Task** | "Add a task to buy groceries", "I need to remember to call mom", "Create task: finish report" |
| **List Tasks** | "Show me all my tasks", "What's pending?", "What have I completed?" |
| **Complete Task** | "Mark task 3 as complete", "I finished buying groceries", "Complete the meeting task" |
| **Delete Task** | "Delete task 2", "Remove the old meeting task" |
| **Update Task** | "Change task 1 to 'Call mom tonight'", "Update task 2 description to 'Include milk and eggs'" |

### Phase 3 Tech Stack

**AI/Agent Layer:**
- OpenAI Agents SDK (Agent orchestration)
- LiteLLM (Gemini 2.5 Flash integration)
- FastMCP (MCP server framework)

**Backend Additions:**
- sse-starlette (Server-Sent Events)
- httpx (Async HTTP client)

**Frontend Additions:**
- OpenAI ChatKit (Chat UI components)
- eventsource-parser (SSE parsing)

---

## Phase 2: Full-Stack Web Application (COMPLETE)

A production-ready web application with persistent storage, Better Auth authentication, and multi-user support.

### Features Implemented

- **User Authentication** - Better Auth with JWT tokens (signup, login, logout)
- **Task Management** - Full CRUD operations (Create, Read, Update, Delete)
- **Optimistic Updates** - Immediate UI feedback for all operations
- **Smooth Animations** - Framer Motion transitions for state changes
- **Real-time Validation** - React Hook Form + Zod schemas
- **Error Handling** - Toast notifications for success/error states
- **Responsive Design** - Mobile-first Tailwind CSS styling
- **User Isolation** - Tasks are private to each user
- **Voice Assistant** - Voice commands to create and complete tasks
- **Task Filtering** - Filter by status, priority
- **Task Sorting** - Sort by date, priority, title
- **Analytics Dashboard** - Task statistics and insights

### Tech Stack

**Frontend:**
- Next.js 16+ (App Router, React 19)
- TypeScript
- Tailwind CSS 4.0
- Zustand (State Management)
- Axios (HTTP Client)
- Shadcn/ui + Aceternity UI Components
- Framer Motion Animations
- Better Auth (Client-side authentication)

**Backend:**
- Python 3.13+ with UV
- FastAPI 0.115+
- SQLModel 0.0.24+ ORM
- PostgreSQL (Neon Serverless)
- Better Auth JWT Validation (JWKS)

---

## Architecture

### System Overview

```
+--------------------+       +----------------------+       +------------------+
|                    |       |                      |       |                  |
|   Next.js Frontend |<----->|   FastAPI Backend    |<----->|   Neon PostgreSQL|
|   (Vercel)         |       |   (Port 8000)        |       |                  |
|                    |       |                      |       +------------------+
|   - ChatKit UI     |       |   - JWT Auth         |
|   - Zustand Store  |       |   - Chat Router      |       +------------------+
|   - SSE Client     |       |   - OpenAI Agents    |<----->|   FastMCP Server |
|                    |       |     SDK              |       |   (Port 8001)    |
+--------------------+       +----------------------+       |                  |
                                      |                     |   - add_task     |
                                      v                     |   - list_tasks   |
                              +---------------+             |   - complete_task|
                              |  Gemini 2.5   |             |   - delete_task  |
                              |  Flash API    |             |   - update_task  |
                              +---------------+             +------------------+
```

### MCP Tools

| Tool | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `add_task` | user_id, title, description? | {task_id, status, title} | Create new task |
| `list_tasks` | user_id, status? | [{id, title, completed, ...}] | List user's tasks |
| `complete_task` | user_id, task_id | {task_id, status, title} | Mark task complete |
| `delete_task` | user_id, task_id | {task_id, status, title} | Delete task |
| `update_task` | user_id, task_id, title?, description? | {task_id, status, title} | Update task |

---

## Project Structure

```
├── frontend/                 # Next.js application
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/          # Auth pages (login, signup)
│   │   ├── (dashboard)/     # Dashboard pages
│   │   └── chat/            # Chat page (Phase 3)
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── tasks/           # Task components
│   │   ├── chat/            # Chat components (Phase 3)
│   │   └── conversation/    # Conversation sidebar (Phase 3)
│   ├── stores/              # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── task-store.ts
│   │   └── conversation-store.ts (Phase 3)
│   └── lib/                 # Utilities and API client
│       ├── api/             # Axios API modules
│       └── sse/             # SSE client (Phase 3)
│
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── models/          # SQLModel database models
│   │   ├── services/        # Business logic
│   │   ├── routers/         # API routes
│   │   ├── agents/          # AI Agent code (Phase 3)
│   │   ├── mcp_server/      # FastMCP server (Phase 3)
│   │   └── schemas/         # Pydantic schemas
│   ├── tests/               # Pytest tests
│   └── alembic/             # Database migrations
│
├── specs/                    # Feature specifications
│   ├── 001-phase-2-web-app/ # Phase 2 specs
│   ├── features/            # Feature specs
│   ├── api/                 # API documentation
│   ├── database/            # Schema specifications
│   └── ui/                  # Component & page specs
│
├── .claude/                  # Claude Code configuration
│   ├── agents/              # Specialized development agents
│   │   ├── backend-api-builder.md
│   │   ├── frontend-ui-builder.md
│   │   ├── database-designer.md
│   │   ├── ai-agent-builder.md     (Phase 3)
│   │   ├── mcp-server-builder.md   (Phase 3)
│   │   └── chatbot-ui-builder.md   (Phase 3)
│   └── skills/              # Setup & configuration skills
│       ├── fastapi-setup/
│       ├── nextjs-setup/
│       ├── shadcn-ui-setup/
│       ├── neon-db-setup/
│       ├── better-auth-integration/
│       ├── openai-agents-setup/       (Phase 3)
│       ├── fastmcp-server-setup/      (Phase 3)
│       ├── chat-api-integration/      (Phase 3)
│       ├── openai-chatkit-setup/      (Phase 3)
│       ├── streaming-sse-setup/       (Phase 3)
│       └── conversation-management/   (Phase 3)
│
├── history/                  # PHRs and ADRs
│   ├── prompts/             # Prompt History Records
│   └── adr/                 # Architecture Decision Records
│
├── prompts/                  # Phase 2 core prompts (reference)
│   ├── constitution-prompt-phase-2.md
│   ├── spec-prompt-phase-2.md
│   └── plan-prompt-phase-2.md
│
├── constitution-prompt-phase-3.md    # Phase 3 constitution
├── spec-prompt-phase-3.md            # Phase 3 specification
├── plan-prompt-phase-3.md            # Phase 3 implementation plan
└── CLAUDE.md                         # Root agent orchestrator
```

---

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL or Neon account
- UV package manager (`pip install uv`)
- Gemini API Key (for Phase 3 AI features)

### Backend Setup

```bash
cd backend
uv sync                    # Install dependencies
cp .env.example .env       # Configure environment
# Edit .env with your database URL and API keys
uv run alembic upgrade head       # Run migrations
uv run uvicorn src.main:app --reload
```

Backend will run at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install                # Install dependencies
cp .env.example .env.local # Configure environment
# Edit .env.local with API URL
npm run dev                # Start dev server
```

Frontend will run at http://localhost:3000

### Phase 3 AI Chatbot Setup

```bash
# 1. Install backend AI dependencies
cd backend
uv add openai-agents fastmcp litellm sse-starlette httpx

# 2. Install frontend chat dependencies
cd frontend
npm install eventsource-parser

# 3. Configure Gemini API key in backend/.env
GEMINI_API_KEY=your-gemini-api-key-here

# 4. Run MCP server (separate terminal)
cd backend
uv run python -m src.mcp_server.server

# 5. Start backend (separate terminal)
cd backend
uv run uvicorn src.main:app --reload

# 6. Start frontend (separate terminal)
cd frontend
npm run dev
```

### Accessing the Chat Interface

1. Navigate to http://localhost:3000
2. Log in with your account
3. Click "Chat" in the navigation
4. Start typing natural language commands to manage tasks

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000

# Phase 3 - AI Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Phase 3 - MCP Server
MCP_SERVER_URL=http://localhost:8001
MCP_SERVER_PORT=8001
```

### Frontend (.env.local)

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# ChatKit (for production deployment)
# Get domain key from: https://platform.openai.com/settings/organization/security/domain-allowlist
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
```

### Getting API Keys

**Gemini API Key:**
1. Visit https://ai.google.dev/
2. Sign in with Google account
3. Navigate to "Get API Key"
4. Create a new API key
5. Copy to `GEMINI_API_KEY` in backend/.env

**ChatKit Domain Allowlist (Production Only):**
1. Deploy frontend to get URL (e.g., `https://your-app.vercel.app`)
2. Add domain at: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Copy domain key to `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`
4. Note: localhost works without configuration

---

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Phase 2 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List all tasks |
| POST | `/api/{user_id}/tasks` | Create task |
| GET | `/api/{user_id}/tasks/{id}` | Get task |
| PUT | `/api/{user_id}/tasks/{id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle complete |

### Phase 3 Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{user_id}/chat` | Send message (non-streaming) |
| POST | `/api/{user_id}/chat/stream` | Send message (SSE streaming) |
| GET | `/api/{user_id}/conversations` | List conversations |
| GET | `/api/{user_id}/conversations/{id}` | Get conversation with messages |
| DELETE | `/api/{user_id}/conversations/{id}` | Delete conversation |

### Chat Request/Response Format

**Request:**
```json
{
  "conversation_id": 123,  // optional - creates new if not provided
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

**Response (SSE streaming):**
```
event: token
data: {"content": "I've "}

event: token
data: {"content": "added "}

event: tool_call
data: {"tool": "add_task", "args": {"title": "Buy groceries"}}

event: tool_result
data: {"task_id": 789, "status": "created"}

event: done
data: {"conversation_id": 123, "message_id": 456}
```

---

## Performance & Security

### Performance Targets

| Metric | Target |
|--------|--------|
| First token latency | < 2 seconds |
| Full response time | < 30 seconds |
| MCP tool execution | < 500ms |
| Conversation load | < 1 second |
| Concurrent sessions | 100+ |

### Security Measures

- **JWT Authentication**: All chat endpoints require valid JWT tokens
- **User Isolation**: Users can only access their own conversations and tasks
- **Rate Limiting**: 30 messages/minute per user (enforced by middleware)
- **Input Validation**: Message length limited to 4000 characters (enforced by Pydantic)
- **Input Sanitization**: Protection against prompt injection attacks (automatic sanitization)
- **Graceful Error Handling**: User-friendly error messages for AI model failures
- **Audit Trail**: Tool calls are logged for security review
- **HTTPS Required**: All production traffic uses HTTPS encryption

---

## Development Methodology

This project follows **Spec-Driven Development**:

1. **Constitution** - Define project principles and constraints
2. **Specification** - Write user stories and acceptance criteria
3. **Plan** - Create implementation architecture
4. **Tasks** - Break down into testable tasks
5. **Implement** - Generate code with Claude Code
6. **Document** - Record decisions in PHRs and ADRs

### Available Slash Commands

```bash
/sp.constitution  # Define project principles
/sp.specify       # Create feature specification
/sp.plan          # Generate implementation plan
/sp.tasks         # Break plan into tasks
/sp.implement     # Execute implementation
/sp.clarify       # Ask clarifying questions
/sp.analyze       # Analyze existing code
/sp.checklist     # Generate completion checklist
/sp.adr           # Document architecture decision
/sp.phr           # Create prompt history record
/sp.git.commit_pr # Commit and create PR
```

---

## See Also

- [CLAUDE.md](./CLAUDE.md) - Root agent orchestrator
- [Phase 3 Constitution](./constitution-prompt-phase-3.md)
- [Phase 3 Specification](./spec-prompt-phase-3.md)
- [Phase 3 Plan](./plan-prompt-phase-3.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

### External Documentation

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [OpenAI ChatKit](https://platform.openai.com/docs/guides/chatkit)
- [Gemini API](https://ai.google.dev/docs)

---

## License

MIT
