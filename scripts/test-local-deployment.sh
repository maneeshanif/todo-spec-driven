#!/bin/bash

##############################################################################
# Local Deployment Test Script
# Tests Phase 5 features on Minikube
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_ROOT="/home/maneeshanif/Desktop/code /python-prjs/claude-cli/todo-web-hackthon"

log_info "====================================="
log_info "Phase 5 Local Deployment Test"
log_info "====================================="
echo ""

# Step 1: Check Minikube
log_info "Checking Minikube status..."
if ! minikube status > /dev/null 2>&1; then
    log_error "Minikube is not running. Start it with: minikube start"
    exit 1
fi
log_success "Minikube is running"

# Step 2: Configure Docker for Minikube
log_info "Configuring Docker to use Minikube..."
eval $(minikube docker-env)
log_success "Docker configured for Minikube"

# Step 3: Build Docker images
log_info "Building Docker images..."

# Backend
log_info "Building backend image..."
cd "$PROJECT_ROOT/backend"
if [ -f Dockerfile ]; then
    docker build -t evolution-todo/backend:latest .
    log_success "Backend image built"
else
    log_warn "Backend Dockerfile not found, skipping..."
fi

# Frontend
log_info "Building frontend image..."
cd "$PROJECT_ROOT/frontend"
if [ -f Dockerfile ]; then
    docker build -t evolution-todo/frontend:latest .
    log_success "Frontend image built"
else
    log_warn "Frontend Dockerfile not found, skipping..."
fi

# MCP Server (if separate)
if [ -d "$PROJECT_ROOT/mcp-server" ]; then
    log_info "Building MCP server image..."
    cd "$PROJECT_ROOT/mcp-server"
    if [ -f Dockerfile ]; then
        docker build -t evolution-todo/mcp-server:latest .
        log_success "MCP server image built"
    fi
fi

cd "$PROJECT_ROOT"

# Step 4: Create namespace
log_info "Creating todo-app namespace..."
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -
log_success "Namespace ready"

# Step 5: Check Kafka status
log_info "Checking Kafka cluster..."
if kubectl get kafka todo-kafka-cluster -n kafka > /dev/null 2>&1; then
    KAFKA_READY=$(kubectl get kafka todo-kafka-cluster -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$KAFKA_READY" == "True" ]; then
        log_success "Kafka cluster is ready"
    else
        log_warn "Kafka cluster is not ready yet. Event-driven features may not work."
    fi
else
    log_warn "Kafka cluster not found. Deploying without Kafka..."
fi

# Step 6: Deploy via Helm (dry-run first)
log_info "Testing Helm deployment (dry-run)..."
helm upgrade --install evolution-todo ./helm/todo-app \
    --namespace todo-app \
    --set frontend.image.repository=evolution-todo/frontend \
    --set frontend.image.tag=latest \
    --set backend.image.repository=evolution-todo/backend \
    --set backend.image.tag=latest \
    --set dapr.enabled=false \
    --dry-run

log_success "Helm dry-run successful"

# Step 7: Actual deployment
log_info "Deploying application to Minikube..."
helm upgrade --install evolution-todo ./helm/todo-app \
    --namespace todo-app \
    --set frontend.image.repository=evolution-todo/frontend \
    --set frontend.image.tag=latest \
    --set backend.image.repository=evolution-todo/backend \
    --set backend.image.tag=latest \
    --set dapr.enabled=false \
    --create-namespace

log_success "Application deployed!"

# Step 8: Wait for pods
log_info "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all -n todo-app --timeout=180s || true

# Step 9: Show status
echo ""
log_info "====================================="
log_info "Deployment Status"
log_info "====================================="
kubectl get pods -n todo-app
echo ""
kubectl get svc -n todo-app
echo ""

# Step 10: Get access URLs
log_info "====================================="
log_info "Access URLs"
log_info "====================================="
log_info "To access the application, run:"
echo ""
echo "  Frontend:"
echo "  minikube service evolution-todo-frontend -n todo-app"
echo ""
echo "  Backend:"
echo "  kubectl port-forward -n todo-app svc/evolution-todo-backend 8000:8000"
echo ""
echo "  View logs:"
echo "  kubectl logs -n todo-app -l app=backend -f"
echo ""

log_success "Deployment complete!"

