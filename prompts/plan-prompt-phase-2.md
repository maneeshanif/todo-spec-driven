# Implementation Plan: Todo Web Application - Phase 2

**Project**: Todo Web Application
**Phase**: Phase 2 - Full-Stack Web Application
**Branch**: `phase-2-web-app`
**Date**: 2025-12-11
**Spec**: [spec-prompt-phase-2.md](./spec-prompt-phase-2.md)
**Constitution**: [constitution-prompt-phase-2.md](./constitution-prompt-phase-2.md)

---

## Summary

Build a production-ready, full-stack web application that transforms the Phase 1 console app into a multi-user web platform. The implementation follows a staged approach: Database → Backend API → Frontend UI → Authentication → Integration Testing → Deployment.

**Primary Requirement**: Create a secure, responsive todo application where users can manage their personal tasks through a modern web interface.

**Technical Approach**:
- Monorepo structure with separate frontend (Next.js) and backend (FastAPI) services
- PostgreSQL database with SQLModel ORM for type-safe data access
- Better Auth for JWT-based authentication
- Shadcn/ui components with Framer Motion animations + Aceternity UI effects
- **Zustand** for state management (MANDATORY - NO React Context)
- **Axios** for HTTP requests (MANDATORY - NO fetch API)
- Deployment to Vercel with Neon Serverless PostgreSQL

---

## Technical Context

**Language/Version**:
- Backend: Python 3.13+ with UV package manager
- Frontend: TypeScript 5.0+ with Node.js 20+

**Primary Dependencies**:
- Backend: FastAPI 0.115+, SQLModel 0.0.24+, Pydantic 2.0, better-auth integration
- Frontend: Next.js 16+, React 19, Shadcn/ui, Framer Motion 11+, Tailwind CSS 4.0, **Zustand 5.0+**, **Axios 1.7+**, **Aceternity UI**

**Storage**:
- Neon Serverless PostgreSQL (cloud-hosted)
- Connection pooling via asyncpg

**Testing**:
- Backend: pytest 8.0+, httpx for API tests
- Frontend: Jest + React Testing Library, Playwright for E2E

**Target Platform**:
- Backend: Vercel Python runtime or Railway
- Frontend: Vercel Edge Network
- Database: Neon Serverless (US region)

**Project Type**: Web application (monorepo with frontend + backend)

**Performance Goals**:
- API: < 500ms response time for p95
- Frontend: < 1.5s First Contentful Paint
- Database: < 100ms query time for indexed lookups
- Support: 100 concurrent users

**Constraints**:
- Must use spec-driven development (no manual code writing)
- Must pass security checklist (JWT validation, data isolation)
- Must be mobile-responsive (320px+)
- Must deploy to free-tier services

**Scale/Scope**:
- Expected: 100-1000 users in Phase 2
- 10,000 tasks per user maximum
- 5-10 API endpoints
- 5-8 frontend pages/components

---

## Constitution Check

*GATE: Must pass before implementation begins*

### ✅ Spec-Driven Development
- [ ] Feature specification complete and approved
- [ ] All user stories have acceptance criteria
- [ ] Technical architecture documented
- [ ] API contracts defined

### ✅ Monorepo Architecture
- [ ] `/frontend` and `/backend` directories created
- [ ] `/specs` directory organized by type
- [ ] Each service has CLAUDE.md

### ✅ Test-First Development
- [ ] Test strategy defined
- [ ] Acceptance tests written before implementation
- [ ] Test coverage goals: 80% backend, 70% frontend

### ✅ Authentication & Authorization First
- [ ] Better Auth integration planned
- [ ] JWT validation strategy defined
- [ ] User isolation approach documented
- [ ] Secrets management strategy (environment variables)

### ✅ API-First Design
- [ ] All API endpoints documented in spec
- [ ] RESTful conventions followed
- [ ] Error response format standardized
- [ ] HTTP status codes defined

### ✅ Database-First Schema Design
- [ ] Complete schema documented
- [ ] Foreign keys and indexes defined
- [ ] Migration strategy planned

### ✅ Modern UI/UX Standards
- [ ] Component library selected (Shadcn/ui + Aceternity UI)
- [ ] Animation library chosen (Framer Motion)
- [ ] State management: Zustand (MANDATORY)
- [ ] HTTP client: Axios with interceptors (MANDATORY)
- [ ] Mobile-first approach defined
- [ ] Accessibility requirements documented

### 🔄 Constitution Violations
None - this implementation follows all constitutional principles.

---

## Project Structure

