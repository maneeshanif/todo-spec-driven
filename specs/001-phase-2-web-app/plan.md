# Implementation Plan: Todo Web Application - Phase 2

**Branch**: `001-phase-2-web-app` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase-2-web-app/spec.md`

## Summary

Transform Phase 1 console application into a production-ready full-stack web application with:
- **Frontend**: Next.js 16+ (App Router, Server Components, Tailwind CSS)
- **Backend**: FastAPI 0.115+ (async API, dependency injection)
- **Database**: PostgreSQL (Neon Serverless) with SQLModel ORM
- **Authentication**: Better Auth (JWT-based, secure token management)
- **Deployment**: Vercel (frontend), Neon (database), self-contained backend

**Technical Approach**: Implement spec-driven development with API-first design, following constitution principles for maintainability, security, and testability.

---

## Technical Context

**Language/Version**: 
- Backend: Python 3.12+
- Frontend: TypeScript 5.3+ with Next.js 16+

**Primary Dependencies**:
- **Backend**: FastAPI 0.115+, SQLModel 0.0.24+, Better Auth (JWT), psycopg2-binary, python-jose
- **Frontend**: Next.js 16+, React 18+, TypeScript, Tailwind CSS, shadcn/ui, Zustand (state), Axios (HTTP)

**Storage**: PostgreSQL 16+ (Neon Serverless with connection pooling)

**Testing**: 
- Backend: pytest, pytest-asyncio, httpx (API tests)
- Frontend: Jest, React Testing Library, Playwright (E2E)
- **Note**: Test implementation deferred to post-MVP per Phase 2 scope

**Target Platform**: 
- Frontend: Vercel (Edge Runtime, CDN)
- Backend: Dockerized FastAPI (deployable to any cloud)
- Database: Neon Serverless PostgreSQL

**Project Type**: Web application (separated frontend/backend)

**Performance Goals**:
- API response time: p95 < 500ms (end-to-end including DB)
- Frontend FCP: < 1.8s on 3G
- Database query time: < 100ms for indexed lookups
- Support 1000+ concurrent users

**Constraints**:
- JWT tokens: 7-day expiry with auto-refresh when < 1 day remains
- Database: User isolation enforced via `user_id` foreign key + indexes
- API: RESTful with OpenAPI 3.1 contracts
- Security: HTTPS only, CORS configured, SQL injection prevention

**Scale/Scope**:
- MVP: 6 user stories (auth + CRUD operations)
- Expected load: 10k users, 100k tasks total
- Database: 2 tables (users, tasks) with proper indexes

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Passing Checks

- [x] **Spec-driven development**: Feature spec complete with user stories, NFRs, and acceptance criteria
- [x] **API contracts defined**: OpenAPI schemas in `contracts/auth.openapi.yaml` and `contracts/tasks.openapi.yaml`
- [x] **Data model documented**: Complete schema in `data-model.md` with SQLModel definitions
- [x] **Simplicity**: Single feature branch, 2 database tables, RESTful API
- [x] **Modern UI/UX**: Zustand for state (MANDATORY, not React Context), shadcn/ui components
- [x] **Security checklist**: JWT tokens, password hashing, SQL injection prevention, HTTPS
- [x] **Deployment target**: Vercel + Neon (documented in quickstart.md)
- [x] **Branch strategy**: Feature branch `001-phase-2-web-app` from main

### ⚠️ Constitution Deviations (with Justification)

| Principle | Deviation | Justification | ADR |
|-----------|-----------|---------------|-----|
| **Test-First Development** | Tests NOT included in Phase 2 tasks | Phase 2 scope explicitly defined as "core functionality MVP" per spec. Test implementation deferred to post-MVP iteration to deliver user value faster. | [ADR to be created] |
| **Observability** | Structured logging/metrics NOT in Phase 2-8 tasks | Basic error handling implemented (Phase 8). Full observability (structured logging, metrics, audit logs) deferred to Phase 9 as "production hardening" step. | See "Observability Implementation" section below |

### 📋 Post-Phase-1 Re-evaluation

After completing Phase 1 (research, data model, contracts):

✅ **All gates pass** - No new violations introduced during design phase.

**Observability Refinement** (addressing analysis finding C1/G1):
- Added explicit observability tasks to Phase 9 (see Phase 9 tasks below)
- Structured logging framework: Python `structlog` for backend, Next.js with Winston for frontend
- Metrics: Response time tracking, error rate monitoring
- Error tracking: Centralized error handler with context capture

---

## Project Structure

### Documentation (this feature)

```text
specs/001-phase-2-web-app/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Database schema + SQLModel definitions
├── quickstart.md        # Development setup guide
├── tasks.md             # Phase 2 task breakdown (220 tasks)
├── contracts/
│   ├── auth.openapi.yaml   # Authentication endpoints
│   └── tasks.openapi.yaml  # Task CRUD endpoints
└── checklists/
    └── requirements.md      # Acceptance criteria checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User SQLModel
