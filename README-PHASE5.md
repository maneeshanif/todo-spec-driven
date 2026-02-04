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

