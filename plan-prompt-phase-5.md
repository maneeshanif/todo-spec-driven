# Phase 5: Advanced Cloud Deployment - Implementation Plan

**Project**: Evolution of Todo
**Phase**: Phase 5 - Advanced Cloud Deployment
**Version**: 1.0.0
**Status**: Draft
**Due Date**: January 18, 2026
**Points**: 300 (Base) + 600 (Bonus potential)

---

## Summary

Phase 5 is the final and most comprehensive phase of the Evolution of Todo hackathon. It transforms the Phase 4 locally deployed application into a production-grade, event-driven, distributed system with:

1. **Part A**: Advanced task features (Priorities, Tags, Due Dates, Reminders, Recurring Tasks, Search, Filter, Sort)
2. **Part B**: Event-driven architecture with Kafka and full Dapr integration on Minikube
3. **Part C**: Production deployment on cloud Kubernetes (AKS/GKE/OKE) with CI/CD

---

## Technical Context

### Languages and Frameworks

| Component | Language/Framework | Version |
|-----------|-------------------|----------|
| Frontend | Next.js | 16+ |
| Backend | Python | 3.13+ |
| Backend Framework | FastAPI | 0.115+ |
| ORM | SQLModel | 0.0.22+ |
| AI Agent | OpenAI Agents SDK | Latest |
| MCP Server | FastMCP | Latest |
| Event Streaming | Kafka (Redpanda) | Latest |
| Distributed Runtime | Dapr | 1.14+ |
| Container Runtime | Docker | Latest |
| Orchestration | Kubernetes | 1.28+ |
| Package Manager | Helm | 3.15+ |
| CI/CD | GitHub Actions | Latest |
| AIOps | kubectl-ai, kagent | Latest |
| Speech-to-Text | Web Speech API / Whisper | Latest |
| i18n | next-intl | Latest |

### Storage and External Services

| Service | Type | Purpose |
|---------|------|---------|
| Neon PostgreSQL | Serverless (External) | Primary database |
| Redpanda Cloud / Confluent | Managed Kafka | Event streaming |
| DigitalOcean DOKS | Managed Kubernetes | Primary cloud deployment |
| DigitalOcean Container Registry | Container Registry | Docker images |
| Kubernetes Secrets | Cloud Secrets | Secret management |
| Prometheus + Grafana | Monitoring | Observability |

### New Microservices (Phase 5)

| Service | Port | Purpose | Kafka Topics |
|---------|------|---------|--------------|
| Notification Service | 8002 | Send reminders | Consumes: `reminders` |
| Recurring Task Service | 8003 | Auto-create next occurrence | Consumes: `task-events` |
| Audit Service | 8004 | Log all task operations | Consumes: `task-events` |

### Testing

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | pytest | 80% backend |
| Integration Tests | pytest + Minikube | All event flows |
| E2E Tests | Manual | All user journeys |
| Helm Validation | helm lint | 100% |
| CI Pipeline | GitHub Actions | All PRs |

### Deployment Targets

| Environment | Platform | Purpose |
|-------------|----------|---------|
| Development | Minikube + Dapr | Local testing with full Dapr |
| Staging | Cloud K8s (PR deployments) | Pre-production testing |
| Production | DigitalOcean DOKS (Primary) | Production deployment |
| Alternative | AKS / GKE / OKE | Fallback cloud providers |

### Performance Goals

| Metric | Target |
|--------|--------|
| Task search response | <500ms |
| Event publish latency | <100ms |
| Kafka consumer lag | <1000 messages |
| Reminder delivery accuracy | Within 1 minute |
| CI/CD pipeline | <10 minutes |
| Cloud deployment | <5 minutes |

---

## Constitution Check

### Compliance with Phase 5 Constitution

| Principle | Implementation | Status |
|-----------|----------------|--------|
| Event-Driven Architecture | All task CRUD publishes to Kafka via Dapr | Pending |
| Dapr Abstraction Layer | No direct Kafka clients, use Dapr Pub/Sub | Pending |
| Stateless Services | All state in DB or Dapr State Store | Pending |
| GitOps Deployment | GitHub Actions for all deployments | Pending |
| Multi-Environment Parity | Same Dapr components, different backends | Pending |
| Observability First | Prometheus + Grafana + Dapr metrics | Pending |
| Resilience Patterns | Circuit breakers, retries via Dapr | Pending |
| Security by Default | mTLS, RBAC, Network Policies | Pending |

---

## Project Structure

### New Directories and Files (Phase 5)

```
todo-web-hackthon/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── task.py                    # UPDATED - Add priority, due_date, recurring
│   │   │   ├── tag.py                     # NEW - Tag model
│   │   │   ├── task_tag.py                # NEW - Junction table
│   │   │   └── reminder.py                # NEW - Reminder model
│   │   ├── routers/
│   │   │   ├── tasks.py                   # UPDATED - Add filter/sort/search
│   │   │   ├── tags.py                    # NEW - Tag CRUD
│   │   │   └── reminders.py               # NEW - Reminder management
│   │   ├── services/
│   │   │   ├── event_publisher.py         # NEW - Dapr Pub/Sub wrapper
│   │   │   ├── dapr_client.py             # NEW - Dapr SDK client
│   │   │   └── search_service.py          # NEW - Full-text search
│   │   └── mcp_server/
│   │       └── tools/
│   │           ├── task_tools.py          # UPDATED - Add advanced features
│   │           ├── tag_tools.py           # NEW - Tag MCP tools
│   │           └── reminder_tools.py      # NEW - Reminder MCP tools
│   ├── alembic/
│   │   └── versions/
│   │       └── xxx_add_phase5_models.py   # NEW - Migration for new models
│   └── Dockerfile                          # UPDATED - Add Dapr SDK
│
├── services/                               # NEW - Microservices directory
│   ├── notification-service/
│   │   ├── src/
│   │   │   ├── main.py                    # FastAPI app
│   │   │   ├── consumer.py                # Dapr subscription handler
│   │   │   └── notifier.py                # Push/email notification
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   │
│   ├── recurring-task-service/
│   │   ├── src/
│   │   │   ├── main.py                    # FastAPI app
│   │   │   ├── consumer.py                # Dapr subscription handler
│   │   │   └── scheduler.py               # Next occurrence calculator
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   │
│   └── audit-service/
│       ├── src/
│       │   ├── main.py                    # FastAPI app
│       │   ├── consumer.py                # Dapr subscription handler
│       │   └── logger.py                  # Audit log storage
│       ├── Dockerfile
│       └── pyproject.toml
│
├── frontend/
│   ├── app/
│   │   └── tasks/
│   │       └── page.tsx                   # UPDATED - Add filter/sort UI
│   ├── components/
│   │   ├── tasks/
│   │   │   ├── priority-selector.tsx      # NEW
│   │   │   ├── tag-manager.tsx            # NEW
│   │   │   ├── due-date-picker.tsx        # NEW
│   │   │   ├── reminder-scheduler.tsx     # NEW
│   │   │   ├── filter-bar.tsx             # NEW
│   │   │   ├── sort-dropdown.tsx          # NEW
│   │   │   └── search-input.tsx           # NEW
│   │   └── recurring/
│   │       └── recurring-pattern.tsx      # NEW
│   └── stores/
│       └── task-store.ts                  # UPDATED - Add filter/sort state
│
├── dapr-components/                        # NEW - Dapr configuration
│   ├── pubsub-kafka.yaml                  # Kafka Pub/Sub component
│   ├── statestore-postgres.yaml           # PostgreSQL state store
│   ├── secretstore-kubernetes.yaml        # K8s secrets store
│   └── resiliency.yaml                    # Circuit breaker policies
│
├── helm/
│   └── todo-app/
│       ├── values-staging.yaml            # NEW - Staging values
│       ├── values-prod.yaml               # UPDATED - Production values
│       └── templates/
│           ├── dapr-components.yaml       # NEW - Dapr components
│           ├── notification-deployment.yaml  # NEW
│           ├── recurring-task-deployment.yaml # NEW
│           ├── audit-deployment.yaml      # NEW
│           └── kafka-topics.yaml          # NEW - Topic configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yaml                        # NEW - Test + lint
│       ├── build.yaml                     # NEW - Build images
│       └── deploy.yaml                    # NEW - Deploy to cloud
│
├── docs/
│   ├── DAPR-INTEGRATION.md                # NEW
│   ├── KAFKA-SETUP.md                     # NEW
│   ├── CLOUD-DEPLOYMENT.md                # NEW
│   ├── EVENT-SCHEMAS.md                   # NEW
│   └── RUNBOOKS.md                        # NEW
│
├── spec-prompt-phase-5.md                 # Created
├── constitution-prompt-phase-5.md         # Created
└── plan-prompt-phase-5.md                 # THIS FILE
```

