# Feature Specification: Phase 5 - Advanced Cloud Deployment

**Feature Branch**: `002-phase-5-cloud-deploy`
**Created**: 2025-12-30
**Status**: Ready for Planning
**Input**: User description: "Phase 5 - Advanced Cloud Deployment with Dapr, Kafka, Microservices, WebSocket real-time sync, CI/CD, and DigitalOcean DOKS deployment"
**Priority**: P1 (Critical - Final Phase)
**Due Date**: January 18, 2026
**Points**: 300 (Base) + 600 (Bonus potential)
**Builds Upon**: Phase 4 - Local Kubernetes Deployment

---

## Executive Summary

Phase 5 is the culmination of the Evolution of Todo project. It transforms the Phase 4 locally deployed application into a production-grade, event-driven, distributed system deployable on cloud Kubernetes providers.

**Three Parts**:
- **Part A**: Advanced Features (Intermediate + Advanced Level)
- **Part B**: Local Dapr + Kafka Deployment (Minikube with Strimzi)
- **Part C**: Cloud Kubernetes Deployment (DigitalOcean DOKS - Primary)

**Key Deliverables**:
- Advanced task features: Priorities, Tags, Due Dates, Reminders, Recurring Tasks, Search, Filter, Sort
- Event-driven architecture with Kafka (Strimzi local / Redpanda Cloud)
- Full Dapr integration (Pub/Sub, State, Jobs API, Secrets, Service Invocation)
- New microservices: Notification, Recurring Task, Audit, WebSocket Sync
- Real-time task synchronization across all connected clients
- CI/CD pipeline with GitHub Actions
- Production deployment on DigitalOcean Kubernetes (DOKS)
- Monitoring and observability (Prometheus + Grafana)

---

## User Scenarios & Testing

### Part A: Advanced Features

---

### User Story 1 - Task Priority Management (Priority: P1)

As a user, I want to assign priorities (high/medium/low) to my tasks so that I can focus on what's most important.

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

As a user, I want to tag my tasks with categories (work/personal/urgent) so that I can organize tasks by context.

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

As a user, I want to set due dates and receive reminders so that I don't miss deadlines.

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

As a user, I want to create recurring tasks (daily/weekly/monthly) so that routine tasks auto-regenerate.

**Why this priority**: Recurring tasks reduce manual entry for routine activities.

**Independent Test**: Can be tested by completing a recurring task and verifying the next occurrence is created.

**Acceptance Scenarios**:

1. **Given** I want a weekly task, **When** I say "Add recurring task: weekly standup every Monday", **Then** a recurring task is created
2. **Given** I complete a recurring task, **When** I mark it complete, **Then** the next occurrence is automatically created
3. **Given** I have a recurring task, **When** I ask "Show my recurring tasks", **Then** all recurring tasks with patterns are shown
4. **Given** I want to stop recurrence, **When** I say "Stop recurring for task 1", **Then** the task becomes one-time
5. **Given** I have a daily recurring task, **When** I complete it, **Then** a new instance for tomorrow is created via event

---

### User Story 5 - Search Tasks (Priority: P2)

As a user, I want to search my tasks by keyword so that I can quickly find specific tasks.

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

As a user, I want to filter and sort my tasks by various criteria so that I can view my tasks in useful ways.

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

As a developer, I want task events published to a message broker via Dapr so that services can react asynchronously.

**Why this priority**: Event-driven architecture is the foundation for scalable microservices.

**Independent Test**: Can be tested by creating a task and verifying the event appears in message topic.

**Acceptance Scenarios**:

1. **Given** I create a task, **When** the task is saved, **Then** a "task.created" event is published to `task-events` topic
2. **Given** I complete a task, **When** I mark it done, **Then** a "task.completed" event is published
3. **Given** I update a task, **When** I change title/description, **Then** a "task.updated" event is published
4. **Given** I delete a task, **When** it's removed, **Then** a "task.deleted" event is published
5. **Given** message broker is unavailable, **When** publishing fails, **Then** the operation still succeeds (async/best-effort)

