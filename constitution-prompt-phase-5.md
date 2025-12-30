# Phase 5: Advanced Cloud Deployment - Project Constitution

**Project**: Evolution of Todo
**Phase**: Phase 5 - Advanced Cloud Deployment
**Version**: 1.1.0
**Ratified**: December 29, 2025
**Updated**: December 30, 2025
**Status**: Active

---

## CLAUDE.md Integration (READ FIRST)

This constitution MUST be read by all agents in this context:
1. **Root CLAUDE.md** - Project-wide rules and phase-specific agent/skill mapping
2. **Backend CLAUDE.md** - Backend-specific patterns and configurations
3. **Frontend CLAUDE.md** - Frontend-specific patterns and configurations
4. **This Constitution** - Phase 5 specific principles and constraints

Agents MUST reference the appropriate CLAUDE.md file based on their scope.

---

## Project Overview

Phase 5 transforms the Phase 4 locally deployed Todo Chatbot into a production-grade, event-driven, distributed system deployable on:
- **Minikube with Dapr** - Local development with full Dapr building blocks
- **Azure AKS / Google GKE / Oracle OKE** - Production cloud Kubernetes deployment
- **Kafka (Redpanda/Confluent/Strimzi)** - Event streaming infrastructure

This phase introduces:
- **Advanced Features**: Recurring Tasks, Due Dates, Reminders, Priorities, Tags, Search, Filter, Sort
- **Event-Driven Architecture**: Kafka for decoupled microservices communication
- **Dapr Integration**: Full building blocks (Pub/Sub, State, Secrets, Service Invocation, Jobs API)
- **Real-time Sync**: Dedicated WebSocket service for multi-client synchronization
- **CI/CD Pipeline**: GitHub Actions for automated deployment
- **Cloud Deployment**: Production Kubernetes on Azure/GKE/Oracle
- **Multi-language Support**: Urdu language support in chatbot (Bonus +100 points)

---

## Core Principles

### Principle I: Event-Driven Architecture (NON-NEGOTIABLE)

**Description**: Services must communicate through events, not direct API calls for async operations.

**Rules**:
- All task CRUD operations must publish to `task-events` Kafka topic
- Reminder scheduling must use `reminders` topic
- Real-time sync across clients must use `task-updates` topic
- Services consume events asynchronously - no blocking waits
- Events are immutable facts - never modify published events

**Rationale**:
- Decouples services for independent scaling
- Enables audit trail and event replay
- Supports eventual consistency patterns
- Allows new consumers without modifying producers

### Principle II: Dapr Abstraction Layer (NON-NEGOTIABLE)

**Description**: All infrastructure dependencies must be abstracted through Dapr building blocks.

**Rules**:
- Use Dapr Pub/Sub for Kafka - no direct Kafka client libraries
- Use Dapr State for conversation state - no direct database calls for state
- Use Dapr Service Invocation for inter-service calls - built-in retries/mTLS
- Use Dapr Secrets for API keys - no hardcoded credentials
- **Use Dapr Jobs API for scheduled reminders (PRIMARY)** - exact-time scheduling for due dates and reminders
- Cron Bindings may be demonstrated optionally to satisfy "Full Dapr" exposure, but production logic relies on Jobs API

**Decision Rationale (Jobs API vs Cron Bindings)**:
| Aspect | Cron Bindings | Jobs API (Chosen) |
|--------|---------------|-------------------|
| Timing | Poll every X minutes | Exact-time callback |
| Precision | Minutes granularity | Seconds granularity |
| Overhead | Continuous polling | Event-driven |
| Use Case | Periodic batch jobs | Precise reminders |

**Rationale**:
- Enables infrastructure swapping without code changes (Kafka → RabbitMQ)
- Provides consistent APIs across all building blocks
- Includes built-in observability and resilience
- Simplifies multi-cloud deployment
- Jobs API provides exact-time scheduling required for reminder accuracy

### Principle III: Stateless Services (NON-NEGOTIABLE)

**Description**: All services must be stateless - state managed externally via Dapr or database.

**Rules**:
- No in-memory session state - use Dapr State Management
- No local file storage - use external object storage
- Configuration via environment variables or Dapr Secrets
- Conversation context stored in PostgreSQL, not memory
- Any pod can handle any request - no sticky sessions

