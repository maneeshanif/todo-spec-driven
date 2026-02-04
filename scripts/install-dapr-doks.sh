#!/bin/bash

##############################################################################
# Dapr Installation Script for DOKS
#
# Purpose: Install Dapr runtime on DigitalOcean Kubernetes cluster
# Phase: Phase 5 - Cloud Deployment
# Task: T145
#
# Prerequisites:
#   - DOKS cluster running
#   - kubectl configured for target cluster
#   - dapr CLI installed
##############################################################################

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

log_info "Installing Dapr on DOKS cluster..."

# Check prerequisites
if ! command -v dapr &> /dev/null; then
    log_warn "Dapr CLI not installed. Installing..."
    wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
fi

if ! command -v kubectl &> /dev/null; then
    echo "kubectl not installed. Please install it first."
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "Not connected to a Kubernetes cluster. Please configure kubectl."
    exit 1
fi

log_info "Current cluster: $(kubectl config current-context)"

# Install Dapr
log_info "Installing Dapr runtime components..."
dapr init -k --wait --timeout 600

# Verify installation
log_info "Verifying Dapr installation..."
dapr status -k

# Check Dapr components
log_info "Dapr components running:"
kubectl get pods -n dapr-system

log_success "Dapr installation complete!"
log_info "You can now deploy Dapr-enabled applications."

