# Todo AI Chatbot - Spec-Driven Development

A modern, AI-powered todo application built using **Spec-Driven Development** with Claude Code and Spec-Kit Plus.

## Current Phase: Phase 3 - AI-Powered Todo Chatbot 🚧

Transform the Phase 2 web application into an AI-powered chatbot interface with natural language task management.

### 🎯 Phase 3 Features (In Progress)

- 🔄 **AI Chatbot Interface** - Natural language task management
- 🔄 **OpenAI Agents SDK** - Gemini-powered AI assistant
- 🔄 **MCP Server** - FastMCP with 5 task operation tools
- 🔄 **SSE Streaming** - Real-time response streaming
- 🔄 **Conversation History** - Persistent chat storage
- 🔄 **ChatKit UI** - Modern chat interface components

### Phase 3 Tech Stack

**AI/Agent Layer:**
- OpenAI Agents SDK (Agent orchestration)
- LiteLLM (Gemini 2.5 Flash integration)
- FastMCP (MCP server framework)

**Backend Additions:**
- sse-starlette (Server-Sent Events)
- httpx (Async HTTP client)

**Frontend Additions:**
- OpenAI ChatKit (Chat UI components - verify package from https://platform.openai.com/docs/guides/chatkit)
- eventsource-parser (SSE parsing)

---

## Phase 2: Full-Stack Web Application ✅ COMPLETE

A production-ready web application with persistent storage, Better Auth authentication, and multi-user support.

### 🎯 Features Implemented

- ✅ **User Authentication** - Better Auth with JWT tokens (signup, login, logout)
- ✅ **Task Management** - Full CRUD operations (Create, Read, Update, Delete)
- ✅ **Optimistic Updates** - Immediate UI feedback for all operations
- ✅ **Smooth Animations** - Framer Motion transitions for state changes
- ✅ **Real-time Validation** - React Hook Form + Zod schemas
- ✅ **Error Handling** - Toast notifications for success/error states
- ✅ **Responsive Design** - Mobile-first Tailwind CSS styling
- ✅ **User Isolation** - Tasks are private to each user
- ✅ **Voice Assistant** - Voice commands to create and complete tasks
- ✅ **Task Filtering** - Filter by status, priority
- ✅ **Task Sorting** - Sort by date, priority, title
- ✅ **Analytics Dashboard** - Task statistics and insights

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
- Gemini API Key (for Phase 3)

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

### Phase 3 Additional Setup

```bash
# Backend - Install AI dependencies
cd backend
uv add openai-agents fastmcp litellm sse-starlette httpx

# Frontend - Install chat dependencies
cd frontend
# Note: Verify ChatKit package name from https://platform.openai.com/docs/guides/chatkit
npm install eventsource-parser
# npm install <chatkit-package>  # Install after verifying package name

# Run MCP server (separate terminal)
cd backend
uv run python -m src.mcp_server.server
```

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

# Phase 3 - AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001
MCP_SERVER_PORT=8001
```

### Frontend (.env.local) - Phase 3 Additions

```env
# ChatKit (for production deployment)
# Get domain key from: https://platform.openai.com/settings/organization/security/domain-allowlist
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
```

**ChatKit Domain Allowlist (Production)**:
Before deploying to production, add your domain to OpenAI's allowlist:
1. Deploy frontend to get URL (e.g., `https://your-app.vercel.app`)
2. Add domain at: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Copy domain key to environment variables
4. Note: localhost works without configuration

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

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

### Phase 3 Endpoints (Coming)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{user_id}/chat` | Send message (non-streaming) |
| POST | `/api/{user_id}/chat/stream` | Send message (SSE streaming) |
| GET | `/api/{user_id}/conversations` | List conversations |
| GET | `/api/{user_id}/conversations/{id}` | Get conversation |
| DELETE | `/api/{user_id}/conversations/{id}` | Delete conversation |

---

## See Also

- [CLAUDE.md](./CLAUDE.md) - Root agent orchestrator
- [Phase 3 Constitution](./constitution-prompt-phase-3.md)
- [Phase 3 Specification](./spec-prompt-phase-3.md)
- [Phase 3 Plan](./plan-prompt-phase-3.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

---

## License

MIT