### Documentation (this feature)

```text
/
├── constitution-prompt-phase-2.md  # Project constitution (this phase)
├── spec-prompt-phase-2.md          # Feature specification (this file references)
├── plan-prompt-phase-2.md          # This implementation plan
├── hackathon-ii.md                 # Original hackathon requirements
└── README.md                       # Setup and deployment instructions

specs/
├── features/
│   ├── authentication.md           # Auth flows and requirements
│   ├── task-crud.md                # CRUD operations specification
│   └── task-ui.md                  # UI component specifications
├── api/
│   └── rest-endpoints.md           # Complete API documentation
├── database/
│   └── schema.md                   # Database schema and migrations
└── ui/
    ├── components.md               # Component library usage
    └── pages.md                    # Page structure and routing

history/
├── prompts/
│   ├── constitution/               # Constitution-related PHRs
│   ├── general/                    # General PHRs
│   └── phase-2-web-app/            # Phase 2 feature PHRs
└── adr/                           # Architecture Decision Records

.specify/
├── memory/
│   └── constitution.md             # Template (to be updated for Phase 2)
├── templates/
│   ├── spec-template.md
│   ├── plan-template.md
│   ├── phr-template.prompt.md
│   └── adr-template.md
└── scripts/
    └── bash/                       # Utility scripts

.claude/
└── commands/                       # Slash command definitions
    ├── sp.specify.md
    ├── sp.plan.md
    ├── sp.tasks.md
    ├── sp.implement.md
    ├── sp.phr.md
    └── sp.adr.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                    # FastAPI application entry
│   ├── config.py                  # Configuration and environment variables
│   ├── database.py                # Database connection and session management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py               # Task SQLModel
│   │   └── user.py               # User model (if extending Better Auth)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py               # Authentication endpoints
│   │   └── tasks.py              # Task CRUD endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py       # Authentication business logic
│   │   └── task_service.py       # Task business logic
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py               # JWT validation middleware
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── task.py               # Pydantic request/response models
│   │   └── auth.py               # Auth request/response models
│   └── utils/
│       ├── __init__.py
│       └── jwt.py                # JWT utilities
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Pytest fixtures
│   ├── test_auth.py              # Authentication tests
│   ├── test_tasks.py             # Task API tests
│   └── integration/
│       └── test_full_flow.py     # End-to-end API tests
├── alembic/                      # Database migrations
│   ├── versions/
│   └── env.py
├── pyproject.toml                # UV project configuration
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
├── Dockerfile                    # Backend container (optional)
└── CLAUDE.md                     # Backend-specific Claude instructions

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home/landing page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx     # Signup page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Dashboard layout
│   │   │   └── tasks/
│   │   │       └── page.tsx     # Main tasks page
│   │   └── api/                 # API route handlers (if needed)
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── checkbox.tsx
│   │   │   └── dialog.tsx
│   │   ├── aceternity/          # Aceternity UI effects
│   │   │   ├── background-beams.tsx
│   │   │   ├── text-generate-effect.tsx
│   │   │   └── moving-border.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   ├── tasks/
│   │   │   ├── task-list.tsx    # Task list container
│   │   │   ├── task-item.tsx    # Individual task component
│   │   │   ├── task-form.tsx    # Create/edit task form
│   │   │   └── task-filters.tsx # Filter controls
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── nav.tsx
│   │       └── footer.tsx
│   ├── stores/                  # Zustand stores (MANDATORY)
│   │   ├── auth-store.ts        # Authentication state
│   │   ├── task-store.ts        # Task state with optimistic updates
│   │   └── ui-store.ts          # UI state (modals, sidebar, theme)
│   ├── lib/
│   │   ├── api/                 # Axios API modules
│   │   │   ├── client.ts        # Axios instance with interceptors
│   │   │   ├── auth.ts          # Auth API calls
│   │   │   └── tasks.ts         # Task API calls
│   │   ├── auth.ts              # Better Auth configuration
│   │   ├── types.ts             # TypeScript type definitions
│   │   └── utils.ts             # Utility functions (cn, etc.)
│   ├── hooks/
│   │   └── use-auth.ts          # Authentication hook (wraps store)
│   └── styles/
│       └── globals.css           # Global styles with Tailwind
├── public/
│   ├── favicon.ico
│   └── images/
├── tests/
│   ├── unit/
│   │   └── components/          # Component unit tests
│   └── e2e/
│       └── tasks.spec.ts        # Playwright E2E tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── components.json              # Shadcn/ui configuration
├── .env.local.example
└── CLAUDE.md                    # Frontend-specific Claude instructions

docker-compose.yml               # Local development orchestration (optional)
.gitignore
LICENSE
README.md                        # Complete setup instructions
```