│   │   └── task.py          # Task SQLModel
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT verification, user context
│   │   └── tasks.py         # Task business logic
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # FastAPI dependencies (auth)
│   │   ├── auth.py          # Auth endpoints
│   │   └── tasks.py         # Task CRUD endpoints
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py       # Database connection
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings (Pydantic BaseSettings)
│   │   └── security.py      # Password hashing, JWT utils
│   └── main.py              # FastAPI app entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/
├── alembic/                 # Database migrations
│   └── versions/
├── .env.example
├── requirements.txt
├── pyproject.toml
└── Dockerfile

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── (dashboard)/
│   │       ├── layout.tsx   # Auth-protected layout
│   │       └── page.tsx     # Task dashboard
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   └── task-form.tsx
│   ├── lib/
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── auth.ts          # Auth utilities
│   │   └── utils.ts         # Utility functions
│   ├── store/
│   │   └── auth-store.ts    # Zustand store (auth state)
│   └── types/
│       ├── user.ts
│       └── task.ts
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

**Structure Decision**: Web application structure (Option 2) chosen because:
1. Spec explicitly requires separate "FastAPI backend" and "Next.js frontend"
2. Independent deployment targets (Vercel for frontend, containerized backend)
3. Clear separation of concerns (API layer vs UI layer)
4. Enables parallel development (backend and frontend teams can work independently)

---

## Authentication Architecture (JWT + Better Auth)

**Decision**: Better Auth library for JWT-based authentication with secure token management

### Token Lifecycle

```
┌─────────────┐
│   Signup    │
│  /signup    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. Backend: Hash password (bcrypt)  │
│ 2. Store user in PostgreSQL         │
│ 3. Generate JWT token (7-day expiry)│
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Login      │
        │  /login      │
        └──────┬───────┘
               │
               ▼
┌──────────────────────────────────────┐
│ 1. Verify credentials                │
│ 2. Generate JWT (access token)       │
│ 3. Return: { token, user }           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: Store in localStorage      │
│ Key: 'auth_token'                    │
└──────────────┬───────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ API Requests │
        └──────┬───────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Axios Interceptor:                   │
│ 1. Check token expiry (<1 day?)     │
│ 2. If near expiry → refresh token    │
│ 3. Add header: Authorization: Bearer│
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Backend: Verify JWT                  │
│ 1. Decode token (python-jose)       │
│ 2. Validate signature + expiry      │
│ 3. Extract user_id from payload     │
│ 4. Inject into request context      │
└──────────────────────────────────────┘
```

### JWT Token Refresh (Addressing Analysis Issue A1)

**Implementation Location**: 
- **Frontend**: Axios request interceptor (runs before each API call)
- **Backend**: `/auth/refresh` endpoint (validates old token, issues new one)

