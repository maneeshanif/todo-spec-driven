#!/bin/bash
##############################################################################
# Start All Local Development Services
# Checks existing resources before creating new ones
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_skip() { echo -e "${YELLOW}[SKIP]${NC} $1 (already exists)"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments
MODE="${1:-start}"
FORCE_REBUILD=false
[[ "$1" == "--rebuild" ]] && FORCE_REBUILD=true
[[ "$1" == "--install" ]] && MODE="install"
[[ "$1" == "--quick" ]] && MODE="quick"
[[ "$1" == "--help" ]] && MODE="help"

if [[ "$MODE" == "help" ]]; then
    echo "Usage: ./start-all.sh [option]"
    echo ""
    echo "Options:"
    echo "  (none)      - Start with checks (skip existing)"
    echo "  --install   - Fresh install (force reinstall everything)"
    echo "  --rebuild   - Rebuild Docker images only"
    echo "  --quick     - Quick start (skip infrastructure)"
    echo "  --help      - Show this help"
    exit 0
fi

# Database credentials
DB_USER="postgres"
DB_PASS="postgres123"
DB_NAME="evolution_todo"

echo "=============================================="
echo "  TaskWhisper - Local Development Startup"
echo "=============================================="
echo ""

# 1. Check/Start Minikube
log_info "Checking Minikube..."
if minikube status 2>/dev/null | grep -q "Running"; then
    log_skip "Minikube already running"
else
    log_info "Starting Minikube cluster..."
    minikube start --cpus=2 --memory=5000 --driver=docker
    log_success "Minikube started"
fi

# 2. Enable addons
log_info "Checking addons..."
minikube addons enable ingress 2>/dev/null || true
minikube addons enable metrics-server 2>/dev/null || true
minikube addons enable dashboard 2>/dev/null || true
log_success "Addons ready"

# 3. Create namespaces
log_info "Checking namespaces..."
for ns in todo-app kafka dapr-system monitoring database; do
    if kubectl get namespace $ns &>/dev/null; then
        log_skip "Namespace $ns"
    else
        kubectl create namespace $ns
        log_success "Created namespace $ns"
    fi
done

# 4. Deploy PostgreSQL
log_info "Checking PostgreSQL..."
if kubectl get deployment postgres -n database &>/dev/null; then
    log_skip "PostgreSQL"
else
    log_info "Deploying PostgreSQL..."
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: database
type: Opaque
stringData:
  POSTGRES_USER: "$DB_USER"
  POSTGRES_PASSWORD: "$DB_PASS"
  POSTGRES_DB: "$DB_NAME"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: database
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        envFrom:
        - secretRef:
            name: postgres-secret
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: database
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
EOF
    log_info "Waiting for PostgreSQL..."
    kubectl wait --for=condition=ready pod -l app=postgres -n database --timeout=120s 2>/dev/null || true
    log_success "PostgreSQL deployed"
fi

# 5. Deploy Adminer (DB UI)
log_info "Checking Adminer..."
if kubectl get deployment adminer -n database &>/dev/null; then
    log_skip "Adminer"
else
    log_info "Deploying Adminer..."
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adminer
  namespace: database
spec:
  replicas: 1
  selector:
    matchLabels:
      app: adminer
  template:
    metadata:
      labels:
        app: adminer
    spec:
      containers:
      - name: adminer
        image: adminer:latest
        ports:
        - containerPort: 8080
        env:
        - name: ADMINER_DEFAULT_SERVER
          value: "postgres.database.svc.cluster.local"
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: adminer
  namespace: database
spec:
  selector:
    app: adminer
  ports:
  - port: 8080
    targetPort: 8080
EOF
    log_success "Adminer deployed"
fi

# Skip heavy infrastructure for --quick mode
if [[ "$MODE" == "quick" ]]; then
    log_warn "Quick mode: Skipping Dapr, Kafka, and Monitoring"
else

# 6. Install Dapr
log_info "Checking Dapr..."
if kubectl get pods -n dapr-system 2>/dev/null | grep -q "dapr-operator"; then
    log_skip "Dapr already installed"
else
    log_info "Installing Dapr..."
    dapr init -k --wait || log_warn "Dapr init failed"
    log_success "Dapr installed"
fi

# 7. Install Strimzi Kafka Operator
log_info "Checking Strimzi operator..."
if kubectl get pods -n kafka 2>/dev/null | grep -q "strimzi-cluster-operator"; then
    log_skip "Strimzi operator"
else
    log_info "Installing Strimzi operator..."
    kubectl apply -f "$PROJECT_ROOT/k8s/kafka/strimzi-operator.yaml" -n kafka 2>/dev/null || \
    kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
    log_info "Waiting for Strimzi operator..."
    kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=120s 2>/dev/null || true
    log_success "Strimzi installed"
fi

# 8. Deploy Kafka Cluster
log_info "Checking Kafka cluster..."
if kubectl get kafka evolution-kafka -n kafka &>/dev/null; then
    log_skip "Kafka cluster"
else
    log_info "Deploying Kafka cluster..."
    kubectl apply -f "$PROJECT_ROOT/k8s/kafka/kafka-cluster-simple.yaml" -n kafka 2>/dev/null || \
    kubectl apply -f "$PROJECT_ROOT/k8s/kafka/kafka-cluster.yaml" -n kafka
    log_info "Waiting for Kafka (2-3 minutes)..."
    sleep 30
    kubectl wait kafka/evolution-kafka --for=condition=Ready -n kafka --timeout=300s 2>/dev/null || log_warn "Kafka still starting"
    log_success "Kafka deployed"
fi

# 9. Create Kafka Topics
log_info "Checking Kafka topics..."
if kubectl get kafkatopic task-events -n kafka &>/dev/null; then
    log_skip "Kafka topics"
else
    kubectl apply -f "$PROJECT_ROOT/k8s/kafka/kafka-topics.yaml" -n kafka 2>/dev/null || true
    log_success "Kafka topics created"
fi

# 10. Install Prometheus & Grafana
log_info "Checking monitoring stack..."
if helm list -n monitoring 2>/dev/null | grep -q "prometheus"; then
    log_skip "Prometheus/Grafana"
else
    log_info "Installing monitoring stack..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
    helm repo update
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set grafana.adminPassword=admin \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --wait --timeout=5m 2>/dev/null || log_warn "Prometheus may need retry"
    log_success "Monitoring installed"
fi

fi  # End of quick mode skip

# 11. Build Docker images
log_info "Building Docker images..."
eval $(minikube docker-env)

if [[ "$FORCE_REBUILD" == "true" || "$MODE" == "install" ]]; then
    log_info "Force rebuilding all images..."
    docker build -t todo-frontend:latest "$PROJECT_ROOT/frontend" && log_success "Frontend built" || log_warn "Frontend build failed"
    docker build -t todo-backend:latest "$PROJECT_ROOT/backend" && log_success "Backend built" || log_warn "Backend build failed"
    docker build -f "$PROJECT_ROOT/backend/Dockerfile.mcp" -t todo-mcp-server:latest "$PROJECT_ROOT/backend" && log_success "MCP built" || log_warn "MCP build failed"
else
    if docker images | grep -q "todo-frontend.*latest"; then
        log_skip "Frontend image"
    else
        docker build -t todo-frontend:latest "$PROJECT_ROOT/frontend" 2>/dev/null && log_success "Frontend built" || log_warn "Frontend build failed"
    fi

    if docker images | grep -q "todo-backend.*latest"; then
        log_skip "Backend image"
    else
        docker build -t todo-backend:latest "$PROJECT_ROOT/backend" 2>/dev/null && log_success "Backend built" || log_warn "Backend build failed"
    fi

    if docker images | grep -q "todo-mcp-server.*latest"; then
        log_skip "MCP image"
    else
        docker build -f "$PROJECT_ROOT/backend/Dockerfile.mcp" -t todo-mcp-server:latest "$PROJECT_ROOT/backend" 2>/dev/null && log_success "MCP built" || log_warn "MCP build failed"
    fi
fi

eval $(minikube docker-env --unset)

# 12. Deploy Application
log_info "Checking application deployment..."

if [[ "$MODE" == "install" ]]; then
    log_info "Force reinstalling application..."
    helm uninstall todo-app -n todo-app 2>/dev/null || true
    sleep 5
fi

if [[ "$MODE" == "install" ]] || ! helm list -n todo-app 2>/dev/null | grep -q "todo-app"; then
    log_info "Deploying application..."
    helm upgrade --install todo-app "$PROJECT_ROOT/helm/todo-app" \
        --namespace todo-app \
        --set frontend.image.pullPolicy=Never \
        --set backend.image.pullPolicy=Never \
        --set mcpServer.image.pullPolicy=Never \
        --set secrets.databaseUrl="postgresql+asyncpg://$DB_USER:$DB_PASS@postgres.database.svc.cluster.local:5432/$DB_NAME" \
        --wait --timeout=5m 2>/dev/null || log_warn "Helm deploy may need secrets"
    log_success "Application deployed"
else
    log_skip "Application (use --install to force reinstall)"
fi

# 13. Apply Dapr components
if [[ "$MODE" != "quick" ]]; then
    log_info "Applying Dapr components..."
    kubectl apply -f "$PROJECT_ROOT/dapr-components/" -n todo-app 2>/dev/null || true
    log_success "Dapr components applied"
fi

echo ""
echo "=============================================="
log_success "Local Environment Ready!"
echo "=============================================="
echo ""
echo "Database Credentials:"
echo "  Host: postgres.database.svc.cluster.local"
echo "  Port: 5432"
echo "  User: $DB_USER"
echo "  Pass: $DB_PASS"
echo "  DB:   $DB_NAME"
echo ""
echo "Next: ./scripts/local-dev/dashboards.sh"
echo ""