---

## Complexity Tracking

### Part A: Advanced Features - Complexity: High

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Update Task model (priority, due_date, recurring) | Medium | 2-3 hours |
| Create Tag model + TaskTag junction | Medium | 2-3 hours |
| Create Reminder model | Low | 1-2 hours |
| Alembic migration | Low | 1 hour |
| Update Task API (filter/sort/search) | High | 4-6 hours |
| Create Tag API endpoints | Medium | 2-3 hours |
| Create Reminder API endpoints | Medium | 2-3 hours |
| Update MCP tools for advanced features | High | 4-6 hours |
| Frontend priority selector | Low | 1-2 hours |
| Frontend tag manager | Medium | 3-4 hours |
| Frontend due date picker | Low | 1-2 hours |
| Frontend filter/sort/search UI | High | 4-6 hours |
| **Subtotal Part A** | | **28-42 hours** |

### Part B: Event-Driven Architecture (Local) - Complexity: Very High

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Install Dapr on Minikube | Low | 1 hour |
| Deploy Redpanda on Minikube | Medium | 2-3 hours |
| Configure Dapr Pub/Sub component | Medium | 2-3 hours |
| Configure Dapr State component | Low | 1-2 hours |
| Configure Dapr Secrets component | Low | 1-2 hours |
| Create event publisher service | Medium | 3-4 hours |
| Publish task events on CRUD | Medium | 3-4 hours |
| Create Notification Service | High | 6-8 hours |
| Create Recurring Task Service | High | 6-8 hours |
| Create Audit Service | Medium | 4-6 hours |
| Implement Dapr Jobs API for reminders | High | 4-6 hours |
| Test event flow end-to-end | Medium | 3-4 hours |
| **Subtotal Part B** | | **37-51 hours** |

### Part C: Cloud Deployment - Complexity: High

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Create GitHub Actions CI workflow | Medium | 3-4 hours |
| Create GitHub Actions build workflow | Medium | 3-4 hours |
| Create GitHub Actions deploy workflow | High | 4-6 hours |
| Create DigitalOcean DOKS cluster | Medium | 2-3 hours |
| Install Dapr on DOKS cluster | Low | 1-2 hours |
| Configure Redpanda Cloud / Confluent | Medium | 2-3 hours |
| Update Dapr components for cloud | Medium | 2-3 hours |
| Configure kubectl-ai and kagent | Low | 1-2 hours |
| Deploy Prometheus + Grafana | Medium | 3-4 hours |
| Configure TLS/SSL (cert-manager) | Medium | 2-3 hours |
| Configure HPA | Low | 1-2 hours |
| End-to-end cloud testing | High | 4-6 hours |
| **Subtotal Part C** | | **30-43 hours** |

### Part D: Bonus Features - Complexity: Very High

| Task | Complexity | Estimated Effort | Points |
|------|------------|------------------|--------|
| **D1: Voice Commands** | | | +200 |
| Voice input button component | Low | 1-2 hours | |
| Web Speech API integration | Medium | 2-3 hours | |
| Voice waveform visualizer | Low | 1-2 hours | |
| Command processing pipeline | Medium | 2-3 hours | |
| Text-to-speech response | Low | 1-2 hours | |
| Testing and polish | Medium | 2-3 hours | |
| **Subtotal D1** | | **9-15 hours** | +200 |
| | | | |
| **D2: Multi-language (Urdu)** | | | +100 |
| i18n setup (next-intl) | Medium | 2-3 hours | |
| Urdu translations file | Low | 1-2 hours | |
| Language selector component | Low | 1 hour | |
| RTL CSS support | Medium | 2-3 hours | |
| AI prompt engineering | Low | 1-2 hours | |
| Font configuration | Low | 1 hour | |
| Testing | Medium | 2-3 hours | |
| **Subtotal D2** | | **10-15 hours** | +100 |
| | | | |
| **D3: Reusable Intelligence** | | | +200 |
| Dapr integration skill | Medium | 3-4 hours | |
| Kafka producer/consumer skills | Medium | 4-6 hours | |
| Microservice scaffold skill | Medium | 3-4 hours | |
| DigitalOcean DOKS skill | Medium | 2-3 hours | |
| Event-driven builder agent | High | 4-6 hours | |
| Microservice builder agent | Medium | 3-4 hours | |
| Cloud deployer agent | Medium | 3-4 hours | |
| AIOps operator agent | Medium | 2-3 hours | |
| **Subtotal D3** | | **24-34 hours** | +200 |
| | | | |
| **D4: Cloud-Native Blueprints** | | | +200 |
| Blueprint schema design | High | 4-6 hours | |
| Blueprint parser | Medium | 3-4 hours | |
| Service generator skill | High | 6-8 hours | |
| Helm generator skill | Medium | 4-6 hours | |
| Pipeline generator skill | High | 4-6 hours | |
| Stack deployer skill | High | 4-6 hours | |
| Example blueprints | Medium | 3-4 hours | |
| Documentation | Medium | 2-3 hours | |
| **Subtotal D4** | | **30-43 hours** | +200 |
| | | | |
| **D5: kubectl-ai & kagent** | | | (included in D3) |
| kubectl-ai skill documentation | Medium | 2-3 hours | |
| kagent skill documentation | Medium | 2-3 hours | |
| CI/CD integration | Medium | 2-3 hours | |
| **Subtotal D5** | | **6-9 hours** | |
| | | | |
| **Total Part D** | | **79-116 hours** | **+600** |