**Trigger Logic**:
```typescript
// frontend/src/lib/api.ts
axios.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token');
  if (!token) return config;

  const payload = jwtDecode(token);
  const expiresIn = payload.exp * 1000 - Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Auto-refresh if < 1 day remains
  if (expiresIn < oneDayMs) {
    const newToken = await refreshToken(token);
    localStorage.setItem('auth_token', newToken);
    config.headers.Authorization = `Bearer ${newToken}`;
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

**Backend Refresh Endpoint**:
```python
# backend/src/api/auth.py
@router.post("/auth/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_user)
):
    # Validate old token still valid (not expired)
    # Issue new token with fresh 7-day expiry
    new_token = create_access_token(user_id=current_user.id)
    return {"token": new_token, "user": current_user}
```

---

## Better Auth Integration Details (Addressing Analysis Issue U2)

**Library**: Better Auth (JWT-based authentication library)
**Version**: Latest stable (check npm/pip for current version)

**Configuration**:

Backend (`backend/src/core/config.py`):
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Better Auth / JWT Configuration
    SECRET_KEY: str  # 256-bit random key for JWT signing
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
```

**Required Environment Variables** (`.env`):
```bash
# Backend
SECRET_KEY="your-256-bit-secret-key-here"  # Generate with: openssl rand -hex 32
DATABASE_URL="postgresql://user:password@host:5432/dbname"
ALLOWED_ORIGINS='["http://localhost:3000","https://your-domain.com"]'

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

**Better Auth Features Used**:
- Password hashing: bcrypt with salt rounds = 12
- JWT generation: python-jose library
- Token payload: `{ sub: user_id, exp: timestamp }`
- Refresh mechanism: Validate old token, issue new one

---

## API Response Standards (Addressing Analysis Issue D2)

**Single Source of Truth**: RFC 7807 Problem Details for error responses

**Success Response** (2xx):
```json
{
  "data": { /* actual payload */ },
  "meta": {
    "timestamp": "2025-12-11T10:30:00Z",
    "request_id": "uuid-v4"
  }
}
```

**Error Response** (4xx, 5xx) - RFC 7807:
```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Title field is required",
  "instance": "/api/v1/tasks",
  "errors": [
    {
      "field": "title",
      "message": "Field required",
      "code": "FIELD_REQUIRED"
    }
  ]
}
```

**FastAPI Implementation**:
```python
# backend/src/api/deps.py
from fastapi import HTTPException
from fastapi.responses import JSONResponse

def create_error_response(
    status_code: int,
    error_type: str,
    title: str,
    detail: str,
    instance: str = None,
    errors: list = None
):
    return JSONResponse(
        status_code=status_code,
        content={
            "type": f"https://api.todo.com/errors/{error_type}",
            "title": title,
            "status": status_code,
            "detail": detail,
            "instance": instance,
            "errors": errors or []
        }
    )
```

---

## Pagination Strategy (Addressing Analysis Issue I3)

**Decision**: Cursor-based pagination ONLY (remove offset-based references)

**Rationale**:
- Efficient for large datasets (no OFFSET scan)
- Stable results (no duplicate/missing items during pagination)
- Token-based (cursor encodes position, not page number)

**Implementation**:

OpenAPI Contract (tasks.openapi.yaml):
```yaml
parameters:
  - name: cursor
    in: query
    schema:
      type: string
    description: Pagination cursor (task ID + timestamp)
  - name: limit
    in: query
    schema:
      type: integer
      default: 50
      maximum: 100
    description: Items per page
  - name: completed
    in: query
    schema:
      type: boolean
    description: Filter by completion status