---

### User Story 8 - Notification Service (Priority: P2)

As a user, I want to receive notifications when reminders are due so that I'm alerted about upcoming tasks.

**Why this priority**: Notifications are the user-facing result of the event-driven architecture.

**Independent Test**: Can be tested by scheduling a reminder and verifying notification is sent.

**Acceptance Scenarios**:

1. **Given** a reminder is scheduled, **When** the time arrives, **Then** Notification Service receives event from `reminders` topic
2. **Given** Notification Service receives event, **When** processing, **Then** it sends in-app notification
3. **Given** notification fails, **When** an error occurs, **Then** it's retried with exponential backoff
4. **Given** I want to see sent notifications, **When** I check logs, **Then** all notifications are audited
5. **Given** user has no notification preference, **When** reminder fires, **Then** default to in-app notification

---

### User Story 9 - Recurring Task Service (Priority: P2)

As a system, I want completed recurring tasks to auto-generate next occurrences via events so that users have seamless recurring task experience.

**Why this priority**: Decouples recurring task logic from main backend for scalability.

**Independent Test**: Can be tested by completing a recurring task and verifying new instance via event.

**Acceptance Scenarios**:

1. **Given** Recurring Task Service is running, **When** it receives "task.completed" for recurring task, **Then** it creates next occurrence
2. **Given** a recurring task is "weekly", **When** completed on Monday, **Then** next occurrence is created for next Monday
3. **Given** a recurring task is "daily", **When** completed, **Then** next occurrence is tomorrow
4. **Given** recurrence is stopped, **When** task is completed, **Then** no new occurrence is created
5. **Given** multiple recurring tasks complete simultaneously, **When** processed, **Then** all next occurrences are created

---

### User Story 10 - Audit Service (Priority: P3)

As an admin, I want all task operations logged to an audit trail so that I have complete history.

**Why this priority**: Audit trail is important for compliance and debugging.

**Independent Test**: Can be tested by performing task operations and querying audit log.

**Acceptance Scenarios**:

1. **Given** Audit Service is running, **When** any task event occurs, **Then** it's logged with timestamp
2. **Given** I want to see task history, **When** I query audit service, **Then** all events for that task are returned
3. **Given** I want user activity, **When** I query by user_id, **Then** all user's task events are returned
4. **Given** audit storage is full, **When** new events arrive, **Then** old events older than 90 days are archived to cold storage and deleted from database
5. **Given** I need to debug, **When** I view audit logs, **Then** I can trace the full event chain

---

### User Story 11 - Dapr Jobs API for Reminders (Priority: P2)

As a developer, I want reminders scheduled via Dapr Jobs API so that exact-time delivery is guaranteed.

**Why this priority**: Dapr Jobs API provides precise timing over cron-based polling.

**Independent Test**: Can be tested by scheduling a job and verifying callback fires at exact time.

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

As a developer, I want automated CI/CD via GitHub Actions so that deployments are consistent and reliable.

**Why this priority**: CI/CD is essential for production deployment practices.

**Independent Test**: Can be tested by pushing to main and verifying deployment completes.

**Acceptance Scenarios**:

1. **Given** I push to a feature branch, **When** pipeline runs, **Then** tests execute and container images build
2. **Given** I create a PR, **When** pipeline runs, **Then** staging deployment is triggered
3. **Given** I merge to main, **When** pipeline runs, **Then** production deployment is triggered
4. **Given** tests fail, **When** pipeline runs, **Then** deployment is blocked
5. **Given** I need to rollback, **When** I revert commit, **Then** previous version is deployed

---

### User Story 13 - Cloud Kubernetes Deployment (Priority: P1)

As a DevOps engineer, I want to deploy to DigitalOcean Kubernetes (DOKS) so that the application is production-ready.

