# Tasks: Phase 5 - Advanced Cloud Deployment

**Input**: Design documents from `/specs/002-phase-5-cloud-deploy/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md
**Branch**: `002-phase-5-cloud-deploy`
**Due Date**: January 18, 2026

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US16)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/`
- **Services**: `services/[service-name]/src/`
- **Dapr Components**: `dapr-components/`
- **Helm**: `helm/todo-app/`
- **CI/CD**: `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Phase 5 project initialization and configuration

- [ ] T001 Create Phase 5 branch structure and update CLAUDE.md
- [ ] T002 [P] Create services/ directory structure for new microservices
- [ ] T003 [P] Create dapr-components/ directory with placeholder files
- [ ] T004 [P] Create .github/workflows/ directory structure
- [ ] T005 [P] Update helm/todo-app/Chart.yaml for Phase 5 version
- [ ] T006 Install Dapr SDK dependencies in backend/pyproject.toml
- [ ] T007 [P] Install WebSocket dependencies (websockets, starlette) in backend/pyproject.toml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema (Required for Part A)

- [ ] T008 Create Priority enum and update Task model with priority field in backend/src/models/task.py
- [ ] T009 [P] Add due_date, reminder_at, recurring_pattern, next_occurrence fields to Task model in backend/src/models/task.py
- [ ] T010 [P] Create Tag model in backend/src/models/tag.py
- [ ] T011 [P] Create TaskTag junction model in backend/src/models/task_tag.py
- [ ] T012 [P] Create Reminder model in backend/src/models/reminder.py
- [ ] T013 [P] Create AuditLog model in backend/src/models/audit_log.py
- [ ] T014 Create Alembic migration for Phase 5 schema in backend/alembic/versions/20251230_add_phase5_models.py (or use `alembic revision --autogenerate`)
- [ ] T015 Run Alembic migration and verify schema changes

### Event Schemas (Required for Part B)

- [ ] T016 [P] Create TaskEvent Pydantic schema in backend/src/schemas/events.py
- [ ] T017 [P] Create ReminderEvent Pydantic schema in backend/src/schemas/events.py
- [ ] T018 [P] Create TaskUpdateEvent Pydantic schema in backend/src/schemas/events.py

### Dapr Infrastructure (Required for Part B)

- [ ] T019 [P] Create Dapr Pub/Sub Kafka component in dapr-components/pubsub-kafka.yaml
- [ ] T020 [P] Create Dapr State Store PostgreSQL component in dapr-components/statestore-postgres.yaml
- [ ] T021 [P] Create Dapr Secrets Kubernetes component in dapr-components/secretstore-kubernetes.yaml
- [ ] T022 [P] Create Dapr Resiliency policies in dapr-components/resiliency.yaml
- [ ] T023 Create Dapr client wrapper service in backend/src/services/dapr_client.py

### Local Kafka Setup (Required for Part B)

- [ ] T024 Create Strimzi Kafka namespace (`kafka`) and operator manifest in k8s/kafka/strimzi-operator.yaml
- [ ] T025 Create Strimzi Kafka cluster manifest in k8s/kafka/kafka-cluster.yaml
- [ ] T026 Create Kafka topics manifest (task-events, reminders, task-updates) in k8s/kafka/kafka-topics.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Task Priority Management (Priority: P1) 🎯 MVP

**Goal**: Users can assign priorities (high/medium/low) to tasks and filter by priority

**Independent Test**: Create task with "high" priority, verify priority indicator appears, filter by priority

### Implementation for User Story 1

- [ ] T027 [US1] Create TaskCreate/TaskUpdate schemas with priority field in backend/src/schemas/task.py
- [ ] T028 [US1] Update tasks router to handle priority in create/update in backend/src/routers/tasks.py
- [ ] T029 [US1] Add priority filter parameter to GET /tasks endpoint in backend/src/routers/tasks.py
- [ ] T030 [US1] Update MCP add_task tool to accept priority parameter in backend/src/mcp_server/tools/task_tools.py
- [ ] T031 [US1] Update MCP list_tasks tool to filter by priority in backend/src/mcp_server/tools/task_tools.py
- [ ] T032 [P] [US1] Create PrioritySelector component in frontend/components/tasks/priority-selector.tsx
- [ ] T033 [P] [US1] Create priority indicator styles (colors/icons) in frontend/components/tasks/priority-badge.tsx
- [ ] T034 [US1] Integrate PrioritySelector into task creation form in frontend/components/tasks/task-form.tsx
- [ ] T035 [US1] Display priority badges in task list in frontend/components/tasks/task-item.tsx
- [ ] T036 [US1] Add priority filter chip to task list page in frontend/app/tasks/page.tsx

**Checkpoint**: User Story 1 complete - priority management works independently

---

## Phase 4: User Story 2 - Tag/Category Management (Priority: P1)

**Goal**: Users can tag tasks with categories and filter by tags

**Independent Test**: Create task with tags "work, personal", filter by "work" tag, see only matching tasks

### Implementation for User Story 2

- [ ] T037 [US2] Create TagCreate/TagUpdate schemas in backend/src/schemas/tag.py
- [ ] T038 [US2] Create tags router with CRUD endpoints in backend/src/routers/tags.py
- [ ] T039 [US2] Add tag relationship handling to task create/update in backend/src/routers/tasks.py
- [ ] T040 [US2] Add tags filter parameter to GET /tasks endpoint in backend/src/routers/tasks.py
- [ ] T041 [US2] Create MCP add_tag, list_tags, remove_tag tools in backend/src/mcp_server/tools/tag_tools.py
- [ ] T042 [US2] Update MCP add_task to accept tags parameter in backend/src/mcp_server/tools/task_tools.py
- [ ] T043 [P] [US2] Create TagManager component with color picker in frontend/components/tasks/tag-manager.tsx
- [ ] T044 [P] [US2] Create TagBadge display component in frontend/components/tasks/tag-badge.tsx
- [ ] T045 [US2] Integrate TagManager into task creation form in frontend/components/tasks/task-form.tsx
- [ ] T046 [US2] Display tags in task list items in frontend/components/tasks/task-item.tsx
- [ ] T047 [US2] Add tag filter chips to task list page in frontend/app/tasks/page.tsx
- [ ] T048 [US2] Create tags API module in frontend/lib/api/tags.ts

**Checkpoint**: User Story 2 complete - tag management works independently

---

## Phase 5: User Story 3 - Due Dates & Reminders (Priority: P1)

**Goal**: Users can set due dates and schedule reminders for tasks

**Independent Test**: Create task with due date, schedule reminder 1 hour before, verify reminder is recorded

### Implementation for User Story 3

- [ ] T049 [US3] Add due_date handling to task create/update in backend/src/routers/tasks.py
- [ ] T050 [US3] Create reminders router in backend/src/routers/reminders.py
- [ ] T051 [US3] Create reminder service for scheduling Dapr Jobs in backend/src/services/reminder_service.py
- [ ] T052 [US3] Add Dapr Jobs API callback endpoint for reminders in backend/src/routers/dapr_callbacks.py
- [ ] T053 [US3] Create MCP schedule_reminder tool in backend/src/mcp_server/tools/reminder_tools.py
- [ ] T054 [US3] Add due_before/due_after filter to GET /tasks in backend/src/routers/tasks.py
- [ ] T055 [P] [US3] Create DueDatePicker component in frontend/components/tasks/due-date-picker.tsx
- [ ] T056 [P] [US3] Create ReminderScheduler component in frontend/components/tasks/reminder-scheduler.tsx
- [ ] T057 [US3] Integrate due date and reminder into task form in frontend/components/tasks/task-form.tsx
- [ ] T058 [US3] Display due date and overdue indicator in task list in frontend/components/tasks/task-item.tsx
- [ ] T059 [US3] Add "due this week" and "due today" quick filters in frontend/app/tasks/page.tsx

**Checkpoint**: User Story 3 complete - due dates and reminders work independently

---

## Phase 6: User Story 4 - Recurring Tasks (Priority: P2)

**Goal**: Users can create recurring tasks that auto-regenerate when completed

**Independent Test**: Create weekly recurring task, complete it, verify next occurrence is created

### Implementation for User Story 4

- [ ] T060 [US4] Add recurring_pattern validation to task schemas in backend/src/schemas/task.py
- [ ] T061 [US4] Add recurring_pattern handling to task create/update in backend/src/routers/tasks.py
- [ ] T062 [US4] Create recurring task utility functions in backend/src/services/recurring_service.py
- [ ] T063 [US4] Update MCP add_task to accept recurring parameter in backend/src/mcp_server/tools/task_tools.py
- [ ] T064 [US4] Create MCP list_recurring_tasks tool in backend/src/mcp_server/tools/task_tools.py
- [ ] T065 [P] [US4] Create RecurringPattern selector component in frontend/components/recurring/recurring-pattern.tsx
- [ ] T066 [US4] Integrate recurring pattern into task form in frontend/components/tasks/task-form.tsx
- [ ] T067 [US4] Display recurring indicator in task list in frontend/components/tasks/task-item.tsx

**Checkpoint**: User Story 4 complete - recurring task setup works (event-driven creation in Part B)

---

## Phase 7: User Story 5 - Search Tasks (Priority: P2)

**Goal**: Users can search tasks by keyword across title and description

**Independent Test**: Create tasks with "meeting" in title, search for "meeting", verify matching tasks returned

### Implementation for User Story 5

- [ ] T068 [US5] Create search service with ILIKE query in backend/src/services/search_service.py
- [ ] T069 [US5] Add search parameter to GET /tasks endpoint in backend/src/routers/tasks.py
- [ ] T070 [US5] Create MCP search_tasks tool in backend/src/mcp_server/tools/task_tools.py
- [ ] T071 [P] [US5] Create SearchInput component with debounce in frontend/components/tasks/search-input.tsx
- [ ] T072 [US5] Integrate SearchInput into task list page in frontend/app/tasks/page.tsx
- [ ] T073 [US5] Update task store with search state in frontend/stores/task-store.ts

**Checkpoint**: User Story 5 complete - search works independently

---

## Phase 8: User Story 6 - Filter & Sort Tasks (Priority: P2)

**Goal**: Users can filter and sort tasks by various criteria

**Independent Test**: Filter by status and priority, sort by due date, verify correct ordering

### Implementation for User Story 6

- [ ] T074 [US6] Add sort_by parameter to GET /tasks endpoint in backend/src/routers/tasks.py
- [ ] T075 [US6] Add combined filter logic (status + priority + tags + due_date) in backend/src/routers/tasks.py
- [ ] T076 [US6] Update MCP list_tasks with filter and sort parameters in backend/src/mcp_server/tools/task_tools.py
- [ ] T077 [P] [US6] Create FilterBar component with all filter options in frontend/components/tasks/filter-bar.tsx
- [ ] T078 [P] [US6] Create SortDropdown component in frontend/components/tasks/sort-dropdown.tsx
- [ ] T079 [US6] Integrate FilterBar and SortDropdown into task list page in frontend/app/tasks/page.tsx
- [ ] T080 [US6] Update task store with filter/sort state in frontend/stores/task-store.ts
- [ ] T081 [US6] Add "Clear filters" functionality in frontend/app/tasks/page.tsx

**Checkpoint**: Part A Complete - All advanced features (US1-US6) working

---

## Phase 9: User Story 7 - Dapr Pub/Sub Integration (Priority: P1)

**Goal**: Task CRUD operations publish events to Kafka via Dapr

**Independent Test**: Create task, verify "task.created" event in Kafka topic

### Implementation for User Story 7

- [ ] T082 [US7] Create event publisher service using Dapr HTTP API in backend/src/services/event_publisher.py
- [ ] T083 [US7] Add event publishing to task create in backend/src/routers/tasks.py
- [ ] T084 [US7] Add event publishing to task update in backend/src/routers/tasks.py
- [ ] T085 [US7] Add event publishing to task complete in backend/src/routers/tasks.py
- [ ] T086 [US7] Add event publishing to task delete in backend/src/routers/tasks.py
- [ ] T087 [US7] Implement async/non-blocking publish with error handling in backend/src/services/event_publisher.py
- [ ] T088 [US7] Add correlation_id generation for event tracing in backend/src/middleware/correlation.py
- [ ] T089 [US7] Update backend Dockerfile to include Dapr annotations in backend/Dockerfile

**Checkpoint**: User Story 7 complete - events publishing to Kafka

---

## Phase 10: User Story 8 - Notification Service (Priority: P2)

**Goal**: New microservice that consumes reminder events and sends in-app notifications

**Independent Test**: Schedule reminder, verify notification service logs receipt and publishes to task-updates

### Implementation for User Story 8

- [ ] T090 [US8] Create Notification Service project structure in services/notification-service/
- [ ] T091 [US8] Create pyproject.toml with FastAPI, Dapr SDK dependencies in services/notification-service/pyproject.toml
- [ ] T092 [US8] Create FastAPI main app in services/notification-service/src/main.py
- [ ] T093 [US8] Create Dapr subscription handler for reminders topic in services/notification-service/src/consumer.py
- [ ] T094 [US8] Create notification logic (publish to task-updates) in services/notification-service/src/notifier.py
- [ ] T095 [US8] Create Dockerfile for Notification Service in services/notification-service/Dockerfile
- [ ] T096 [US8] Create Dapr subscription config in services/notification-service/components/subscription.yaml

**Checkpoint**: User Story 8 complete - Notification Service consuming reminders

---

## Phase 11: User Story 9 - Recurring Task Service (Priority: P2)

**Goal**: New microservice that creates next occurrence when recurring task is completed

**Independent Test**: Complete recurring task, verify new task created for next occurrence

### Implementation for User Story 9

- [ ] T097 [US9] Create Recurring Task Service project structure in services/recurring-task-service/
- [ ] T098 [US9] Create pyproject.toml with FastAPI, Dapr SDK, python-dateutil in services/recurring-task-service/pyproject.toml
- [ ] T099 [US9] Create FastAPI main app in services/recurring-task-service/src/main.py
- [ ] T100 [US9] Create Dapr subscription handler for task-events topic in services/recurring-task-service/src/consumer.py
- [ ] T101 [US9] Create next occurrence scheduler logic in services/recurring-task-service/src/scheduler.py
- [ ] T102 [US9] Implement Dapr Service Invocation to call backend create task API in services/recurring-task-service/src/scheduler.py
- [ ] T103 [US9] Create Dockerfile for Recurring Task Service in services/recurring-task-service/Dockerfile
- [ ] T104 [US9] Create Dapr subscription config in services/recurring-task-service/components/subscription.yaml

**Checkpoint**: User Story 9 complete - Recurring tasks auto-create next occurrence

---

## Phase 12: User Story 10 - Audit Service (Priority: P3)

**Goal**: New microservice that logs all task events to audit trail

**Independent Test**: Perform task CRUD, query audit service for task history

### Implementation for User Story 10

- [ ] T105 [US10] Create Audit Service project structure in services/audit-service/
- [ ] T106 [US10] Create pyproject.toml with FastAPI, Dapr SDK, SQLModel in services/audit-service/pyproject.toml
- [ ] T107 [US10] Create FastAPI main app in services/audit-service/src/main.py
- [ ] T108 [US10] Create Dapr subscription handler for task-events topic in services/audit-service/src/consumer.py
- [ ] T109 [US10] Create audit logger with database persistence in services/audit-service/src/logger.py
- [ ] T110 [US10] Create GET /audit/task/{task_id} endpoint for history query in services/audit-service/src/main.py
- [ ] T111 [US10] Create GET /audit/user/{user_id} endpoint for user activity in services/audit-service/src/main.py
- [ ] T112 [US10] Create Dockerfile for Audit Service in services/audit-service/Dockerfile
- [ ] T113 [US10] Create Dapr subscription config in services/audit-service/components/subscription.yaml

**Checkpoint**: User Story 10 complete - All events logged to audit trail

---

## Phase 13: User Story 11 - Dapr Jobs API for Reminders (Priority: P2)

**Goal**: Reminders scheduled via Dapr Jobs API for exact-time delivery

**Independent Test**: Schedule reminder for specific time, verify callback fires at exact time

### Implementation for User Story 11

- [ ] T114 [US11] Integrate Dapr Jobs API scheduling into reminder service in backend/src/services/reminder_service.py
- [ ] T115 [US11] Create Dapr job callback endpoint in backend/src/routers/dapr_callbacks.py
- [ ] T116 [US11] Implement job cancellation for reminder updates in backend/src/services/reminder_service.py
- [ ] T117 [US11] Implement job rescheduling for reminder time changes in backend/src/services/reminder_service.py
- [ ] T118 [US11] Add past-due handling (fire immediately) in backend/src/services/reminder_service.py
- [ ] T119 [US11] Publish reminder event to reminders topic on job callback in backend/src/routers/dapr_callbacks.py

**Checkpoint**: User Story 11 complete - Reminders scheduled via Dapr Jobs API

---

## Phase 14: User Story 16 - Real-time Task Sync via WebSocket (Priority: P1)

**Goal**: Task changes sync in real-time across all connected clients

**Independent Test**: Open two browser tabs, create task in one, verify appears in other within 1 second

### Implementation for User Story 16

- [ ] T120 [US16] Create WebSocket Service project structure in services/websocket-service/
- [ ] T121 [US16] Create pyproject.toml with FastAPI, websockets, Dapr SDK in services/websocket-service/pyproject.toml
- [ ] T122 [US16] Create FastAPI main app with WebSocket endpoint in services/websocket-service/src/main.py
- [ ] T123 [US16] Create WebSocket connection manager with user isolation in services/websocket-service/src/broadcaster.py
- [ ] T124 [US16] Create Dapr subscription handler for task-updates topic in services/websocket-service/src/consumer.py
- [ ] T125 [US16] Broadcast task updates to user's connected clients in services/websocket-service/src/broadcaster.py
- [ ] T126 [US16] Create Dockerfile for WebSocket Service in services/websocket-service/Dockerfile
- [ ] T127 [US16] Create Dapr subscription config in services/websocket-service/components/subscription.yaml
- [ ] T128 [P] [US16] Create WebSocket client hook in frontend/lib/websocket/use-websocket.ts
- [ ] T129 [P] [US16] Create sync client for real-time updates in frontend/lib/websocket/sync-client.ts
- [ ] T130 [US16] Integrate WebSocket sync into task store in frontend/stores/task-store.ts
- [ ] T131 [US16] Add reconnection logic on disconnect in frontend/lib/websocket/sync-client.ts
- [ ] T132 [US16] Display real-time notification toasts in frontend/components/tasks/notification-toast.tsx
- [ ] T133 [US16] Add publishing to task-updates topic from backend in backend/src/services/event_publisher.py

**Checkpoint**: User Story 16 complete - Real-time sync working across clients

---

## Phase 15: User Story 12 - CI/CD Pipeline (Priority: P1)

**Goal**: Automated CI/CD via GitHub Actions

**Independent Test**: Push to feature branch, verify tests run and images build

### Implementation for User Story 12

- [ ] T134 [US12] Create CI workflow for tests and lint in .github/workflows/ci.yaml
- [ ] T135 [US12] Add backend pytest job to CI workflow in .github/workflows/ci.yaml
- [ ] T136 [US12] Add frontend npm test job to CI workflow in .github/workflows/ci.yaml
- [ ] T137 [US12] Add Helm lint job to CI workflow in .github/workflows/ci.yaml
- [ ] T138 [US12] Create build workflow for Docker images in .github/workflows/build.yaml
- [ ] T139 [US12] Add DOCR login and push steps in .github/workflows/build.yaml
- [ ] T140 [US12] Create deploy workflow for cloud deployment in .github/workflows/deploy.yaml
- [ ] T141 [US12] Add staging deployment job (on PR) in .github/workflows/deploy.yaml
- [ ] T142 [US12] Add production deployment job (on main merge) in .github/workflows/deploy.yaml
- [ ] T143 [US12] Configure GitHub repository secrets (DIGITALOCEAN_ACCESS_TOKEN, etc.)
- [ ] T144-A [US12] Verify CI/CD pipeline completes within 10 minutes (NFR-PERF-005) - excludes cluster creation time
- [ ] T144-B [US12] Measure and log pipeline execution times for optimization

**Checkpoint**: User Story 12 complete - CI/CD pipeline functional

---

## Phase 16: User Story 13 - Cloud Kubernetes Deployment (Priority: P1)

**Goal**: Application deployed and accessible on DigitalOcean DOKS

**Independent Test**: Access cloud URL, create task, verify persistence

### Implementation for User Story 13

- [ ] T144 [US13] Create DOKS cluster creation script in scripts/create-doks-cluster.sh
- [ ] T145 [US13] Install Dapr on DOKS cluster using dapr init -k
- [ ] T146 [US13] Update Helm values-prod.yaml for DOKS deployment in helm/todo-app/values-prod.yaml
- [ ] T147 [US13] Create production Dapr components for cloud in helm/todo-app/templates/dapr-components.yaml
- [ ] T148 [US13] Create Notification Service deployment in helm/todo-app/templates/notification-deployment.yaml
- [ ] T149 [US13] Create Recurring Task Service deployment in helm/todo-app/templates/recurring-task-deployment.yaml
- [ ] T150 [US13] Create Audit Service deployment in helm/todo-app/templates/audit-deployment.yaml
- [ ] T151 [US13] Create WebSocket Service deployment in helm/todo-app/templates/websocket-deployment.yaml
- [ ] T152 [US13] Configure HorizontalPodAutoscaler for all services in helm/todo-app/templates/hpa.yaml
- [ ] T153 [US13] Configure NetworkPolicies for pod communication in helm/todo-app/templates/networkpolicy.yaml
- [ ] T154 [US13] Deploy application to DOKS using Helm

**Checkpoint**: User Story 13 complete - Application accessible on cloud

---

## Phase 17: User Story 14 - Cloud Message Broker Integration (Priority: P1)

**Goal**: Production events flow through Redpanda Cloud

**Independent Test**: Create task on cloud, verify event in Redpanda Cloud console

### Implementation for User Story 14

- [ ] T155 [US14] Create Redpanda Cloud account and cluster (select region for low latency, e.g., us-east-1)
- [ ] T156 [US14] Create Kafka topics in Redpanda Cloud (task-events, reminders, task-updates)
- [ ] T157 [US14] Create Kubernetes secret for Redpanda credentials in k8s/secrets/redpanda-credentials.yaml
- [ ] T158 [US14] Update Dapr Pub/Sub component for Redpanda Cloud in helm/todo-app/templates/dapr-pubsub-prod.yaml
- [ ] T159 [US14] Configure SASL authentication for Redpanda in Dapr component
- [ ] T160 [US14] Test event flow from backend to consumer services on cloud
- [ ] T161 [US14] Monitor consumer lag in Redpanda Cloud console

**Checkpoint**: User Story 14 complete - Cloud messaging operational

---

## Phase 18: User Story 15 - Monitoring & Observability (Priority: P2)

**Goal**: Monitoring dashboards for system health visibility

**Independent Test**: Access Grafana dashboard, view pod metrics

### Implementation for User Story 15

- [ ] T162 [US15] Deploy Prometheus using Helm chart in helm/todo-app/templates/prometheus.yaml
- [ ] T163 [US15] Deploy Grafana using Helm chart in helm/todo-app/templates/grafana.yaml
- [ ] T164 [US15] Create Grafana dashboard for pod metrics in docs/grafana-dashboards/pods.json
- [ ] T165 [US15] Create Grafana dashboard for Kafka consumer lag in docs/grafana-dashboards/kafka.json
- [ ] T166 [US15] Configure Dapr metrics export to Prometheus in dapr-components/config.yaml
- [ ] T167 [US15] Configure alerting rules for high latency in helm/todo-app/templates/prometheus-rules.yaml
- [ ] T168 [US15] Deploy Dapr Dashboard for service mesh visibility
- [ ] T169 [US15] Configure centralized logging (pod logs to stdout, use kubectl logs)

**Checkpoint**: User Story 15 complete - Monitoring dashboards operational

---

## Phase 19: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T170 Configure TLS/SSL via cert-manager and Let's Encrypt in helm/todo-app/templates/certificate.yaml
- [ ] T171 [P] Create DAPR-INTEGRATION.md documentation in docs/DAPR-INTEGRATION.md
- [ ] T172 [P] Create KAFKA-SETUP.md documentation in docs/KAFKA-SETUP.md
- [ ] T173 [P] Create CLOUD-DEPLOYMENT.md documentation in docs/CLOUD-DEPLOYMENT.md
- [ ] T174 [P] Create EVENT-SCHEMAS.md documentation in docs/EVENT-SCHEMAS.md
- [ ] T175 [P] Create RUNBOOKS.md with operational procedures in docs/RUNBOOKS.md
- [ ] T176 Security scan container images in CI pipeline in .github/workflows/ci.yaml
- [ ] T177 [P] Update README.md with Phase 5 deployment instructions
- [ ] T178 Configure RBAC for Kubernetes resources in helm/todo-app/templates/rbac.yaml
- [ ] T179 Final end-to-end testing of all user stories
- [ ] T180 Run quickstart.md validation for Phase 5

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Part A (US1-US6)**: Depends on Phase 2 database schema tasks (T008-T015)
- **Part B (US7-US11, US16)**: Depends on Phase 2 event schemas and Dapr infrastructure (T016-T026)
- **Part C (US12-US15)**: Can start after Part A and Part B are functional
- **Phase 19 (Polish)**: Depends on all user stories being complete

### Part A: Advanced Features (US1-US6) - Priority Order

- **US1 (Priority)**: Can start immediately after Foundational - No dependencies
- **US2 (Tags)**: Can start after T010-T011 (Tag models) - No dependency on US1
- **US3 (Due Dates/Reminders)**: Can start after T012 (Reminder model) - No dependency on US1/US2
- **US4 (Recurring)**: Depends on recurring fields in T009 - Event-driven creation needs Part B
- **US5 (Search)**: Can start after Foundational - No dependency on US1-US4
- **US6 (Filter/Sort)**: Can start after US1, US2, US3 provide fields to filter

### Part B: Event-Driven Architecture (US7-US11, US16) - Priority Order

- **US7 (Dapr Pub/Sub)**: MUST complete first - Foundation for all other Part B stories
- **US16 (WebSocket Sync)**: Can start after US7 - Consumes task-updates topic
- **US8 (Notification Service)**: Can start after US7 - Consumes reminders topic
- **US9 (Recurring Task Service)**: Can start after US7 - Consumes task-events topic
- **US10 (Audit Service)**: Can start after US7 - Consumes task-events topic
- **US11 (Dapr Jobs)**: Can start after US7 - Integrates with US3 reminders

### Part C: Cloud Deployment (US12-US15) - Priority Order

- **US12 (CI/CD)**: Can start once services are buildable - Foundation for US13
- **US13 (Cloud K8s)**: Depends on US12 - Needs working CI/CD
- **US14 (Cloud Messaging)**: Depends on US13 - Needs cloud cluster running
- **US15 (Monitoring)**: Depends on US13 - Needs cloud cluster running

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
T008 (Priority enum) → T009 (new fields) - sequential
T010, T011, T012, T013 - all [P] can run in parallel
T016, T017, T018 - all [P] can run in parallel
T019, T020, T021, T022 - all [P] can run in parallel
```