**Rationale**:
- Enables horizontal scaling without session affinity
- Supports rolling deployments without state loss
- Facilitates disaster recovery
- Simplifies debugging and testing

### Principle IV: GitOps Deployment (NON-NEGOTIABLE)

**Description**: All deployments must be triggered through Git - no manual kubectl or helm commands in production.

**Rules**:
- Production deployments only via GitHub Actions
- All Helm values versioned in Git
- Infrastructure changes through Pull Requests
- Rollback by reverting Git commits
- No `kubectl edit` or `kubectl apply` in production - only via CI/CD

**Rationale**:
- Complete audit trail of all deployments
- Reproducible infrastructure from Git history
- Enables automated testing before deployment
- Supports approval workflows

### Principle V: Multi-Environment Parity (NON-NEGOTIABLE)

**Description**: Development, staging, and production environments must be as similar as possible.

**Rules**:
- Same Dapr components in all environments (different backends)
- Same Helm chart with environment-specific values
- Minikube topology mirrors cloud topology
- Local Kafka/Redpanda for development
- Cloud Kafka (Redpanda Cloud/Confluent) for production

**Rationale**:
- Reduces "works on my machine" issues
- Enables realistic local testing
- Simplifies debugging production issues
- Faster onboarding for new developers

### Principle VI: Observability First (NON-NEGOTIABLE)

**Description**: All services must be observable - logs, metrics, and traces.

**Rules**:
- Structured JSON logging in all services
- Prometheus metrics endpoint on all services
- Distributed tracing via Dapr (OpenTelemetry)
- Centralized log aggregation (Loki or cloud equivalent)
- Dashboard for key metrics (Grafana)

**Rationale**:
- Enables rapid incident diagnosis
- Supports proactive alerting
- Provides visibility into system behavior
- Facilitates capacity planning

### Principle VII: Resilience Patterns (NON-NEGOTIABLE)

**Description**: All services must implement resilience patterns for fault tolerance.

**Rules**:
- Circuit breakers via Dapr resiliency policies
- Retry with exponential backoff for external calls
- Timeout configuration on all HTTP calls
- Graceful degradation when dependencies fail
- Health checks for liveness and readiness

**Rationale**:
- Prevents cascade failures
- Improves user experience during partial outages
- Enables self-healing systems
- Reduces on-call burden

### Principle VIII: Security by Default (NON-NEGOTIABLE)

**Description**: Security is built-in, not bolted on.

**Rules**:
- mTLS between all services via Dapr
- RBAC for Kubernetes resources
- Network policies to restrict pod communication
- Secrets never in Git - use Sealed Secrets or external vault
- Image scanning in CI/CD pipeline
- Pod Security Standards enforced

**Rationale**:
- Reduces attack surface
- Meets compliance requirements
- Protects against internal threats
- Enables audit trails

---

## Technology Stack

### Event Streaming

| Component | Local (Minikube) | Production (Cloud) |
|-----------|------------------|-------------------|
| Kafka | Redpanda (Docker) or Strimzi | Redpanda Cloud / Confluent Cloud |
| Topics | task-events, reminders, task-updates | Same topics, managed service |
| Schema | JSON events | JSON with optional Avro/Protobuf |

### Dapr Building Blocks

| Building Block | Purpose | Local | Production |
|----------------|---------|-------|------------|
| Pub/Sub | Event streaming | pubsub.kafka | pubsub.kafka (cloud) |
| State | Conversation state | state.postgresql | state.postgresql |
| Service Invocation | Service calls | Built-in | Built-in |
| Secrets | API keys | secretstores.kubernetes | Azure KeyVault / GCP Secret Manager |
| Jobs API | Scheduled reminders | Built-in scheduler | Built-in scheduler |

### Cloud Kubernetes

| Provider | Service | Free Tier | Recommendation |
|----------|---------|-----------|----------------|
| Oracle Cloud | OKE | Always free (4 OCPU, 24GB) | Best for learning |
| Google Cloud | GKE | $300 credit / 90 days | Good documentation |
| Azure | AKS | $200 credit / 30 days | Enterprise features |
| DigitalOcean | DOKS | $200 credit / 60 days | Simple setup |

### CI/CD

| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD pipeline |
| Helm | Package deployment |
| Container Registry | GHCR / Docker Hub / Cloud Registry |
| ArgoCD (optional) | GitOps deployment |

### Advanced Features Stack

| Feature | Implementation |
|---------|----------------|
| Recurring Tasks | Dapr Jobs API + Kafka events |
| Due Dates | Task model field + reminder scheduling |
| Reminders | In-app notifications via Kafka → WebSocket (NOT browser push) |
| Priorities | Task model field (high/medium/low) |
| Tags/Categories | Many-to-many relationship with Tag model |
| Search | **Simple SQL LIKE/ILIKE queries** (upgradeable to full-text later) |
| Filter/Sort | API query parameters + database queries |
| Real-time Sync | Dedicated WebSocket service consuming `task-updates` topic |

**Decision: Search Implementation**
- Simple SQL `LIKE/ILIKE` search meets hackathon requirement: "Search by keyword"
- No need for ranking, stemming, or fuzzy matching
- PostgreSQL full-text search is available but overkill for MVP
- External search engines (Elasticsearch/Meilisearch) = out of scope

**Decision: Notifications**
- In-app notifications only via Kafka-driven real-time channels
- Browser-level push notifications (Web Push API) are out of scope for Phase 5
- Rationale: Web Push requires service workers, VAPID keys, adds complexity without hackathon requirement

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                         CLOUD KUBERNETES CLUSTER (AKS/GKE/OKE)                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+ |
|  |                              DAPR CONTROL PLANE                              | |
|  |  Dapr Sidecar Injector | Dapr Operator | Dapr Sentry (mTLS) | Dapr Placement| |
|  +-----------------------------------------------------------------------------+ |
|                                                                                   |
|  +-------------------+  +-------------------+  +-------------------+             |
|  |   FRONTEND POD    |  |   BACKEND POD     |  |  WEBSOCKET POD    |             |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |             |
|  | | Next.js App  |  |  | | FastAPI App  |  |  | | WS Service   |  |             |
|  | |  Port: 3000  |  |  | |  Port: 8000  |  |  | |  Port: 8005  |  |             |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |             |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |             |
|  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |             |
|  | |  Port: 3500  |  |  | |  Port: 3500  |  |  | |  Port: 3500  |  |             |
|  | +--------------+  |  | +--------------+  |  | +--------------+  |             |
|  +-------------------+  +-------------------+  +-------------------+             |
|           |                      |                      |                        |
|           v                      v                      v                        |
|  +-----------------------------------------------------------------------------+ |
|  |                           DAPR COMPONENTS                                    | |
|  |  +------------------+  +------------------+  +------------------+            | |
|  |  | pubsub.kafka     |  | state.postgresql |  | secretstores     |            | |
|  |  | (Redpanda Cloud) |  | (Neon DB)        |  | (K8s/Azure/GCP)  |            | |
|  |  +------------------+  +------------------+  +------------------+            | |
|  |                                                                              | |
|  |  +------------------+  +------------------+                                  | |
|  |  | bindings.cron    |  | Jobs API         |                                  | |
|  |  | (Demo only)      |  | (Reminders)      |                                  | |
|  |  +------------------+  +------------------+                                  | |
|  +-----------------------------------------------------------------------------+ |
|                                                                                   |
|  +-------------------+  +-------------------+  +-------------------+             |
|  |  NOTIFICATION POD |  |  RECURRING TASK   |  |  AUDIT SERVICE   |             |
|  | +--------------+  |  |  SERVICE POD      |  |  POD             |             |
|  | | Notif Svc    |  |  | +--------------+  |  | +--------------+  |             |
|  | |  Port: 8002  |  |  | | Recurring Svc|  |  | | Audit Svc    |  |             |
|  | +--------------+  |  | |  Port: 8003  |  |  | |  Port: 8004  |  |             |
|  | | Dapr Sidecar |  |  | +--------------+  |  | +--------------+  |             |
|  | +--------------+  |  | | Dapr Sidecar |  |  | | Dapr Sidecar |  |             |
|  +-------------------+  | +--------------+  |  | +--------------+  |             |
|                         +-------------------+  +-------------------+             |
|                                                                                   |
|  +-------------------+                                                           |
|  |  MCP SERVER POD   |                                                           |
|  | +--------------+  |                                                           |
|  | | FastMCP      |  |                                                           |
|  | |  Port: 8001  |  |                                                           |
|  | +--------------+  |                                                           |
|  | | Dapr Sidecar |  |                                                           |
|  | +--------------+  |                                                           |
|  +-------------------+                                                           |
|                                                                                   |
|  External Services:                                                               |
|  - Neon PostgreSQL (External managed)                                            |
|  - Redpanda Cloud / Confluent Cloud (Kafka)                                      |
|  - Cloud Secret Manager (Azure KeyVault / GCP Secret Manager)                    |
+-----------------------------------------------------------------------------------+

