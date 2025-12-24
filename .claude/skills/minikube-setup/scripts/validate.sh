#!/bin/bash
# Minikube Setup Validation Script

set -e

echo "=== Minikube Setup Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check minikube installation
echo "Checking minikube installation..."
if command -v minikube &> /dev/null; then
    MINIKUBE_VERSION=$(minikube version --short 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} minikube installed: $MINIKUBE_VERSION"
else
    echo -e "${RED}✗${NC} minikube not installed"
    echo "  Install: https://minikube.sigs.k8s.io/docs/start/"
    ERRORS=$((ERRORS + 1))
fi

# Check kubectl installation
echo "Checking kubectl installation..."
if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client -o json 2>/dev/null | grep gitVersion | head -1 | cut -d'"' -f4 || echo "unknown")
    echo -e "${GREEN}✓${NC} kubectl installed: $KUBECTL_VERSION"
else
    echo -e "${YELLOW}!${NC} kubectl not installed (minikube includes kubectl)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Docker installation (for docker driver)
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    if docker info &> /dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version)
        echo -e "${GREEN}✓${NC} Docker available: $DOCKER_VERSION"
    else
        echo -e "${YELLOW}!${NC} Docker installed but daemon not running"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}!${NC} Docker not installed (required for docker driver)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check minikube status
echo ""
echo "Checking minikube cluster status..."
if minikube status &> /dev/null 2>&1; then
    STATUS=$(minikube status --format='{{.Host}}' 2>/dev/null || echo "unknown")
    PROFILE=$(minikube profile 2>/dev/null || echo "default")

    echo -e "${GREEN}✓${NC} Cluster running (profile: $PROFILE)"

    # Get node count
    NODE_COUNT=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Nodes: $NODE_COUNT"

    # Check system pods
    READY_PODS=$(kubectl get pods -n kube-system --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} System pods running: $READY_PODS"

    # Check addons
    ENABLED_ADDONS=$(minikube addons list -o json 2>/dev/null | grep -c '"Status": "enabled"' || echo "0")
    echo -e "${GREEN}✓${NC} Enabled addons: $ENABLED_ADDONS"
else
    echo -e "${YELLOW}!${NC} No minikube cluster running"
    echo "  Start: minikube start --nodes=3 --cpus=2 --memory=4096"
fi

# List all profiles
echo ""
echo "Checking minikube profiles..."
if minikube profile list &> /dev/null 2>&1; then
    PROFILES=$(minikube profile list -o json 2>/dev/null | grep -c '"Name"' || echo "0")
    if [ "$PROFILES" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $PROFILES profile(s)"
        minikube profile list 2>/dev/null | head -10
    else
        echo -e "${YELLOW}!${NC} No profiles found"
    fi
else
    echo -e "${YELLOW}!${NC} Could not list profiles"
fi

# Check required resources
echo ""
echo "Checking system resources..."

# Memory check
TOTAL_MEM=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
if [ "$TOTAL_MEM" -gt 8000 ]; then
    echo -e "${GREEN}✓${NC} Memory: ${TOTAL_MEM}MB (sufficient for multi-node)"
elif [ "$TOTAL_MEM" -gt 4000 ]; then
    echo -e "${YELLOW}!${NC} Memory: ${TOTAL_MEM}MB (limited for multi-node)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗${NC} Memory: ${TOTAL_MEM}MB (insufficient)"
    ERRORS=$((ERRORS + 1))
fi

# CPU check
CPU_COUNT=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "0")
if [ "$CPU_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✓${NC} CPUs: $CPU_COUNT (sufficient)"
elif [ "$CPU_COUNT" -ge 2 ]; then
    echo -e "${YELLOW}!${NC} CPUs: $CPU_COUNT (limited)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}✗${NC} CPUs: $CPU_COUNT (insufficient)"
    ERRORS=$((ERRORS + 1))
fi

# Disk check
DISK_FREE=$(df -h . 2>/dev/null | awk 'NR==2 {print $4}' || echo "unknown")
echo -e "${GREEN}✓${NC} Disk free: $DISK_FREE"

# Check if ingress is enabled
echo ""
echo "Checking common addons..."
if minikube addons list &> /dev/null 2>&1; then
    ADDONS=("ingress" "dashboard" "metrics-server" "storage-provisioner")
    for addon in "${ADDONS[@]}"; do
        STATUS=$(minikube addons list 2>/dev/null | grep "$addon" | grep -c "enabled" || echo "0")
        if [ "$STATUS" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} $addon: enabled"
        else
            echo -e "${YELLOW}!${NC} $addon: disabled"
        fi
    done
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