**Structure Decision**: Chose Option 2 (Web application) from the template because this is explicitly a full-stack web project with distinct frontend and backend services that will be independently deployed.

---

## Complexity Tracking

> No constitution violations - all complexity is justified by Phase 2 requirements.

---

## Implementation Phases

### Phase 0: Project Setup & Research (Day 1)

**Goal**: Set up development environment and understand integration points.

**Tasks**:
1. Initialize backend (FastAPI + UV)
   - Create `backend/` directory structure
   - Set up `pyproject.toml` with dependencies
   - Configure FastAPI application
   - Test basic endpoint

2. Initialize frontend (Next.js + TypeScript)
   - Create Next.js app with App Router
   - Install and configure Shadcn/ui
   - Set up Tailwind CSS 4.0
   - Install Framer Motion
   - **Install Zustand for state management**
   - **Install Axios for HTTP requests**
   - **Set up Aceternity UI components directory**

3. Set up Neon PostgreSQL
   - Create Neon project and database
   - Get connection string
   - Test connection from backend

4. Research Better Auth integration
   - Study JWT flow documentation
   - Plan frontend + backend integration
   - Document auth strategy

**Deliverables**:
- [ ] Backend serves "Hello World" at `/`
- [ ] Frontend renders basic page
- [ ] Database connection successful
- [ ] Better Auth integration strategy documented

---

### Phase 1: Database Schema & Models (Day 1-2)

**Goal**: Define and implement database schema with migrations.

**Tasks**:
1. Design complete database schema
   - Document in `specs/database/schema.md`
   - Define `users` table (Better Auth)
   - Define `tasks` table with all fields
   - Define indexes and constraints

2. Implement SQLModel models
   - Create `models/task.py` with `Task` model
   - Add validation rules
   - Test model creation

3. Set up database migrations
   - Initialize Alembic
   - Create initial migration
   - Apply migration to Neon database
   - Test rollback

4. Create test data fixtures
   - Seed script for development
   - Test data for automated tests

**Deliverables**:
- [ ] `specs/database/schema.md` complete
- [ ] SQLModel `Task` model implemented
- [ ] Database migrations working
- [ ] Can create and query tasks directly in database

---

### Phase 2: Backend API (Day 2-3)

**Goal**: Implement RESTful API with authentication.

**Tasks**:
1. Implement authentication endpoints
   - Integrate Better Auth
   - JWT token generation
   - JWT validation middleware
   - Test authentication flow

