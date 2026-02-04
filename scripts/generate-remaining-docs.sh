#!/bin/bash

# Generate remaining documentation files for Phase 5
# Tasks: T173, T174, T175, T177

DOCS_DIR="/home/maneeshanif/Desktop/code /python-prjs/claude-cli/todo-web-hackthon/docs"
PROJECT_ROOT="/home/maneeshanif/Desktop/code /python-prjs/claude-cli/todo-web-hackthon"

echo "Generating documentation files..."

# T173: CLOUD-DEPLOYMENT.md
cat > "$DOCS_DIR/CLOUD-DEPLOYMENT.md" << 'CLOUD_DOC'
# Cloud Deployment Guide

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T173

## Prerequisites

- DigitalOcean account with billing enabled
- `doctl` CLI installed and configured
- `kubectl` and `helm` installed
- Domain name (optional, for production)

## Quick Start

```bash
# 1. Create DOKS cluster
./scripts/create-doks-cluster.sh production

# 2. Deploy application
helm upgrade --install evolution-todo ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  -n todo-app --create-namespace

# 3. Verify deployment
kubectl get pods -n todo-app
```

## Detailed Steps

See scripts/create-doks-cluster.sh for automated deployment.

Manual steps available in helm/todo-app/README.md.

## Post-Deployment

1. Configure DNS
2. Enable TLS with cert-manager
3. Configure monitoring alerts
4. Run smoke tests

CLOUD_DOC

# T174: EVENT-SCHEMAS.md
cat > "$DOCS_DIR/EVENT-SCHEMAS.md" << 'SCHEMA_DOC'
# Event Schemas

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T174

## Task Events

### TaskEvent Schema

```python
class TaskEvent(BaseModel):
    event_type: TaskEventType  # created, updated, deleted, completed
    task_id: int
    user_id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: Optional[Priority]
    due_date: Optional[datetime]
    tags: List[str]
    timestamp: datetime
```

### Example

```json
{
  "event_type": "created",
  "task_id": 123,
  "user_id": "user-456",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-01-15T10:00:00Z",
  "tags": ["personal", "shopping"],
  "timestamp": "2026-01-01T12:00:00Z"
}
```

## Reminder Events

### ReminderEvent Schema

```python
class ReminderEvent(BaseModel):
    event_type: ReminderEventType  # scheduled, due, cancelled
    reminder_id: int
    task_id: int
    user_id: str
    title: str
    remind_at: datetime
    due_at: Optional[datetime]
    timestamp: datetime
```

## Task Update Events

For WebSocket real-time sync:

```python
class TaskUpdateEvent(BaseModel):
    event_type: str  # task.created, task.updated, task.deleted
    task_id: int
    user_id: str
    data: dict
    timestamp: datetime
```

## CloudEvents Format

All events follow CloudEvents v1.0 specification when published via Dapr:

```json
{
  "specversion": "1.0",
  "type": "com.evolutiontodo.task.created",
  "source": "backend-service",
  "id": "uuid-123",
  "time": "2026-01-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": { ... }
}
```

SCHEMA_DOC

# T175: RUNBOOKS.md
cat > "$DOCS_DIR/RUNBOOKS.md" << 'RUNBOOK_DOC'
# Operational Runbooks

**Phase**: Phase 5 - Advanced Cloud Deployment  
**Task**: T175

## Common Operations

### Deploy New Version

```bash
# 1. Update image tags in values-prod.yaml
helm upgrade evolution-todo ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  -n todo-app

# 2. Monitor rollout
kubectl rollout status deployment/backend -n todo-app
```

### Scale Services

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n todo-app

# Scale notification service
kubectl scale deployment notification-service --replicas=3 -n todo-app
```

### Restart Service

```bash
kubectl rollout restart deployment/backend -n todo-app
```

### View Logs

```bash
# Backend logs
kubectl logs -n todo-app -l app=backend --tail=100 -f

# All services
stern -n todo-app .
```

### Check Health

```bash
# All pods
kubectl get pods -n todo-app

# Service endpoints
kubectl get svc -n todo-app

# Ingress
kubectl get ingress -n todo-app
```

## Incident Response

### High Error Rate

1. Check pod logs for errors
2. Check Prometheus alerts
3. Review recent deployments
4. Rollback if necessary

### High Latency

1. Check resource usage (CPU/Memory)
2. Check database connections
3. Check Kafka consumer lag
4. Scale services if needed

### Pod Crashes

1. Check pod events: `kubectl describe pod <pod-name> -n todo-app`
2. Check logs before crash: `kubectl logs <pod-name> --previous -n todo-app`
3. Check resource limits
4. Review recent code changes

### Kafka Issues

1. Check Kafka cluster status
2. Check consumer lag
3. Restart affected consumers
4. Review Dapr pub/sub logs

## Maintenance Windows

### Database Migrations

```bash
# Run migrations
kubectl exec -it <backend-pod> -n todo-app -- \
  uv run alembic upgrade head
```

### Backup Database

```bash
# Using pg_dump
kubectl exec -it <postgres-pod> -n todo-app -- \
  pg_dump -U postgres evolution_todo > backup.sql
```

### Update Secrets

```bash
# Update Redpanda credentials
kubectl create secret generic redpanda-credentials \
  --from-literal=sasl-password='NEW_PASSWORD' \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart affected pods
kubectl rollout restart deployment/backend -n todo-app
```

RUNBOOK_DOC

# T177: Update README.md
cat > "$PROJECT_ROOT/README-PHASE5.md" << 'README_DOC'
# Evolution of Todo - Phase 5: Advanced Cloud Deployment

## Quick Start

### Local Development

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=5000

# 2. Deploy Kafka
kubectl apply -f k8s/kafka/strimzi-operator.yaml
kubectl apply -f k8s/kafka/kafka-cluster.yaml
kubectl apply -f k8s/kafka/kafka-topics.yaml

# 3. Deploy application
helm upgrade --install evolution-todo ./helm/todo-app \
  -n todo-app --create-namespace

# 4. Access application
minikube service frontend -n todo-app
```

### Cloud Deployment

```bash
# 1. Create DOKS cluster
./scripts/create-doks-cluster.sh production

# 2. Configure secrets
kubectl create secret generic redpanda-credentials ...

# 3. Deploy
helm upgrade --install evolution-todo ./helm/todo-app \
  -f helm/todo-app/values-prod.yaml \
  -n todo-app
```

## Phase 5 Features

- ✅ Event-Driven Architecture (Kafka + Dapr)
- ✅ 4 New Microservices (Notification, Recurring, Audit, WebSocket)
- ✅ Advanced Task Features (Priorities, Tags, Due Dates, Reminders)
- ✅ Real-time Sync via WebSocket
- ✅ Monitoring Stack (Prometheus + Grafana)
- ✅ Cloud Deployment (DOKS + Redpanda Cloud)

## Documentation

- [DAPR-INTEGRATION.md](docs/DAPR-INTEGRATION.md)
- [KAFKA-SETUP.md](docs/KAFKA-SETUP.md)
- [CLOUD-DEPLOYMENT.md](docs/CLOUD-DEPLOYMENT.md)
- [EVENT-SCHEMAS.md](docs/EVENT-SCHEMAS.md)
- [RUNBOOKS.md](docs/RUNBOOKS.md)
- [MONITORING.md](docs/MONITORING.md)
- [LOGGING.md](docs/LOGGING.md)

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.

README_DOC

echo "✅ All documentation files generated!"
ls -lh "$DOCS_DIR"/*.md