---

### Total Effort Summary

| Part | Effort | Points |
|------|--------|--------|
| Part A: Advanced Features | 28-42 hours | Base |
| Part B: Event-Driven (Local) | 37-51 hours | Base |
| Part C: Cloud Deployment | 30-43 hours | Base |
| **Base Total** | **95-136 hours** | **300** |
| Part D: Bonus Features | 79-116 hours | +600 |
| **Grand Total** | **174-252 hours** | **900** |

**Estimated Duration**:
- Base (300 points): ~2-3 weeks full-time
- With Bonuses (900 points): ~4-6 weeks full-time

---

## Architecture Decisions

### AD-01: Dapr vs Direct Kafka Client

**Decision**: Use Dapr Pub/Sub to abstract Kafka

**Rationale**:
- Dapr provides infrastructure abstraction
- Swap Kafka for RabbitMQ/Redis without code changes
- Built-in retries, dead letter queues
- Consistent API across building blocks
- mTLS between services for free

**Trade-offs**:
- Pros: Portability, abstraction, resilience features
- Cons: Learning curve, sidecar overhead

**Alternatives Considered**:
1. Direct kafka-python/aiokafka - Rejected (tight coupling)
2. Celery for async tasks - Rejected (not event-driven)

---

### AD-02: Separate Microservices vs Monolith Extension

**Decision**: Create 3 new microservices (Notification, Recurring Task, Audit)

**Rationale**:
- Single Responsibility Principle
- Independent scaling based on load
- Independent deployment and updates
- Failure isolation
- Follows hackathon architecture diagram

**Trade-offs**:
- Pros: Scalability, isolation, maintainability
- Cons: More deployments, inter-service complexity

**Alternatives Considered**:
1. Add to backend monolith - Rejected (scaling, coupling)
2. Single "worker" service - Rejected (mixed responsibilities)

---

### AD-03: Dapr Jobs API vs Cron Bindings

**Decision**: Use Dapr Jobs API for scheduled reminders

**Rationale**:
- Exact-time delivery (not polling-based)
- No database scanning overhead
- Dapr manages job state across restarts
- More efficient than cron polling
- Better for per-task scheduling

**Trade-offs**:
- Pros: Precise timing, no polling, scalable
- Cons: Alpha API, requires callback endpoint

**Alternatives Considered**:
1. Dapr Cron Binding - Rejected (polling overhead)
2. APScheduler in backend - Rejected (not distributed)

---

### AD-04: Cloud Provider Selection

**Decision**: DigitalOcean DOKS as primary with AKS/GKE/OKE as alternatives

**Rationale**:
- Hackathon specification explicitly mentions DigitalOcean DOKS for Phase V
- $200 credit for 60 days (generous trial period)
- Simple, developer-friendly Kubernetes experience
- Good documentation and community support
- Helm chart works across all providers for flexibility

**Trade-offs**:
- Pros: Matches hackathon requirements, simple setup, generous credits
- Cons: Smaller ecosystem than AWS/GCP/Azure

**Alternatives Available**:
1. Oracle OKE - Always-free tier (4 OCPU, 24GB RAM), good fallback
2. Google GKE - $300 credit for 90 days
3. Azure AKS - $200 credit for 30 days

---

### AD-05: Kafka Provider Selection

**Decision**: Redpanda Cloud (primary) with Strimzi fallback

**Rationale**:
- Redpanda Cloud has free serverless tier
- Kafka-compatible (same client code)
- No Zookeeper (simpler)
- Strimzi for self-hosted option in cluster
- Dapr abstracts the choice anyway

**Trade-offs**:
- Pros: Free tier, Kafka-compatible, simple
- Cons: Newer ecosystem than Confluent

**Alternatives Considered**:
1. Confluent Cloud - Rejected (credits expire quickly)
2. Self-hosted only - Rejected (more complex for hackathon)

---

## Component Breakdown

### 1. Advanced Features Layer (Part A)

```
Advanced Features Layer
├── Database Models
│   ├── Task (UPDATED)
│   │   ├── priority: enum (high/medium/low)
│   │   ├── due_date: datetime
│   │   ├── reminder_at: datetime
│   │   ├── recurring_pattern: string (daily/weekly/monthly)
│   │   └── next_occurrence: datetime
│   │
│   ├── Tag (NEW)
│   │   ├── id, user_id, name, color
│   │   └── Relationship: many-to-many with Task
│   │
│   ├── TaskTag (NEW - Junction)
│   │   └── task_id, tag_id
│   │
│   └── Reminder (NEW)
│       └── id, task_id, user_id, remind_at, status, sent_at
│
├── API Endpoints
│   ├── GET /tasks?priority=high&tags=work&due_before=2026-01-15&search=meeting&sort=due_date
│   ├── POST/GET/PUT/DELETE /tags
│   └── POST/DELETE /tasks/{id}/reminder
│
├── MCP Tools (UPDATED)
│   ├── add_task (+ priority, due_date, tags, recurring)
│   ├── list_tasks (+ filter, sort, search)
│   ├── schedule_reminder
│   ├── add_tag, list_tags
│   └── search_tasks
│
└── Frontend Components
    ├── PrioritySelector
    ├── TagManager
    ├── DueDatePicker
    ├── ReminderScheduler
    ├── FilterBar
    ├── SortDropdown
    └── SearchInput
```

### 2. Event-Driven Architecture Layer (Part B)

