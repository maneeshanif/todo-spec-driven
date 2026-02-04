#!/bin/bash
##############################################################################
# Check Status of All Services
##############################################################################

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=============================================="
echo "  TaskWhisper - System Status"
echo "=============================================="
echo ""

# Minikube
echo -e "${BLUE}[Minikube]${NC}"
if minikube status 2>/dev/null | grep -q "Running"; then
    echo -e "  ${GREEN}✓${NC} Running (IP: $(minikube ip 2>/dev/null))"
else
    echo -e "  ${RED}✗${NC} Not running"
    echo "  Run: ./scripts/local-dev/start-all.sh"
    exit 1
fi
echo ""

# Namespaces
echo -e "${BLUE}[Namespaces]${NC}"
for ns in todo-app kafka dapr-system monitoring; do
    if kubectl get namespace $ns &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $ns"
    else
        echo -e "  ${RED}✗${NC} $ns"
    fi
done
echo ""

# Database
echo -e "${BLUE}[Database]${NC}"
if kubectl get pod -l app=postgres -n todo-app &>/dev/null; then
    POD_STATUS=$(kubectl get pod -l app=postgres -n todo-app -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
    if [ "$POD_STATUS" == "Running" ]; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL running"
    else
        echo -e "  ${YELLOW}○${NC} PostgreSQL: $POD_STATUS"
    fi
else
    echo -e "  ${RED}✗${NC} PostgreSQL not deployed"
fi

if kubectl get pod -l app=adminer -n todo-app &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Adminer running"
else
    echo -e "  ${RED}✗${NC} Adminer not deployed"
fi
echo ""

# Application Pods
echo -e "${BLUE}[Application Pods]${NC}"
kubectl get pods -n todo-app -l app.kubernetes.io/instance=evolution-todo 2>/dev/null || echo "  No app pods"
echo ""

# Kafka
echo -e "${BLUE}[Kafka]${NC}"
if kubectl get kafka -n kafka &>/dev/null; then
    KAFKA_NAME=$(kubectl get kafka -n kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    STATUS=$(kubectl get kafka $KAFKA_NAME -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
    if [ "$STATUS" == "True" ]; then
        echo -e "  ${GREEN}✓${NC} Kafka cluster ready ($KAFKA_NAME)"
    else
        echo -e "  ${YELLOW}○${NC} Kafka cluster starting..."
    fi
else
    echo -e "  ${RED}✗${NC} Kafka not deployed"
fi
kubectl get pods -n kafka 2>/dev/null | head -5
echo ""

# Dapr
echo -e "${BLUE}[Dapr]${NC}"
DAPR_PODS=$(kubectl get pods -n dapr-system --no-headers 2>/dev/null | wc -l)
if [ "$DAPR_PODS" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Dapr running ($DAPR_PODS pods)"
else
    echo -e "  ${RED}✗${NC} Dapr not installed"
fi
echo ""

# Monitoring
echo -e "${BLUE}[Monitoring]${NC}"
if helm list -n monitoring 2>/dev/null | grep -q "monitoring"; then
    echo -e "  ${GREEN}✓${NC} Prometheus/Grafana installed"
else
    echo -e "  ${RED}✗${NC} Monitoring not installed"
fi
echo ""

# Port Forwards
echo -e "${BLUE}[Active Port Forwards]${NC}"
PF_COUNT=$(pgrep -f "kubectl port-forward" 2>/dev/null | wc -l)
if [ "$PF_COUNT" -gt 0 ]; then
    echo "  $PF_COUNT active port-forwards"
    echo ""
    echo "  Checking ports:"
    for port in 3000 8000 8001 3001 9090 8080 9999 5432 8082; do
        if lsof -i :$port &>/dev/null; then
            echo -e "    ${GREEN}✓${NC} :$port in use"
        else
            echo -e "    ${YELLOW}○${NC} :$port free"
        fi
    done
else
    echo "  No port-forwards active"
    echo "  Run: ./scripts/local-dev/dashboards.sh"
fi
echo ""

# Kafka Topics
echo -e "${BLUE}[Kafka Topics]${NC}"
kubectl get kafkatopics -n kafka --no-headers 2>/dev/null || echo "  No topics"
echo ""

# Dapr Components
echo -e "${BLUE}[Dapr Components]${NC}"
kubectl get components -n todo-app --no-headers 2>/dev/null || echo "  No components"
echo ""

# Database Connection String
echo -e "${BLUE}[Database Connection]${NC}"
echo "  postgresql://postgres:postgres@localhost:5432/todo"
echo ""

echo "=============================================="
