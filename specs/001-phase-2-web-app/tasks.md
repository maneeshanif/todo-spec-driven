# Tasks: Todo Web Application - Phase 2

**Feature Branch**: `001-phase-2-web-app`
**Input**: Design documents from `/specs/001-phase-2-web-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅, quickstart.md ✅

**Tests**: Tests are NOT included as they were not explicitly requested in the specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a monorepo web application:
- Backend: `backend/src/` (FastAPI + SQLModel)
- Frontend: `frontend/src/` (Next.js + React)
- Tests: `backend/tests/`, `frontend/__tests__/`

---

## Phase 0: Research & Prerequisites (Phase 0 from plan.md)

**Purpose**: Understand requirements and validate technical choices

- [X] T001 Read constitution-prompt-phase-2.md for project laws
- [X] T002 Read spec-prompt-phase-2.md for user stories and acceptance criteria
- [X] T003 Read plan-prompt-phase-2.md for architecture and technical approach
- [X] T004 [P] Review data-model.md for database schema
- [X] T005 [P] Review contracts/auth.openapi.yaml for auth endpoints
- [X] T006 [P] Review contracts/tasks.openapi.yaml for task endpoints
- [X] T007 [P] Review research.md for technical decisions
- [X] T008 Validate all design documents are complete and consistent

**Checkpoint**: Design documents reviewed and understood - ready for setup

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize monorepo structure and install dependencies

### Backend Setup

- [X] T009 Create backend/ directory structure (src/, tests/, alembic/)
- [X] T010 Initialize UV project in backend/ with Python 3.13+
- [X] T011 [P] Add FastAPI 0.115+ dependency to backend/pyproject.toml
- [X] T012 [P] Add SQLModel 0.0.24+ dependency to backend/pyproject.toml
- [X] T013 [P] Add Pydantic 2.0+ dependency to backend/pyproject.toml
- [X] T014 [P] Add PyJWT dependency for JWT handling to backend/pyproject.toml
- [X] T015 [P] Add python-dotenv for environment variables to backend/pyproject.toml
- [X] T016 [P] Add pytest 8.0+ and httpx for testing to backend/pyproject.toml
- [X] T017 [P] Add alembic for database migrations to backend/pyproject.toml
- [X] T018 [P] Add asyncpg for PostgreSQL async driver to backend/pyproject.toml
- [X] T019 [P] Add passlib[bcrypt] for password hashing to backend/pyproject.toml
- [X] T020 Create backend/src/__init__.py
- [X] T021 Create backend/.env.example with required environment variables
- [X] T022 Create backend/README.md with setup instructions
- [X] T023 Create backend/CLAUDE.md with backend-specific agent rules

### Frontend Setup

- [X] T024 Initialize Next.js 16+ project in frontend/ with TypeScript and App Router
- [X] T025 [P] Add React 19 to frontend/package.json
- [X] T026 [P] Add Tailwind CSS 4.0 to frontend/package.json
- [X] T027 [P] Add Shadcn/ui components to frontend/
- [X] T028 [P] Add Zustand 5.0+ for state management to frontend/package.json
- [X] T029 [P] Add Axios 1.7+ for HTTP client to frontend/package.json
- [X] T030 [P] Add Framer Motion 11+ for animations to frontend/package.json
- [X] T031 [P] Add Aceternity UI components to frontend/
- [X] T032 [P] Add React Hook Form for form handling to frontend/package.json
- [X] T033 [P] Add Zod for validation to frontend/package.json
- [X] T034 [P] Add Jest and React Testing Library to frontend/package.json
- [X] T035 Create frontend/src/lib/ directory for utilities
- [X] T036 Create frontend/src/stores/ directory for Zustand stores
- [X] T037 Create frontend/src/components/ directory for React components
- [X] T038 Create frontend/src/app/ directory structure (App Router pages)
- [X] T039 Create frontend/.env.example with API URL
- [X] T040 Create frontend/README.md with setup instructions
- [X] T041 Create frontend/CLAUDE.md with frontend-specific agent rules

### Repository Configuration

- [X] T042 Create root .gitignore with backend and frontend patterns
- [X] T043 [P] Create .github/workflows/ci.yml for GitHub Actions
- [X] T044 [P] Update root README.md with monorepo setup instructions
- [X] T045 Verify all dependencies install correctly (uv sync and npm install)

**Checkpoint**: Project structure initialized - ready for foundational work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [X] T046 Create backend/src/core/ directory for shared utilities
- [X] T047 Create database configuration in backend/src/core/database.py with engine and session
- [X] T048 Create environment config loader in backend/src/core/config.py with Settings class
- [X] T049 Initialize Alembic in backend/ for database migrations
- [X] T050 Configure Alembic env.py to use SQLModel metadata
- [X] T051 Create backend/src/models/__init__.py for model exports
- [X] T052 [P] Create User model in backend/src/models/user.py per data-model.md
- [X] T053 [P] Create Task model in backend/src/models/task.py per data-model.md
- [X] T054 Generate initial migration (001_initial_schema.py) with users and tasks tables
- [X] T055 Test migration up/down on local PostgreSQL or Neon instance

### Authentication Foundation

- [X] T056 Create backend/src/core/security.py with JWT utilities (create_token, verify_token)
- [X] T057 Create password hashing utilities in backend/src/core/security.py (hash_password, verify_password)
- [X] T058 Create authentication dependency in backend/src/core/deps.py (get_current_user)
- [X] T059 Create JWT middleware in backend/src/middleware/auth.py for token validation
- [X] T060 Create backend/src/schemas/__init__.py for Pydantic schemas
- [X] T061 [P] Create auth schemas in backend/src/schemas/auth.py (SignupRequest, LoginRequest, AuthResponse)
- [X] T062 [P] Create user schemas in backend/src/schemas/user.py (UserPublic, UserCreate)

### API Foundation

- [X] T063 Create FastAPI app instance in backend/src/main.py with CORS middleware
- [X] T064 Create API router structure in backend/src/api/__init__.py
- [X] T065 Create error handler in backend/src/core/errors.py following RFC 7807 format
- [X] T066 Add global exception handlers to backend/src/main.py
- [X] T067 Create logging configuration in backend/src/core/logging.py with structured logging
- [X] T068 Add health check endpoint at GET /api/health in backend/src/main.py

### Frontend Foundation

- [X] T069 Create Axios instance in frontend/src/lib/api/client.ts with base URL and interceptors
- [X] T070 Add auth interceptor to frontend/src/lib/api/client.ts for JWT token injection
- [X] T071 Add refresh interceptor to frontend/src/lib/api/client.ts for token refresh on 401
- [X] T072 Create auth store in frontend/src/stores/auth-store.ts with Zustand (user, token, login, logout, persist)
- [X] T073 Create UI store in frontend/src/stores/ui-store.ts with Zustand (modals, sidebar, theme)
- [X] T074 Create route protection HOC in frontend/src/components/ProtectedRoute.tsx
- [X] T075 Create global layout in frontend/src/app/layout.tsx with providers
- [X] T076 Create error boundary in frontend/src/components/ErrorBoundary.tsx
- [X] T077 Create loading component in frontend/src/components/LoadingSpinner.tsx
- [X] T078 Configure Tailwind CSS in frontend/tailwind.config.ts with custom theme
- [X] T079 Create global styles in frontend/src/app/globals.css

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration & Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts, log in, and log out with JWT-based authentication

**Independent Test**: Sign up with email/password, log in, verify JWT token in localStorage, log out successfully

### Implementation for User Story 1

#### Backend - Auth Service & Endpoints

- [X] T080 [P] [US1] Create auth service in backend/src/services/auth_service.py (signup, login methods)
- [X] T081 [P] [US1] Create user service in backend/src/services/user_service.py (get_by_email, create_user methods)
- [X] T082 [US1] Create auth router in backend/src/api/routes/auth.py (depends on T080, T081)
- [X] T083 [US1] Implement POST /api/auth/signup endpoint in backend/src/api/routes/auth.py per auth.openapi.yaml
- [X] T084 [US1] Implement POST /api/auth/login endpoint in backend/src/api/routes/auth.py per auth.openapi.yaml
- [X] T085 [US1] Implement POST /api/auth/logout endpoint in backend/src/api/routes/auth.py per auth.openapi.yaml
- [X] T086 [US1] Implement GET /api/auth/me endpoint in backend/src/api/routes/auth.py for current user
- [X] T087 [US1] Register auth router in backend/src/main.py
- [X] T088 [US1] Add input validation for signup (email format, password min 8 chars)
- [X] T089 [US1] Add error handling for duplicate email (409 Conflict)
- [X] T090 [US1] Add error handling for invalid credentials (401 Unauthorized)

#### Frontend - Auth API Module

- [X] T091 [P] [US1] Create auth API module in frontend/src/lib/api/auth.ts (signup, login, logout, getMe functions)
- [X] T092 [US1] Add error handling to auth API module with proper error types

#### Frontend - Landing Page

- [X] T093 [P] [US1] Create landing page at frontend/src/app/page.tsx with hero section
- [X] T094 [US1] Add Aceternity UI BackgroundBeams to landing page
- [X] T095 [US1] Add Aceternity UI TextGenerateEffect to landing page hero text
- [X] T096 [US1] Add Aceternity UI MovingBorder button components to landing page
- [X] T097 [US1] Add navigation to signup and login from landing page

#### Frontend - Signup Page

- [X] T098 [US1] Create signup page at frontend/src/app/signup/page.tsx
- [X] T099 [US1] Create signup form component in frontend/src/components/auth/SignupForm.tsx
- [X] T100 [US1] Add React Hook Form with Zod validation to signup form (email, name, password)
- [X] T101 [US1] Integrate signup form with auth store and auth API
- [X] T102 [US1] Add loading state during signup
- [X] T103 [US1] Add error display for signup failures
- [X] T104 [US1] Add redirect to dashboard on successful signup

#### Frontend - Login Page

- [X] T105 [US1] Create login page at frontend/src/app/login/page.tsx
- [X] T106 [US1] Create login form component in frontend/src/components/auth/LoginForm.tsx
- [X] T107 [US1] Add React Hook Form with Zod validation to login form (email, password)
- [X] T108 [US1] Integrate login form with auth store and auth API
- [X] T109 [US1] Add loading state during login
- [X] T110 [US1] Add error display for login failures (invalid credentials)
- [X] T111 [US1] Add redirect to dashboard on successful login
- [X] T112 [US1] Implement "Remember me" with Zustand persist middleware

#### Frontend - Auth State Management

- [X] T113 [US1] Add token refresh logic to auth store (auto-refresh when <1 day remaining)
- [X] T114 [US1] Add logout functionality to auth store (clear token, redirect to login)
- [X] T115 [US1] Implement protected route wrapper for dashboard and settings pages

**Checkpoint**: User Story 1 complete - users can signup, login, and logout. Auth foundation ready for task management.

---

## Phase 4: User Story 2 - View My Tasks (Priority: P1)

**Goal**: Display all user tasks in a clean, organized interface with empty state

**Independent Test**: Log in and see task list (or empty state if no tasks). Create a task manually in DB and verify it appears.

### Implementation for User Story 2

#### Backend - Task Service & List Endpoint

- [X] T116 [P] [US2] Create task service in backend/src/services/task_service.py (get_tasks method with user isolation)
- [X] T117 [P] [US2] Create task schemas in backend/src/schemas/task.py (TaskPublic, TaskListResponse)
- [X] T118 [US2] Create task router in backend/src/api/routes/tasks.py (depends on T116, T117)
- [X] T119 [US2] Implement GET /api/tasks endpoint in backend/src/api/routes/tasks.py per tasks.openapi.yaml
- [X] T120 [US2] Add pagination support to GET /api/tasks (page, page_size params)
- [X] T121 [US2] Add completed filter support to GET /api/tasks (completed query param)
- [X] T122 [US2] Add cursor-based pagination logic (cursor param, next_cursor in response)
- [X] T123 [US2] Add user isolation check (user_id from JWT must match task.user_id)
- [X] T124 [US2] Register task router in backend/src/main.py
- [X] T125 [US2] Add sorting by created_at DESC in task service

#### Frontend - Task API Module

- [X] T126 [P] [US2] Create task API module in frontend/src/lib/api/tasks.ts (getTasks function)
- [X] T127 [US2] Add error handling to task API module

#### Frontend - Task Store

- [X] T128 [P] [US2] Create task store in frontend/src/stores/task-store.ts with Zustand (tasks array, loading, error, fetchTasks)
- [X] T129 [US2] Add optimistic updates support to task store

#### Frontend - Dashboard Page

- [X] T130 [US2] Create dashboard page at frontend/src/app/dashboard/page.tsx (protected route)
- [X] T131 [US2] Create dashboard layout in frontend/src/components/dashboard/DashboardLayout.tsx
- [X] T132 [US2] Create task list component in frontend/src/components/tasks/TaskList.tsx
- [X] T133 [US2] Create task item component in frontend/src/components/tasks/TaskItem.tsx with Shadcn Card
- [X] T134 [US2] Add empty state component in frontend/src/components/tasks/EmptyState.tsx (when no tasks)
- [X] T135 [US2] Integrate dashboard with task store (fetch tasks on mount)
- [X] T136 [US2] Add loading skeleton for task list using Shadcn Skeleton
- [X] T137 [US2] Add error display for task fetch failures
- [X] T138 [US2] Add responsive design for mobile (TaskList and TaskItem)

**Checkpoint**: User Story 2 complete - users can view their task list with empty state

---

## Phase 5: User Story 3 - Create a New Task (Priority: P1)

**Goal**: Allow users to quickly add tasks with title and optional description

**Independent Test**: Click "Add Task" button, fill in title (and optionally description), submit, see task appear in list immediately (optimistic update)

### Implementation for User Story 3

#### Backend - Create Task Endpoint

- [X] T139 [P] [US3] Create TaskCreate schema in backend/src/schemas/task.py (title, description)
- [X] T140 [US3] Add create_task method to backend/src/services/task_service.py
- [X] T141 [US3] Implement POST /api/tasks endpoint in backend/src/api/routes/tasks.py per tasks.openapi.yaml
- [X] T142 [US3] Add validation for title (1-200 chars) and description (max 1000 chars)
- [X] T143 [US3] Add user_id from JWT to new task automatically
- [X] T144 [US3] Return 201 Created with task object

#### Frontend - Task Creation

- [X] T145 [US3] Add createTask function to frontend/src/lib/api/tasks.ts
- [X] T146 [US3] Add createTask action to frontend/src/stores/task-store.ts with optimistic update
- [X] T147 [US3] Create "Add Task" button in frontend/src/components/tasks/AddTaskButton.tsx
- [X] T148 [US3] Create task creation modal in frontend/src/components/tasks/CreateTaskModal.tsx using Shadcn Dialog
- [X] T149 [US3] Create task form in frontend/src/components/tasks/TaskForm.tsx with React Hook Form
- [X] T150 [US3] Add Zod validation to task form (title required 1-200 chars, description optional max 1000)
- [X] T151 [US3] Integrate create task modal with task store
- [X] T152 [US3] Add optimistic UI update (task appears immediately in list)
- [X] T153 [US3] Add loading state during task creation
- [X] T154 [US3] Add error handling (rollback optimistic update on failure)
- [X] T155 [US3] Add success toast notification using Shadcn Toast
- [X] T156 [US3] Auto-focus title input when modal opens
- [X] T157 [US3] Close modal and reset form after successful creation

**Checkpoint**: User Story 3 complete - users can create tasks with immediate feedback

---

## Phase 6: User Story 4 - Mark Task as Complete (Priority: P1)

**Goal**: Allow users to toggle task completion status with smooth animations

**Independent Test**: Click checkbox next to a task, see it marked complete with strikethrough. Click again to mark incomplete.

### Implementation for User Story 4

#### Backend - Update Task Completion

- [X] T158 [P] [US4] Create TaskUpdate schema in backend/src/schemas/task.py (title, description, completed - all optional)
- [X] T159 [US4] Add update_task method to backend/src/services/task_service.py
- [X] T160 [US4] Implement PATCH /api/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py per tasks.openapi.yaml
- [X] T161 [US4] Add user isolation check (verify task belongs to current user)
- [X] T162 [US4] Return 404 if task not found or doesn't belong to user
- [X] T163 [US4] Update updated_at timestamp automatically

#### Frontend - Task Completion Toggle

- [X] T164 [US4] Add updateTask function to frontend/src/lib/api/tasks.ts
- [X] T165 [US4] Add toggleComplete action to frontend/src/stores/task-store.ts with optimistic update
- [X] T166 [US4] Add checkbox to frontend/src/components/tasks/TaskItem.tsx using Shadcn Checkbox
- [X] T167 [US4] Add strikethrough styling for completed tasks
- [X] T168 [US4] Add Framer Motion animation for completion state change
- [X] T169 [US4] Integrate checkbox with task store toggleComplete action
- [X] T170 [US4] Add optimistic UI update (checkbox state changes immediately)
- [X] T171 [US4] Add error handling (rollback optimistic update on API failure)
- [X] T172 [US4] Add visual distinction between complete and incomplete tasks (opacity, color)

**Checkpoint**: User Story 4 complete - users can mark tasks complete/incomplete with smooth UX

---

## Phase 7: User Story 5 - Update Task Details (Priority: P2)

**Goal**: Allow users to edit task title and description with inline editing

**Independent Test**: Click "Edit" icon on a task, modify title/description, save changes. See updated task in list.

### Implementation for User Story 5

#### Frontend - Task Editing

- [X] T173 [US5] Add updateTask action to frontend/src/stores/task-store.ts (reuse from US4 if needed)
- [X] T174 [US5] Create edit task modal in frontend/src/components/tasks/EditTaskModal.tsx using Shadcn Dialog
- [X] T175 [US5] Reuse TaskForm component from US3 for edit modal (prepopulate with current values)
- [X] T176 [US5] Add "Edit" icon button to frontend/src/components/tasks/TaskItem.tsx using Shadcn Button
- [X] T177 [US5] Integrate edit modal with task store updateTask action
- [X] T178 [US5] Add optimistic UI update (task updates immediately in list)
- [X] T179 [US5] Add loading state during update
- [X] T180 [US5] Add error handling (rollback optimistic update on failure)
- [X] T181 [US5] Add cancel button to discard changes
- [X] T182 [US5] Add success toast notification
- [X] T183 [US5] Close modal after successful update

**Checkpoint**: User Story 5 complete - users can edit task details with inline editing

---

## Phase 8: User Story 6 - Delete Tasks (Priority: P2)

**Goal**: Allow users to permanently delete tasks with confirmation

**Independent Test**: Click "Delete" icon, confirm in dialog, see task removed from list with smooth animation

### Implementation for User Story 6

#### Backend - Delete Task Endpoint

- [X] T184 [US6] Add delete_task method to backend/src/services/task_service.py
- [X] T185 [US6] Implement DELETE /api/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py per tasks.openapi.yaml
- [X] T186 [US6] Add user isolation check (verify task belongs to current user)
- [X] T187 [US6] Return 404 if task not found or doesn't belong to user
- [X] T188 [US6] Return 204 No Content on successful deletion

#### Frontend - Task Deletion

- [X] T189 [US6] Add deleteTask function to frontend/src/lib/api/tasks.ts
- [X] T190 [US6] Add deleteTask action to frontend/src/stores/task-store.ts with optimistic update
- [X] T191 [US6] Create delete confirmation dialog in frontend/src/components/tasks/DeleteTaskDialog.tsx using Shadcn AlertDialog
- [X] T192 [US6] Add "Delete" icon button to frontend/src/components/tasks/TaskItem.tsx using Shadcn Button (destructive variant)
- [X] T193 [US6] Integrate delete dialog with task store deleteTask action
- [X] T194 [US6] Add optimistic UI update (task removed immediately from list)
- [X] T195 [US6] Add Framer Motion exit animation for deleted task
- [X] T196 [US6] Add error handling (restore task to list on API failure)
- [X] T197 [US6] Add success toast notification
- [X] T198 [US6] Close dialog after successful deletion

**Checkpoint**: User Story 6 complete - users can delete tasks with confirmation

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Navigation & Layout

- [X] T199 [P] Create header component in frontend/src/components/layout/Header.tsx with logo and user menu
- [X] T200 [P] Create sidebar component in frontend/src/components/layout/Sidebar.tsx with navigation
- [X] T201 [P] Add logout button to user menu in header
- [X] T202 [P] Create settings page at frontend/src/app/settings/page.tsx (protected route)
- [X] T203 [P] Create not-found page at frontend/src/app/not-found/page.tsx

### Error Handling & Logging

- [X] T204 [P] Add request logging middleware to backend/src/middleware/logging.py
- [X] T205 [P] Add error tracking setup (e.g., Sentry) to backend/src/core/monitoring.py
- [X] T206 [P] Add performance monitoring to backend
- [X] T207 [P] Add error tracking setup to frontend (e.g., Sentry)

### Testing & Documentation

- [X] T208 [P] Run quickstart.md validation scenarios
- [X] T209 [P] Add API documentation with FastAPI auto-generated docs
- [X] T210 [P] Update README.md with complete setup and deployment instructions
- [X] T211 [P] Create DEPLOYMENT.md with Vercel and Neon setup steps
- [X] T212 [P] Add example .env files with all required variables

### Security Hardening

- [X] T213 [P] Add rate limiting to auth endpoints
- [X] T214 [P] Add CSRF protection middleware
- [X] T215 [P] Review and fix any security vulnerabilities
- [X] T216 [P] Add security headers (HSTS, CSP, etc.)

### Performance Optimization

- [X] T217 [P] Add database query optimization (check N+1 queries)
- [X] T218 [P] Add frontend bundle optimization (code splitting)
- [X] T219 [P] Add image optimization with Next.js Image component
- [X] T220 [P] Add caching strategy for API responses

### Observability Implementation (from plan.md refinement)

- [X] T221 [P] Setup structured logging framework - Backend: install structlog, Frontend: install winston, configure JSON output format
- [X] T222 [P] Implement request/response logging in backend/src/middleware/logging.py with request_id, method, path, status_code, duration_ms, user_id
- [X] T223 [P] Add performance metrics collection for API response times (p50, p95, p99) and database query times in Prometheus-compatible format
- [X] T224 [P] Implement error tracking and context capture with global exception handler, stack traces, user_id, request_id in backend/src/core/monitoring.py
- [X] T225 [P] Create audit log for user actions (task created/updated/deleted, auth events) with schema in separate audit_logs table
- [X] T226 [P] Add health check endpoints GET /health and GET /health/db in backend/src/api/health.py for deployment verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Research (Phase 0)**: No dependencies - can start immediately
- **Setup (Phase 1)**: Depends on Phase 0 - requires understanding of design
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Phase 2 completion
  - US1 (Auth) must complete before US2-6 (requires authentication)
  - US2 (View) should complete before US3-6 (establishes list view)
  - US3 (Create) independent after US2
  - US4 (Complete) independent after US2
  - US5 (Update) independent after US2
  - US6 (Delete) independent after US2
- **Polish (Phase 9)**: Depends on desired user stories being complete

### User Story Dependencies

```
Phase 2 (Foundation)
       │
       ├──> Phase 3 (US1: Auth) ──┐
       │                          │
       └──────────────────────────┴──> Phase 4 (US2: View) ──┐
                                                              │
                                         ┌────────────────────┤
                                         │                    │
                                    Phase 5 (US3: Create)     │
                                         │                    │
                                    Phase 6 (US4: Complete)   │
                                         │                    │
                                    Phase 7 (US5: Update)     │
                                         │                    │
                                    Phase 8 (US6: Delete)     │
                                         │                    │
                                         └────────────────────┴──> Phase 9 (Polish)
