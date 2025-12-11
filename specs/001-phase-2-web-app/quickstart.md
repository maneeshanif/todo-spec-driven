# Quickstart Guide: Todo Web Application - Phase 2

**Feature**: Todo Web Application - Phase 2
**Date**: 2025-12-11
**Status**: Complete

This guide provides step-by-step instructions for setting up the local development environment for both frontend and backend services.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Check Command | Install Link |
|----------|----------------|---------------|--------------|
| **Python** | 3.13+ | `python --version` | https://www.python.org/downloads/ |
| **UV** | Latest | `uv --version` | `pip install uv` |
| **Node.js** | 20+ | `node --version` | https://nodejs.org/ |
| **npm** | 10+ | `npm --version` | Comes with Node.js |
| **Git** | 2.0+ | `git --version` | https://git-scm.com/ |
| **PostgreSQL** | 14+ (optional local) | `psql --version` | https://www.postgresql.org/ |

### Optional Tools

- **Docker** (for containerized development): https://www.docker.com/
- **VS Code** (recommended IDE): https://code.visualstudio.com/
- **Postman** (API testing): https://www.postman.com/

---

## Project Structure Overview

```
todo-web-hackthon/
├── backend/          # FastAPI backend service
├── frontend/         # Next.js frontend application
├── specs/            # Specifications and documentation
├── history/          # PHRs and ADRs
├── .gitignore
└── README.md
```

---

## Part 1: Database Setup (Neon PostgreSQL)

### Option A: Neon Serverless (Recommended for Phase 2)

1. **Create Neon Account**:
   - Visit https://neon.tech
   - Sign up with GitHub or email
   - Create a new project: "todo-app-phase-2"

2. **Get Connection String**:
   ```bash
   # Example connection string from Neon dashboard:
   postgresql://user:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. **Save for Later**:
   - Copy the connection string
   - You'll add it to `.env` files in the next steps

### Option B: Local PostgreSQL (Development Alternative)

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb todoapp_dev

# Connection string for local:
postgresql://localhost:5432/todoapp_dev
```

---

## Part 2: Backend Setup (FastAPI)

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Initialize UV Project

```bash
# Initialize UV project
uv init

# Install dependencies
uv add fastapi sqlmodel pydantic pydantic-settings
uv add uvicorn[standard]  # ASGI server
uv add pyjwt  # JWT handling
uv add bcrypt  # Password hashing
uv add python-multipart  # Form data
uv add alembic  # Database migrations
uv add asyncpg  # Async PostgreSQL driver

# Development dependencies
uv add --dev pytest pytest-asyncio httpx
uv add --dev black ruff mypy  # Code quality tools
```

### 3. Create Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**`.env` Template**:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
SECRET_KEY=your-secret-key-min-32-chars-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Better Auth
BETTER_AUTH_SECRET=your-better-auth-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Application
ENVIRONMENT=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# API
API_V1_PREFIX=/api
```

### 4. Generate Secret Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate BETTER_AUTH_SECRET
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Initialize Database Migrations

```bash
# Initialize Alembic
alembic init alembic

# Edit alembic.ini to use env variable
# Change: sqlalchemy.url = driver://user:pass@localhost/dbname
# To: sqlalchemy.url = ${DATABASE_URL}

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 6. Run Backend Server

```bash
# Development mode with auto-reload
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process
# INFO:     Application startup complete.
```

### 7. Verify Backend

```bash
# Open browser or curl
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","version":"1.0.0"}

# View API docs
# Browser: http://localhost:8000/docs (Swagger UI)
# Browser: http://localhost:8000/redoc (ReDoc)
```

---

