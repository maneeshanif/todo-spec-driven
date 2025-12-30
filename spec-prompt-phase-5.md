# Feature Specification: Advanced Cloud Deployment - Phase 5

**Project**: Evolution of Todo
**Phase**: Phase 5 - Advanced Cloud Deployment
**Version**: 1.1.0
**Created**: December 29, 2025
**Due Date**: January 18, 2026
**Status**: Ready for Planning
**Priority**: P1 (Critical - Final Phase)
**Builds Upon**: Phase 4 - Local Kubernetes Deployment
**Points**: 300 (Base) + 600 (Bonus potential)

---

## Executive Summary

Phase 5 is the culmination of the Evolution of Todo project. It transforms the Phase 4 locally deployed application into a production-grade, event-driven, distributed system deployable on cloud Kubernetes providers.

**Three Parts**:
- **Part A**: Advanced Features (Intermediate + Advanced Level)
- **Part B**: Local Dapr + Kafka Deployment (Minikube with Strimzi)
- **Part C**: Cloud Kubernetes Deployment (DigitalOcean DOKS - Primary)

> **Cloud Provider Clarification**: Phase 5 is deployed primarily on **DigitalOcean Kubernetes (DOKS)**. The architecture remains cloud-agnostic and is compatible with AKS, GKE, and OKE as valid alternatives.

**Key Deliverables**:
- Advanced task features: Priorities, Tags, Due Dates, Reminders, Recurring Tasks, Search, Filter, Sort
- Event-driven architecture with Kafka (Strimzi local / Redpanda Cloud)
- Full Dapr integration (Pub/Sub, State, Jobs API, Secrets, Service Invocation)
- New microservices: Notification, Recurring Task, Audit, **WebSocket Sync**
- Real-time task synchronization across all connected clients
- CI/CD pipeline with GitHub Actions
- Production deployment on DigitalOcean Kubernetes (DOKS)
- Monitoring and observability (Prometheus + Grafana)

---

## User Scenarios & Testing

### Part A: Advanced Features

---

### User Story 1 - Task Priority Management (Priority: P1)

**Description**: As a user, I want to assign priorities (high/medium/low) to my tasks so that I can focus on what's most important.

**Why this priority**: Priority is fundamental to task management - helps users organize and focus.

**Independent Test**: Can be tested by creating a task with "high" priority and verifying it appears with priority indicator.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I say "Add high priority task to finish project", **Then** a task is created with priority "high"
2. **Given** I have tasks with different priorities, **When** I ask "Show my high priority tasks", **Then** only high priority tasks are shown
3. **Given** I have a task with medium priority, **When** I say "Change task 1 to high priority", **Then** the priority is updated
4. **Given** I am listing tasks, **When** I view the list, **Then** tasks show priority indicators (color/icon)
5. **Given** I don't specify priority, **When** I create a task, **Then** it defaults to "medium" priority

---

### User Story 2 - Tag/Category Management (Priority: P1)

**Description**: As a user, I want to tag my tasks with categories (work/personal/urgent) so that I can organize tasks by context.

**Why this priority**: Tags enable flexible organization beyond priority levels.

**Independent Test**: Can be tested by creating a task with tags and filtering by tag.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I say "Add task: buy groceries, tags: shopping, personal", **Then** task is created with both tags
2. **Given** I have tasks with tags, **When** I ask "Show tasks tagged work", **Then** only work-tagged tasks appear
3. **Given** I have a task, **When** I say "Add tag urgent to task 1", **Then** the tag is added
4. **Given** I have a task with tags, **When** I say "Remove tag personal from task 1", **Then** the tag is removed
5. **Given** I want to see my tags, **When** I ask "List my tags", **Then** all unique tags are shown with task counts

---

### User Story 3 - Due Dates & Reminders (Priority: P1)

**Description**: As a user, I want to set due dates and receive reminders so that I don't miss deadlines.

**Why this priority**: Time-based task management is essential for productivity.

**Independent Test**: Can be tested by creating a task with due date and verifying reminder is scheduled.

> **Notification Clarification**: Reminders are delivered via **in-app real-time notifications** (required). Browser-level push notifications (Web Push API) and email notifications are **optional** and not required for Phase 5 scoring.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I say "Add task: submit report due January 15", **Then** task is created with due date
2. **Given** I have a task with due date, **When** I say "Remind me 1 hour before task 1 is due", **Then** a reminder is scheduled
3. **Given** a reminder is due, **When** the time arrives, **Then** I receive an in-app notification (real-time via WebSocket)
4. **Given** I want to see upcoming tasks, **When** I ask "What's due this week?", **Then** tasks due within 7 days are shown
5. **Given** I have an overdue task, **When** I view my tasks, **Then** it's highlighted as overdue

---

### User Story 4 - Recurring Tasks (Priority: P2)

**Description**: As a user, I want to create recurring tasks (daily/weekly/monthly) so that routine tasks auto-regenerate.

**Why this priority**: Recurring tasks reduce manual entry for routine activities.

**Independent Test**: Can be tested by completing a recurring task and verifying the next occurrence is created.

**Acceptance Scenarios**:

1. **Given** I want a weekly task, **When** I say "Add recurring task: weekly standup every Monday", **Then** a recurring task is created
2. **Given** I complete a recurring task, **When** I mark it complete, **Then** the next occurrence is automatically created
3. **Given** I have a recurring task, **When** I ask "Show my recurring tasks", **Then** all recurring tasks with patterns are shown
4. **Given** I want to stop recurrence, **When** I say "Stop recurring for task 1", **Then** the task becomes one-time
5. **Given** I have a daily recurring task, **When** I complete it, **Then** a new instance for tomorrow is created via Kafka event