```

### Critical Path

1. **Phase 0-2 (Blocking)**: Must complete sequentially
2. **Phase 3 (Auth)**: Must complete before Phase 4
3. **Phase 4 (View)**: Should complete before Phase 5-8
4. **Phase 5-8**: Can proceed in parallel after Phase 4

### Parallel Opportunities

#### Phase 1 (Setup)
- Backend dependencies (T011-T019) can all run in parallel
- Frontend dependencies (T025-T034) can all run in parallel
- Backend setup and Frontend setup can run in parallel

#### Phase 2 (Foundation)
- User and Task models (T052-T053) can run in parallel
- Auth and User schemas (T061-T062) can run in parallel
- All frontend foundation tasks (T069-T079) can run in parallel after API client

#### Phase 3 (US1: Auth)
- Backend auth and user services (T080-T081) can run in parallel
- Frontend auth API module (T091-T092) can run in parallel with landing page (T093-T097)
- Signup and Login pages can be built in parallel once auth store is ready

#### Phase 4-8 (US2-US6)
- Once US1 is complete, all remaining user stories can start in parallel if team capacity allows
- Within each story, frontend and backend can proceed in parallel

---

## Parallel Example: User Story 1 (Auth)

```bash
# Backend - Run these in parallel:
Task T080: "Create auth service in backend/src/services/auth_service.py"
Task T081: "Create user service in backend/src/services/user_service.py"