**Why this priority**: Cloud deployment is the final deliverable of the hackathon.

**Independent Test**: Can be tested by accessing the application via cloud URL.

**Acceptance Scenarios**:

1. **Given** Helm charts are ready, **When** I run deploy script, **Then** all pods deploy to cloud cluster
2. **Given** I access the cloud URL, **When** I visit the frontend, **Then** the application loads
3. **Given** I use the chatbot, **When** I create tasks, **Then** they persist to database
4. **Given** I scale replicas, **When** HPA triggers, **Then** pods scale automatically
5. **Given** a pod crashes, **When** Kubernetes detects, **Then** it's automatically restarted

---

### User Story 14 - Cloud Message Broker Integration (Priority: P1)

As a developer, I want to use cloud-managed message broker so that events flow reliably in production.

**Why this priority**: Cloud messaging is required for production event streaming.

**Independent Test**: Can be tested by creating a task and verifying event in cloud console.

**Acceptance Scenarios**:

1. **Given** cloud messaging is configured, **When** task event is published, **Then** it appears in cloud topic
2. **Given** cloud messaging has authentication, **When** service connects, **Then** authentication succeeds
3. **Given** consumer processes events, **When** backend publishes, **Then** Notification/Recurring services receive
4. **Given** cloud messaging has retention, **When** events are old, **Then** they're cleaned up per policy
5. **Given** I view cloud console, **When** I check topics, **Then** I see message flow and consumer lag

---

### User Story 15 - Monitoring & Observability (Priority: P2)

As a DevOps engineer, I want monitoring dashboards so that I can observe system health.

**Why this priority**: Observability is essential for production operations.

**Independent Test**: Can be tested by accessing dashboard and viewing metrics.

**Acceptance Scenarios**:

1. **Given** metrics collection is deployed, **When** services expose metrics, **Then** metrics are scraped
2. **Given** dashboard is deployed, **When** I access it, **Then** I see pod metrics
3. **Given** a service has high latency, **When** I check dashboard, **Then** latency spike is visible
4. **Given** I set an alert, **When** threshold is exceeded, **Then** alert fires
5. **Given** Dapr is enabled, **When** I view Dapr dashboard, **Then** I see service invocation metrics

---

### User Story 16 - Real-time Task Sync via WebSocket (Priority: P1)

As a user with multiple devices/tabs open, I want task changes to sync in real-time across all connected clients so that I always see the latest state.

**Why this priority**: Real-time sync demonstrates event-driven fan-out and multi-client consistency - core to the event-driven architecture.

**Independent Test**: Can be tested by opening two browser tabs, creating a task in one, and verifying it appears immediately in the other.

**Acceptance Scenarios**:

1. **Given** I have two browser tabs open, **When** I create a task in tab 1, **Then** the task appears in tab 2 within 1 second
2. **Given** I complete a task on my phone, **When** my desktop is connected, **Then** the task shows completed on desktop immediately
3. **Given** WebSocket service is consuming `task-updates`, **When** a task event is published, **Then** all connected clients receive the update
4. **Given** a client disconnects and reconnects, **When** reconnected, **Then** the client fetches latest state and resumes real-time updates
5. **Given** multiple users are connected, **When** one user updates their task, **Then** only that user's clients receive the update (user isolation)

---

### Edge Cases

**Event-Driven Architecture**:
- What happens when message broker is temporarily unavailable?
  - Events are buffered locally, retried with exponential backoff
  - Task operations still succeed (async event publishing)
- What happens when consumer lags behind producer?
  - Monitor consumer lag metrics, scale consumers if needed
- What happens when event processing fails?
  - Dead letter queue for failed events, manual retry capability
  - Circuit breaker opens after 5 consecutive failures, resets after 60 seconds

**Advanced Features**:
- What happens when recurring task pattern is invalid?
  - Validate patterns (daily/weekly/monthly), reject invalid patterns