---

### User Story 5 - Search Tasks (Priority: P2)

**Description**: As a user, I want to search my tasks by keyword so that I can quickly find specific tasks.

**Why this priority**: Search becomes essential as task lists grow.

**Independent Test**: Can be tested by searching for a keyword and verifying matching tasks are returned.

**Acceptance Scenarios**:

1. **Given** I have many tasks, **When** I say "Search for meeting", **Then** all tasks containing "meeting" are shown
2. **Given** I search for a non-existent term, **When** I see results, **Then** "No tasks found" is displayed
3. **Given** I have tasks with descriptions, **When** I search, **Then** both title and description are searched
4. **Given** I search with filters, **When** I say "Search meeting in high priority", **Then** results are filtered by both
5. **Given** I want partial matching, **When** I search "meet", **Then** "meeting" tasks are included

---

### User Story 6 - Filter & Sort Tasks (Priority: P2)

**Description**: As a user, I want to filter and sort my tasks by various criteria so that I can view my tasks in useful ways.

**Why this priority**: Filtering/sorting improves task list usability.

**Independent Test**: Can be tested by filtering by status and sorting by due date.

**Acceptance Scenarios**:

1. **Given** I have mixed tasks, **When** I ask "Show pending high priority tasks", **Then** only matching tasks appear
2. **Given** I want to sort, **When** I say "Sort tasks by due date", **Then** tasks are ordered by due date
3. **Given** I want multiple filters, **When** I say "Show work tasks due this week", **Then** both filters apply
4. **Given** I want to see all, **When** I say "Clear filters", **Then** all tasks are shown
5. **Given** I want alphabetical order, **When** I say "Sort tasks by title", **Then** tasks are sorted A-Z

---

### Part B: Event-Driven Architecture (Local)

---

### User Story 7 - Dapr Pub/Sub Integration (Priority: P1)

**Description**: As a developer, I want task events published to Kafka via Dapr so that services can react asynchronously.

**Why this priority**: Event-driven architecture is the foundation for scalable microservices.

**Independent Test**: Can be tested by creating a task and verifying the event appears in Kafka topic.

**Acceptance Scenarios**:

1. **Given** I create a task, **When** the task is saved, **Then** a "task.created" event is published to `task-events` topic
2. **Given** I complete a task, **When** I mark it done, **Then** a "task.completed" event is published
3. **Given** I update a task, **When** I change title/description, **Then** a "task.updated" event is published
4. **Given** I delete a task, **When** it's removed, **Then** a "task.deleted" event is published
5. **Given** Kafka is unavailable, **When** publishing fails, **Then** the operation still succeeds (async/best-effort)

---

### User Story 8 - Notification Service (Priority: P2)

**Description**: As a user, I want to receive notifications when reminders are due so that I'm alerted about upcoming tasks.

**Why this priority**: Notifications are the user-facing result of the event-driven architecture.

**Independent Test**: Can be tested by scheduling a reminder and verifying notification is sent.

**Acceptance Scenarios**:

1. **Given** a reminder is scheduled, **When** the time arrives, **Then** Notification Service receives event from `reminders` topic
2. **Given** Notification Service receives event, **When** processing, **Then** it sends push/email notification
3. **Given** notification fails, **When** an error occurs, **Then** it's retried with exponential backoff
4. **Given** I want to see sent notifications, **When** I check logs, **Then** all notifications are audited
5. **Given** user has no notification preference, **When** reminder fires, **Then** default to push notification

---

### User Story 9 - Recurring Task Service (Priority: P2)

**Description**: As a system, I want completed recurring tasks to auto-generate next occurrences via Kafka so that users have seamless recurring task experience.

**Why this priority**: Decouples recurring task logic from main backend for scalability.

**Independent Test**: Can be tested by completing a recurring task and verifying new instance via Kafka.

**Acceptance Scenarios**:

1. **Given** Recurring Task Service is running, **When** it receives "task.completed" for recurring task, **Then** it creates next occurrence
2. **Given** a recurring task is "weekly", **When** completed on Monday, **Then** next occurrence is created for next Monday
3. **Given** a recurring task is "daily", **When** completed, **Then** next occurrence is tomorrow
4. **Given** recurrence is stopped, **When** task is completed, **Then** no new occurrence is created
5. **Given** multiple recurring tasks complete simultaneously, **When** processed, **Then** all next occurrences are created

---

### User Story 10 - Audit Service (Priority: P3)

**Description**: As an admin, I want all task operations logged to an audit trail so that I have complete history.

**Why this priority**: Audit trail is important for compliance and debugging.

**Independent Test**: Can be tested by performing task operations and querying audit log.

**Acceptance Scenarios**:

1. **Given** Audit Service is running, **When** any task event occurs, **Then** it's logged with timestamp
2. **Given** I want to see task history, **When** I query audit service, **Then** all events for that task are returned
3. **Given** I want user activity, **When** I query by user_id, **Then** all user's task events are returned
4. **Given** audit storage is full, **When** new events arrive, **Then** old events are archived (retention policy)
5. **Given** I need to debug, **When** I view audit logs, **Then** I can trace the full event chain

---

### User Story 11 - Dapr Jobs API for Reminders (Priority: P2)

**Description**: As a developer, I want reminders scheduled via Dapr Jobs API so that exact-time delivery is guaranteed.

**Why this priority**: Dapr Jobs API provides precise timing over cron-based polling.

**Independent Test**: Can be tested by scheduling a job and verifying callback fires at exact time.

