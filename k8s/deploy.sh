#!/bin/bash
# Kubernetes Deployment Script for Evolution of Todo
# This script deploys all manifests to Minikube in the correct order

set -e

echo "======================================"
echo "Evolution of Todo - K8s Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if Minikube is running
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}Warning: Cannot connect to Kubernetes cluster${NC}"
    echo "Make sure Minikube is running: minikube start"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is installed${NC}"
echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
echo ""

# Function to apply and verify
apply_manifest() {
    local file=$1
    local resource=$2

    echo "Applying $file..."
    kubectl apply -f "$file"

    if [ -n "$resource" ]; then
        echo "Waiting for $resource to be ready..."
        kubectl wait --for=condition=available --timeout=60s "$resource" -n todo-app 2>/dev/null || true
    fi
    echo ""
}

# Step 1: Create namespace
echo -e "${YELLOW}Step 1: Creating namespace${NC}"
apply_manifest "00-namespace.yaml"

# Step 2: Create ConfigMap
echo -e "${YELLOW}Step 2: Creating ConfigMap${NC}"
apply_manifest "01-configmap.yaml"

# Step 3: Handle Secrets
echo -e "${YELLOW}Step 3: Creating Secrets${NC}"
echo -e "${RED}IMPORTANT: Make sure you've configured secrets in 02-secret.yaml${NC}"
echo -e "${RED}Or created them using kubectl create secret${NC}"
read -p "Have you configured the secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled. Please configure secrets first.${NC}"
    echo "See README.md for instructions on configuring secrets."
    exit 1
fi
apply_manifest "02-secret.yaml"

# Step 4: Deploy MCP Server
echo -e "${YELLOW}Step 4: Deploying MCP Server${NC}"
apply_manifest "03-mcp-server-deployment.yaml" "deployment/mcp-server"
apply_manifest "04-mcp-server-service.yaml"

# Step 5: Deploy Backend
echo -e "${YELLOW}Step 5: Deploying Backend${NC}"
apply_manifest "05-backend-deployment.yaml" "deployment/backend"
apply_manifest "06-backend-service.yaml"

# Step 6: Deploy Frontend
echo -e "${YELLOW}Step 6: Deploying Frontend${NC}"
apply_manifest "07-frontend-deployment.yaml" "deployment/frontend"
apply_manifest "08-frontend-service.yaml"

# Summary
echo "======================================"
echo "Deployment Summary"
echo "======================================"
echo ""

# Show all resources
kubectl get all -n todo-app

echo ""
echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "1. Check pod status:"
echo "   kubectl get pods -n todo-app"
echo ""
echo "2. View logs:"
echo "   kubectl logs -f deployment/backend -n todo-app"
echo "   kubectl logs -f deployment/frontend -n todo-app"
echo "   kubectl logs -f deployment/mcp-server -n todo-app"
echo ""
echo "3. Access the application:"
echo "   minikube service frontend -n todo-app"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
