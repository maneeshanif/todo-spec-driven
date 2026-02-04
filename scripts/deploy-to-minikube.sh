#!/bin/bash

##############################################################################
# Deploy Evolution Todo to Minikube
# Tests all Phase 5 features locally
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

log_info "====================================="
log_info "Deploy to Minikube"
log_info "====================================="

# Create namespace
log_info "Creating namespace..."
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -

# Create database secret (temporary for testing)
log_info "Creating database secret..."
kubectl create secret generic postgres-credentials \
  --from-literal=connection-string="postgresql://postgres:postgres@localhost:5432/evolution_todo" \
  --namespace todo-app \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy via Helm
log_info "Deploying application via Helm..."
helm upgrade --install evolution-todo ./helm/todo-app \
    --namespace todo-app \
    --set frontend.image.repository=evolution-todo/frontend \
    --set frontend.image.tag=latest \
    --set backend.image.repository=evolution-todo/backend \
    --set backend.image.tag=latest \
    --set backend.image.pullPolicy=Never \
    --set frontend.image.pullPolicy=Never \
    --set dapr.enabled=false \
    --set observability.metrics.enabled=true \
    --wait --timeout=5m

log_success "Deployment complete!"

# Show status
echo ""
log_info "====================================="
log_info "Deployment Status"
log_info "====================================="
kubectl get pods -n todo-app
echo ""
kubectl get svc -n todo-app

# Access instructions
echo ""
log_info "====================================="
log_info "Access Application"
log_info "====================================="
echo ""
echo "Frontend:"
echo "  minikube service evolution-todo-frontend -n todo-app"
echo ""
echo "Backend API:"
echo "  kubectl port-forward -n todo-app svc/evolution-todo-backend 8000:8000"
echo "  curl http://localhost:8000/health"
echo ""
echo "Prometheus:"
echo "  kubectl port-forward -n todo-app svc/evolution-todo-prometheus 9090:9090"
echo ""
echo "Grafana:"
echo "  kubectl port-forward -n todo-app svc/evolution-todo-grafana 3000:3000"
echo ""

log_success "Ready for testing!"

