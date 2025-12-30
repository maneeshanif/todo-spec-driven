# Quickstart: Phase 5 - Advanced Cloud Deployment

**Branch**: `002-phase-5-cloud-deploy` | **Date**: 2025-12-30

This guide provides step-by-step instructions to set up the Phase 5 development environment.

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| Docker | Latest | Container runtime | [docker.com](https://www.docker.com/get-started) |
| Minikube | 1.32+ | Local Kubernetes | `brew install minikube` or [minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/start/) |
| kubectl | 1.28+ | Kubernetes CLI | `brew install kubectl` |
| Helm | 3.15+ | Package manager | `brew install helm` |
| Dapr CLI | 1.14+ | Dapr runtime | `brew install dapr/tap/dapr-cli` |
| UV | Latest | Python package manager | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js | 20+ | Frontend runtime | `brew install node` |
| doctl | Latest | DigitalOcean CLI | `brew install doctl` |

### Required Accounts (for Part C)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [DigitalOcean](https://digitalocean.com) | DOKS Kubernetes | $200 / 60 days |
| [Redpanda Cloud](https://redpanda.com/redpanda-cloud) | Kafka | Free serverless |
| [Neon](https://neon.tech) | PostgreSQL | Free tier |
| [GitHub](https://github.com) | Repository + Actions | Free for public repos |

---

## Part A: Local Development Setup

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-username/evolution-todo.git
cd evolution-todo

# Checkout Phase 5 branch
git checkout 002-phase-5-cloud-deploy
```

### Step 2: Backend Setup

```bash
cd backend

# Install Python dependencies
uv sync

# Copy environment file
cp .env.example .env

# Edit .env with your Neon database URL
# DATABASE_URL=postgresql://...

# Run database migrations
uv run alembic upgrade head

# Start backend (development)
uv run uvicorn src.main:app --reload --port 8000
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_WS_URL=ws://localhost:8005

# Start frontend (development)
npm run dev
```

### Step 4: MCP Server Setup

```bash
cd backend

# Start MCP server (separate terminal)
uv run python -m src.mcp_server.server
```

---

## Part B: Event-Driven Architecture Setup

### Step 5: Start Minikube Cluster

```bash
# Start multi-node Minikube cluster
minikube start \
  --nodes=3 \
  --cpus=2 \
  --memory=4096 \
  --driver=docker

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Verify nodes
kubectl get nodes
```

### Step 6: Install Dapr

```bash
# Initialize Dapr on Kubernetes
dapr init -k --runtime-version 1.14.0

# Wait for Dapr to be ready
dapr status -k

# Verify Dapr components
kubectl get pods -n dapr-system
```

### Step 7: Deploy Strimzi Kafka

```bash
# Create kafka namespace
kubectl create namespace kafka

# Install Strimzi operator
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Wait for operator to be ready
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

# Deploy Kafka cluster
cat <<EOF | kubectl apply -f -
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
    config:
      offsets.topic.replication.factor: 1
      transaction.state.log.replication.factor: 1
      transaction.state.log.min.isr: 1
  zookeeper:
    replicas: 1
    storage:
      type: ephemeral
EOF

# Wait for Kafka to be ready
kubectl wait kafka/evolution-kafka --for=condition=Ready --timeout=300s -n kafka

# Create topics
kubectl apply -f specs/002-phase-5-cloud-deploy/contracts/dapr-components.yaml
```

### Step 8: Deploy Dapr Components

```bash
# Create todo-app namespace
kubectl create namespace todo-app

# Create secrets for Neon database
kubectl create secret generic neon-credentials \
  --from-literal=connection_string="postgresql://..." \
  -n todo-app

# Apply Dapr components
kubectl apply -f dapr-components/ -n todo-app

# Verify components
dapr components -k -n todo-app
```

### Step 9: Build and Deploy Application

```bash
# Configure Docker to use Minikube's daemon
eval $(minikube docker-env)

# Build images
docker build -t evolution-todo/backend:latest ./backend
docker build -t evolution-todo/frontend:latest ./frontend
docker build -t evolution-todo/mcp-server:latest ./backend -f ./backend/Dockerfile.mcp
docker build -t evolution-todo/notification-service:latest ./services/notification-service
docker build -t evolution-todo/recurring-task-service:latest ./services/recurring-task-service
docker build -t evolution-todo/audit-service:latest ./services/audit-service
docker build -t evolution-todo/websocket-service:latest ./services/websocket-service

# Deploy with Helm
helm upgrade --install evolution-todo ./helm/todo-app \
  -n todo-app \
  --create-namespace \
  -f ./helm/todo-app/values.yaml

# Reset Docker environment
eval $(minikube docker-env --unset)
```

### Step 10: Access Application

```bash
# Get Minikube IP
minikube ip

# Port forward services (alternative to Ingress)
kubectl port-forward svc/frontend 3000:3000 -n todo-app &
kubectl port-forward svc/backend 8000:8000 -n todo-app &
kubectl port-forward svc/websocket-service 8005:8005 -n todo-app &

# Or use Minikube tunnel for LoadBalancer services
minikube tunnel

# Access application
open http://localhost:3000
```

### Step 11: Verify Event Flow

```bash
# Check Dapr sidecar logs
kubectl logs -l app=backend -c daprd -n todo-app

# Check consumer service logs
kubectl logs -l app=notification-service -n todo-app
kubectl logs -l app=recurring-task-service -n todo-app
kubectl logs -l app=audit-service -n todo-app

# View Kafka topics (using Strimzi CLI)
kubectl exec -it evolution-kafka-kafka-0 -n kafka -- \
  bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# View messages in topic
kubectl exec -it evolution-kafka-kafka-0 -n kafka -- \
  bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning \
  --max-messages 5
```

---

## Part C: Cloud Deployment Setup

### Step 12: DigitalOcean Setup

```bash
# Login to DigitalOcean
doctl auth init

# Create DOKS cluster
doctl kubernetes cluster create evolution-todo \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --count 3 \
  --tag evolution-todo

# Get kubeconfig
doctl kubernetes cluster kubeconfig save evolution-todo

# Verify cluster
kubectl get nodes

# Create container registry
doctl registry create evolution-todo-registry

# Login to registry
doctl registry login
```

### Step 13: Install Dapr on DOKS

```bash
# Initialize Dapr on DOKS
dapr init -k --runtime-version 1.14.0

# Verify
dapr status -k
```

### Step 14: Configure Redpanda Cloud

1. Sign up at [Redpanda Cloud](https://redpanda.com/redpanda-cloud)
2. Create a serverless cluster
3. Create topics: `task-events`, `reminders`, `task-updates`
4. Get connection credentials (brokers, username, password)

```bash
# Create Redpanda credentials secret
kubectl create secret generic redpanda-credentials \
  --from-literal=brokers="seed-xxxxxxxx.redpanda.com:9092" \
  --from-literal=username="your-username" \
  --from-literal=password="your-password" \
  -n todo-app
```

### Step 15: Configure GitHub Actions

1. Add repository secrets in GitHub Settings > Secrets:
   - `DIGITALOCEAN_ACCESS_TOKEN`: Your DO API token
   - `REGISTRY_NAME`: `evolution-todo-registry`
   - `NEON_DATABASE_URL`: Your Neon connection string
   - `REDPANDA_BROKERS`: Your Redpanda brokers
   - `REDPANDA_USERNAME`: Your Redpanda username
   - `REDPANDA_PASSWORD`: Your Redpanda password

2. Push to main branch to trigger deployment:

```bash
git add .
git commit -m "feat: Phase 5 implementation"
git push origin main
```

### Step 16: Install cert-manager and Configure TLS

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### Step 17: Deploy Monitoring Stack

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus + Grafana
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin

# Port forward Grafana
kubectl port-forward svc/monitoring-grafana 3001:80 -n monitoring

# Access Grafana at http://localhost:3001 (admin/admin)
```

---

## Verification Checklist

### Part A: Advanced Features

- [ ] Create task with priority (high/medium/low)
- [ ] Create and assign tags to tasks
- [ ] Set due date on task
- [ ] Schedule reminder for task
- [ ] Create recurring task (daily/weekly/monthly)
- [ ] Search tasks by keyword
- [ ] Filter tasks by priority/tags/due date
- [ ] Sort tasks by various fields

### Part B: Event-Driven Architecture

- [ ] Task create publishes to `task-events` topic
- [ ] Recurring task completion creates next occurrence
- [ ] Reminder fires at scheduled time
- [ ] Notification delivered to WebSocket clients
- [ ] Audit service logs all task events
- [ ] Real-time sync across browser tabs

### Part C: Cloud Deployment

- [ ] GitHub Actions CI passes on PR
- [ ] Images pushed to DOCR on merge
- [ ] Helm deployment succeeds on DOKS
- [ ] Application accessible via cloud URL
- [ ] TLS/SSL configured with cert-manager
- [ ] Prometheus/Grafana showing metrics

---

## Troubleshooting

### Common Issues

**Dapr sidecar not injecting**:
```bash
# Check Dapr annotations on deployment
kubectl get deployment backend -n todo-app -o yaml | grep -A 5 annotations

# Ensure namespace has Dapr injection enabled
kubectl label namespace todo-app dapr.io/injection=enabled
```

**Kafka connection issues**:
```bash
# Check Kafka cluster status
kubectl get kafka -n kafka

# Check Kafka pods
kubectl get pods -n kafka

# Test connectivity
kubectl run kafka-test --rm -it --image=bitnami/kafka -- \
  kafka-console-producer.sh --broker-list evolution-kafka-kafka-bootstrap.kafka:9092 --topic test
```

**Database connection issues**:
```bash
# Check Neon connection string
kubectl get secret neon-credentials -n todo-app -o jsonpath='{.data.connection_string}' | base64 -d

# Test connection from pod
kubectl exec -it deployment/backend -n todo-app -- python -c "import asyncpg; print('OK')"
```

**WebSocket not connecting**:
```bash
# Check WebSocket service logs
kubectl logs -l app=websocket-service -n todo-app

# Verify WebSocket service is running
kubectl get pods -l app=websocket-service -n todo-app
```

---

## Quick Reference

### Useful Commands

```bash
# View all pods
kubectl get pods -n todo-app

# View logs for service
kubectl logs -l app=backend -n todo-app -f

# Restart deployment
kubectl rollout restart deployment/backend -n todo-app

# Dapr dashboard
dapr dashboard -k

# Minikube dashboard
minikube dashboard

# Helm status
helm status evolution-todo -n todo-app

# Helm rollback
helm rollback evolution-todo 1 -n todo-app
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js UI |
| Backend | 8000 | FastAPI |
| MCP Server | 8001 | FastMCP |
| Notification | 8002 | Notifications |
| Recurring | 8003 | Recurring tasks |
| Audit | 8004 | Audit logs |
| WebSocket | 8005 | Real-time sync |
| Dapr Sidecar | 3500 | Dapr HTTP |

---

**Quickstart Version**: 1.0.0
**Created**: 2025-12-30
**Next Step**: Run `/sp.tasks` to generate implementation tasks
