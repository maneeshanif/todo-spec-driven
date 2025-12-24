#!/bin/bash
# Kubernetes Deployment Validation Script

set -e

echo "=== Kubernetes Deployment Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check kubectl installation
echo "Checking kubectl installation..."
if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client -o json 2>/dev/null | jq -r '.clientVersion.gitVersion' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} kubectl installed: $KUBECTL_VERSION"
else
    echo -e "${RED}✗${NC} kubectl not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check minikube installation
echo "Checking minikube installation..."
if command -v minikube &> /dev/null; then
    MINIKUBE_VERSION=$(minikube version --short 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} minikube installed: $MINIKUBE_VERSION"
else
    echo -e "${YELLOW}!${NC} minikube not installed (optional for local dev)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check cluster connectivity
echo ""
echo "Checking cluster connectivity..."
if kubectl cluster-info &> /dev/null 2>&1; then
    CONTEXT=$(kubectl config current-context 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Connected to cluster: $CONTEXT"

    # Check nodes
    NODE_COUNT=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Nodes available: $NODE_COUNT"
else
    echo -e "${YELLOW}!${NC} No cluster connection (minikube may not be running)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for k8s manifests
echo ""
echo "Checking Kubernetes manifests..."

K8S_DIRS=("k8s" "kubernetes" "deploy/k8s")
K8S_FOUND=false

for dir in "${K8S_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Found manifests directory: $dir"
        K8S_FOUND=true

        # Check for kustomization
        if [ -f "$dir/kustomization.yaml" ] || [ -f "$dir/base/kustomization.yaml" ]; then
            echo -e "  ${GREEN}✓${NC} Kustomization file found"

            # Validate kustomize build
            if kubectl kustomize "$dir" &> /dev/null 2>&1 || kubectl kustomize "$dir/base" &> /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} Kustomization builds successfully"
            else
                echo -e "  ${RED}✗${NC} Kustomization build failed"
                ERRORS=$((ERRORS + 1))
            fi
        fi

        # Count manifest files
        YAML_COUNT=$(find "$dir" -name "*.yaml" -o -name "*.yml" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} YAML files found: $YAML_COUNT"
    fi
done

if [ "$K8S_FOUND" = false ]; then
    echo -e "${YELLOW}!${NC} No Kubernetes manifest directory found"
    WARNINGS=$((WARNINGS + 1))
fi

# Validate individual manifest files
echo ""
echo "Validating manifest syntax..."

if [ -d "k8s" ]; then
    for file in $(find k8s -name "*.yaml" -o -name "*.yml" 2>/dev/null | head -10); do
        if kubectl apply --dry-run=client -f "$file" &> /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Valid: $file"
        else
            echo -e "  ${YELLOW}!${NC} Could not validate: $file"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
fi

# Check required components
echo ""
echo "Checking required manifest types..."

REQUIRED_TYPES=("Deployment" "Service" "ConfigMap" "Secret" "Namespace")
for type in "${REQUIRED_TYPES[@]}"; do
    if grep -rq "kind: $type" k8s 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found: $type manifest"
    else
        echo -e "${YELLOW}!${NC} Missing: $type manifest"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# Check for environment-specific overlays
echo ""
echo "Checking environment overlays..."

OVERLAYS=("dev" "staging" "prod" "production")
for overlay in "${OVERLAYS[@]}"; do
    if [ -d "k8s/overlays/$overlay" ]; then
        echo -e "${GREEN}✓${NC} Found overlay: $overlay"
    fi
done

# Check Docker images
echo ""
echo "Checking Docker images..."

if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
    IMAGES=("evolution-todo/backend" "evolution-todo/frontend" "evolution-todo/mcp-server")
    for img in "${IMAGES[@]}"; do
        if docker image inspect "$img:latest" &> /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Image exists: $img:latest"
        else
            echo -e "${YELLOW}!${NC} Image not found: $img:latest (needs to be built)"
        fi
    done
else
    echo -e "${YELLOW}!${NC} Docker not available for image check"
fi

# Summary
echo ""
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s), 0 errors${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
