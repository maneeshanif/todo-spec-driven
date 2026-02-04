# Dapr Integration Guide

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T171

## Overview

This document describes how Dapr is integrated into the Evolution Todo application for event-driven microservices architecture.

## Table of Contents

- [Architecture](#architecture)
- [Dapr Components](#dapr-components)
- [Pub/Sub Integration](#pubsub-integration)
- [State Management](#state-management)
- [Service Invocation](#service-invocation)
- [Jobs API](#jobs-api)
- [Local Development](#local-development)
- [Cloud Deployment](#cloud-deployment)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dapr Sidecars                               │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │Backend │  │Notif.  │  │Recur.  │  │Audit   │  │WebSock │   │
│  │+Dapr   │  │+Dapr   │  │+Dapr   │  │+Dapr   │  │+Dapr   │   │
│  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘   │
│       │           │           │           │           │       │
│  ┌────▼───────────▼───────────▼───────────▼───────────▼────┐  │
│  │              Dapr Pub/Sub (Kafka)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Dapr State Store (PostgreSQL)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Dapr Jobs API (Reminder Scheduling)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Dapr Components

### 1. Pub/Sub Component (Kafka)

**Local Development:**
```yaml
# dapr-components/pubsub-kafka.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub-kafka
spec:
  type: pubsub.kafka
  metadata:
    - name: brokers
      value: "todo-kafka-cluster-kafka-bootstrap.kafka:9092"
    - name: consumerGroup
      value: "{service-name}-group"
```

**Production (Redpanda Cloud):**
```yaml
# helm/todo-app/templates/dapr-pubsub-prod.yaml
- name: brokers
  secretKeyRef:
    name: redpanda-credentials
    key: bootstrap-servers
- name: saslUsername
  secretKeyRef:
    name: redpanda-credentials
    key: sasl-username
```

### 2. State Store Component (PostgreSQL)

```yaml
# dapr-components/statestore-postgres.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore-postgres
spec:
  type: state.postgresql
  metadata:
    - name: connectionString
      secretKeyRef:
        name: postgres-credentials
        key: connection-string
```

### 3. Secrets Store Component (Kubernetes)

```yaml
# dapr-components/secretstore-kubernetes.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
```

### 4. Resiliency Policies

```yaml
# dapr-components/resiliency.yaml
apiVersion: dapr.io/v1alpha1
kind: Resiliency
metadata:
  name: todo-resiliency
spec:
  policies:
    retries:
      PubSubRetryPolicy:
        policy: exponential
        maxRetries: 5
    circuitBreakers:
      PubSubCircuitBreaker:
        maxRequests: 5
        timeout: 60s
```

## Pub/Sub Integration

### Event Schemas

**TaskEvent:**
```python
class TaskEvent(BaseModel):
    event_type: TaskEventType  # created, updated, deleted, completed
    task_id: int
    user_id: str
    title: str
    status: TaskStatus
    timestamp: datetime
```

**ReminderEvent:**
```python
class ReminderEvent(BaseModel):
    event_type: ReminderEventType  # scheduled, due, cancelled
    reminder_id: int
    task_id: int
    user_id: str
    remind_at: datetime
```

### Publishing Events

**Python (FastAPI):**
```python
from src.services.dapr_client import DaprClient

# Publish task created event
event = TaskEvent(
    event_type=TaskEventType.CREATED,
    task_id=task.id,
    user_id=task.user_id,
    title=task.title,
    status=task.status,
    timestamp=datetime.now(timezone.utc)
)

await DaprClient.publish_event(
    pubsub_name="pubsub-kafka",
    topic="task-events",
    data=event.model_dump(mode='json')
)
```

### Subscribing to Events

**Declarative Subscription:**
```yaml
# services/notification-service/components/subscription.yaml
apiVersion: dapr.io/v2alpha1
kind: Subscription
metadata:
  name: task-events-subscription
spec:
  pubsubname: pubsub-kafka
  topic: task-events
  routes:
    default: /dapr/subscribe/task-events
```

**Programmatic Subscription:**
```python
@app.post("/dapr/subscribe/task-events")
async def handle_task_event(event: CloudEvent):
    data = TaskEvent(**event.data)
    
    if data.event_type == TaskEventType.CREATED:
        await send_notification(data.user_id, f"Task created: {data.title}")
```

## State Management

### Storing State

```python
from dapr.clients import DaprClient

async with DaprClient() as client:
    await client.save_state(
        store_name="statestore-postgres",
        key=f"recurring-task-{task_id}",
        value=json.dumps(state_data),
        state_metadata={"contentType": "application/json"}
    )
```

### Retrieving State

```python
async with DaprClient() as client:
    state = await client.get_state(
        store_name="statestore-postgres",
        key=f"recurring-task-{task_id}"
    )
    data = json.loads(state.data)
```

## Service Invocation

```python
from dapr.clients import DaprClient

# Invoke audit service from backend
async with DaprClient() as client:
    response = await client.invoke_method(
        app_id="audit-service",
        method_name="log-action",
        data=json.dumps({
            "user_id": user_id,
            "action": "task.created",
            "resource_id": str(task_id)
        }),
        http_verb="POST"
    )
```

## Jobs API

### Scheduling Reminders

```python
from src.services.dapr_client import DaprClient

job_data = {
    "reminder_id": reminder.id,
    "task_id": task.id,
    "user_id": reminder.user_id
}

await DaprClient.schedule_job(
    job_name=f"reminder-{reminder.id}",
    schedule=remind_at.isoformat(),  # ISO 8601 datetime
    data=job_data
)
```

### Job Callback Endpoint

```python
@app.post("/dapr/jobs/reminder-callback")
async def handle_reminder_job(job_data: dict):
    reminder_id = job_data["reminder_id"]
    task_id = job_data["task_id"]
    
    # Fire reminder event
    event = ReminderEvent(
        event_type=ReminderEventType.DUE,
        reminder_id=reminder_id,
        task_id=task_id,
        ...
    )
    
    await DaprClient.publish_event("pubsub-kafka", "reminder-events", event.model_dump())
```

## Local Development

### Prerequisites

```bash
# Install Dapr CLI
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Initialize Dapr in standalone mode
dapr init
```

### Running with Dapr

```bash
# Backend service
dapr run --app-id backend \
  --app-port 8000 \
  --dapr-http-port 3500 \
  --components-path ./dapr-components \
  -- uvicorn src.main:app --host 0.0.0.0 --port 8000

# Notification service
dapr run --app-id notification-service \
  --app-port 8002 \
  --dapr-http-port 3502 \
  --components-path ./dapr-components \
  -- uvicorn src.main:app --host 0.0.0.0 --port 8002
```

### Dapr Dashboard (Local)

```bash
dapr dashboard -p 9999
# Access at http://localhost:9999
```

## Cloud Deployment

### Prerequisites

```bash
# Install Dapr on Kubernetes
dapr init -k --wait --timeout 600

# Verify installation
dapr status -k
```

### Deploy Dapr Components

```bash
# Apply components to Kubernetes
kubectl apply -f dapr-components/ -n todo-app

# Verify components
dapr components -k -n todo-app
```

### Enable Dapr Sidecar Injection

Add annotations to Helm chart deployments:

```yaml
spec:
  template:
    metadata:
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "backend"
        dapr.io/app-port: "8000"
        dapr.io/enable-metrics: "true"
        dapr.io/metrics-port: "9090"
```

### Dapr Dashboard (Kubernetes)

```bash
# Deploy Dapr Dashboard
kubectl apply -f helm/todo-app/templates/dapr-dashboard.yaml

# Port forward
kubectl port-forward -n todo-app svc/evolution-todo-dapr-dashboard 8080:8080

# Access at http://localhost:8080
```

## Troubleshooting

### Check Dapr Sidecar Logs

```bash
# Get sidecar logs
kubectl logs -n todo-app <pod-name> -c daprd

# Follow sidecar logs
kubectl logs -n todo-app <pod-name> -c daprd -f
```

### Check Component Status

```bash
# List components
dapr components -k -n todo-app

# Check component logs
kubectl logs -n dapr-system -l app=dapr-sidecar-injector
```

### Common Issues

**Issue**: Pub/Sub messages not received
```bash
# Check subscription
kubectl get subscription -n todo-app

# Check Kafka topics
kubectl exec -n kafka todo-kafka-cluster-kafka-0 -- \
  /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

**Issue**: State store connection failed
```bash
# Check PostgreSQL connectivity
kubectl exec -n todo-app <backend-pod> -c daprd -- \
  curl http://localhost:3500/v1.0/healthz
```

## Best Practices

1. **Always use CloudEvents format** for pub/sub messages
2. **Implement idempotency** in event handlers
3. **Use correlation IDs** for distributed tracing
4. **Configure resiliency policies** for all components
5. **Monitor Dapr metrics** in Prometheus/Grafana
6. **Use service invocation** for synchronous calls between services
7. **Test locally with Dapr CLI** before deploying to Kubernetes

## References

- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Python SDK](https://github.com/dapr/python-sdk)
- [Dapr Best Practices](https://docs.dapr.io/operations/best-practices/)
- [CloudEvents Specification](https://cloudevents.io/)