> **Scheduling Clarification**: Scheduled reminders use **Dapr Jobs API as the primary mechanism**. Cron bindings may be demonstrated optionally to satisfy full Dapr building block exposure, but Jobs API is preferred for its precision and per-task scheduling capability.

**Acceptance Scenarios**:

1. **Given** I set a reminder for 3 PM, **When** I save it, **Then** a Dapr Job is scheduled for exactly 3 PM
2. **Given** the scheduled time arrives, **When** Dapr calls the callback, **Then** reminder event is published
3. **Given** I cancel a reminder, **When** the job is deleted, **Then** no callback fires
4. **Given** I update reminder time, **When** I change it to 4 PM, **Then** the job is rescheduled
5. **Given** server restarts, **When** it comes back up, **Then** scheduled jobs are preserved (Dapr manages state)

---

### Part C: Cloud Deployment

---

### User Story 12 - CI/CD Pipeline (Priority: P1)

**Description**: As a developer, I want automated CI/CD via GitHub Actions so that deployments are consistent and reliable.

**Why this priority**: CI/CD is essential for production deployment practices.

**Independent Test**: Can be tested by pushing to main and verifying deployment completes.

**Acceptance Scenarios**:

1. **Given** I push to a feature branch, **When** pipeline runs, **Then** tests execute and Docker images build
2. **Given** I create a PR, **When** pipeline runs, **Then** staging deployment is triggered
3. **Given** I merge to main, **When** pipeline runs, **Then** production deployment is triggered
4. **Given** tests fail, **When** pipeline runs, **Then** deployment is blocked
5. **Given** I need to rollback, **When** I revert commit, **Then** previous version is deployed

---

### User Story 13 - Cloud Kubernetes Deployment (Priority: P1)

**Description**: As a DevOps engineer, I want to deploy to DigitalOcean Kubernetes (DOKS) so that the application is production-ready.

**Why this priority**: Cloud deployment is the final deliverable of the hackathon.

**Independent Test**: Can be tested by accessing the application via DigitalOcean cloud URL.

> **Cloud Provider**: Primary target is **DigitalOcean Kubernetes (DOKS)**. Architecture is cloud-agnostic and compatible with AKS, GKE, and OKE as alternatives.

**Acceptance Scenarios**:

1. **Given** Helm charts are ready, **When** I run deploy script, **Then** all pods deploy to DOKS cluster
2. **Given** I access the DigitalOcean URL, **When** I visit the frontend, **Then** the application loads
3. **Given** I use the chatbot, **When** I create tasks, **Then** they persist to Neon database
4. **Given** I scale replicas, **When** HPA triggers, **Then** pods scale automatically
5. **Given** a pod crashes, **When** Kubernetes detects, **Then** it's automatically restarted

---

### User Story 14 - Cloud Kafka Integration (Priority: P1)

**Description**: As a developer, I want to use cloud-managed Kafka (Redpanda/Confluent) so that events flow reliably in production.

**Why this priority**: Cloud Kafka is required for production event streaming.

**Independent Test**: Can be tested by creating a task and verifying event in cloud Kafka console.

**Acceptance Scenarios**:

1. **Given** Redpanda Cloud is configured, **When** task event is published, **Then** it appears in cloud topic
2. **Given** cloud Kafka has SASL authentication, **When** service connects, **Then** authentication succeeds
3. **Given** consumer processes events, **When** backend publishes, **Then** Notification/Recurring services receive
4. **Given** cloud Kafka has retention, **When** events are old, **Then** they're cleaned up per policy
5. **Given** I view Redpanda console, **When** I check topics, **Then** I see message flow and consumer lag

---

### User Story 15 - Monitoring & Observability (Priority: P2)

**Description**: As a DevOps engineer, I want Prometheus + Grafana monitoring so that I can observe system health.

**Why this priority**: Observability is essential for production operations.

**Independent Test**: Can be tested by accessing Grafana dashboard and viewing metrics.

**Acceptance Scenarios**:

1. **Given** Prometheus is deployed, **When** services expose /metrics, **Then** metrics are scraped
2. **Given** Grafana is deployed, **When** I access dashboard, **Then** I see pod metrics
3. **Given** a service has high latency, **When** I check dashboard, **Then** latency spike is visible
4. **Given** I set an alert, **When** threshold is exceeded, **Then** alert fires
5. **Given** Dapr is enabled, **When** I view Dapr dashboard, **Then** I see service invocation metrics

---

### User Story 16 - Real-time Task Sync via WebSocket (Priority: P1)

**Description**: As a user with multiple devices/tabs open, I want task changes to sync in real-time across all connected clients so that I always see the latest state.

**Why this priority**: Real-time sync demonstrates event-driven fan-out and multi-client consistency - core to the event-driven architecture.

**Independent Test**: Can be tested by opening two browser tabs, creating a task in one, and verifying it appears immediately in the other.

> **Architecture Note**: Phase 5 includes a dedicated **WebSocket Service** consuming the `task-updates` topic to synchronize task changes across all connected clients in real time. This is a **REQUIRED** feature, not optional.

**Acceptance Scenarios**:

1. **Given** I have two browser tabs open, **When** I create a task in tab 1, **Then** the task appears in tab 2 within 1 second
2. **Given** I complete a task on my phone, **When** my desktop is connected, **Then** the task shows completed on desktop immediately
3. **Given** WebSocket service is consuming `task-updates`, **When** a task event is published, **Then** all connected clients receive the update
4. **Given** a client disconnects and reconnects, **When** reconnected, **Then** the client fetches latest state and resumes real-time updates
5. **Given** multiple users are connected, **When** one user updates their task, **Then** only that user's clients receive the update (user isolation)

