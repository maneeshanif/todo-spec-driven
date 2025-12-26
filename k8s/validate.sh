#!/bin/bash
# Kubernetes Manifest Validation Script
# This script validates all manifests without applying them to the cluster

set -e

echo "======================================"
echo "Kubernetes Manifest Validation"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for pass/fail
PASS=0
FAIL=0

# Function to validate a manifest
validate_manifest() {
    local file=$1
    echo -n "Validating $file... "

    if kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        kubectl apply --dry-run=client -f "$file"
        ((FAIL++))
    fi
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

echo "Checking kubectl version..."
kubectl version --client --short
echo ""

# Validate all manifests
echo "Validating manifests..."
echo ""

for file in /home/maneeshanif/Desktop/code\ /python-prjs/claude-cli/todo-web-hackthon/k8s/*.yaml; do
    if [ -f "$file" ]; then
        validate_manifest "$file"
    fi
done

echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All manifests are valid!${NC}"
    exit 0
else
    echo -e "${RED}Some manifests failed validation${NC}"
    exit 1
fi
