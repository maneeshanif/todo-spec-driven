#!/bin/bash
#
# Verification script for Phase 5 Monitoring Stack
# Verifies that all monitoring components are deployed and accessible
#

set -e

NAMESPACE="todo-app"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Phase 5 Monitoring Stack Verification"
echo "=========================================="
echo ""

# Function to check if a pod is running
check_pod() {
    local component=$1
    local label=$2

    echo -n "Checking ${component}... "

    if kubectl get pods -n ${NAMESPACE} -l "${label}" --no-headers 2>/dev/null | grep -q "Running"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not Running${NC}"
        return 1
    fi
}

# Function to check if a service is accessible
check_service() {
    local service=$1
    local port=$2

    echo -n "Checking service ${service}:${port}... "

    if kubectl get svc -n ${NAMESPACE} ${service} --no-headers 2>/dev/null | grep -q "${service}"; then
        echo -e "${GREEN}✓ Service exists${NC}"
        return 0
    else
        echo -e "${RED}✗ Service not found${NC}"
        return 1
    fi
}

# Function to check if a configmap exists
check_configmap() {
    local configmap=$1

    echo -n "Checking ConfigMap ${configmap}... "

    if kubectl get configmap -n ${NAMESPACE} ${configmap} --no-headers 2>/dev/null | grep -q "${configmap}"; then
        echo -e "${GREEN}✓ ConfigMap exists${NC}"
        return 0
    else
        echo -e "${RED}✗ ConfigMap not found${NC}"
        return 1
    fi
}

echo "1. Checking Prometheus Deployment"
echo "----------------------------------"
check_pod "Prometheus" "app.kubernetes.io/component=prometheus"
check_service "evolution-todo-prometheus" "9090"
check_configmap "evolution-todo-prometheus-config"
check_configmap "evolution-todo-prometheus-rules"
echo ""

echo "2. Checking Grafana Deployment"
echo "-------------------------------"
check_pod "Grafana" "app.kubernetes.io/component=grafana"
check_service "evolution-todo-grafana" "3000"
check_configmap "evolution-todo-grafana-datasources"
check_configmap "evolution-todo-grafana-dashboards-config"
check_configmap "evolution-todo-grafana-dashboards"
echo ""

echo "3. Checking Dapr Dashboard"
echo "--------------------------"
check_pod "Dapr Dashboard" "app.kubernetes.io/component=dapr-dashboard"
check_service "evolution-todo-dapr-dashboard" "8080"
echo ""

echo "4. Checking Dapr Configuration"
echo "-------------------------------"
echo -n "Checking Dapr config... "
if kubectl get configuration -n ${NAMESPACE} todo-app-config --no-headers 2>/dev/null | grep -q "todo-app-config"; then
    echo -e "${GREEN}✓ Configuration exists${NC}"
else
    echo -e "${YELLOW}⚠ Configuration not found (will be created on deploy)${NC}"
fi
echo ""

echo "5. Checking Grafana Dashboards"
echo "-------------------------------"
echo -n "Checking pods.json dashboard... "
if [ -f "docs/grafana-dashboards/pods.json" ]; then
    echo -e "${GREEN}✓ File exists${NC}"
else
    echo -e "${RED}✗ File not found${NC}"
fi

echo -n "Checking kafka.json dashboard... "
if [ -f "docs/grafana-dashboards/kafka.json" ]; then
    echo -e "${GREEN}✓ File exists${NC}"
else
    echo -e "${RED}✗ File not found${NC}"
fi
echo ""

echo "6. Checking Alert Rules"
echo "-----------------------"
echo -n "Checking alert rules ConfigMap... "
if kubectl get configmap -n ${NAMESPACE} evolution-todo-prometheus-rules --no-headers 2>/dev/null | grep -q "evolution-todo-prometheus-rules"; then
    echo -e "${GREEN}✓ Alert rules configured${NC}"

    # Count alert rules
    rule_count=$(kubectl get configmap -n ${NAMESPACE} evolution-todo-prometheus-rules -o jsonpath='{.data.todo-app-alerts\.yaml}' 2>/dev/null | grep -c "alert:" || echo "0")
    echo "   Found ${rule_count} alert rules"
else
    echo -e "${YELLOW}⚠ Alert rules not configured (will be created on deploy)${NC}"
fi
echo ""

echo "7. Port-Forward Commands"
echo "------------------------"
echo "To access monitoring dashboards locally, run:"
echo ""
echo -e "${YELLOW}# Prometheus${NC}"
echo "kubectl port-forward -n ${NAMESPACE} svc/evolution-todo-prometheus 9090:9090"
echo "Open: http://localhost:9090"
echo ""
echo -e "${YELLOW}# Grafana${NC}"
echo "kubectl port-forward -n ${NAMESPACE} svc/evolution-todo-grafana 3000:3000"
echo "Open: http://localhost:3000 (admin/admin)"
echo ""
echo -e "${YELLOW}# Dapr Dashboard${NC}"
echo "kubectl port-forward -n ${NAMESPACE} svc/evolution-todo-dapr-dashboard 8080:8080"
echo "Open: http://localhost:8080"
echo ""

echo "8. Quick Health Check"
echo "---------------------"

# Check if metrics endpoint is accessible
echo -n "Testing Prometheus metrics endpoint... "
if kubectl exec -n ${NAMESPACE} deployment/evolution-todo-prometheus -- wget -q -O- http://localhost:9090/-/healthy 2>/dev/null | grep -q "Prometheus is Healthy"; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${YELLOW}⚠ Unable to verify (pod may not be running yet)${NC}"
fi

echo -n "Testing Grafana health endpoint... "
if kubectl exec -n ${NAMESPACE} deployment/evolution-todo-grafana -- wget -q -O- http://localhost:3000/api/health 2>/dev/null | grep -q "ok"; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${YELLOW}⚠ Unable to verify (pod may not be running yet)${NC}"
fi
echo ""

echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Deploy/upgrade Helm chart: helm upgrade --install evolution-todo ./helm/todo-app -n ${NAMESPACE} --create-namespace"
echo "2. Wait for pods to be ready: kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n ${NAMESPACE} --timeout=300s"
echo "3. Access dashboards using port-forward commands above"
echo "4. Check logs: kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=prometheus"
echo ""