- What happens when user creates 1000+ tags?
  - Limit to 100 tags per user, suggest consolidation
- What happens when reminder time is in the past?
  - Fire reminder immediately (within 1 minute) and notify user it was past-due

**Cloud Deployment**:
- What happens when cloud provider has outage?
  - Multi-AZ deployment for resilience, health checks for failover
- What happens when CI/CD secret expires?
  - Automated notifications for secret rotation
- What happens when Helm upgrade fails?
  - Automatic rollback to previous release

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

- **FR-EDA-001**: System MUST publish task events to `task-events` topic
- **FR-EDA-002**: System MUST publish reminder events to `reminders` topic
- **FR-EDA-003**: System MUST use Dapr Pub/Sub for message broker abstraction
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
- **FR-CICD-003**: System MUST build and push container images on merge
- **FR-CICD-004**: System MUST deploy to staging on PR
- **FR-CICD-005**: System MUST deploy to production on main merge
- **FR-CICD-006**: System MUST support rollback via Git revert

#### Cloud Deployment (FR-CLOUD-001 to FR-CLOUD-008)

- **FR-CLOUD-001**: System MUST deploy to cloud Kubernetes cluster as primary target
- **FR-CLOUD-002**: System MUST use cloud-managed message broker
- **FR-CLOUD-003**: System MUST configure Dapr on cloud cluster
- **FR-CLOUD-004**: System MUST use cloud secret manager for secrets
- **FR-CLOUD-005**: System MUST configure TLS/SSL via cert-manager
- **FR-CLOUD-006**: System MUST configure Horizontal Pod Autoscaler
- **FR-CLOUD-007**: System MUST deploy monitoring and dashboards
- **FR-CLOUD-008**: System MUST configure centralized logging

### Non-Functional Requirements

#### Performance (NFR-PERF-001 to NFR-PERF-005)

- **NFR-PERF-001**: Task search MUST return results within 500ms
- **NFR-PERF-002**: Event publishing MUST complete within 100ms
- **NFR-PERF-003**: Consumer lag MUST stay under 1000 messages
- **NFR-PERF-004**: Reminder delivery MUST be within 1 minute of scheduled time
- **NFR-PERF-005**: Cloud deployment (Helm upgrade only) MUST complete within 10 minutes. Cluster creation time is excluded from this metric.

#### Reliability (NFR-REL-001 to NFR-REL-005)

- **NFR-REL-001**: System MUST handle message broker unavailability gracefully
- **NFR-REL-002**: System MUST retry failed events with exponential backoff
- **NFR-REL-003**: System MUST use circuit breakers for external calls
- **NFR-REL-004**: System MUST have 99.9% uptime SLO for production
- **NFR-REL-005**: System MUST auto-recover from pod failures

#### Security (NFR-SEC-001 to NFR-SEC-006)