Real-time Sync Flow (WebSocket Service):
+-------------+     +----------------+     +------------------+     +---------------+
| Task Change | --> | Kafka Topic    | --> | WebSocket Service| --> | All Connected |
| (Any Client)|     | "task-updates" |     | (Fan-out)        |     | Clients       |
+-------------+     +----------------+     +------------------+     +---------------+

GitHub Actions CI/CD:
+------------------+     +------------------+     +------------------+
| Push to main     | --> | Build & Test     | --> | Deploy to Cloud  |
| (Pull Request)   |     | (Docker + Helm)  |     | (helm upgrade)   |
+------------------+     +------------------+     +------------------+
```

---

## Kafka Event Schemas

### Task Event

```json
{
  "event_type": "created | updated | completed | deleted",
  "task_id": 123,
  "user_id": "user-uuid",
  "task_data": {
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "high | medium | low",
    "due_date": "2026-01-15T10:00:00Z",
    "tags": ["work", "urgent"],
    "recurring": {
      "enabled": true,
      "pattern": "weekly",
      "next_occurrence": "2026-01-22T10:00:00Z"
    }
  },
  "timestamp": "2026-01-10T14:30:00Z",
  "correlation_id": "uuid-for-tracing"
}
```

### Reminder Event

```json
{
  "task_id": 123,
  "user_id": "user-uuid",
  "title": "Task title",
  "due_at": "2026-01-15T10:00:00Z",
  "remind_at": "2026-01-15T09:00:00Z",
  "notification_type": "push | email | both",
  "correlation_id": "uuid-for-tracing"
}
```

### Task Update Event (Real-time Sync)

```json
{
  "event_type": "sync",
  "task_id": 123,
  "user_id": "user-uuid",
  "changes": {
    "completed": true
  },
  "source_client": "web | mobile | api",
  "timestamp": "2026-01-10T14:30:00Z"
}
```

---

## Dapr Component Configurations

### Pub/Sub (Kafka)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
  namespace: todo-app
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "your-cluster.cloud.redpanda.com:9092"
    - name: consumerGroup
      value: "todo-service"
    - name: authType
      value: "password"
    - name: saslUsername
      secretKeyRef:
        name: kafka-secrets
        key: username
    - name: saslPassword
      secretKeyRef:
        name: kafka-secrets
        key: password
```

### State Store (PostgreSQL)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
  namespace: todo-app
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: db-secrets
        key: connection-string
    - name: tableName
      value: "dapr_state"
```

### Secrets Store (Kubernetes)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
  namespace: todo-app
spec:
  type: secretstores.kubernetes
  version: v1
```

---

## Claude Code Integration

### Phase 5 Agents

| Agent | When to Use | Coupled Skills |
|-------|-------------|----------------|
| **@devops-kubernetes-builder** | K8s manifests, cloud deployment | kubernetes-deployment |
| **@aiops-helm-builder** | Helm charts, Dapr components | helm-charts-setup |
| **@backend-api-builder** | Kafka integration, new services | chatkit-backend |
| **@database-designer** | New models (Priority, Tag, Reminder) | neon-db-setup |

### Phase 5 Skills (CREATE DURING SPEC PHASE)

> **IMPORTANT**: These skills target **+200 Reusable Intelligence bonus points**.
> Skills MUST be created as part of the specification phase before implementation.