**Part A - User Stories can run in parallel**:
```
After T015 (migration), these can start in parallel:
- US1 (T027-T036) - Priority management
- US2 (T037-T048) - Tag management
- US3 (T049-T059) - Due dates & reminders
- US5 (T068-T073) - Search
```

**Part B - Consumer services can run in parallel**:
```
After US7 (T082-T089), these can start in parallel:
- US8 (T090-T096) - Notification Service
- US9 (T097-T104) - Recurring Task Service
- US10 (T105-T113) - Audit Service
- US16 (T120-T133) - WebSocket Service
```

---

## Parallel Example: Part B Microservices

```bash
# After US7 (Dapr Pub/Sub) is complete, launch all consumer services in parallel:
Task: "Create Notification Service project structure in services/notification-service/"
Task: "Create Recurring Task Service project structure in services/recurring-task-service/"
Task: "Create Audit Service project structure in services/audit-service/"
Task: "Create WebSocket Service project structure in services/websocket-service/"
```

---

## Implementation Strategy

### MVP First (Part A Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (database schema only - T008-T015)
3. Complete US1 (Priority) → Test independently
4. Complete US2 (Tags) → Test independently
5. Complete US3 (Due Dates) → Test independently
6. **STOP and VALIDATE**: All advanced features working
7. Deploy to Vercel (existing Phase 2 setup) for demo