```
Event-Driven Architecture Layer
├── Dapr Building Blocks
│   ├── Pub/Sub (pubsub.kafka)
│   │   └── Broker: Redpanda (local) / Redpanda Cloud (prod)
│   │
│   ├── State Management (state.postgresql)
│   │   └── Backend: Neon PostgreSQL
│   │
│   ├── Secrets (secretstores.kubernetes / azure-keyvault)
│   │   └── Store: K8s Secrets (local) / Cloud Vault (prod)
│   │
│   └── Jobs API (scheduler)
│       └── Purpose: Exact-time reminder scheduling
│
├── Kafka Topics
│   ├── task-events
│   │   ├── Events: created, updated, completed, deleted
│   │   ├── Producer: Backend API
│   │   └── Consumers: Recurring Task Service, Audit Service
│   │
│   ├── reminders
│   │   ├── Events: reminder.scheduled, reminder.due
│   │   ├── Producer: Backend API, Dapr Jobs
│   │   └── Consumer: Notification Service
│   │
│   └── task-updates (optional)
│       ├── Events: sync
│       ├── Producer: Backend API
│       └── Consumer: WebSocket Service (future)
│
├── New Microservices
│   ├── Notification Service (Port 8002)
│   │   ├── Subscribes: reminders topic
│   │   ├── Actions: Send push notification, email
│   │   └── Dapr App ID: notification-service
│   │
│   ├── Recurring Task Service (Port 8003)
│   │   ├── Subscribes: task-events (completed)
│   │   ├── Actions: Create next occurrence
│   │   ├── Publishes: task-events (created)
│   │   └── Dapr App ID: recurring-task-service
│   │
│   └── Audit Service (Port 8004)
│       ├── Subscribes: task-events (all)
│       ├── Actions: Log to audit table
│       └── Dapr App ID: audit-service
│
└── Event Flow
    User Action → Backend → Dapr Pub/Sub → Kafka → Consumer Services
```

### 3. CI/CD Pipeline Layer (Part C)

```
CI/CD Pipeline Layer
├── GitHub Actions Workflows
│   ├── ci.yaml (on: pull_request)
│   │   ├── Run backend tests (pytest)
│   │   ├── Run frontend tests (npm test)
│   │   ├── Lint Helm charts
│   │   └── Validate K8s manifests
│   │
│   ├── build.yaml (on: push to main)
│   │   ├── Build Docker images
│   │   ├── Tag with commit SHA
│   │   └── Push to GHCR/Docker Hub
│   │
│   └── deploy.yaml (on: push to main)
│       ├── Deploy to staging (on PR)
│       └── Deploy to production (on main merge)
│
├── Container Registry
│   ├── GHCR (ghcr.io)
│   │   └── Images: frontend, backend, mcp-server, notification, recurring, audit
│   │
│   └── Tags: latest, {commit-sha}, v{version}
│
└── Deployment Strategy
    ├── Helm upgrade --install
    ├── Rolling updates (zero downtime)
    └── Rollback via helm rollback or git revert
```

### 4. Cloud Deployment Layer (Part C)

```
Cloud Deployment Layer
├── Kubernetes Cluster
│   ├── Primary Provider
│   │   └── DigitalOcean DOKS ($200 credit / 60 days) ⭐ Recommended
│   │
│   ├── Alternative Providers
│   │   ├── Oracle OKE (Always Free - 4 OCPU, 24GB RAM)
│   │   ├── Google GKE ($300 credit / 90 days)
│   │   └── Azure AKS ($200 credit / 30 days)
│   │
│   ├── Node Configuration
│   │   ├── Minimum: 2 nodes, 2 vCPU, 4GB RAM each
│   │   └── Recommended: 3 nodes for HA
│   │
│   └── Installed Components
│       ├── Dapr runtime
│       ├── NGINX Ingress Controller
│       ├── cert-manager (TLS)
│       ├── Prometheus + Grafana
│       └── kubectl-ai + kagent (AIOps)
│
├── Kafka Cloud
│   ├── Redpanda Cloud (Free Serverless)
│   │   └── Topics: task-events, reminders, task-updates
│   │
│   └── Alternative: Confluent Cloud ($400 credit)
│
├── Secrets Management
│   ├── DigitalOcean: DO Spaces + K8s Secrets
│   ├── Azure: Azure KeyVault
│   ├── GCP: Secret Manager
│   └── Oracle: OCI Vault
│
├── AIOps Tools
│   ├── kubectl-ai (AI-assisted kubectl operations)
│   └── kagent (Cluster analysis and optimization)
│
└── Monitoring
    ├── Prometheus (metrics collection)
    ├── Grafana (dashboards)
    ├── Dapr Dashboard (service mesh visibility)
    └── DigitalOcean Monitoring
```

### 5. DigitalOcean DOKS Setup

**Account Setup**:
1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Use **$200 credit for 60 days** (new accounts)
3. No credit card charges after trial period

**Cluster Creation**:
```bash
# Using doctl CLI
doctl kubernetes cluster create todo-app-cluster \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --count 3 \
  --tag todo-app

# Configure kubectl
doctl kubernetes cluster kubeconfig save todo-app-cluster
```

**Container Registry Setup**:
```bash
# Create container registry
doctl registry create todo-app-registry

# Login to registry
doctl registry login

# Tag and push images
docker tag evolution-todo/backend:latest registry.digitalocean.com/todo-app-registry/backend:latest
docker push registry.digitalocean.com/todo-app-registry/backend:latest
```

**Install Dapr on DOKS**:
```bash
# Install Dapr CLI
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | bash

# Initialize Dapr on Kubernetes
dapr init -k

# Verify installation
dapr status -k
```

**Install AIOps Tools**:
```bash
# Install kubectl-ai
pip install kubectl-ai

# Configure with API key
export OPENAI_API_KEY=your-key

# Test kubectl-ai
kubectl-ai "list all pods in todo-app namespace"

# Install kagent (if available)
pip install kagent
```

**DigitalOcean Costs**:

| Resource | Size | Monthly Cost |
|----------|------|--------------|
| DOKS Cluster (3 nodes) | s-2vcpu-4gb | ~$36 |
| Container Registry | Basic | ~$5 |
| Load Balancer | Small | ~$12 |
| **Total** | | **~$53/month** |
| **With $200 credit** | | **~4 months free** |

---

## High-Level Sequencing

### Phase 5 Implementation Sequence