| Skill | Purpose | Directory | Bonus Target |
|-------|---------|-----------|--------------|
| `dapr-integration` | Dapr building blocks (Pub/Sub, State, Jobs API, Secrets) | `.claude/skills/dapr-integration/` | +200 |
| `kafka-setup` | Kafka/Redpanda configuration (local + cloud) | `.claude/skills/kafka-setup/` | +200 |
| `github-actions-cicd` | CI/CD pipeline for K8s deployment | `.claude/skills/github-actions-cicd/` | +200 |
| `cloud-k8s-deployment` | AKS/GKE/OKE deployment patterns | `.claude/skills/cloud-k8s-deployment/` | +200 |
| `advanced-features` | Recurring tasks, reminders, priorities, tags | `.claude/skills/advanced-features/` | +200 |
| `websocket-realtime` | WebSocket service for multi-client sync | `.claude/skills/websocket-realtime/` | +200 |
| `urdu-language-support` | Urdu chatbot responses | `.claude/skills/urdu-language-support/` | +100 |

**Each skill MUST include**:
- `SKILL.md` - Skill definition and patterns
- `examples.md` - Usage examples
- `validation.sh` - Validation script (optional)

---

## Development Workflow

### Phase 5 Development Cycle

```
+-----------------------------------------------------------------------------+
|                    PHASE 5 DEVELOPMENT CYCLE                                |
|                                                                             |
|  PART A: ADVANCED FEATURES                                                  |
|  +---------------------------------------------------------------------------+
|  |  1. DATABASE UPDATES                                                     |
|  |     |-> @database-designer                                               |
|  |     |-> Add Priority enum to Task model                                  |
|  |     |-> Create Tag model with many-to-many                               |
|  |     |-> Add due_date, reminder_at, recurring fields                      |
|  |     |-> Create Reminder model                                            |
|  |     |-> Run Alembic migrations                                           |
|  |                                                                          |
|  |  2. API UPDATES                                                          |
|  |     |-> @backend-api-builder                                             |
|  |     |-> Add filter/sort query parameters                                 |
|  |     |-> Add search endpoint                                              |
|  |     |-> Add priority/tags to task endpoints                              |
|  |     |-> Add reminder scheduling endpoints                                |
|  |                                                                          |
|  |  3. FRONTEND UPDATES                                                     |
|  |     |-> @frontend-ui-builder                                             |
|  |     |-> Add priority selector component                                  |
|  |     |-> Add tag management UI                                            |
|  |     |-> Add date picker for due dates                                    |
|  |     |-> Add filter/sort controls                                         |
|  |     |-> Add search bar                                                   |
|  +---------------------------------------------------------------------------+
|                                                                             |
|  PART B: EVENT-DRIVEN ARCHITECTURE (LOCAL)                                  |
|  +---------------------------------------------------------------------------+
|  |  4. DAPR SETUP (MINIKUBE)                                                |
|  |     |-> Install Dapr on Minikube                                         |
|  |     |-> Configure Dapr components (Pub/Sub, State, Secrets)              |
|  |     |-> Enable Dapr sidecar injection                                    |
|  |     |-> Test Dapr dashboard                                              |
|  |                                                                          |
|  |  5. KAFKA SETUP (LOCAL)                                                  |
|  |     |-> Deploy Redpanda on Minikube (or use Strimzi)                     |
|  |     |-> Create Kafka topics                                              |
|  |     |-> Configure Dapr Pub/Sub component                                 |
|  |     |-> Test event publishing/consuming                                  |
|  |                                                                          |
|  |  6. SERVICE REFACTORING                                                  |
|  |     |-> Replace direct Kafka calls with Dapr Pub/Sub                     |
|  |     |-> Publish task-events on all CRUD operations                       |
|  |     |-> Create Notification service (consumes reminders)                 |
|  |     |-> Create Recurring Task service (consumes task-events)             |
|  |     |-> Create Audit service (consumes task-events)                      |
|  |                                                                          |
|  |  7. DAPR JOBS API                                                        |
|  |     |-> Schedule reminders using Dapr Jobs API                           |
|  |     |-> Handle job callbacks in Notification service                     |
|  |     |-> Test exact-time reminder delivery                                |
|  +---------------------------------------------------------------------------+
|                                                                             |
|  PART C: CLOUD DEPLOYMENT                                                   |
|  +---------------------------------------------------------------------------+
|  |  8. CI/CD PIPELINE                                                       |
|  |     |-> Create GitHub Actions workflow                                   |
|  |     |-> Build and push Docker images to registry                         |
|  |     |-> Lint Helm charts                                                 |
|  |     |-> Run tests                                                        |
|  |     |-> Deploy to staging on PR                                          |
|  |     |-> Deploy to production on main merge                               |
|  |                                                                          |
|  |  9. CLOUD KUBERNETES                                                     |
|  |     |-> Create cluster (AKS/GKE/OKE)                                     |
|  |     |-> Install Dapr on cloud cluster                                    |
|  |     |-> Configure cloud Dapr components                                  |
|  |     |-> Deploy using Helm                                                |
|  |                                                                          |
|  |  10. KAFKA CLOUD                                                         |
|  |      |-> Create Redpanda Cloud / Confluent Cloud cluster                 |
|  |      |-> Create topics                                                   |
|  |      |-> Update Dapr Pub/Sub component for cloud                         |
|  |      |-> Test event flow end-to-end                                      |
|  |                                                                          |
|  |  11. MONITORING & OBSERVABILITY                                          |
|  |      |-> Deploy Prometheus + Grafana                                     |
|  |      |-> Configure Dapr metrics collection                               |
|  |      |-> Set up alerting                                                 |
|  |      |-> Configure centralized logging                                   |
|  +---------------------------------------------------------------------------+
+-----------------------------------------------------------------------------+
```