---

### Edge Cases

**Event-Driven Architecture**:
- What happens when Kafka/Redpanda is temporarily unavailable?
  - → Events are buffered locally, retried with exponential backoff
  - → Task operations still succeed (async event publishing)
- What happens when consumer lags behind producer?
  - → Monitor consumer lag metrics, scale consumers if needed
- What happens when event processing fails?
  - → Dead letter queue for failed events, manual retry capability

**Advanced Features**:
- What happens when recurring task pattern is invalid?
  - → Validate patterns (daily/weekly/monthly), reject invalid patterns
- What happens when user creates 1000+ tags?
  - → Limit to 100 tags per user, suggest consolidation
- What happens when reminder time is in the past?
  - → Fire immediately or reject with user-friendly error

**Cloud Deployment**:
- What happens when cloud provider has outage?
  - → Multi-AZ deployment for resilience, health checks for failover
- What happens when GitHub Actions secret expires?
  - → Automated notifications for secret rotation
- What happens when Helm upgrade fails?
  - → Automatic rollback to previous release

---

## Requirements

### Functional Requirements

#### Advanced Features (FR-ADV-001 to FR-ADV-015)

- **FR-ADV-001**: System MUST support task priority (high/medium/low) with visual indicators
- **FR-ADV-002**: System MUST support multiple tags per task with color customization
- **FR-ADV-003**: System MUST support due dates with date/time picker
- **FR-ADV-004**: System MUST support reminders with configurable lead time
- **FR-ADV-005**: System MUST support recurring tasks (daily/weekly/monthly patterns)
- **FR-ADV-006**: System MUST auto-create next occurrence when recurring task is completed
- **FR-ADV-007**: System MUST support full-text search across title and description
- **FR-ADV-008**: System MUST support filtering by status, priority, tags, due date
- **FR-ADV-009**: System MUST support sorting by created_at, due_date, priority, title
- **FR-ADV-010**: System MUST show overdue tasks with visual indicator
- **FR-ADV-011**: System MUST support "due this week" and "due today" quick filters
- **FR-ADV-012**: System MUST expose all advanced features via MCP tools
- **FR-ADV-013**: System MUST expose all advanced features via REST API
- **FR-ADV-014**: System MUST support combined filtering (e.g., high priority + work tag + due this week)
- **FR-ADV-015**: System MUST validate recurring patterns and due dates

#### Event-Driven Architecture (FR-EDA-001 to FR-EDA-012)

- **FR-EDA-001**: System MUST publish task events to Kafka `task-events` topic
- **FR-EDA-002**: System MUST publish reminder events to Kafka `reminders` topic
- **FR-EDA-003**: System MUST use Dapr Pub/Sub for Kafka abstraction
- **FR-EDA-004**: System MUST implement Notification Service consuming `reminders`
- **FR-EDA-005**: System MUST implement Recurring Task Service consuming `task-events`
- **FR-EDA-006**: System MUST implement Audit Service consuming `task-events`
- **FR-EDA-007**: System MUST use Dapr Jobs API for scheduled reminders (primary mechanism)
- **FR-EDA-008**: System MUST use Dapr State Management for conversation state
- **FR-EDA-009**: System MUST use Dapr Secrets for API keys and credentials
- **FR-EDA-010**: System MUST use Dapr Service Invocation for inter-service calls
- **FR-EDA-011**: System MUST implement WebSocket Service consuming `task-updates` for real-time sync
- **FR-EDA-012**: System MUST deliver task updates to all connected clients within 1 second

#### CI/CD Pipeline (FR-CICD-001 to FR-CICD-006)

- **FR-CICD-001**: System MUST have GitHub Actions workflow for CI/CD
- **FR-CICD-002**: System MUST run tests on pull request
- **FR-CICD-003**: System MUST build and push Docker images on merge
- **FR-CICD-004**: System MUST deploy to staging on PR
- **FR-CICD-005**: System MUST deploy to production on main merge
- **FR-CICD-006**: System MUST support rollback via Git revert

#### Cloud Deployment (FR-CLOUD-001 to FR-CLOUD-008)

- **FR-CLOUD-001**: System MUST deploy to DigitalOcean Kubernetes (DOKS) as primary target
- **FR-CLOUD-002**: System MUST use cloud-managed Kafka (Redpanda Cloud/Confluent)
- **FR-CLOUD-003**: System MUST configure Dapr on cloud cluster
- **FR-CLOUD-004**: System MUST use cloud secret manager for secrets
- **FR-CLOUD-005**: System MUST configure TLS/SSL via cert-manager
- **FR-CLOUD-006**: System MUST configure Horizontal Pod Autoscaler
- **FR-CLOUD-007**: System MUST deploy Prometheus + Grafana for monitoring
- **FR-CLOUD-008**: System MUST configure centralized logging

> **Cloud-Agnostic Note**: While DOKS is the primary target, the architecture MUST remain compatible with AKS, GKE, and OKE.

### Non-Functional Requirements

#### Performance (NFR-PERF-001 to NFR-PERF-005)

- **NFR-PERF-001**: Task search MUST return results within 500ms
- **NFR-PERF-002**: Event publishing MUST complete within 100ms
- **NFR-PERF-003**: Kafka consumer lag MUST stay under 1000 messages
- **NFR-PERF-004**: Reminder delivery MUST be within 1 minute of scheduled time
- **NFR-PERF-005**: Cloud deployment MUST complete within 10 minutes