```
PART A: ADVANCED FEATURES (Week 1-2)
═══════════════════════════════════════════════════════════════════

Week 1: Database & Backend
├── Day 1-2: Database Updates
│   ├── Update Task model with priority, due_date, recurring fields
│   ├── Create Tag model with many-to-many relationship
│   ├── Create Reminder model
│   └── Run Alembic migrations
│
├── Day 3-4: API Updates
│   ├── Add filter query parameters to GET /tasks
│   ├── Add sort query parameters
│   ├── Add search endpoint
│   ├── Create Tag CRUD endpoints
│   └── Create Reminder endpoints
│
└── Day 5: MCP Tools
    ├── Update add_task with priority, due_date, tags, recurring
    ├── Update list_tasks with filter, sort, search
    ├── Add schedule_reminder tool
    └── Add tag management tools

Week 2: Frontend
├── Day 1-2: Task UI Updates
│   ├── Priority selector component
│   ├── Tag manager component
│   └── Due date picker component
│
├── Day 3-4: Filter/Sort UI
│   ├── Filter bar component
│   ├── Sort dropdown component
│   ├── Search input component
│   └── Update task store
│
└── Day 5: Testing & Integration
    ├── Test all advanced features
    ├── Verify MCP tools work with AI agent
    └── Fix bugs and polish

PART B: EVENT-DRIVEN ARCHITECTURE (Week 3)
═══════════════════════════════════════════════════════════════════

Day 1: Dapr Setup
├── Install Dapr on Minikube
├── Deploy Redpanda (local Kafka)
├── Create Dapr Pub/Sub component
├── Create Dapr State component
└── Create Dapr Secrets component

Day 2: Event Publishing
├── Create Dapr client wrapper
├── Create event publisher service
├── Publish task-events on create/update/complete/delete
└── Test events appear in Kafka

Day 3-4: Consumer Services
├── Create Notification Service
│   ├── FastAPI app structure
│   ├── Dapr subscription endpoint
│   └── Notification logic (push/email stub)
│
├── Create Recurring Task Service
│   ├── FastAPI app structure
│   ├── Dapr subscription endpoint
│   └── Next occurrence calculator
│
└── Create Audit Service
    ├── FastAPI app structure
    ├── Dapr subscription endpoint
    └── Audit log storage

Day 5: Dapr Jobs API
├── Implement reminder scheduling via Jobs API
├── Create callback endpoint for job triggers
├── Publish to reminders topic on job fire
└── Test exact-time reminder delivery

Day 6-7: Testing & Debugging
├── End-to-end event flow testing
├── Test recurring task auto-creation
├── Test reminder notifications
└── Verify audit logging

PART C: CLOUD DEPLOYMENT (Week 4)
═══════════════════════════════════════════════════════════════════

Day 1: CI/CD Pipeline
├── Create GitHub Actions CI workflow
├── Create build workflow (Docker images)
└── Create deploy workflow (Helm)

Day 2: Cloud Cluster Setup
├── Create DigitalOcean DOKS cluster
├── Install Dapr on DOKS cluster
├── Configure NGINX Ingress
└── Setup kubectl-ai and kagent for AIOps

Day 3: Cloud Kafka Setup
├── Create Redpanda Cloud account
├── Create Kafka topics
├── Update Dapr Pub/Sub component for cloud
└── Test connectivity

Day 4: Cloud Secrets & TLS
├── Configure Kubernetes Secrets
├── Update Dapr Secrets component
├── Install cert-manager
└── Configure TLS certificates

Day 5: Monitoring Setup
├── Deploy Prometheus
├── Deploy Grafana
├── Configure Dapr metrics
└── Create dashboards

Day 6-7: Final Testing & Documentation
├── Deploy to cloud via CI/CD
├── End-to-end cloud testing using kubectl-ai
├── Performance testing
├── Write deployment documentation
└── Create runbooks

PART D: BONUS FEATURES (Week 5-6) - Optional +600 Points
═══════════════════════════════════════════════════════════════════

Week 5: Voice Commands & Urdu Support
├── Day 1-2: Voice Commands
│   ├── Create voice input button component
│   ├── Integrate Web Speech API
│   ├── Add voice waveform visualizer
│   └── Connect to AI agent
│
├── Day 3-4: Multi-language Support
│   ├── Setup next-intl for i18n
│   ├── Create Urdu translations file
│   ├── Implement RTL CSS support
│   ├── Update AI agent for Urdu
│   └── Add language selector component
│
└── Day 5: Testing Voice & i18n
    ├── Test voice commands end-to-end
    ├── Test Urdu responses
    └── Polish UI/UX

Week 6: Reusable Intelligence & Blueprints
├── Day 1-2: Claude Code Skills
│   ├── Create Dapr integration skill
│   ├── Create Kafka producer/consumer skills
│   ├── Create microservice scaffold skill
│   ├── Create DigitalOcean DOKS skill
│   └── Create kubectl-ai/kagent skills
│
├── Day 3-4: Claude Code Subagents
│   ├── Create event-driven-builder agent
│   ├── Create microservice-builder agent
│   ├── Create cloud-deployer agent
│   └── Create aiops-operator agent
│
├── Day 5-6: Cloud-Native Blueprints
│   ├── Design blueprint schema
│   ├── Create blueprint parser
│   ├── Create service generator skill
│   ├── Create Helm generator skill
│   └── Create example blueprints
│
└── Day 7: Documentation & Testing
    ├── Document all skills and agents
    ├── Test blueprint generation
    └── Create demo video
```

---

## System Responsibilities

| Component | Responsibilities | Dependencies |
|-----------|-----------------|--------------|
| Frontend | UI, filter/sort/search, priority/tag selection, voice input, i18n | Backend API |
| Backend API | Task CRUD, event publishing, reminder scheduling | MCP Server, Dapr Pub/Sub, Neon DB |
| MCP Server | AI agent tools for task operations | Neon DB |
| Notification Service | Send push/email when reminder due | Dapr Pub/Sub (reminders topic) |
| Recurring Task Service | Auto-create next occurrence | Dapr Pub/Sub (task-events topic), Backend API |
| Audit Service | Log all task operations | Dapr Pub/Sub (task-events topic) |
| Dapr Sidecar | Pub/Sub, State, Secrets, Service Invocation | Kafka, Neon, K8s Secrets |
| Kafka (Redpanda) | Event streaming, topic management | - |
| GitHub Actions | CI/CD pipeline | DOCR, DigitalOcean DOKS |
| kubectl-ai | AI-assisted K8s commands | DOKS cluster |
| kagent | Cluster analysis, optimization | DOKS cluster |
| Voice Module | Speech-to-text conversion | Web Speech API / Whisper |
| i18n Module | Multi-language support (English, Urdu) | next-intl |

---

## Non-Functional Requirements

### Performance

| NFR | Target | Measurement |
|-----|--------|-------------|
| Task search response | <500ms | API response time |
| Event publish latency | <100ms | Dapr publish time |
| Kafka consumer lag | <1000 messages | Kafka metrics |
| Reminder accuracy | Within 1 minute | Job callback time |
| CI/CD pipeline | <10 minutes | GitHub Actions time |
| Cloud deployment | <5 minutes | Helm upgrade time |

### Reliability

| NFR | Target | Measurement |
|-----|--------|-------------|
| Event delivery | At-least-once | Kafka acknowledgment |
| Service availability | 99.9% | Uptime monitoring |
| Retry on failure | 3 attempts with backoff | Dapr resiliency |
| Circuit breaker | Open after 5 failures | Dapr resiliency |

### Security

| NFR | Target | Measurement |
|-----|--------|-------------|
| Service communication | mTLS via Dapr | Dapr Sentry |
| Secrets in git | 0 | Code scan |
| Kafka authentication | SASL | Redpanda config |
| API authentication | JWT required | Middleware |
| Network policies | Enforced | K8s NetworkPolicy |

### Scalability

| NFR | Target | Measurement |
|-----|--------|-------------|
| Concurrent users | 1000 | Load test |
| Auto-scaling | HPA on CPU/memory | K8s HPA |
| Independent scaling | Per-service | Deployment replicas |
| Kafka partitions | 3 per topic | Topic config |

