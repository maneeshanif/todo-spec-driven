# Research: Phase 5 - Advanced Cloud Deployment

**Branch**: `002-phase-5-cloud-deploy` | **Date**: 2025-12-30
**Purpose**: Resolve all NEEDS CLARIFICATION items and research technology best practices

---

## Research Tasks Completed

### RT-01: Dapr Pub/Sub Integration Patterns

**Decision**: Use Dapr HTTP API for Pub/Sub with declarative subscriptions

**Rationale**:
- Dapr provides consistent pub/sub API across brokers (Kafka, RabbitMQ, Redis)
- HTTP-based sidecar pattern works with any language/framework
- Declarative subscriptions via YAML simplify configuration
- Built-in CloudEvents envelope for event metadata

**Best Practices**:
1. Use declarative subscription files for production
2. Implement `/dapr/subscribe` endpoint for runtime subscriptions
3. Handle message acknowledgment properly (return 200 for success)
4. Use topic scopes to limit access per application
5. Configure dead letter topics for failed messages

**Dapr Pub/Sub Component Example** (Kafka):
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
      value: "redpanda:9092"
    - name: consumerGroup
      value: "{appid}-group"
    - name: authRequired
      value: "false"
    - name: disableTls
      value: "true"
```

**Alternatives Considered**:
1. Direct kafka-python/aiokafka - Rejected (tight coupling, no abstraction)
2. Celery with RabbitMQ - Rejected (not event-driven pattern)

---

### RT-02: Dapr Jobs API for Reminders

**Decision**: Use Dapr Jobs API (alpha) for exact-time reminder scheduling

**Rationale**:
- Exact time delivery vs polling-based cron
- Dapr manages job state across service restarts
- No database scanning overhead
- More efficient than background polling

**Best Practices**:
1. Schedule jobs with unique names (e.g., `reminder-{task_id}-{timestamp}`)
2. Implement idempotent callback handlers
3. Use TTL for job cleanup
4. Handle job cancellation for reminder updates

**Job Scheduling Example**:
```python
import httpx