2. Implement task CRUD endpoints
   - `POST /api/{user_id}/tasks` - Create task
   - `GET /api/{user_id}/tasks` - List tasks
   - `GET /api/{user_id}/tasks/{id}` - Get task
   - `PUT /api/{user_id}/tasks/{id}` - Update task
   - `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle complete
   - `DELETE /api/{user_id}/tasks/{id}` - Delete task

3. Implement business logic layer
   - Create `services/task_service.py`
   - User isolation enforcement
   - Input validation with Pydantic
   - Error handling

4. Add API documentation
   - OpenAPI/Swagger auto-generation
   - Test all endpoints manually
   - Document in `specs/api/rest-endpoints.md`

**Deliverables**:
- [ ] All 6 task endpoints working
- [ ] JWT validation on all protected routes
- [ ] User isolation verified
- [ ] Swagger docs accessible at `/docs`

---

### Phase 3: Backend Testing (Day 3)

**Goal**: Ensure backend reliability with comprehensive tests.

**Tasks**:
1. Write authentication tests
   - Signup success/failure scenarios
   - Login success/failure scenarios
   - Token validation tests
   - Token expiration tests

2. Write task API tests
   - CRUD operations for authenticated users
   - User isolation tests (can't access others' tasks)
   - Validation error tests
   - Edge cases (empty title, long description, etc.)

3. Write integration tests
   - Full user journey: signup → create task → mark complete
   - Database transaction rollback scenarios
   - Concurrent user scenarios

4. Achieve test coverage goals
   - Minimum 80% code coverage
   - All critical paths tested

**Deliverables**:
- [ ] Test suite passes 100%
- [ ] Code coverage > 80%
- [ ] All edge cases covered

---

### Phase 4: Frontend UI Components (Day 4-5)

**Goal**: Build reusable UI components with Shadcn/ui and Aceternity UI.

**Tasks**:
1. Install and configure Shadcn/ui components
   - Button, Card, Input, Checkbox, Dialog
   - Form components with React Hook Form
   - Configure Tailwind theme

2. Set up Aceternity UI effects (Landing Page)
   - Create `components/aceternity/` directory
   - Add BackgroundBeams component
   - Add TextGenerateEffect component
   - Add MovingBorder component for CTAs

3. Build authentication components
   - LoginForm component
   - SignupForm component
   - AuthLayout component
   - Better Auth client integration

4. Build task components
   - TaskList component (with animations)
   - TaskItem component (with checkbox + actions)
   - TaskForm component (create + edit)
   - EmptyState component

5. Add Framer Motion animations
   - Task creation/deletion animations
   - Page transitions
   - Hover effects and micro-interactions

6. Set up Zustand stores
   - Create auth-store.ts with persist middleware
   - Create task-store.ts with optimistic updates
   - Create ui-store.ts for modals/theme

7. Test components in isolation
   - Storybook (optional) or component test pages
   - Verify responsiveness
   - Test dark mode (optional)

**Deliverables**:
- [ ] All UI components implemented
- [ ] Aceternity UI effects on landing page
- [ ] Zustand stores configured
- [ ] Components are responsive (mobile, tablet, desktop)
- [ ] Animations are smooth and performant
- [ ] Dark mode supported (optional)

---

### Phase 5: Frontend Integration (Day 5-6)

**Goal**: Connect frontend to backend API with Zustand state management and Axios.

**Tasks**:
1. Implement Axios API client
   - Create `lib/api/client.ts` with Axios instance
   - Add request interceptor for JWT token
   - Add response interceptor for error handling (401 → logout)
   - Create `lib/api/tasks.ts` and `lib/api/auth.ts` modules

2. Connect Zustand stores to API
   - Wire auth-store to auth API endpoints
   - Wire task-store to task API endpoints
   - Implement optimistic updates with rollback

3. Implement authentication flow
   - Signup page with form validation
   - Login page with JWT persistence (Zustand persist)
   - Protected route middleware
   - Logout functionality

4. Implement task management pages
   - Dashboard with task list (from task-store)
   - Task creation flow
   - Task editing flow
   - Task deletion with confirmation
   - Task completion toggle

4. Implement data fetching strategies
   - Server Components for initial data
   - Client-side fetching for mutations
   - Optimistic UI updates
   - Loading and error states

5. Add user feedback
   - Toast notifications for actions
   - Loading spinners
   - Error messages
   - Success confirmations

**Deliverables**:
- [ ] Frontend successfully calls all API endpoints
- [ ] Authentication flow works end-to-end
- [ ] All task operations functional
- [ ] Optimistic UI updates working

---

### Phase 6: Integration Testing (Day 6)

**Goal**: Verify end-to-end functionality.

**Tasks**:
1. Write E2E tests with Playwright
   - User signup → login → create task → complete → logout
   - User cannot access another user's tasks
   - Form validation works correctly
   - Error handling works as expected

2. Test on multiple browsers
   - Chrome
   - Firefox
   - Safari (if available)

3. Test on multiple devices
   - Mobile (320px, 375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)

4. Performance testing
   - Lighthouse audit (target > 90)
   - Load testing with 100 concurrent users
   - Database query performance

**Deliverables**:
- [ ] E2E test suite passes 100%
- [ ] Application works on all tested browsers
- [ ] Responsive design verified on all sizes
- [ ] Lighthouse score > 90

---

### Phase 7: Deployment (Day 7)

**Goal**: Deploy application to production.

**Tasks**:
1. Prepare environment variables
   - Document all required variables
   - Create `.env.example` files
   - Set up secrets in deployment platforms

2. Deploy backend
   - Option A: Vercel (Python runtime)
   - Option B: Railway
   - Configure DATABASE_URL (Neon)
   - Configure BETTER_AUTH_SECRET
   - Test deployed API

3. Deploy frontend
   - Deploy to Vercel
   - Configure NEXT_PUBLIC_API_URL
   - Configure Better Auth domain
   - Test deployed frontend

4. Connect frontend to backend
   - Update API URL in frontend
   - Test authentication flow in production
   - Verify CORS settings

5. Final smoke testing
   - Test all features in production
   - Verify no console errors
   - Check performance metrics

**Deliverables**:
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Application works end-to-end in production
- [ ] Public URLs documented in README

---

### Phase 8: Documentation & Wrap-up (Day 7)

**Goal**: Complete documentation and knowledge capture.

**Tasks**:
1. Update README.md
   - Tech stack description
   - Local development setup
   - Deployment instructions
   - Environment variables documentation
   - Troubleshooting guide

2. Create video demo
   - Record 90-second walkthrough
   - Show all features
   - Upload to YouTube/Vimeo

3. Create PHR for Phase 2
   - Record all user interactions
   - Document decisions made
   - List files created/modified
   - Archive in `history/prompts/phase-2-web-app/`

4. Review ADR opportunities
   - Check for architectural decisions
   - Suggest ADR creation if significant
   - Wait for user consent

**Deliverables**:
- [ ] README.md complete and accurate
- [ ] Demo video created (<90 seconds)
- [ ] PHR created and archived
- [ ] ADR suggested if applicable

---

## Testing Strategy

### Unit Tests
- **Backend**: pytest for all service logic, models, utilities
- **Frontend**: Jest + React Testing Library for components

### Integration Tests
- **Backend**: FastAPI TestClient for API endpoint testing
- **Frontend**: Integration tests for data flows

### End-to-End Tests
- **Full Stack**: Playwright for complete user journeys

### Test Coverage Goals
- Backend: Minimum 80%
- Frontend: Minimum 70%
- Critical paths: 100%

---

## Security Considerations

### Authentication Security
- JWT tokens signed with strong secret (256-bit)
- Tokens expire after 7 days
- Secure, HttpOnly cookies for token storage (frontend)
- HTTPS enforced in production

### Data Security
- User isolation enforced at API layer
- All database queries filtered by `user_id`
- SQL injection prevented via SQLModel ORM
- XSS prevented via React auto-escaping

### API Security
- CORS configured to allow only frontend origin
- Rate limiting on authentication endpoints (optional)
- Input validation with Pydantic
- Error messages don't expose internal details

---

## Performance Optimization

### Backend
- Database connection pooling
- Indexes on `user_id` and `completed` columns
- Async database operations with asyncpg
- Response time monitoring

### Frontend
- Code splitting with Next.js App Router
- Image optimization with next/image
- Lazy loading for non-critical components
- Bundle size optimization (target < 500KB)

### Database
- Proper indexing strategy
- Query optimization
- Connection pooling

---

## Monitoring & Observability

### Logging
- Structured logging in JSON format
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request ID tracking
- Never log sensitive data

### Metrics (Optional for Phase 2)
- API response times
- Error rates
- Database query performance
- User actions

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (unit, integration, E2E)
- [ ] Security checklist complete
- [ ] Environment variables documented
- [ ] Database migrations applied
- [ ] Frontend build succeeds
- [ ] Backend health check endpoint works
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Error tracking configured (optional)
- [ ] Performance benchmarks met

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Better Auth integration complexity | Study docs thoroughly, allocate 4-6 hours, use official examples |
| Vercel deployment issues | Test early (Day 5), have Railway as backup plan |
| Database migration failures | Test migrations locally first, have rollback plan |
| JWT security vulnerabilities | Follow security checklist strictly, review auth code with expert |
| Performance issues | Implement pagination, optimize queries, monitor metrics |
| Cross-browser compatibility | Test on multiple browsers early, use standard web APIs |

---

## Timeline Estimate

**Total Duration**: 7 days (can be compressed to 5 days with focus)

- **Days 1-2**: Setup + Database + Backend API
- **Days 3-4**: Backend Testing + Frontend Components
- **Days 5-6**: Frontend Integration + E2E Testing
- **Day 7**: Deployment + Documentation

---

## Success Metrics

Phase 2 is successful when:

1. ✅ All 6 user stories have passing acceptance tests
2. ✅ Application is deployed and publicly accessible
3. ✅ Security checklist is 100% complete
4. ✅ Test coverage meets goals (80% backend, 70% frontend)
5. ✅ Lighthouse score > 90
6. ✅ All features work on mobile and desktop
7. ✅ PHR created and archived
8. ✅ README includes complete setup instructions

---

## Next Steps

After completing this plan:

1. Run `/sp.tasks` to generate detailed task breakdown
2. Run `/sp.implement` to begin execution
3. Create PHR after each major milestone
4. Suggest ADR for significant architectural decisions

---

## References

- [Phase 2 Specification](./spec-prompt-phase-2.md)
- [Phase 2 Constitution](./constitution-prompt-phase-2.md)
- [Hackathon II Requirements](./hackathon-ii.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)

---

**Status**: Ready for task breakdown
**Next Command**: `/sp.tasks`
**Est. Completion**: 7 days from start
