#!/bin/bash

##############################################################################
# DOKS Cluster Creation Script for Evolution of Todo Application
#
# Purpose: Automate DigitalOcean Kubernetes (DOKS) cluster creation
# Phase: Phase 5 - Cloud Deployment
# Task: T144
#
# Prerequisites:
#   - doctl CLI installed and configured
#   - DIGITALOCEAN_ACCESS_TOKEN environment variable set
#   - kubectl installed
#
# Usage:
#   ./scripts/create-doks-cluster.sh [environment]
#
# Arguments:
#   environment: staging | production (default: staging)
##############################################################################

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT="${1:-staging}"
PROJECT_NAME="evolution-todo"
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    CLUSTER_VERSION="1.31.1-do.0"  # Stable K8s version
    NODE_COUNT=3
    NODE_SIZE="s-4vcpu-8gb"  # 4 vCPU, 8GB RAM
    REGION="nyc3"  # New York (adjust based on your needs)
    MIN_NODES=3
    MAX_NODES=6
else
    # Staging configuration (smaller for cost savings)
    CLUSTER_VERSION="1.31.1-do.0"
    NODE_COUNT=2
    NODE_SIZE="s-2vcpu-4gb"  # 2 vCPU, 4GB RAM
    REGION="nyc3"
    MIN_NODES=2
    MAX_NODES=4
fi

log_info "================================================"
log_info "  DOKS Cluster Creation Script"
log_info "  Environment: ${ENVIRONMENT}"
log_info "  Cluster: ${CLUSTER_NAME}"
log_info "================================================"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v doctl &> /dev/null; then
    log_error "doctl CLI is not installed. Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed. Install from: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

if [ -z "${DIGITALOCEAN_ACCESS_TOKEN:-}" ]; then
    log_error "DIGITALOCEAN_ACCESS_TOKEN environment variable is not set."
    log_info "Get your token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Authenticate doctl
log_info "Authenticating with DigitalOcean..."
doctl auth init --access-token "${DIGITALOCEAN_ACCESS_TOKEN}" > /dev/null 2>&1

# Check if cluster already exists
log_info "Checking if cluster ${CLUSTER_NAME} already exists..."
if doctl kubernetes cluster get "${CLUSTER_NAME}" &> /dev/null; then
    log_warn "Cluster ${CLUSTER_NAME} already exists!"
    read -p "Do you want to delete and recreate it? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Deleting existing cluster..."
        doctl kubernetes cluster delete "${CLUSTER_NAME}" --force
        log_success "Cluster deleted."
        sleep 10
    else
        log_info "Using existing cluster."
        doctl kubernetes cluster kubeconfig save "${CLUSTER_NAME}"
        log_success "Kubeconfig updated for cluster ${CLUSTER_NAME}"
        exit 0
    fi
fi

# Create DOKS cluster
log_info "Creating DOKS cluster: ${CLUSTER_NAME}"
log_info "  - Version: ${CLUSTER_VERSION}"
log_info "  - Region: ${REGION}"
log_info "  - Nodes: ${NODE_COUNT} x ${NODE_SIZE}"
log_info "  - Auto-scaling: ${MIN_NODES}-${MAX_NODES} nodes"
echo ""

doctl kubernetes cluster create "${CLUSTER_NAME}" \
    --version "${CLUSTER_VERSION}" \
    --count "${NODE_COUNT}" \
    --size "${NODE_SIZE}" \
    --region "${REGION}" \
    --auto-upgrade=true \
    --maintenance-window "saturday=03:00" \
    --surge-upgrade=true \
    --ha=false \
    --wait \
    --verbose

if [ $? -ne 0 ]; then
    log_error "Failed to create DOKS cluster."
    exit 1
fi

log_success "DOKS cluster created successfully!"

# Configure kubectl
log_info "Configuring kubectl to use the new cluster..."
doctl kubernetes cluster kubeconfig save "${CLUSTER_NAME}"
log_success "Kubeconfig saved. Current context: ${CLUSTER_NAME}"

# Verify cluster
log_info "Verifying cluster..."
kubectl cluster-info
kubectl get nodes

# Enable autoscaling
log_info "Configuring autoscaling (${MIN_NODES}-${MAX_NODES} nodes)..."
doctl kubernetes cluster node-pool update "${CLUSTER_NAME}" \
    $(doctl kubernetes cluster node-pool list "${CLUSTER_NAME}" --format ID --no-header) \
    --auto-scale \
    --min-nodes "${MIN_NODES}" \
    --max-nodes "${MAX_NODES}"

log_success "Autoscaling configured."

# Create namespaces
log_info "Creating Kubernetes namespaces..."
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace kafka --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

log_success "Namespaces created: todo-app, kafka, monitoring"

# Install Dapr
log_info "Installing Dapr on DOKS cluster..."
if ! command -v dapr &> /dev/null; then
    log_warn "Dapr CLI not found. Please install manually: https://docs.dapr.io/getting-started/install-dapr-cli/"
else
    dapr init -k --wait --timeout 600
    if [ $? -eq 0 ]; then
        log_success "Dapr installed successfully!"
    else
        log_error "Failed to install Dapr. Install manually with: dapr init -k"
    fi
fi

# Summary
echo ""
log_success "================================================"
log_success "  DOKS Cluster Setup Complete!"
log_success "================================================"
echo ""
log_info "Cluster Details:"
log_info "  - Name: ${CLUSTER_NAME}"
log_info "  - Environment: ${ENVIRONMENT}"
log_info "  - Nodes: ${NODE_COUNT} x ${NODE_SIZE}"
log_info "  - Region: ${REGION}"
log_info "  - Autoscaling: ${MIN_NODES}-${MAX_NODES} nodes"
echo ""
log_info "Next Steps:"
log_info "  1. Deploy Strimzi Kafka operator:"
log_info "     kubectl apply -f k8s/kafka/strimzi-operator.yaml"
echo ""
log_info "  2. Deploy application via Helm:"
log_info "     helm upgrade --install evolution-todo ./helm/todo-app \\"
log_info "       -f helm/todo-app/values-${ENVIRONMENT}.yaml \\"
log_info "       -n todo-app"
echo ""
log_info "  3. Monitor deployment:"
log_info "     kubectl get pods -n todo-app -w"
echo ""
log_info "  4. Get LoadBalancer IP:"
log_info "     kubectl get svc -n todo-app"
echo ""
log_success "Cluster is ready for deployment!"
