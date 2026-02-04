#!/bin/bash
##############################################################################
# Rebuild Docker Images (force rebuild)
##############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=============================================="
echo "  TaskWhisper - Rebuild Images"
echo "=============================================="
echo ""

# Check Minikube
if ! minikube status 2>/dev/null | grep -q "Running"; then
    echo "Minikube not running. Start it first."
    exit 1
fi

log_info "Connecting to Minikube Docker..."
eval $(minikube docker-env)

log_info "Building Frontend..."
docker build --no-cache -t todo-frontend:latest "$PROJECT_ROOT/frontend"
log_success "Frontend built"

log_info "Building Backend..."
docker build --no-cache -t todo-backend:latest "$PROJECT_ROOT/backend"
log_success "Backend built"

log_info "Building MCP Server..."
docker build --no-cache -f "$PROJECT_ROOT/backend/Dockerfile.mcp" -t todo-mcp-server:latest "$PROJECT_ROOT/backend"
log_success "MCP Server built"

eval $(minikube docker-env --unset)

log_info "Restarting deployments..."
kubectl rollout restart deployment -n todo-app

echo ""
log_success "Rebuild complete!"
echo ""
echo "Wait for pods to restart:"
echo "  kubectl get pods -n todo-app -w"