async def schedule_reminder(task_id: int, remind_at: datetime, user_id: str):
    job_name = f"reminder-{task_id}-{remind_at.timestamp()}"
    job_data = {
        "name": job_name,
        "schedule": f"@at {remind_at.isoformat()}",
        "data": {
            "task_id": task_id,
            "user_id": user_id
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0-alpha1/jobs/{job_name}",
            json=job_data
        )
        return response.status_code == 200
```

**Alternatives Considered**:
1. Dapr Cron Binding - Rejected (polling overhead, not exact time)
2. APScheduler in Python - Rejected (not distributed, state lost on restart)
3. Celery Beat - Rejected (requires Redis, more complex setup)

---

### RT-03: Strimzi Kafka on Minikube

**Decision**: Use Strimzi Operator for local Kafka deployment

**Rationale**:
- Kubernetes-native Kafka deployment
- CRD-based configuration (GitOps friendly)
- Includes topic operator for declarative topics
- Production-grade even for local development

**Best Practices**:
1. Use ephemeral storage for local development
2. Configure single-node cluster for development
3. Create topics via KafkaTopic CRDs
4. Set retention policies appropriate for dev

**Strimzi Quick Setup**:
```bash
# Install Strimzi operator
kubectl create namespace kafka
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Create Kafka cluster
kubectl apply -f - <<EOF
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: evolution-kafka
  namespace: kafka
spec:
  kafka:
    replicas: 1
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    storage:
      type: ephemeral
  zookeeper:
    replicas: 1
    storage:
      type: ephemeral
EOF
```

**Alternatives Considered**:
1. Redpanda (local) - Viable alternative, simpler (no Zookeeper)
2. Confluent Platform - Rejected (heavier, overkill for local)
3. Docker Compose Kafka - Rejected (not K8s-native)

---

### RT-04: Redpanda Cloud for Production

**Decision**: Use Redpanda Cloud (Kafka-compatible) for production event streaming

**Rationale**:
- Free serverless tier available
- Kafka-compatible API (same client code)
- No Zookeeper required (simpler operations)
- Built-in schema registry
- Lower latency than Kafka

**Configuration**:
```yaml
# Dapr component for Redpanda Cloud
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "seed-xxxxxxxx.redpanda.com:9092"
    - name: authRequired
      value: "true"
    - name: saslUsername
      secretKeyRef:
        name: redpanda-credentials
        key: username
    - name: saslPassword
      secretKeyRef:
        name: redpanda-credentials
        key: password
    - name: saslMechanism
      value: "SCRAM-SHA-256"
```

**Alternatives Considered**:
1. Confluent Cloud - Rejected (credits expire faster)
2. Amazon MSK - Rejected (AWS only, more expensive)
3. Self-hosted Kafka on DOKS - Rejected (operational overhead)

---

### RT-05: DigitalOcean DOKS Setup

**Decision**: Use DigitalOcean Kubernetes (DOKS) as sole cloud target

**Rationale**:
- Hackathon spec explicitly mentions DOKS for Phase V
- $200 credit for 60 days
- Simple, developer-friendly K8s experience
- Native DOCR (container registry) integration
- Easy doctl CLI for automation

**Cluster Configuration**:
```bash
# Create DOKS cluster
doctl kubernetes cluster create evolution-todo \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --count 3 \
  --tag evolution-todo

# Get kubeconfig
doctl kubernetes cluster kubeconfig save evolution-todo

# Install Dapr
dapr init -k --runtime-version 1.14.0

# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/do/deploy.yaml
```

**Cost Estimate**:
| Resource | Size | Monthly Cost |
|----------|------|--------------|
| DOKS Cluster (3 nodes) | s-2vcpu-4gb | ~$36 |
| Container Registry | Basic | ~$5 |
| Load Balancer | Small | ~$12 |
| **Total** | | **~$53/month** |
| **With $200 credit** | | **~4 months free** |

**Alternatives Considered**:
1. Oracle OKE - Always-free tier available, but spec mandates DOKS
2. Google GKE - $300 credit, but spec mandates DOKS
3. Azure AKS - $200 credit, but spec mandates DOKS

---

### RT-06: GitHub Actions CI/CD

**Decision**: Use GitHub Actions for CI/CD with Helm deployments

**Rationale**:
- Free for public repositories
- Native integration with GitHub
- Rich marketplace of reusable actions
- Supports secrets management
- Matrix builds for efficiency

**Workflow Structure**:
```yaml
# .github/workflows/ci.yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Backend Tests
        run: |
          cd backend
          uv sync
          uv run pytest
      - name: Frontend Tests
        run: |
          cd frontend
          npm ci
          npm test
      - name: Helm Lint
        run: helm lint helm/todo-app

# .github/workflows/deploy.yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push images
        run: |
          doctl registry login
          docker build -t registry.digitalocean.com/evolution-todo/backend:${{ github.sha }} ./backend
          docker push registry.digitalocean.com/evolution-todo/backend:${{ github.sha }}
      - name: Deploy to DOKS
        run: |
          doctl kubernetes cluster kubeconfig save evolution-todo
          helm upgrade --install evolution-todo ./helm/todo-app \
            --set backend.image.tag=${{ github.sha }}
```

**Best Practices**:
1. Use environment secrets for credentials
2. Cache dependencies for faster builds
3. Use matrix builds for multi-service testing
4. Implement staging deployment on PR
5. Use manual approval for production

**Alternatives Considered**:
1. GitLab CI - Rejected (not using GitLab)
2. ArgoCD - Could be added later for GitOps
3. Flux - Could be added later for GitOps

---

### RT-07: WebSocket Real-time Sync Architecture

**Decision**: Dedicated WebSocket service consuming Kafka topic for real-time sync

**Rationale**:
- Separates real-time concerns from main backend
- Fan-out pattern for multi-client synchronization
- Event-driven (consumes task-updates topic)
- Independent scaling based on connected clients
- User isolation (only broadcasts to user's clients)

**Architecture**:
```
[Backend] --publish--> [task-updates topic] --subscribe--> [WebSocket Service]
                                                                    |
                                                                    v
                                                          [WebSocket Manager]
                                                                    |
                                              +---------------------+---------------------+
                                              |                     |                     |
                                        [Client 1]            [Client 2]            [Client N]
                                        (Browser Tab)         (Mobile App)          (Desktop)
```

**Implementation Pattern**:
```python
# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # user_id -> list of websocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)
```

**Alternatives Considered**:
1. SSE from main backend - Rejected (uni-directional, no fan-out)
2. Socket.IO - Rejected (adds complexity, WebSocket sufficient)
3. Polling - Rejected (inefficient, high latency)

---

### RT-08: Advanced Task Features Implementation

**Decision**: Extend existing Task model with new fields and relationships

**Rationale**:
- Minimal database schema changes
- Backward compatible with existing code
- Many-to-many relationship for flexible tagging
- Enum for type-safe priorities

**Schema Extensions**:

**Task Model Updates**:
```python
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Task(SQLModel, table=True):
    # Existing fields
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # NEW Phase 5 fields
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: datetime | None = Field(default=None)
    reminder_at: datetime | None = Field(default=None)
    recurring_pattern: str | None = Field(default=None)  # "daily", "weekly", "monthly"
    next_occurrence: datetime | None = Field(default=None)

    # Relationships
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)
```

**Search Implementation**:
```python
# Simple SQL-based search (no external search engine)
async def search_tasks(
    user_id: str,
    query: str,
    priority: Priority | None = None,
    tags: list[str] | None = None,
    due_before: datetime | None = None,
    sort_by: str = "created_at"
) -> list[Task]:
    statement = select(Task).where(Task.user_id == user_id)

    if query:
        statement = statement.where(
            or_(
                Task.title.ilike(f"%{query}%"),
                Task.description.ilike(f"%{query}%")
            )
        )

    if priority:
        statement = statement.where(Task.priority == priority)

    if due_before:
        statement = statement.where(Task.due_date <= due_before)

    # Sort
    sort_column = getattr(Task, sort_by, Task.created_at)
    statement = statement.order_by(sort_column)

    return await session.exec(statement)