- **NFR-SEC-001**: All services MUST communicate via mTLS
- **NFR-SEC-002**: Message broker MUST use authentication
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
| user_id | string | Owner (FK to users.id) |
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
| user_id | string | Owner (FK to users.id) |
| name | string | Tag name (max 50 chars) |
| color | string | Hex color (default: #808080) |
| created_at | timestamp | Auto-set |

### TaskTag Entity (New - Junction)

| Field | Type | Description |
|-------|------|-------------|
| task_id | integer | FK to tasks.id |
| tag_id | integer | FK to tags.id |

### Reminder Entity (New)

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| task_id | integer | FK to tasks.id |
| user_id | string | Owner (FK to users.id) |
| remind_at | datetime | When to send reminder |
| status | enum | pending/sent/failed |
| sent_at | datetime | When notification was sent |
| created_at | timestamp | Auto-set |

### TaskEvent Entity (Event Schema)

| Field | Type | Description |
|-------|------|-------------|
| event_type | string | created/updated/completed/deleted |
| task_id | integer | Task identifier |
| user_id | string | User identifier |
| task_data | object | Full task object |
| timestamp | datetime | Event timestamp |
| correlation_id | string | Tracing identifier |

### ReminderEvent Entity (Event Schema)

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

## Success Criteria

### Measurable Outcomes

- **SC-001**: All advanced features (priorities, tags, due dates, reminders, recurring, search, filter, sort) functional
- **SC-002**: All task events published and consumed by services
- **SC-003**: Reminders delivered within 1 minute of scheduled time
- **SC-004**: Recurring tasks auto-create next occurrence
- **SC-005**: CI/CD pipeline deploys in under 10 minutes
- **SC-006**: Application accessible via cloud Kubernetes URL
- **SC-007**: Metrics visible in monitoring dashboard
- **SC-008**: All services communicate via mTLS
- **SC-009**: No secrets exposed in Git repository
- **SC-010**: System handles 100 concurrent users on cloud
- **SC-011**: Real-time task sync across browser tabs within 1 second

---

## Out of Scope

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

| Service | Purpose | Notes |
|---------|---------|-------|
| Neon PostgreSQL | Database (existing) | Free tier |
| Cloud Kubernetes | Production K8s cluster | DigitalOcean DOKS (sole target) |
| Cloud Message Broker | Event streaming | Redpanda Cloud (Kafka-compatible, sole target) |
| Local Message Broker | Local development | Strimzi Operator on Minikube |
| GitHub Actions | CI/CD | Free for public repos |
| Container Registry | Image storage | DOCR (native DOKS integration, sole target) |

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Dapr learning curve | Medium | High | Start with Pub/Sub only, add incrementally |
| Message broker complexity | High | Medium | Use managed service, Dapr abstracts details |
| Cloud cost overrun | Medium | Medium | Set budget alerts, use free tiers |
| CI/CD setup time | Medium | Medium | Use template workflows |
| Integration failures | High | Medium | Extensive local testing first |
| Deadline pressure | High | Medium | Prioritize Part A + B, Part C optional |

---

## Bonus Features (+600 Points)

Phase 5 explicitly targets up to **+600 bonus points** via the following features. These are optional but highly recommended for maximum scoring.

| Bonus Feature | Points | Description |
|---------------|--------|-------------|
| **Reusable Intelligence** | +200 | Create and use reusable Claude Code Subagents and Agent Skills |
| **Cloud-Native Blueprints** | +200 | Create reusable Agent Skills for Kubernetes, Dapr, CI/CD |
| **Multi-language Support (Urdu)** | +100 | Enable Urdu language support with RTL layout |
| **Voice Commands** | +200 | Add voice input capability for todo commands |

---

## Assumptions

1. Phase 4 local Kubernetes deployment is complete and functional
2. Existing Phase 4 Helm charts can be extended for Phase 5
3. Neon PostgreSQL database from Phase 2 remains available
4. Cloud provider free credits are sufficient for development and testing
5. GitHub repository is public (for free GitHub Actions)
6. Team has basic familiarity with Docker and Kubernetes from Phase 4
7. In-app notifications are sufficient (no external push notification service required)

---

## Clarifications

### Session 2025-12-30

- Q: Which cloud Kubernetes provider should be the SOLE implementation target for Phase 5? → A: DigitalOcean DOKS only
- Q: Which cloud message broker should be used for production event streaming? → A: Redpanda Cloud (Kafka-compatible)
- Q: Which container registry should be used for storing container images? → A: DOCR (DigitalOcean Container Registry)
- Q: What should happen when a user sets a reminder time that is already in the past? → A: Fire immediately and notify user it was past-due

---

**Specification Version**: 1.1.0
**Last Updated**: 2025-12-30
**Phase**: Phase 5 - Advanced Cloud Deployment
**Next Step**: Run `/sp.plan` to create implementation plan based on this specification.