---

## Operational Readiness

### Observability

| Component | Implementation | Tool |
|-----------|----------------|------|
| Metrics | Prometheus scraping | Prometheus + Grafana |
| Logs | Structured JSON | Loki or Cloud Logging |
| Traces | Dapr tracing | Zipkin or Jaeger |
| Dashboards | Pre-built + custom | Grafana |
| Dapr visibility | Dapr Dashboard | Port-forward 8080 |

### Alerting

| Alert | Condition | Channel |
|-------|-----------|---------|
| Pod crash loop | >3 restarts/hour | Slack/Email |
| High consumer lag | >5000 messages | Slack/Email |
| API error rate | >5% | Slack/Email |
| Memory usage | >90% of limit | Slack/Email |

### Runbooks

| Operation | Runbook |
|-----------|---------|
| Deploy to production | docs/CLOUD-DEPLOYMENT.md |
| Rollback deployment | docs/RUNBOOKS.md#rollback |
| Scale services | docs/RUNBOOKS.md#scaling |
| Debug event flow | docs/RUNBOOKS.md#event-debugging |
| Restart Dapr sidecar | docs/RUNBOOKS.md#dapr-restart |

---

## Risk Analysis

### Top 5 Risks

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| 1 | Dapr learning curve | High | High | Start with Pub/Sub only, add incrementally, use docs |
| 2 | Kafka complexity | High | Medium | Use Redpanda (simpler), Dapr abstracts complexity |
| 3 | Cloud cost overrun | Medium | Medium | Use free tiers, set budget alerts, Oracle OKE always free |
| 4 | CI/CD setup time | Medium | Medium | Use template workflows, GitHub Actions marketplace |
| 5 | Time constraints | High | High | Prioritize Part A+B, Part C can be partial |

### Mitigation Strategies

| Risk | Primary Mitigation | Fallback |
|------|-------------------|----------|
| Dapr complexity | Follow official tutorials | Use direct Kafka if needed |
| Kafka issues | Use Dapr abstraction | Switch to Redis Pub/Sub via Dapr |
| Cloud provider issues | Document all three providers | Stick with Minikube |
| CI/CD failures | Test locally first | Manual deployment scripts |
| Time pressure | MVP first, polish later | Submit Part A+B only |

---

## Evaluation and Validation

### Definition of Done - Part A

- [ ] Task model updated with priority, due_date, recurring fields
- [ ] Tag model created with many-to-many relationship
- [ ] Reminder model created
- [ ] Alembic migration applied successfully
- [ ] Filter/sort/search API endpoints working
- [ ] Tag CRUD endpoints working
- [ ] Reminder endpoints working
- [ ] All MCP tools updated
- [ ] Frontend components created
- [ ] Advanced features working via chatbot

### Definition of Done - Part B

- [ ] Dapr installed on Minikube
- [ ] Redpanda deployed and running
- [ ] Dapr components configured (Pub/Sub, State, Secrets)
- [ ] Task events published on all CRUD operations
- [ ] Notification Service consuming reminders
- [ ] Recurring Task Service creating next occurrences
- [ ] Audit Service logging all events
- [ ] Dapr Jobs API scheduling reminders
- [ ] End-to-end event flow verified

### Definition of Done - Part C

- [ ] GitHub Actions CI workflow passing
- [ ] GitHub Actions build workflow pushing images
- [ ] GitHub Actions deploy workflow working
- [ ] Cloud K8s cluster created
- [ ] Dapr installed on cloud cluster
- [ ] Cloud Kafka (Redpanda Cloud) configured
- [ ] Cloud secrets configured
- [ ] TLS/SSL configured
- [ ] Prometheus + Grafana deployed
- [ ] Application accessible via cloud URL
- [ ] End-to-end testing passed

### Output Validation

| Output | Validation Method |
|--------|-------------------|
| Database models | Alembic migration success |
| API endpoints | pytest + manual testing |
| Event flow | Kafka consumer logs |
| Dapr components | `dapr components -k` |
| CI/CD pipeline | GitHub Actions UI |
| Cloud deployment | `kubectl get pods` |
| Monitoring | Grafana dashboards |

---

## Integration Points

### Dapr Integration

| Component | Dapr Building Block | Endpoint |
|-----------|--------------------|-----------
| Task CRUD | Pub/Sub | POST /v1.0/publish/kafka-pubsub/task-events |
| Conversation state | State | POST /v1.0/state/statestore |
| API keys | Secrets | GET /v1.0/secrets/kubernetes-secrets/{key} |
| Reminders | Jobs API | POST /v1.0-alpha1/jobs/{name} |
| Service calls | Invoke | POST /v1.0/invoke/{app-id}/method/{method} |

### Kafka Integration

| Topic | Producer | Consumer | Event Types |
|-------|----------|----------|-------------|
| task-events | Backend | Recurring, Audit | created, updated, completed, deleted |
| reminders | Backend, Jobs | Notification | scheduled, due |
| task-updates | Backend | (Future WebSocket) | sync |

### Cloud Provider Integration

| Provider | K8s Service | Secret Store | Registry | AIOps |
|----------|-------------|--------------|----------|-------|
| DigitalOcean DOKS ⭐ | DOKS | K8s Secrets | DOCR | kubectl-ai, kagent |
| Oracle OKE | OKE | OCI Vault | OCIR | kubectl-ai, kagent |
| Google GKE | GKE | Secret Manager | GCR/Artifact Registry | kubectl-ai, kagent |
| Azure AKS | AKS | KeyVault | ACR | kubectl-ai, kagent |

---

## Part D: Bonus Features (+600 Points)

### Overview

Bonus features provide additional points beyond the base 300 points for Phase 5:

| Bonus Feature | Points | Description |
|---------------|--------|-------------|
| Reusable Intelligence (Subagents/Skills) | +200 | Create Claude Code subagents and skills |
| Cloud-Native Blueprints via Skills | +200 | Spec-driven infrastructure automation |
| Voice Commands | +200 | Voice input for todo commands |
| Multi-language Support (Urdu) | +100 | Urdu language support in chatbot |
| **TOTAL BONUS** | **+600** | |

---

### D1. Voice Commands (+200 Points)

**Objective**: Add voice input capability for managing todos through spoken commands.

#### Architecture