```

**Response**:
```json
{
  "data": [/* tasks */],
  "meta": {
    "next_cursor": "base64-encoded-cursor",
    "has_more": true,
    "total": 1234
  }
}
```

**SQL Query** (SQLModel):
```python
# backend/src/services/tasks.py
async def get_tasks(
    user_id: str,
    cursor: str | None = None,
    limit: int = 50,
    completed: bool | None = None
):
    query = select(Task).where(Task.user_id == user_id)
    
    if completed is not None:
        query = query.where(Task.completed == completed)
    
    if cursor:
        decoded = decode_cursor(cursor)  # Returns (task_id, created_at)
        query = query.where(
            or_(
                Task.created_at < decoded.created_at,
                and_(
                    Task.created_at == decoded.created_at,
                    Task.id < decoded.task_id
                )
            )
        )
    
    query = query.order_by(Task.created_at.desc(), Task.id.desc())
    query = query.limit(limit + 1)  # Fetch one extra to check has_more
    
    results = await db.execute(query)
    tasks = results.all()
    
    has_more = len(tasks) > limit
    if has_more:
        tasks = tasks[:limit]
    
    next_cursor = encode_cursor(tasks[-1]) if has_more else None
    
    return tasks, next_cursor, has_more
```

---

## Observability Implementation (Addressing Analysis Finding G1)

**Status**: Added to Phase 9 tasks (production hardening)

### Phase 9: Additional Tasks for Observability

**T221: Setup Structured Logging Framework [P]**
- Backend: Install `structlog` and configure JSON output
- Frontend: Install `winston` for browser logging
- Output format: JSON with `timestamp`, `level`, `message`, `context`
- Estimated: 3h

**T222: Implement Request/Response Logging [P]**
- Backend: FastAPI middleware to log all API requests
- Log fields: `request_id`, `method`, `path`, `status_code`, `duration_ms`, `user_id`
- Frontend: Axios interceptor to log API calls
- Estimated: 2h

**T223: Add Performance Metrics Collection [P]**
- Backend: Track API response times (p50, p95, p99)
- Database: Track query execution times
- Frontend: Track page load times, FCP, LCP
- Storage: In-memory counters (Prometheus-compatible format)
- Estimated: 4h

**T224: Implement Error Tracking and Context Capture [P]**
- Backend: Global exception handler with stack traces
- Frontend: Error boundary with component stack
- Context: User ID, request ID, API endpoint, timestamp
- Integration: Console logging (expandable to Sentry later)
- Estimated: 3h

**T225: Create Audit Log for User Actions [P]**
- Log events: Task created/updated/deleted, auth events
- Schema: `{ timestamp, user_id, action, resource_type, resource_id, changes }`
- Storage: Separate `audit_logs` table (optional for MVP)
- Estimated: 4h

**T226: Add Health Check Endpoints [P]**
- Backend: `/health` (200 OK), `/health/db` (check DB connection)
- Frontend: Check API connectivity on app load
- Use for: Deployment verification, monitoring uptime
- Estimated: 1h

---

## Security Hardening Details

**Per Constitution Security Checklist**:

1. ✅ **HTTPS Only**: Enforced at deployment (Vercel, Neon SSL)
2. ✅ **CORS Configuration**: Restrict `ALLOWED_ORIGINS` to production domain
3. ✅ **SQL Injection Prevention**: SQLModel parameterized queries
4. ✅ **Password Security**: Bcrypt with 12 rounds, never log passwords
5. ✅ **JWT Security**: 256-bit secret, 7-day expiry, signature verification
6. ✅ **Input Validation**: Pydantic models on backend, Zod on frontend
7. ✅ **Rate Limiting**: FastAPI middleware (100 req/min per IP) - Phase 9
8. ✅ **Secrets Management**: Environment variables, never commit `.env`
9. ✅ **Error Messages**: Generic errors for auth failures (no user enumeration)
10. ✅ **Dependency Scanning**: `pip-audit` (backend), `npm audit` (frontend) - Phase 9
11. ✅ **XSS Prevention**: React escapes by default, CSP headers
12. ✅ **CSRF Protection**: SameSite cookies, CSRF tokens for state-changing ops

---

## Performance Optimization Strategy

**NFR-PERF Requirements** (from spec.md):

1. **NFR-PERF-001**: API p95 < 500ms
   - **Implementation**: Database indexes on `user_id` and `completed`
   - **Task**: T218 (Phase 9) - Run load tests with 1000 concurrent users

2. **NFR-PERF-002**: Frontend FCP < 1.8s
   - **Implementation**: Next.js Server Components, image optimization, code splitting
   - **Task**: T219 (Phase 9) - Lighthouse audit, optimize to score > 90

3. **NFR-PERF-003**: Database queries < 100ms
   - **Implementation**: Composite index on `(user_id, created_at)` for pagination
   - **Task**: T054 (Phase 2) - Verify indexes created correctly

4. **NFR-PERF-004**: Support 1000+ concurrent users
   - **Implementation**: Neon connection pooling, async FastAPI handlers
   - **Task**: T218 (Phase 9) - Load testing with k6 or Locust

---

## Deployment Architecture

**Frontend** (Vercel):
```
User → Vercel Edge CDN → Next.js App Router → API Calls
                          (Server Components)