---

## New Database Models

### Task Model (Updated)

```python
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: datetime | None = Field(default=None)
    reminder_at: datetime | None = Field(default=None)
    recurring_pattern: str | None = Field(default=None)  # "daily", "weekly", "monthly"
    next_occurrence: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)
```

### Tag Model (New)

```python
class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str = Field(max_length=50)
    color: str = Field(default="#808080")  # Hex color

    # Relationships
    tasks: list["Task"] = Relationship(back_populates="tags", link_model=TaskTag)

class TaskTag(SQLModel, table=True):
    task_id: int = Field(foreign_key="task.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)
```

### Reminder Model (New)

```python
class ReminderStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"

class Reminder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    user_id: str = Field(index=True)
    remind_at: datetime
    status: ReminderStatus = Field(default=ReminderStatus.PENDING)
    sent_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## New Services

### WebSocket Service (NEW - Phase 5)

| Aspect | Details |
|--------|---------|
| **Port** | 8005 |
| **Purpose** | Real-time multi-client sync via WebSocket fan-out |
| **Consumes** | `task-updates` topic (via Dapr Pub/Sub) |
| **Publishes** | None (broadcasts to connected WebSocket clients) |
| **Dapr App ID** | `websocket-service` |
| **Technology** | FastAPI + WebSockets + Dapr Pub/Sub subscription |

**Key Responsibilities**:
- Consume `task-updates` events from Kafka
- Maintain WebSocket connections per user
- Broadcast task changes to all connected clients for that user
- Handle connection lifecycle (connect/disconnect/reconnect)

### Notification Service

| Aspect | Details |
|--------|---------|
| **Port** | 8002 |
| **Purpose** | In-app notifications for reminders (NOT browser push) |
| **Consumes** | `reminders` topic |
| **Publishes** | `task-updates` topic (to trigger WebSocket broadcast) |
| **Dapr App ID** | `notification-service` |

**Scope Clarification**:
- ✅ In-app notifications via WebSocket broadcast
- ✅ Email notifications (optional future enhancement)
- ❌ Browser Push API (out of scope - requires service workers, VAPID keys)

### Recurring Task Service

| Aspect | Details |
|--------|---------|
| **Port** | 8003 |
| **Purpose** | Auto-create next occurrence of recurring tasks |
| **Consumes** | `task-events` (completed events for recurring tasks) |
| **Publishes** | `task-events` (created events for new occurrence) |
| **Dapr App ID** | `recurring-task-service` |

### Audit Service

| Aspect | Details |
|--------|---------|
| **Port** | 8004 |
| **Purpose** | Log all task operations for audit trail |
| **Consumes** | `task-events` (all events) |
| **Publishes** | None |
| **Dapr App ID** | `audit-service` |

---

## GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: cd backend && uv run pytest
      - name: Run frontend tests
        run: cd frontend && npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push images
        run: |
          docker build -t $REGISTRY/$IMAGE_PREFIX/backend:${{ github.sha }} ./backend
          docker build -t $REGISTRY/$IMAGE_PREFIX/frontend:${{ github.sha }} ./frontend
          docker push $REGISTRY/$IMAGE_PREFIX/backend:${{ github.sha }}
          docker push $REGISTRY/$IMAGE_PREFIX/frontend:${{ github.sha }}

  deploy-staging:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          helm upgrade --install todo-app ./helm/todo-app \
            -f ./helm/todo-app/values-staging.yaml \
            --set image.tag=${{ github.sha }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          helm upgrade --install todo-app ./helm/todo-app \
            -f ./helm/todo-app/values-prod.yaml \
            --set image.tag=${{ github.sha }}
```