### Full Implementation

1. **Week 1**: Setup + Foundational + Part A (US1-US6)
2. **Week 2**: Part B (US7-US11, US16) - Event-driven architecture
3. **Week 3**: Part C (US12-US15) - Cloud deployment
4. **Week 4**: Polish, testing, documentation

### Parallel Team Strategy

With multiple developers:

**Team A (Backend Focus)**:
- Phase 2: Database schema (T008-T015)
- Part A: US1, US2, US3 backend tasks
- Part B: US7, US11 (Dapr Pub/Sub, Jobs API)

**Team B (Services Focus)**:
- Part B: US8, US9, US10, US16 (all consumer microservices)

**Team C (Frontend + DevOps)**:
- Part A: Frontend tasks (T032-T081)
- Part C: CI/CD, Cloud deployment (US12-US15)

---

## Task Summary

| Part | User Stories | Task Count | Priority |
|------|--------------|------------|----------|
| Setup | - | 7 | P1 |
| Foundational | - | 19 | P1 |
| Part A | US1-US6 | 55 | P1/P2 |
| Part B | US7-US11, US16 | 52 | P1/P2/P3 |
| Part C | US12-US15 | 36 | P1/P2 |
| Polish | - | 11 | P2 |
| **Total** | **16 User Stories** | **180 Tasks** | - |

### Tasks by User Story

| Story | Title | Tasks | Priority |
|-------|-------|-------|----------|
| US1 | Task Priority Management | 10 | P1 |
| US2 | Tag/Category Management | 12 | P1 |
| US3 | Due Dates & Reminders | 11 | P1 |
| US4 | Recurring Tasks | 8 | P2 |
| US5 | Search Tasks | 6 | P2 |
| US6 | Filter & Sort Tasks | 8 | P2 |
| US7 | Dapr Pub/Sub Integration | 8 | P1 |
| US8 | Notification Service | 7 | P2 |
| US9 | Recurring Task Service | 8 | P2 |
| US10 | Audit Service | 9 | P3 |
| US11 | Dapr Jobs API | 6 | P2 |
| US12 | CI/CD Pipeline | 10 | P1 |
| US13 | Cloud K8s Deployment | 11 | P1 |
| US14 | Cloud Message Broker | 7 | P1 |
| US15 | Monitoring & Observability | 8 | P2 |
| US16 | Real-time Task Sync | 14 | P1 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies

---

**Tasks Version**: 1.0.0
**Generated**: 2025-12-30
**Total Tasks**: 180
**User Stories**: 16
**Next Step**: Run `/sp.implement` to begin executing tasks