```

**Backend** (Docker):
```
API Request → Load Balancer → FastAPI Container → Neon PostgreSQL
                               (uvicorn, 4 workers)
```

**Database** (Neon Serverless):
```
FastAPI → Neon Proxy → PostgreSQL 16
          (Connection Pooling)
```

**Environment Setup** (see `quickstart.md`):
- Frontend: `.env.local` with `NEXT_PUBLIC_API_URL`
- Backend: `.env` with `DATABASE_URL`, `SECRET_KEY`
- Database: Neon connection string from dashboard

---

## Phase Summary

| Phase | Description | Output | Status |
|-------|-------------|--------|--------|
| 0 | Research & Technology Validation | `research.md` | ✅ Complete |
| 1 | Data Model & API Contracts | `data-model.md`, `contracts/` | ✅ Complete |
| 2 | Database Setup & Models | SQLModel classes, migrations | Ready |
| 3 | Backend Authentication API | Auth endpoints, JWT | Ready |
| 4 | Backend Task CRUD API | Task endpoints | Ready |
| 5 | Frontend Authentication UI | Login/Signup pages | Ready |
| 6 | Frontend Task Dashboard UI | Task list, forms | Ready |
| 7 | Frontend-Backend Integration | Axios, auth flow | Ready |
| 8 | Error Handling & Validation | Global handlers | Ready |
| 9 | Testing & Production Hardening | Observability, performance | Ready |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Better Auth version incompatibility | HIGH | LOW | Pin specific version in `requirements.txt`, test during Phase 3 |
| Neon connection limits exceeded | MEDIUM | MEDIUM | Enable connection pooling, monitor active connections |
| JWT token size grows too large | LOW | LOW | Keep payload minimal (`sub`, `exp` only) |
| Pagination cursor security | MEDIUM | LOW | Sign cursors with HMAC, validate on decode |
| CORS misconfiguration in production | HIGH | LOW | Test with production domain before go-live |

---

## Next Steps

1. ✅ **Plan Complete** - This document
2. ⏭️ **Run `/sp.tasks`** - Generate 220 detailed implementation tasks
3. ⏭️ **Run `/sp.implement`** - Begin Phase 2 implementation (database setup)
4. ⏭️ **Parallel Development**:
   - Backend: Phases 2-4 (database, auth API, task API)
   - Frontend: Phases 5-6 (auth UI, dashboard)
   - Integration: Phase 7 (connect frontend ↔ backend)

---

## Document History

- **2025-12-11**: Initial plan created
- **2025-12-11**: Refined based on `/sp.analyze` findings (constitution violations, observability gaps, JWT refresh clarification)

---

**Ready for Task Generation**: All unknowns resolved, constitution gates passing (with documented deviations), architecture validated through research.