---

## Environment Configuration

### Local (Minikube with Dapr)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | redpanda:9092 | Redpanda in cluster |
| DATABASE_URL | Neon connection | Secret |

### Staging (Cloud K8s)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | staging.redpanda.cloud:9092 | Redpanda Cloud |
| DATABASE_URL | Neon staging branch | Secret |

### Production (Cloud K8s)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | prod.redpanda.cloud:9092 | Redpanda Cloud |
| DATABASE_URL | Neon production branch | Secret |
| ENABLE_MONITORING | true | ConfigMap |

---

## Security Checklist

- [ ] All services communicate via Dapr mTLS
- [ ] RBAC configured for Kubernetes resources
- [ ] Network policies restrict pod communication
- [ ] Secrets stored in cloud secret manager (not K8s secrets)
- [ ] GitHub Actions secrets for CI/CD credentials
- [ ] Image scanning in CI pipeline
- [ ] Pod Security Standards enforced
- [ ] Dapr API tokens configured
- [ ] Kafka SASL authentication enabled
- [ ] TLS for Ingress (cert-manager + Let's Encrypt)

---

## Testing Strategy

### Unit Tests
- New model validations
- Event schema validations
- Service business logic

### Integration Tests (Minikube)
```bash
# 1. Deploy with Dapr
dapr init -k
kubectl apply -f dapr-components/
helm install todo-app ./helm/todo-app -f values-dev.yaml

# 2. Test Dapr Pub/Sub
kubectl exec -it backend-pod -- curl localhost:3500/v1.0/publish/kafka-pubsub/task-events -d '{...}'

# 3. Verify event consumption
kubectl logs notification-service-pod

# 4. Test Dapr Jobs API
kubectl exec -it backend-pod -- curl localhost:3500/v1.0-alpha1/jobs/test-reminder -d '{...}'

# 5. End-to-end test
minikube service frontend
# Create task with reminder, verify notification
```

### Cloud Tests
```bash
# 1. Verify deployment
kubectl get pods -n todo-app

# 2. Test with cloud Kafka
# Publish event, verify in Redpanda Cloud console

# 3. Monitor Dapr dashboard
kubectl port-forward svc/dapr-dashboard 8080:8080 -n dapr-system
```

---

## Bonus Features (Phase 5)

### Hackathon Bonus Points Targets

| Bonus Feature | Points | Status | Implementation |
|--------------|--------|--------|----------------|
| **Reusable Intelligence** (Agent Skills) | +200 | 🎯 Target | Create Phase 5 skills for Dapr, Kafka, CI/CD, Cloud K8s |
| **Cloud-Native Blueprints** (Agent Skills) | +200 | 🎯 Target | Skills for deployment patterns |
| **Multi-language Support (Urdu)** | +100 | 🎯 Target | Urdu chatbot responses via language-aware prompts |
| **Voice Commands** | +200 | ✅ Done | Already implemented in Phase 3 |

**Total Potential Bonus**: +600 points (Voice already done = +200 secured)

### Urdu Language Support Implementation

**Scope**:
- Chatbot understands and responds in Urdu
- Language toggle in chat UI (optional)
- System prompt language switching
- UI translation is out of scope (Urdu responses only)

**Implementation Approach**:
```python
# Agent system prompt with language awareness
SYSTEM_PROMPT_URDU = """
آپ ایک مددگار Todo اسسٹنٹ ہیں۔ صارف کے ساتھ اردو میں بات کریں۔
جب صارف اردو میں بولے تو اردو میں جواب دیں۔
When user speaks in English, respond in English.
"""

# Language detection in agent
def get_system_prompt(language: str = "en") -> str:
    if language == "ur":
        return SYSTEM_PROMPT_URDU
    return SYSTEM_PROMPT_EN
```

**Acceptance Criteria**:
- [ ] Agent responds in Urdu when user writes in Urdu
- [ ] Agent responds in English when user writes in English
- [ ] Task titles/descriptions can be in Urdu
- [ ] Language preference stored per user (optional)

---

## Phase 5 Deliverables

### Required Files

1. **Database Migrations**
   - `backend/alembic/versions/xxx_add_priority_tags_recurring.py`

2. **New Services**
   - `backend/src/services/notification_service/` - In-app notifications
   - `backend/src/services/recurring_task_service/` - Recurring task spawning
   - `backend/src/services/audit_service/` - Event audit trail
   - `backend/src/services/websocket_service/` - Real-time multi-client sync

3. **Dapr Components**
   - `dapr-components/pubsub-kafka.yaml`
   - `dapr-components/statestore-postgres.yaml`
   - `dapr-components/secretstore.yaml`
   - `dapr-components/resiliency.yaml`

4. **Helm Chart Updates**
   - `helm/todo-app/values-staging.yaml`
   - `helm/todo-app/values-prod.yaml`
   - `helm/todo-app/templates/dapr-components.yaml`
   - `helm/todo-app/templates/notification-deployment.yaml`
   - `helm/todo-app/templates/recurring-task-deployment.yaml`
   - `helm/todo-app/templates/audit-deployment.yaml`
   - `helm/todo-app/templates/websocket-deployment.yaml` (NEW)

5. **CI/CD**
   - `.github/workflows/ci-cd.yaml`

6. **Phase 5 Skills (Bonus +200)**
   - `.claude/skills/dapr-integration/SKILL.md`
   - `.claude/skills/kafka-setup/SKILL.md`
   - `.claude/skills/github-actions-cicd/SKILL.md`
   - `.claude/skills/cloud-k8s-deployment/SKILL.md`
   - `.claude/skills/advanced-features/SKILL.md`
   - `.claude/skills/websocket-realtime/SKILL.md`
   - `.claude/skills/urdu-language-support/SKILL.md`

7. **Documentation**
   - Cloud deployment guide
   - Dapr integration guide
   - Event schema documentation
   - Runbooks for common operations

### Working Application
- All advanced features functional (priorities, tags, search, filter, sort)
- Recurring tasks auto-create next occurrence
- Reminders sent at scheduled time (in-app via WebSocket)
- Events flowing through Kafka
- Real-time sync across multiple clients
- Deployed on cloud Kubernetes
- CI/CD pipeline operational
- Monitoring dashboards available
- Urdu language support in chatbot (Bonus +100)

---

## References

- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Jobs API](https://docs.dapr.io/developing-applications/building-blocks/jobs/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redpanda Documentation](https://docs.redpanda.com/)
- [Strimzi Operator](https://strimzi.io/documentation/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Azure AKS](https://docs.microsoft.com/en-us/azure/aks/)
- [Google GKE](https://cloud.google.com/kubernetes-engine/docs)
- [Oracle OKE](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [Hackathon II Spec](./Hackathon%20II%20-%20Todo%20Spec-Driven%20Development.md)

---

## Key Decisions Summary (Locked for Phase 5)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Dapr Scheduling | **Jobs API (Primary)** | Exact-time scheduling for reminders; Cron Bindings optional for demo |
| 2 | Notifications | **In-app only (Kafka → WebSocket)** | Browser Push API out of scope - too complex for hackathon |
| 3 | Real-time Sync | **Dedicated WebSocket Service** | Fan-out to multiple clients; decoupled via Kafka |
| 4 | Search | **Simple SQL LIKE/ILIKE** | Meets "search by keyword" requirement; upgradeable later |
| 5 | Phase 5 Skills | **Create during spec phase** | Target +200/+400 Reusable Intelligence bonus |
| 6 | Urdu Support | **Yes (Bonus +100)** | Language-aware agent prompts; high points-to-effort ratio |

---

**Constitution Version**: 1.1.0
**Last Updated**: December 30, 2025
**Phase**: Phase 5 - Advanced Cloud Deployment