# Frontend - Run these in parallel after auth store:
Task T093: "Create landing page at frontend/src/app/page.tsx"
Task T098: "Create signup page at frontend/src/app/signup/page.tsx"
Task T105: "Create login page at frontend/src/app/login/page.tsx"
```

---

## Implementation Strategy

### MVP First (Phases 0-4 Only)

**Goal**: Minimal viable product with auth and task viewing

1. Complete Phase 0: Research (8 tasks)
2. Complete Phase 1: Setup (37 tasks)
3. Complete Phase 2: Foundational (34 tasks) - **CRITICAL BLOCKER**
4. Complete Phase 3: User Story 1 - Auth (36 tasks)
5. Complete Phase 4: User Story 2 - View Tasks (23 tasks)
6. **STOP and VALIDATE**: Test auth flow and task viewing
7. Deploy MVP to Vercel + Neon

**Total MVP Tasks**: 138 tasks

### Incremental Delivery

1. **MVP Release** (Phases 0-4): Auth + View Tasks
2. **v1.1** (Phase 5): Add Task Creation
3. **v1.2** (Phase 6): Add Task Completion
4. **v1.3** (Phase 7): Add Task Editing
5. **v1.4** (Phase 8): Add Task Deletion
6. **v2.0** (Phase 9): Polish + Production Ready

### Parallel Team Strategy

With 3 developers:

**Phases 0-2**: Everyone works together (foundation is critical)

**After Phase 2 completes**:
- **Developer A**: Phase 3 (US1: Auth) - 36 tasks
- **Developer B**: Phase 5 (US3: Create) - 19 tasks (can start after US2)
- **Developer C**: Phase 6 (US4: Complete) - 15 tasks (can start after US2)

**Note**: US2 (View) should be completed by one developer first as it establishes the task list foundation.

---

## Summary

### Task Count

- **Total Tasks**: 226 tasks
- **Phase 0 (Research)**: 8 tasks
- **Phase 1 (Setup)**: 37 tasks
- **Phase 2 (Foundation)**: 34 tasks ⚠️ BLOCKER
- **Phase 3 (US1: Auth)**: 36 tasks
- **Phase 4 (US2: View)**: 23 tasks
- **Phase 5 (US3: Create)**: 19 tasks
- **Phase 6 (US4: Complete)**: 15 tasks
- **Phase 7 (US5: Update)**: 11 tasks
- **Phase 8 (US6: Delete)**: 15 tasks
- **Phase 9 (Polish)**: 28 tasks (includes 6 new observability tasks T221-T226)

### Parallel Opportunities

- **Phase 1**: 28 parallelizable tasks (backend deps, frontend deps, configs)
- **Phase 2**: 16 parallelizable tasks (models, schemas, API modules)
- **Phase 3-8**: Most frontend and backend tasks within each story can run in parallel
- **Phase 9**: 28 polish tasks can run in parallel (includes 6 observability tasks)

### Independent Test Criteria

- **US1 (Auth)**: Sign up → Log in → Verify token → Log out
- **US2 (View)**: Log in → See task list or empty state
- **US3 (Create)**: Click "Add Task" → Fill form → See task appear immediately
- **US4 (Complete)**: Click checkbox → See strikethrough → Click again to undo
- **US5 (Update)**: Click "Edit" → Change title → Save → See updated task
- **US6 (Delete)**: Click "Delete" → Confirm → See task removed with animation

### Suggested MVP Scope

**Phases 0-4 (138 tasks)**: Research + Setup + Foundation + Auth + View Tasks

This provides a fully functional authentication system with the ability to view tasks, establishing the complete infrastructure for rapid addition of remaining CRUD operations.

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] marker indicates parallelizable tasks
- [Story] label maps to user stories (US1-US6)
- Phase 2 (Foundation) MUST complete before any user story work begins
- Each user story is independently testable
- Tests are NOT included (not requested in specification)
- Commit after completing each task or logical group
- Stop at any checkpoint to validate story independently