```
Voice Commands Architecture
├── Frontend Components
│   ├── components/voice/
│   │   ├── voice-input-button.tsx        # Microphone button component
│   │   ├── voice-recorder.tsx            # Audio recording logic
│   │   ├── voice-visualizer.tsx          # Audio waveform display
│   │   └── voice-feedback.tsx            # Visual feedback during recording
│   │
│   └── lib/voice/
│       ├── speech-recognition.ts         # Web Speech API wrapper
│       ├── audio-processor.ts            # Audio processing utilities
│       └── voice-commands.ts             # Command pattern matching
│
├── Backend Integration
│   ├── Speech-to-Text Options
│   │   ├── Web Speech API (browser-native, free)
│   │   ├── OpenAI Whisper API (cloud, accurate)
│   │   └── Deepgram (streaming, real-time)
│   │
│   └── Processing Flow
│       User speaks → STT → Text → AI Agent → Task Action
│
└── Voice Command Examples
    ├── "Add a task to buy groceries"
    ├── "Show me my pending tasks"
    ├── "Mark task 3 as complete"
    └── "Delete the meeting task"
```

#### Implementation

| Component | Technology | Purpose |
|-----------|------------|---------|
| Speech Recognition | Web Speech API / Whisper | Convert speech to text |
| Voice UI | React + Tailwind | Microphone button, visualizer |
| Text Processing | AI Agent | Interpret commands |
| Feedback | TTS (optional) | Speak response back |

#### Complexity Estimate

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Voice input button component | Low | 1-2 hours |
| Web Speech API integration | Medium | 2-3 hours |
| Voice waveform visualizer | Low | 1-2 hours |
| Command processing pipeline | Medium | 2-3 hours |
| Text-to-speech response (optional) | Low | 1-2 hours |
| Testing and polish | Medium | 2-3 hours |
| **Subtotal** | | **9-15 hours** |

---

### D2. Multi-language Support - Urdu (+100 Points)

**Objective**: Enable the AI chatbot to understand and respond in Urdu.

#### Architecture

```
Multi-language Support Architecture
├── Frontend Internationalization
│   ├── lib/i18n/
│   │   ├── translations/
│   │   │   ├── en.json                   # English translations
│   │   │   └── ur.json                   # Urdu translations
│   │   ├── i18n-config.ts                # i18n configuration
│   │   └── use-translation.ts            # Translation hook
│   │
│   └── components/
│       └── language-selector.tsx         # Language toggle component
│
├── Backend Multilingual Support
│   ├── AI Agent Configuration
│   │   └── System prompt with Urdu capability
│   │
│   └── Response Language Detection
│       └── Match user's input language
│
└── Urdu-Specific Considerations
    ├── RTL (Right-to-Left) text support
    ├── Urdu numerals (optional)
    └── Font selection (Noto Sans Urdu)
```

#### Implementation

| Component | Technology | Purpose |
|-----------|------------|---------|
| i18n Framework | next-intl / react-i18next | Translation management |
| UI Translations | JSON files | Static UI text |
| AI Responses | Gemini prompt engineering | Dynamic Urdu responses |
| RTL Support | Tailwind CSS dir="rtl" | Right-to-left layout |
| Fonts | Noto Sans Urdu | Proper Urdu rendering |

#### AI Agent Prompt Enhancement

```python
SYSTEM_PROMPT_URDU = """
You are a helpful todo assistant that can communicate in both English and Urdu.
When the user writes in Urdu, respond in Urdu.
When the user writes in English, respond in English.

آپ ایک مددگار ٹوڈو اسسٹنٹ ہیں جو اردو اور انگریزی دونوں میں بات کر سکتے ہیں۔
جب صارف اردو میں لکھے، اردو میں جواب دیں۔
جب صارف انگریزی میں لکھے، انگریزی میں جواب دیں۔
"""
```

#### Complexity Estimate

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| i18n setup (next-intl) | Medium | 2-3 hours |
| Urdu translations file | Low | 1-2 hours |
| Language selector component | Low | 1 hour |
| RTL CSS support | Medium | 2-3 hours |
| AI prompt engineering for Urdu | Low | 1-2 hours |
| Font configuration | Low | 1 hour |
| Testing | Medium | 2-3 hours |
| **Subtotal** | | **10-15 hours** |

---

### D3. Reusable Intelligence - Subagents/Skills (+200 Points)

**Objective**: Create Claude Code subagents and skills for reusable development patterns.

#### Architecture

```
Reusable Intelligence Architecture
├── Claude Code Skills (/.claude/skills/)
│   ├── dapr-integration/
│   │   ├── SKILL.md                      # Dapr setup instructions
│   │   ├── examples.md                   # Code examples
│   │   └── validation.sh                 # Validation script
│   │
│   ├── kafka-producer/
│   │   ├── SKILL.md                      # Kafka producer patterns
│   │   └── examples.md                   # Producer examples
│   │
│   ├── kafka-consumer/
│   │   ├── SKILL.md                      # Kafka consumer patterns
│   │   └── examples.md                   # Consumer examples
│   │
│   ├── microservice-scaffold/
│   │   ├── SKILL.md                      # Microservice template
│   │   └── templates/                    # Boilerplate files
│   │
│   └── digitalocean-doks/
│       ├── SKILL.md                      # DOKS deployment guide
│       └── examples.md                   # Deployment examples
│
├── Claude Code Subagents (/.claude/agents/)
│   ├── event-driven-builder.md           # Kafka + Dapr agent
│   ├── microservice-builder.md           # Microservice creation agent
│   ├── cloud-deployer.md                 # Cloud deployment agent
│   └── aiops-operator.md                 # kubectl-ai + kagent agent
│
└── MCP Tools Integration
    └── Skills exposed as MCP prompts for any AI agent
```

#### Skills to Create

| Skill | Purpose | Reusability |
|-------|---------|-------------|
| `dapr-integration` | Setup Dapr building blocks | Any Dapr project |
| `kafka-producer` | Event publishing patterns | Any event-driven app |
| `kafka-consumer` | Event consumption patterns | Any microservice |
| `microservice-scaffold` | FastAPI microservice template | Any Python microservice |
| `digitalocean-doks` | DOKS deployment guide | Any DO deployment |

#### Subagents to Create

| Agent | Purpose | Tools Access |
|-------|---------|--------------|
| `event-driven-builder` | Create event-driven components | Kafka, Dapr skills |
| `microservice-builder` | Scaffold new microservices | Microservice skill |
| `cloud-deployer` | Deploy to cloud K8s | DOKS, Helm skills |
| `aiops-operator` | AI-assisted K8s operations | kubectl-ai, kagent |

#### Complexity Estimate

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Dapr integration skill | Medium | 3-4 hours |
| Kafka producer/consumer skills | Medium | 4-6 hours |
| Microservice scaffold skill | Medium | 3-4 hours |
| DigitalOcean DOKS skill | Medium | 2-3 hours |
| Event-driven builder agent | High | 4-6 hours |
| Microservice builder agent | Medium | 3-4 hours |
| Cloud deployer agent | Medium | 3-4 hours |
| AIOps operator agent | Medium | 2-3 hours |
| **Subtotal** | | **24-34 hours** |

---

### D4. Cloud-Native Blueprints via Agent Skills (+200 Points)

**Objective**: Create spec-driven infrastructure automation using Claude Code skills.

#### Architecture