#### Reliability (NFR-REL-001 to NFR-REL-005)

- **NFR-REL-001**: System MUST handle Kafka unavailability gracefully
- **NFR-REL-002**: System MUST retry failed events with exponential backoff
- **NFR-REL-003**: System MUST use circuit breakers for external calls
- **NFR-REL-004**: System MUST have 99.9% uptime SLO for production
- **NFR-REL-005**: System MUST auto-recover from pod failures

#### Security (NFR-SEC-001 to NFR-SEC-006)

- **NFR-SEC-001**: All services MUST communicate via Dapr mTLS
- **NFR-SEC-002**: Kafka MUST use SASL authentication
- **NFR-SEC-003**: Secrets MUST NOT be stored in Git
- **NFR-SEC-004**: Network policies MUST restrict pod communication
- **NFR-SEC-005**: RBAC MUST be configured for Kubernetes resources
- **NFR-SEC-006**: Container images MUST be scanned in CI pipeline

#### Scalability (NFR-SCALE-001 to NFR-SCALE-003)

- **NFR-SCALE-001**: System MUST scale to 1000 concurrent users
- **NFR-SCALE-002**: System MUST auto-scale based on CPU/memory
- **NFR-SCALE-003**: Each microservice MUST scale independently

---

## Key Entities

### Task Entity (Updated from Phase 2)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| user_id | string | Owner (FK → users.id) |
| title | string | Task title (max 200 chars) |
| description | string | Task description (max 1000 chars) |
| completed | boolean | Completion status |
| **priority** | enum | NEW: high/medium/low (default: medium) |
| **due_date** | datetime | NEW: When task is due |
| **reminder_at** | datetime | NEW: When to send reminder |
| **recurring_pattern** | string | NEW: daily/weekly/monthly |
| **next_occurrence** | datetime | NEW: Next recurring date |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-updated |