## Part 3: Frontend Setup (Next.js)

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
```

### 2. Initialize Next.js Project

```bash
# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# When prompted:
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … Yes
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias (@/*)? … No
```

### 3. Install Dependencies

```bash
# Core dependencies
npm install zustand axios better-auth
npm install react-hook-form zod @hookform/resolvers
npm install framer-motion clsx tailwind-merge
npm install date-fns  # Date utilities

# Development dependencies
npm install --save-dev @types/node @types/react @types/react-dom
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev playwright @playwright/test
npm install --save-dev eslint-config-next
```

### 4. Install Shadcn/ui

```bash
# Initialize Shadcn/ui
npx shadcn@latest init

# When prompted:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › Yes

# Add components
npx shadcn@latest add button card input checkbox dialog
npx shadcn@latest add form label toast
npx shadcn@latest add dropdown-menu avatar
```

### 5. Create Environment Variables

```bash
# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local with your values
nano .env.local
```

**`.env.local` Template**:
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_PATH=/api

# Better Auth
BETTER_AUTH_SECRET=your-better-auth-secret-same-as-backend
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 6. Run Frontend Server

```bash
# Development mode with hot reload
npm run dev

# Expected output:
# ▲ Next.js 16.0.3
# - Local:        http://localhost:3000
# - Network:      http://192.168.1.x:3000
# ✓ Ready in 2.5s
```

### 7. Verify Frontend

```bash
# Open browser
open http://localhost:3000

# You should see the Next.js welcome page
```

---

## Part 4: Full Stack Integration

### 1. Test Backend from Frontend

Create a test API call in the frontend:

```typescript
// src/lib/api/client.ts (create this file)
import axios from 'axios'

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Test health endpoint
async function testBackend() {
    try {
        const response = await apiClient.get('/api/health')
        console.log('Backend connected:', response.data)
    } catch (error) {
        console.error('Backend connection failed:', error)
    }
}

testBackend()
```

### 2. Configure CORS

In `backend/src/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Run Both Services

**Terminal 1 (Backend)**:
```bash
cd backend
uv run uvicorn src.main:app --reload --port 8000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

### 4. Verify Integration

1. Frontend: http://localhost:3000
2. Backend API: http://localhost:8000
3. API Docs: http://localhost:8000/docs
4. Check browser console for "Backend connected" message

---

## Part 5: Development Workflow

### Daily Development Startup

```bash
# Option 1: Manual (two terminals)
# Terminal 1
cd backend && uv run uvicorn src.main:app --reload

# Terminal 2
cd frontend && npm run dev

# Option 2: Using docker-compose (if configured)
docker-compose up
```

### Running Tests

**Backend Tests**:
```bash
cd backend
uv run pytest
uv run pytest --cov=src  # With coverage
uv run pytest -v  # Verbose output
```

**Frontend Tests**:
```bash
cd frontend
npm run test  # Unit tests
npm run test:e2e  # E2E tests with Playwright
```

### Database Migrations

```bash
cd backend

# Create new migration after model changes
alembic revision --autogenerate -m "Add new field"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history

# Check current version
alembic current
```

### Code Quality Checks

**Backend**:
```bash
cd backend

# Format code
uv run black src/

# Lint code
uv run ruff check src/

# Type checking
uv run mypy src/
```

**Frontend**:
```bash
cd frontend

# Lint
npm run lint

# Format (if Prettier configured)
npm run format

# Type check
npm run type-check
```

---

## Part 6: Troubleshooting

### Common Issues

#### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'xyz'`
```bash
# Solution: Reinstall dependencies
uv sync
# or
uv add <package-name>
```

**Issue**: Database connection error
```bash
# Check DATABASE_URL in .env
# Verify Neon project is active
# Test connection manually
psql $DATABASE_URL
```

**Issue**: Port 8000 already in use
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn src.main:app --reload --port 8001
```

#### Frontend Issues

**Issue**: `Cannot find module '@/components/ui/button'`
```bash
# Solution: Re-add Shadcn component
npx shadcn@latest add button
```

**Issue**: CORS error in browser console
```bash
# Solution: Check backend CORS middleware
# Ensure allow_origins includes http://localhost:3000
```

**Issue**: Port 3000 already in use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### Database Issues

**Issue**: Migration conflicts
```bash
# Drop all tables (CAUTION: deletes data)
alembic downgrade base

# Re-run migrations
alembic upgrade head
```

**Issue**: Connection pool exhausted
```bash
# Increase pool size in backend/src/database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # Increase from 10
    max_overflow=40  # Increase from 20
)
```

---

## Part 7: Environment-Specific Setup

### Development

- Use `.env` (backend) and `.env.local` (frontend)
- Enable debug mode
- Verbose logging
- Hot reload enabled

### Testing

```bash
# Backend test environment
cp .env .env.test
# Change DATABASE_URL to test database

# Run tests
ENVIRONMENT=test pytest
```

### Production (Preview)

- Set `DEBUG=false`
- Use production secrets
- Disable source maps
- Enable minification

---

## Part 8: Useful Commands Cheat Sheet

### Backend Commands

```bash
# Start server
uv run uvicorn src.main:app --reload

# Run tests
uv run pytest

# Format code
uv run black src/

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "message"

# Add package
uv add <package-name>

# Python shell with models loaded
uv run python
>>> from src.models import Task, User
```

### Frontend Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm run test
npm run test:e2e

# Add Shadcn component
npx shadcn@latest add <component-name>

# Install package
npm install <package-name>
```

### Git Commands

```bash
# Create feature branch
git checkout -b feature/task-creation

# Commit changes
git add .
git commit -m "feat: implement task creation endpoint"

# Push to remote
git push -u origin feature/task-creation

# Create PR
gh pr create --title "Add task creation" --body "Implements FR-TASK-001"
```

---

## Part 9: Next Steps

After completing this quickstart:

1. ✅ Verify all services are running
2. ✅ Test API endpoints via Swagger UI (http://localhost:8000/docs)
3. ✅ Test frontend loads successfully (http://localhost:3000)
4. ✅ Run test suites (backend + frontend)
5. 📝 Begin implementation with `/sp.tasks` command
6. 🚀 Follow implementation plan from `plan.md`

---

## Part 10: Additional Resources

### Documentation Links

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLModel**: https://sqlmodel.tiangolo.com/
- **Better Auth**: https://www.better-auth.com/
- **Shadcn/ui**: https://ui.shadcn.com/
- **Zustand**: https://zustand.docs.pmnd.rs/
- **Neon**: https://neon.tech/docs

### Project Documentation

- Specification: `specs/001-phase-2-web-app/spec.md`
- Implementation Plan: `specs/001-phase-2-web-app/plan.md`
- Data Model: `specs/001-phase-2-web-app/data-model.md`
- API Contracts: `specs/001-phase-2-web-app/contracts/`

---

**Setup Complete!** ✅

You're now ready to begin implementation. Run `/sp.tasks` to generate the task breakdown, then `/sp.implement` to start coding.

**Questions?** Check the troubleshooting section or create an issue in the project repository.

**Last Updated**: 2025-12-11