```
Cloud-Native Blueprints Architecture
├── Blueprint Specifications (/.specify/blueprints/)
│   ├── microservice-blueprint.yaml       # Microservice spec
│   ├── event-pipeline-blueprint.yaml     # Event pipeline spec
│   └── monitoring-blueprint.yaml         # Monitoring stack spec
│
├── Blueprint Skills (/.claude/skills/)
│   ├── blueprint-executor/
│   │   ├── SKILL.md                      # Blueprint execution guide
│   │   ├── parser.py                     # Blueprint YAML parser
│   │   └── generator.py                  # Code/manifest generator
│   │
│   └── infrastructure-as-spec/
│       ├── SKILL.md                      # IaS patterns
│       └── examples/                     # Blueprint examples
│
├── Generated Artifacts
│   ├── Helm Charts (from blueprint)
│   ├── Kubernetes Manifests
│   ├── Docker Compose files
│   └── CI/CD Workflows
│
└── Blueprint Types
    ├── Service Blueprint → Microservice + Dockerfile + Helm
    ├── Pipeline Blueprint → Kafka topics + producers + consumers
    └── Stack Blueprint → Full application deployment
```

#### Blueprint Example

```yaml
# microservice-blueprint.yaml
apiVersion: blueprint.speckit.io/v1
kind: ServiceBlueprint
metadata:
  name: notification-service
spec:
  runtime: python-fastapi
  port: 8002

  dapr:
    enabled: true
    appId: notification-service
    components:
      - pubsub.kafka
      - secretstores.kubernetes

  subscriptions:
    - topic: reminders
      route: /api/reminders

  dependencies:
    - kafka
    - neon-postgres

  scaling:
    minReplicas: 1
    maxReplicas: 5
    cpu: 80%
```

#### Blueprint Skills

| Skill | Input | Output |
|-------|-------|--------|
| `blueprint-parser` | YAML spec | Structured blueprint object |
| `service-generator` | Service blueprint | FastAPI code + Dockerfile |
| `helm-generator` | Any blueprint | Helm chart |
| `pipeline-generator` | Pipeline blueprint | Kafka topics + consumers |
| `stack-deployer` | Stack blueprint | Full deployment |

#### Complexity Estimate

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| Blueprint schema design | High | 4-6 hours |
| Blueprint parser | Medium | 3-4 hours |
| Service generator skill | High | 6-8 hours |
| Helm generator skill | Medium | 4-6 hours |
| Pipeline generator skill | High | 4-6 hours |
| Stack deployer skill | High | 4-6 hours |
| Example blueprints | Medium | 3-4 hours |
| Documentation | Medium | 2-3 hours |
| **Subtotal** | | **30-43 hours** |

---

### D5. kubectl-ai and kagent Integration

**Objective**: Integrate AI-assisted Kubernetes operations for intelligent cluster management.

#### Tools Overview

| Tool | Purpose | Installation |
|------|---------|--------------|
| kubectl-ai | AI-assisted kubectl commands | `pip install kubectl-ai` |
| kagent | Cluster analysis and optimization | `pip install kagent` |

#### Usage Examples

```bash
# kubectl-ai examples
kubectl-ai "deploy the notification service with 2 replicas"
kubectl-ai "scale the backend to handle more load"
kubectl-ai "check why pods are failing in todo-app namespace"
kubectl-ai "show me resource usage across all services"
kubectl-ai "create a network policy to isolate frontend"

# kagent examples
kagent "analyze cluster health"
kagent "optimize resource allocation for todo-app"
kagent "identify potential bottlenecks"
kagent "recommend scaling strategy"
```

#### Integration with Claude Code

```
AIOps Integration
├── Skills
│   ├── kubectl-ai-operations/
│   │   ├── SKILL.md                      # kubectl-ai usage guide
│   │   └── examples.md                   # Common operations
│   │
│   └── kagent-analysis/
│       ├── SKILL.md                      # kagent usage guide
│       └── examples.md                   # Analysis examples
│
├── Subagent
│   └── aiops-operator.md
│       ├── Uses kubectl-ai for deployments
│       ├── Uses kagent for analysis
│       └── Integrates with CI/CD workflows
│
└── Automation
    ├── Pre-deployment health checks
    ├── Post-deployment validation
    └── Continuous optimization suggestions
```

#### Complexity Estimate

| Task | Complexity | Estimated Effort |
|------|------------|------------------|
| kubectl-ai installation and setup | Low | 1 hour |
| kagent installation and setup | Low | 1 hour |
| kubectl-ai skill documentation | Medium | 2-3 hours |
| kagent skill documentation | Medium | 2-3 hours |
| AIOps operator agent | Medium | 3-4 hours |
| CI/CD integration | Medium | 2-3 hours |
| **Subtotal** | | **11-15 hours** |

---

## References

### Core Documentation
- [Phase 5 Constitution](./constitution-prompt-phase-5.md)
- [Phase 5 Specification](./spec-prompt-phase-5.md)
- [Phase 4 Plan](./plan-prompt-phase-4.md)
- [Hackathon II Specification](./Hackathon%20II%20-%20Todo%20Spec-Driven%20Development.md)

### Cloud Providers
- [DigitalOcean DOKS](https://docs.digitalocean.com/products/kubernetes/) ⭐ Primary
- [DigitalOcean Container Registry](https://docs.digitalocean.com/products/container-registry/)
- [Oracle OKE](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [Google GKE](https://cloud.google.com/kubernetes-engine/docs)
- [Azure AKS](https://docs.microsoft.com/en-us/azure/aks/)

### Event-Driven Architecture
- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Jobs API](https://docs.dapr.io/developing-applications/building-blocks/jobs/)
- [Redpanda Documentation](https://docs.redpanda.com/)
- [Redpanda Cloud](https://www.redpanda.com/redpanda-cloud)
- [Strimzi Operator](https://strimzi.io/documentation/)

### CI/CD & DevOps
- [GitHub Actions](https://docs.github.com/en/actions)
- [Helm Documentation](https://helm.sh/docs/)

### AIOps Tools
- [kubectl-ai](https://github.com/GoogleCloudPlatform/kubectl-ai)
- [kagent](https://github.com/kagent-dev/kagent)

### Bonus Features
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
- [next-intl](https://next-intl-docs.vercel.app/)
- [Noto Sans Urdu Font](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu)

### Spec-Driven Development
- [Spec-Driven IaC](https://thenewstack.io/is-spec-driven-development-key-for-infrastructure-automation/)
- [Claude Code](https://claude.ai/claude-code)

---

**Plan Version**: 1.1.0
**Last Updated**: December 30, 2025
**Phase**: Phase 5 - Advanced Cloud Deployment
**Total Points**: 300 (Base) + 600 (Bonus) = 900 Points
**Next Step**: Run `/sp.tasks` to generate implementation tasks from this plan.