```

**Alternatives Considered**:
1. Elasticsearch for search - Rejected (overkill for Phase 5)
2. PostgreSQL full-text search - Could upgrade later if needed
3. Separate Tags service - Rejected (adds complexity)

---

### RT-09: Notification Delivery Strategy

**Decision**: In-app real-time notifications via WebSocket (NOT browser push)

**Rationale**:
- Spec clarification states in-app notifications are sufficient
- Browser push requires service workers and VAPID keys (complexity)
- WebSocket already provides real-time channel
- Simpler implementation for Phase 5 timeline

**Notification Flow**:
```
[Dapr Jobs fires reminder]
    --> [Notification Service receives callback]
    --> [Publish to task-updates topic with type: "reminder"]
    --> [WebSocket Service broadcasts to user's clients]
    --> [Frontend shows notification toast]
```

**Frontend Notification Handling**:
```typescript
// In WebSocket client
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "reminder") {
    toast({
      title: "Reminder",
      description: `Task "${data.task_title}" is due soon!`,
      variant: "warning"
    });
  } else if (data.type === "task_update") {
    // Refresh task list
    queryClient.invalidateQueries(["tasks"]);
  }
};
```

**Alternatives Considered**:
1. Web Push API - Rejected (out of scope per spec clarification)
2. Email notifications - Rejected (out of scope per spec clarification)
3. SMS notifications - Rejected (cost and complexity)

---

### RT-10: Recurring Task Pattern Implementation

**Decision**: String-based pattern with dateutil for calculation

**Rationale**:
- Simple patterns: "daily", "weekly", "monthly"
- python-dateutil provides reliable date calculation
- No complex cron expressions needed
- Recurring Task Service handles next occurrence

**Implementation**:
```python
from dateutil.relativedelta import relativedelta

def calculate_next_occurrence(
    current_date: datetime,
    pattern: str
) -> datetime:
    match pattern:
        case "daily":
            return current_date + relativedelta(days=1)
        case "weekly":
            return current_date + relativedelta(weeks=1)
        case "monthly":
            return current_date + relativedelta(months=1)
        case _:
            raise ValueError(f"Unknown pattern: {pattern}")

# Recurring Task Service handler
async def handle_task_completed(event: TaskEvent):
    if event.task_data.recurring_pattern:
        next_date = calculate_next_occurrence(
            event.task_data.due_date or datetime.utcnow(),
            event.task_data.recurring_pattern
        )

        # Create next occurrence
        new_task = TaskCreate(
            title=event.task_data.title,
            description=event.task_data.description,
            user_id=event.user_id,
            priority=event.task_data.priority,
            due_date=next_date,
            recurring_pattern=event.task_data.recurring_pattern
        )

        # Call backend API to create
        await create_task_via_dapr(new_task)
```

**Alternatives Considered**:
1. Cron expressions - Rejected (overkill for simple patterns)
2. iCalendar RRULE - Could add later for advanced recurrence
3. Celery Beat - Rejected (not event-driven)

---

## Clarifications Resolved

| Question | Resolution | Source |
|----------|------------|--------|
| Which cloud K8s provider? | DigitalOcean DOKS only | Spec clarification session 2025-12-30 |
| Which cloud message broker? | Redpanda Cloud (Kafka-compatible) | Spec clarification session 2025-12-30 |
| Which container registry? | DOCR (DigitalOcean Container Registry) | Spec clarification session 2025-12-30 |
| Reminder delivery mechanism? | In-app via WebSocket (not browser push) | Spec clarification |
| Past-due reminder handling? | Fire immediately, notify user | Spec clarification session 2025-12-30 |

---

## Technology Stack Summary

| Layer | Local (Minikube) | Production (DOKS) |
|-------|------------------|-------------------|
| Kubernetes | Minikube 1.32+ | DigitalOcean DOKS |
| Message Broker | Strimzi Kafka | Redpanda Cloud |
| Container Registry | Minikube registry | DOCR |
| Dapr | Dapr 1.14+ | Dapr 1.14+ |
| Secrets | K8s Secrets | K8s Secrets |
| TLS | Self-signed | cert-manager + Let's Encrypt |
| Monitoring | Prometheus + Grafana | Prometheus + Grafana |

---

**Research Version**: 1.0.0
**Created**: 2025-12-30
**Status**: All clarifications resolved
**Next Step**: Create data-model.md with entity definitions