### Tag Entity (New)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| user_id | string | Owner (FK → users.id) |
| name | string | Tag name (max 50 chars) |
| color | string | Hex color (default: #808080) |
| created_at | timestamp | Auto-set |

### TaskTag Entity (New - Junction)

| Field | Type | Description |
|-------|------|-------------|
| task_id | integer | FK → tasks.id |
| tag_id | integer | FK → tags.id |

### Reminder Entity (New)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| task_id | integer | FK → tasks.id |
| user_id | string | Owner (FK → users.id) |
| remind_at | datetime | When to send reminder |
| status | enum | pending/sent/failed |
| sent_at | datetime | When notification was sent |
| created_at | timestamp | Auto-set |

### TaskEvent Entity (Kafka Event Schema)

| Field | Type | Description |
|-------|------|-------------|
| event_type | string | created/updated/completed/deleted |
| task_id | integer | Task identifier |
| user_id | string | User identifier |
| task_data | object | Full task object |
| timestamp | datetime | Event timestamp |
| correlation_id | string | Tracing identifier |

### ReminderEvent Entity (Kafka Event Schema)

| Field | Type | Description |
|-------|------|-------------|
| task_id | integer | Task identifier |
| user_id | string | User identifier |
| title | string | Task title for notification |
| due_at | datetime | Task due date |
| remind_at | datetime | When reminder was scheduled |
| notification_type | string | push/email/both |
| correlation_id | string | Tracing identifier |

---

## API Contracts

### New REST Endpoints (Phase 5)

#### Tag Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{user_id}/tags | List user's tags |
| POST | /api/{user_id}/tags | Create a tag |
| PUT | /api/{user_id}/tags/{id} | Update a tag |
| DELETE | /api/{user_id}/tags/{id} | Delete a tag |

#### Task Filtering & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{user_id}/tasks?priority=high | Filter by priority |
| GET | /api/{user_id}/tasks?tags=work,urgent | Filter by tags |
| GET | /api/{user_id}/tasks?due_before=2026-01-15 | Filter by due date |
| GET | /api/{user_id}/tasks?search=meeting | Full-text search |
| GET | /api/{user_id}/tasks?sort=due_date&order=asc | Sort tasks |
| GET | /api/{user_id}/tasks?recurring=true | Filter recurring tasks |

#### Reminder Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{user_id}/reminders | List user's reminders |
| POST | /api/{user_id}/tasks/{task_id}/reminder | Schedule reminder |
| DELETE | /api/{user_id}/reminders/{id} | Cancel reminder |

### Updated MCP Tools (Phase 5)

| Tool | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `add_task` | user_id, title, description?, priority?, due_date?, tags?, recurring? | {task_id, status} | Create task with advanced fields |
| `list_tasks` | user_id, status?, priority?, tags?, due_before?, search?, sort? | [{task}] | List with filtering |
| `update_task` | user_id, task_id, title?, description?, priority?, due_date?, tags? | {task_id, status} | Update any field |
| `schedule_reminder` | user_id, task_id, remind_at | {reminder_id, status} | Schedule reminder |
| `cancel_reminder` | user_id, reminder_id | {status} | Cancel reminder |
| `add_tag` | user_id, tag_name, color? | {tag_id, status} | Create tag |
| `list_tags` | user_id | [{tag}] | List user's tags |
| `search_tasks` | user_id, query, filters? | [{task}] | Full-text search |

### Kafka Topics

| Topic | Producer | Consumers | Schema |
|-------|----------|-----------|--------|
| `task-events` | Backend API | Recurring Task Service, Audit Service | TaskEvent |
| `reminders` | Backend API, Dapr Jobs | Notification Service | ReminderEvent |
| `task-updates` | Backend API | WebSocket Service (**REQUIRED**) | TaskSyncEvent |

> **Real-time Sync**: The `task-updates` topic and WebSocket Service are **mandatory** for Phase 5 to demonstrate event-driven fan-out and multi-client consistency.

### Dapr Component Endpoints

| Building Block | Dapr URL | Purpose |
|----------------|----------|---------|
| Pub/Sub | POST http://localhost:3500/v1.0/publish/{pubsub-name}/{topic} | Publish events |
| State | POST/GET http://localhost:3500/v1.0/state/{statestore-name} | Store/retrieve state |
| Secrets | GET http://localhost:3500/v1.0/secrets/{secret-store-name}/{key} | Get secrets |
| Jobs | POST http://localhost:3500/v1.0-alpha1/jobs/{job-name} | Schedule jobs |
| Service Invoke | POST http://localhost:3500/v1.0/invoke/{app-id}/method/{method} | Service calls |

---

## Architecture Overview

### Microservices Architecture

```
+-----------------------------------------------------------------------------------+
|                    DIGITALOCEAN KUBERNETES (DOKS) CLUSTER                          |
|            (Cloud-agnostic - compatible with AKS/GKE/OKE)                          |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |                              DAPR CONTROL PLANE                              |  |
|  |  Sidecar Injector | Operator | Sentry (mTLS) | Placement | Scheduler        |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  +-------------------+  +-------------------+  +-------------------+              |
|  |   FRONTEND POD    |  |   BACKEND POD     |  |  MCP SERVER POD   |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  | | Next.js App  |  |  | | FastAPI App  |  |  | | FastMCP      |  |              |
|  | |  Port: 3000  |  |  | |  Port: 8000  |  |  | |  Port: 8001  |  |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |              |
|  | |  Port: 3500  |  |  | |  Port: 3500  |  |  | |  Port: 3500  |  |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  +-------------------+  +-------------------+  +-------------------+              |
|                                                                                    |
|  +-------------------+  +-------------------+  +-------------------+              |
|  | NOTIFICATION POD  |  | RECURRING TASK POD|  |   AUDIT POD      |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  | | Notif Service|  |  | | Recurring Svc|  |  | | Audit Service|  |              |
|  | |  Port: 8002  |  |  | |  Port: 8003  |  |  | |  Port: 8004  |  |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |              |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |              |
|  +-------------------+  +-------------------+  +-------------------+              |
|                                                                                    |
|  +-------------------+                                                            |
|  | WEBSOCKET POD     |  <-- NEW: Real-time sync service (REQUIRED)               |
|  | +--------------+  |                                                            |
|  | | WS Service   |  |  Consumes: task-updates topic                             |
|  | |  Port: 8005  |  |  Pushes: Real-time updates to all connected clients       |
|  | +--------------+  |                                                            |
|  | | Dapr Sidecar |  |                                                            |
|  | +--------------+  |                                                            |
|  +-------------------+                                                            |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |                           DAPR COMPONENTS                                    |  |
|  |  +------------------+  +------------------+  +------------------+            |  |
|  |  | pubsub.kafka     |  | state.postgresql |  | secretstores     |            |  |
|  |  | (Redpanda Cloud) |  | (Neon DB)        |  | (K8s/DO Secrets) |            |  |
|  |  +------------------+  +------------------+  +------------------+            |  |
|  |  +------------------+                                                        |  |
|  |  | Jobs API         |  (Scheduled reminders - PRIMARY mechanism)             |  |
|  |  +------------------+                                                        |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  External Services:                                                                |
|  - Neon PostgreSQL (External managed)                                             |
|  - Redpanda Cloud / Confluent Cloud (Managed Kafka)                               |
|  - DigitalOcean Container Registry (DOCR)                                         |
+-----------------------------------------------------------------------------------+

CI/CD Pipeline (GitHub Actions):
+------------------+     +------------------+     +------------------+
| Push/PR          | --> | Test + Build     | --> | Deploy to Cloud  |
| (Git workflow)   |     | (Docker + Helm)  |     | (helm upgrade)   |
+------------------+     +------------------+     +------------------+
```

### Event Flow Diagram

```
User Action → Backend API → Dapr Pub/Sub → Kafka Topic → Consuming Services

Example: Complete Recurring Task
+--------+   +--------+   +---------+   +-------------+   +---------------+
| User   |-->| Backend|-->| Dapr    |-->| task-events |-->| Recurring Task|
| marks  |   | marks  |   | publish |   | topic       |   | Service       |
| done   |   | complete|  |         |   |             |   | (creates next)|
+--------+   +--------+   +---------+   +-------------+   +---------------+
                                                                 |
                                                                 v
                                               +---------+   +-------+
                                               | Dapr    |-->| Neon  |
                                               | publish |   | DB    |
                                               | created |   +-------+
                                               +---------+

Example: Reminder Notification
+--------+   +--------+   +---------+   +-------------+   +---------------+
| Task   |-->| Backend|-->| Dapr    |-->| reminders   |-->| Notification  |
| due    |   | schedules| | Jobs    |   | topic       |   | Service       |
| soon   |   | job    |   | fires   |   |             |   | (sends push)  |
+--------+   +--------+   +---------+   +-------------+   +---------------+
```

---

## Deployment Strategy

### Local (Minikube) - Part B

> **Kafka Strategy (Local)**: Phase 5 uses **Strimzi Operator** for self-hosted Kafka on Minikube. This provides a hands-on learning experience with Kubernetes-native Kafka management.

1. Start Minikube with Dapr
2. Install Strimzi Operator for Kafka
3. Deploy Kafka cluster via Strimzi CRDs
4. Deploy Dapr components (Pub/Sub, State, Secrets, Jobs API)
5. Deploy application via Helm
6. Verify event flow through all services
7. Test WebSocket real-time sync

### Cloud (DigitalOcean DOKS) - Part C

> **Kafka Strategy (Cloud)**: Phase 5 uses **managed Kafka service** (Redpanda Cloud or Confluent Cloud) for production deployment. This demonstrates production-grade event streaming.

1. Create DigitalOcean Kubernetes (DOKS) cluster
2. Install Dapr on DOKS cluster
3. Configure Redpanda Cloud (managed Kafka)
4. Configure DigitalOcean Secrets or Kubernetes secrets
5. Update Helm values for DOKS
6. Deploy via GitHub Actions CI/CD
7. Verify real-time sync across cloud deployment

> **AIOps Tools**: kubectl-ai and Kagent may be used optionally during cluster operations but are not required for Phase 5 deployment. These tools were primarily featured in Phase 4.

### CI/CD Pipeline Stages

```yaml
stages:
  - test      # Run unit/integration tests
  - build     # Build Docker images
  - push      # Push to container registry
  - deploy    # Deploy via Helm

triggers:
  - pull_request: Deploy to staging
  - push to main: Deploy to production
```

---

## Out of Scope (Phase 5)

These are explicitly NOT part of Phase 5:

- Multi-region deployment
- Auto-scaling across regions
- Custom domain with DNS management
- Advanced caching (Redis)
- Full OAuth2/OIDC implementation
- Real-time collaboration features
- Mobile application
- Advanced analytics dashboard
- Machine learning recommendations
- Multi-tenant architecture

---

## Dependencies

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Neon PostgreSQL | Database (existing) | Free tier |
| **DigitalOcean DOKS** | **Primary K8s cluster** | $200 credit for 60 days |
| Azure AKS / GKE / OKE | Alternative K8s clusters | Free credits |
| Redpanda Cloud / Confluent | Cloud Kafka streaming | Free tier / credits |
| Strimzi Operator | Local Kafka (Minikube) | Free (open source) |
| GitHub Actions | CI/CD | Free for public repos |
| Docker Hub / GHCR / DOCR | Container registry | Free tier |

> **DigitalOcean**: Sign up at digitalocean.com for $200 credit valid for 60 days - sufficient for Phase 5 completion.

### New Libraries (Backend)

| Library | Version | Purpose |
|---------|---------|---------|
| dapr | latest | Dapr SDK for Python |
| aiokafka | 0.10+ | Async Kafka client (fallback) |
| cloudevents | 1.10+ | CloudEvents format |
| apscheduler | 3.10+ | Scheduler (backup for Dapr Jobs) |

### New Libraries (Frontend)

| Library | Version | Purpose |
|---------|---------|---------|
| date-fns | 3.0+ | Date manipulation |
| react-datepicker | 6.0+ | Date picker component |
| @tanstack/react-query | 5.0+ | Server state management |

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Dapr learning curve | Medium | High | Start with Pub/Sub only, add incrementally |
| Kafka complexity | High | Medium | Use Redpanda (simpler), Dapr abstracts |
| Cloud cost overrun | Medium | Medium | Set budget alerts, use free tiers |
| CI/CD setup time | Medium | Medium | Use template workflows |
| Integration failures | High | Medium | Extensive local testing first |
| Deadline pressure | High | Medium | Prioritize Part A + B, Part C optional |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All advanced features (priorities, tags, due dates, reminders, recurring, search, filter, sort) functional
- **SC-002**: All task events published to Kafka and consumed by services
- **SC-003**: Reminders delivered within 1 minute of scheduled time
- **SC-004**: Recurring tasks auto-create next occurrence
- **SC-005**: CI/CD pipeline deploys in <10 minutes
- **SC-006**: Application accessible via cloud Kubernetes URL
- **SC-007**: Prometheus metrics visible in Grafana
- **SC-008**: All services communicate via Dapr mTLS
- **SC-009**: No secrets exposed in Git repository
- **SC-010**: System handles 100 concurrent users on cloud

---

## Acceptance Checklist

### Part A: Advanced Features

- [ ] Priority field added to Task model
- [ ] Tag model and many-to-many relationship implemented
- [ ] Due date and reminder fields added
- [ ] Recurring task pattern field added
- [ ] Search endpoint implemented
- [ ] Filter query parameters implemented
- [ ] Sort query parameters implemented
- [ ] All MCP tools updated for advanced features
- [ ] Frontend UI updated for advanced features
- [ ] Database migrations created and applied

### Part B: Event-Driven Architecture (Local)

- [ ] Dapr installed on Minikube
- [ ] Strimzi Operator deployed for Kafka
- [ ] Kafka cluster created via Strimzi CRDs
- [ ] Dapr Pub/Sub component configured (kafka-pubsub)
- [ ] Dapr State component configured (state.postgresql)
- [ ] Dapr Secrets component configured
- [ ] Dapr Jobs API configured for reminders
- [ ] Task events published on CRUD operations
- [ ] Notification Service consuming `reminders` topic
- [ ] Recurring Task Service consuming `task-events` topic
- [ ] Audit Service logging all events from `task-events`
- [ ] **WebSocket Service consuming `task-updates` topic**
- [ ] **Real-time sync verified across browser tabs**

### Part C: Cloud Deployment (DigitalOcean DOKS)

- [ ] **DigitalOcean Kubernetes (DOKS) cluster created**
- [ ] Dapr installed on DOKS cluster
- [ ] **Redpanda Cloud configured (managed Kafka)**
- [ ] DigitalOcean/Kubernetes secrets configured
- [ ] GitHub Actions workflow created
- [ ] Docker images pushed to registry (DOCR/GHCR)
- [ ] Helm deployment to DOKS successful
- [ ] TLS/SSL configured via cert-manager
- [ ] HPA configured for auto-scaling
- [ ] Prometheus + Grafana deployed
- [ ] **Application accessible via DigitalOcean URL**
- [ ] **WebSocket real-time sync verified on cloud**
- [ ] End-to-end testing on cloud completed

### Documentation

- [ ] Cloud deployment guide written
- [ ] Dapr integration guide written
- [ ] Event schema documentation complete
- [ ] Runbooks for common operations
- [ ] Architecture diagram updated
- [ ] README with deployment instructions

---

## Bonus Features (+600 Points)

Phase 5 explicitly targets up to **+600 bonus points** via the following features. These are optional but highly recommended for maximum scoring.

### Bonus Acceptance Checklist

| Bonus Feature | Points | Status | Description |
|---------------|--------|--------|-------------|
| **Reusable Intelligence** | +200 | [ ] | Create and use reusable Claude Code Subagents and Agent Skills for Phase 5 implementation |
| **Cloud-Native Blueprints** | +200 | [ ] | Create reusable Agent Skills for Kubernetes deployment, Dapr setup, and CI/CD |
| **Multi-language Support (Urdu)** | +100 | [ ] | Enable Urdu language support in the AI chatbot interface |
| **Voice Commands** | +200 | [ ] | Add voice input capability for todo commands (speech-to-text) |

### Bonus Feature Details

#### 1. Reusable Intelligence (+200 points)

- [ ] Create Claude Code Subagents for specific Phase 5 tasks
- [ ] Create Agent Skills for Dapr component setup
- [ ] Create Agent Skills for Kafka topic management
- [ ] Create Agent Skills for Helm chart generation
- [ ] Document reusable intelligence in `.claude/skills/` and `.claude/agents/`

#### 2. Cloud-Native Blueprints (+200 points)

- [ ] Create deployment blueprint skill for DOKS
- [ ] Create Strimzi Kafka setup skill
- [ ] Create Dapr component configuration skill
- [ ] Create CI/CD pipeline generation skill
- [ ] Create monitoring setup skill (Prometheus + Grafana)

#### 3. Multi-language Support - Urdu (+100 points)

- [ ] AI Agent understands Urdu commands
- [ ] AI Agent responds in Urdu when prompted
- [ ] UI supports RTL (right-to-left) text display
- [ ] Example: "میرے کام دکھاؤ" → shows tasks in Urdu

#### 4. Voice Commands (+200 points)

- [ ] Integrate Web Speech API for voice input
- [ ] Voice-to-text for task commands
- [ ] Visual feedback during voice recording
- [ ] Support for English voice commands
- [ ] Optional: Support for Urdu voice commands

> **Bonus Scoring Note**: Judges evaluate bonuses based on implementation completeness and integration quality. Partial implementations receive proportional credit.

---

## References

### Project Documents
- [Phase 5 Constitution](./constitution-prompt-phase-5.md)
- [Phase 4 Specification](./spec-prompt-phase-4.md)
- [Hackathon II Documentation](./Hackathon%20II%20-%20Todo%20Spec-Driven%20Development.md)

### Cloud Providers
- [**DigitalOcean DOKS** (Primary)](https://docs.digitalocean.com/products/kubernetes/)
- [DigitalOcean Container Registry](https://docs.digitalocean.com/products/container-registry/)
- [Azure AKS](https://docs.microsoft.com/en-us/azure/aks/)
- [Google GKE](https://cloud.google.com/kubernetes-engine/docs)
- [Oracle OKE](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)

### Dapr
- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Jobs API](https://docs.dapr.io/developing-applications/building-blocks/jobs/)
- [Dapr State Management](https://docs.dapr.io/developing-applications/building-blocks/state-management/)
- [Dapr Service Invocation](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/)

### Kafka
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Strimzi Operator](https://strimzi.io/documentation/) - Local Kafka
- [Redpanda Cloud](https://docs.redpanda.com/) - Cloud Kafka
- [Confluent Cloud](https://docs.confluent.io/cloud/current/overview.html) - Alternative

### CI/CD & DevOps
- [GitHub Actions](https://docs.github.com/en/actions)
- [Helm Charts](https://helm.sh/docs/)
- [cert-manager](https://cert-manager.io/docs/)

---

**Specification Version**: 1.1.0
**Last Updated**: December 30, 2025
**Phase**: Phase 5 - Advanced Cloud Deployment
**Primary Cloud Provider**: DigitalOcean Kubernetes (DOKS)
**Next Step**: Run `/sp.plan` to create implementation plan based on this specification.

---

## Changelog

### v1.1.0 (December 30, 2025)
- **Cloud Provider**: Updated to DigitalOcean DOKS as primary target (AKS/GKE/OKE as alternatives)
- **Kafka Strategy**: Split by environment - Strimzi for local, managed Kafka for cloud
- **Dapr Jobs API**: Clarified as primary mechanism for scheduled reminders
- **WebSocket Sync**: Added as REQUIRED feature (User Story 16)
- **Notifications**: Clarified in-app notifications required, Web Push optional
- **Bonus Features**: Added explicit +600 point bonus acceptance checklist
- **AIOps Tools**: Clarified kubectl-ai/Kagent as optional for Phase 5

### v1.0.0 (December 29, 2025)
- Initial specification draft
