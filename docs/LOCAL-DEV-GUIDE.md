# TaskWhisper - Local Development Guide

Complete guide to run and test the entire Phase 5 stack locally on Minikube.

## Quick Start

```bash
# 1. Start everything
./scripts/local-dev/start-all.sh

# 2. Open all dashboards
./scripts/local-dev/dashboards.sh

# 3. Check status
./scripts/local-dev/status.sh

# 4. Stop when done
./scripts/local-dev/stop-all.sh
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker | 24.0+ | [docker.com](https://docker.com) |
| Minikube | 1.32+ | `curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube` |
| kubectl | 1.28+ | `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install kubectl /usr/local/bin/kubectl` |
| Helm | 3.15+ | `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \| bash` |
| Dapr CLI | 1.12+ | `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - \| /bin/bash` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MINIKUBE CLUSTER                                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Frontend   │  │   Backend   │  │ MCP Server  │                 │
│  │  :3000      │  │   :8000     │  │   :8001     │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│  ┌──────▼────────────────▼────────────────▼──────┐                 │
│  │           DAPR SIDECAR (Pub/Sub)              │                 │
│  └───────────────────────┬───────────────────────┘                 │
│                          │                                          │
│  ┌───────────────────────▼───────────────────────┐                 │
│  │              KAFKA (Strimzi)                  │                 │
│  │  Topics: task-events, reminders, audit-events │                 │
│  └───────────────────────────────────────────────┘                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐                                  │
│  │ PostgreSQL  │  │   Adminer   │                                  │
│  │   :5432     │  │   :8082     │                                  │
│  └─────────────┘  └─────────────┘                                  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Prometheus  │  │   Grafana   │  │  Kafka UI   │                 │
│  │   :9090     │  │   :3001     │  │   :8080     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## All Dashboard URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **MCP Server** | http://localhost:8001 | - |
| **PostgreSQL** | localhost:5432 | postgres / postgres |
| **Adminer (DB UI)** | http://localhost:8082 | See below |
| **Grafana** | http://localhost:3001 | admin / prom-operator |
| **Prometheus** | http://localhost:9090 | - |
| **Kafka UI** | http://localhost:8080 | - |
| **Dapr Dashboard** | http://localhost:9999 | - |
| **K8s Dashboard** | (auto-opens) | - |

---

## Database Access

### Credentials

```
Host:     localhost (or postgres.todo-app.svc.cluster.local in cluster)
Port:     5432
Username: postgres
Password: postgres
Database: todo
```

### Connection String

```
postgresql://postgres:postgres@localhost:5432/todo
postgresql+asyncpg://postgres:postgres@localhost:5432/todo
```

### Adminer Login

1. Open http://localhost:8082
2. Fill in:
   - **System**: PostgreSQL
   - **Server**: `postgres`
   - **Username**: `postgres`
   - **Password**: `postgres`
   - **Database**: `todo`

### Direct psql Access

```bash
# Port-forward first (if not using dashboards.sh)
kubectl port-forward svc/postgres 5432:5432 -n todo-app &

# Connect with psql
psql -h localhost -U postgres -d todo
# Password: postgres
```

---

## Scripts Reference

### `start-all.sh`

Starts everything (checks existing before creating):
- Minikube cluster
- Namespaces (todo-app, kafka, dapr-system, monitoring)
- PostgreSQL + Adminer
- Dapr runtime
- Strimzi Kafka + topics
- Prometheus + Grafana
- Application (frontend, backend, mcp-server)

```bash
./scripts/local-dev/start-all.sh
```

### `stop-all.sh`

```bash
./scripts/local-dev/stop-all.sh          # Stop port-forwards only
./scripts/local-dev/stop-all.sh --full   # Stop Minikube
./scripts/local-dev/stop-all.sh --delete # Delete Minikube cluster
```

### `dashboards.sh`

Port-forwards all services:

```bash
./scripts/local-dev/dashboards.sh
```

### `logs.sh`

```bash
./scripts/local-dev/logs.sh all           # Summary of all
./scripts/local-dev/logs.sh frontend      # Frontend logs
./scripts/local-dev/logs.sh backend       # Backend logs
./scripts/local-dev/logs.sh mcp           # MCP server logs
./scripts/local-dev/logs.sh postgres      # PostgreSQL logs
./scripts/local-dev/logs.sh adminer       # Adminer logs
./scripts/local-dev/logs.sh kafka         # Kafka logs
./scripts/local-dev/logs.sh backend -f    # Follow logs
```

### `status.sh`

```bash
./scripts/local-dev/status.sh
```

### `test-events.sh`

```bash
./scripts/local-dev/test-events.sh
```

### `rebuild.sh`

Force rebuild Docker images after code changes:

```bash
./scripts/local-dev/rebuild.sh
```

---

## Step-by-Step Testing

### 1. Start Environment

```bash
./scripts/local-dev/start-all.sh
```

Wait 5-10 minutes for first-time setup.

### 2. Check Status

```bash
./scripts/local-dev/status.sh
```

All should show green ✓

### 3. Open Dashboards

```bash
./scripts/local-dev/dashboards.sh
```

### 4. Verify Database

1. Open http://localhost:8082 (Adminer)
2. Login:
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: todo
3. Check tables exist

### 5. Test Application

1. Open http://localhost:3000
2. Sign up / Login
3. Create a task
4. Check database in Adminer

### 6. Test Events

```bash
./scripts/local-dev/test-events.sh
```

### 7. Monitor

- Grafana: http://localhost:3001 (admin/prom-operator)
- Prometheus: http://localhost:9090
- Kafka UI: http://localhost:8080

---

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL pod
kubectl get pods -n todo-app -l app=postgres
kubectl logs deployment/postgres -n todo-app

# Restart PostgreSQL
kubectl rollout restart deployment/postgres -n todo-app
```

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Reset Database

```bash
# Delete and recreate
kubectl delete deployment postgres -n todo-app
kubectl delete pvc postgres-pvc -n todo-app
./scripts/local-dev/start-all.sh
```

### Port Already in Use

```bash
# Find process
lsof -i :5432
kill <PID>

# Or use different port
kubectl port-forward svc/postgres 5433:5432 -n todo-app
```

### Service Not Found

Check actual service names:
```bash
kubectl get svc -n todo-app
kubectl get svc -n monitoring
kubectl get svc -n kafka
```

---

## Actual Service Names

The Helm chart creates services with these names:

| Service | Kubernetes Name |
|---------|-----------------|
| Frontend | `evolution-todo-todo-app-frontend` |
| Backend | `evolution-todo-todo-app-backend` |
| MCP Server | `evolution-todo-todo-app-mcp-server` |
| PostgreSQL | `postgres` |
| Adminer | `adminer` |
| Grafana | `monitoring-grafana` |
| Prometheus | `monitoring-kube-prometheus-prometheus` |
| Kafka UI | `kafka-ui` |

---

## Next Steps

Once everything works locally:

1. Configure GitHub secrets (T143)
2. Push to trigger CI/CD
3. Deploy to DigitalOcean DOKS (T154)
4. Set up Redpanda Cloud (T155-T156)

See [Cloud Deployment Guide](./CLOUD-DEPLOYMENT.md)
