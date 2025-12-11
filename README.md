# Todo Web Application - Spec-Driven Development

A modern, full-stack todo application built using **Spec-Driven Development** with Claude Code and Spec-Kit Plus.

## Phase 2: Full-Stack Web Application ✅ COMPLETE

A production-ready web application with persistent storage, JWT authentication, and multi-user support.

### 🎯 Features Implemented

- ✅ **User Authentication** - Signup, login, logout with JWT tokens
- ✅ **Task Management** - Full CRUD operations (Create, Read, Update, Delete)
- ✅ **Optimistic Updates** - Immediate UI feedback for all operations
- ✅ **Smooth Animations** - Framer Motion transitions for state changes
- ✅ **Real-time Validation** - React Hook Form + Zod schemas
- ✅ **Error Handling** - Toast notifications for success/error states
- ✅ **Responsive Design** - Mobile-first Tailwind CSS styling
- ✅ **User Isolation** - Tasks are private to each user

### Tech Stack

**Frontend:**
- Next.js 16+ (App Router, React 19)
- TypeScript
- Tailwind CSS 4.0
- Zustand (State Management)
- Axios (HTTP Client)
- Shadcn/ui + Aceternity UI Components
- Framer Motion Animations

**Backend:**
- Python 3.13+ with UV
- FastAPI 0.115+
- SQLModel 0.0.24+ ORM
- PostgreSQL (Neon Serverless)
- JWT Authentication

### Project Structure

```
├── frontend/           # Next.js application
│   ├── app/           # Next.js App Router pages
│   ├── src/           # Source code
│   │   ├── components/ # React components
│   │   ├── lib/       # Utilities and API client
│   │   └── stores/    # Zustand stores
│   └── __tests__/     # Jest tests
├── backend/            # FastAPI application
│   ├── src/           # Source code
│   │   ├── models/    # SQLModel database models
│   │   ├── services/  # Business logic
│   │   ├── api/       # API routes
│   │   ├── core/      # Config, security, deps
│   │   └── schemas/   # Pydantic schemas
│   ├── tests/         # Pytest tests
│   └── alembic/       # Database migrations
├── specs/              # Feature specifications
│   ├── 001-phase-2-web-app/ # Current feature
│   │   ├── spec.md    # User stories
│   │   ├── plan.md    # Implementation plan
│   │   ├── tasks.md   # Task breakdown
│   │   ├── data-model.md  # Database schema
│   │   └── contracts/ # OpenAPI specs
│   ├── features/      # Legacy feature specs
│   ├── api/           # API documentation
│   ├── database/      # Schema specifications
│   └── ui/            # Component & page specs
├── .claude/            # Claude Code configuration
│   ├── agents/         # Specialized development agents
│   └── skills/         # Setup & configuration skills
├── history/            # PHRs and ADRs
│   ├── prompts/       # Prompt History Records
│   └── adr/           # Architecture Decision Records
└── prompts/            # Phase 2 core prompts
    ├── constitution-prompt-phase-2.md
    ├── spec-prompt-phase-2.md
    └── plan-prompt-phase-2.md
```

### Quick Start

#### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL or Neon account
- UV package manager (`pip install uv`)

#### Backend Setup

```bash
cd backend
uv sync                    # Install dependencies
cp .env.example .env       # Configure environment
# Edit .env with your database URL
alembic upgrade head       # Run migrations
uv run uvicorn src.main:app --reload
```

Backend will run at http://localhost:8000

#### Frontend Setup

```bash
cd frontend
npm install                # Install dependencies
cp .env.example .env.local # Configure environment
# Edit .env.local with API URL
npm run dev                # Start dev server
```

Frontend will run at http://localhost:3000

### Development Methodology

This project follows **Spec-Driven Development**:
1. Write specifications before code
2. Use Claude Code to generate implementation
3. Refine specs until output is correct
4. Document all decisions in PHRs and ADRs

### See Also

- [CLAUDE.md](./CLAUDE.md) - Root agent orchestrator
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Specification](./specs/001-phase-2-web-app/spec.md)
- [Implementation Plan](./specs/001-phase-2-web-app/plan.md)

### License

MIT
