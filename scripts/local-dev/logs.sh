#!/bin/bash
##############################################################################
# View Service Logs
# Usage: ./logs.sh [service] [--follow]
##############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVICE=${1:-all}
FOLLOW=""
[[ "$2" == "--follow" || "$2" == "-f" ]] && FOLLOW="-f"

# Get actual pod/deployment names
FRONTEND_DEP=$(kubectl get deployment -n todo-app -o name 2>/dev/null | grep frontend | head -1)
BACKEND_DEP=$(kubectl get deployment -n todo-app -o name 2>/dev/null | grep backend | head -1)
MCP_DEP=$(kubectl get deployment -n todo-app -o name 2>/dev/null | grep mcp | head -1)
KAFKA_POD=$(kubectl get pods -n kafka -l strimzi.io/kind=Kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

echo "=============================================="
echo "  TaskWhisper - Service Logs"
echo "=============================================="
echo ""

case $SERVICE in
    frontend)
        echo -e "${BLUE}[Frontend Logs]${NC}"
        kubectl logs $FRONTEND_DEP -n todo-app $FOLLOW 2>/dev/null || echo "Frontend not running"
        ;;
    backend)
        echo -e "${BLUE}[Backend Logs]${NC}"
        kubectl logs $BACKEND_DEP -n todo-app $FOLLOW 2>/dev/null || echo "Backend not running"
        ;;
    mcp)
        echo -e "${BLUE}[MCP Server Logs]${NC}"
        kubectl logs $MCP_DEP -n todo-app $FOLLOW 2>/dev/null || echo "MCP not running"
        ;;
    postgres|db)
        echo -e "${BLUE}[PostgreSQL Logs]${NC}"
        kubectl logs deployment/postgres -n todo-app $FOLLOW 2>/dev/null || echo "PostgreSQL not running"
        ;;
    adminer)
        echo -e "${BLUE}[Adminer Logs]${NC}"
        kubectl logs deployment/adminer -n todo-app $FOLLOW 2>/dev/null || echo "Adminer not running"
        ;;
    kafka)
        echo -e "${BLUE}[Kafka Logs]${NC}"
        if [ -n "$KAFKA_POD" ]; then
            kubectl logs $KAFKA_POD -n kafka $FOLLOW
        else
            echo "Kafka pod not found"
        fi
        ;;
    dapr)
        echo -e "${BLUE}[Dapr Sidecar Logs]${NC}"
        kubectl logs $BACKEND_DEP -n todo-app -c daprd $FOLLOW 2>/dev/null || \
        echo "No Dapr sidecar found"
        ;;
    notification)
        echo -e "${BLUE}[Notification Service Logs]${NC}"
        kubectl logs deployment/notification-service -n todo-app $FOLLOW 2>/dev/null || \
        echo "Notification service not deployed"
        ;;
    recurring)
        echo -e "${BLUE}[Recurring Task Service Logs]${NC}"
        kubectl logs deployment/recurring-task-service -n todo-app $FOLLOW 2>/dev/null || \
        echo "Recurring task service not deployed"
        ;;
    audit)
        echo -e "${BLUE}[Audit Service Logs]${NC}"
        kubectl logs deployment/audit-service -n todo-app $FOLLOW 2>/dev/null || \
        echo "Audit service not deployed"
        ;;
    websocket)
        echo -e "${BLUE}[WebSocket Service Logs]${NC}"
        kubectl logs deployment/websocket-service -n todo-app $FOLLOW 2>/dev/null || \
        echo "WebSocket service not deployed"
        ;;
    all)
        echo -e "${BLUE}[All Service Logs - Last 20 lines each]${NC}"
        echo ""
        echo "=== PostgreSQL ==="
        kubectl logs deployment/postgres -n database --tail=10 2>/dev/null || echo "Not running"
        echo ""
        echo "=== Frontend ==="
        kubectl logs $FRONTEND_DEP -n todo-app --tail=20 2>/dev/null || echo "Not running"
        echo ""
        echo "=== Backend ==="
        kubectl logs $BACKEND_DEP -n todo-app --tail=20 2>/dev/null || echo "Not running"
        echo ""
        echo "=== MCP Server ==="
        kubectl logs $MCP_DEP -n todo-app --tail=20 2>/dev/null || echo "Not running"
        echo ""
        echo "=== Notification Service ==="
        kubectl logs deployment/notification-service -n todo-app --tail=10 2>/dev/null || echo "Not deployed"
        echo ""
        echo "=== Recurring Task Service ==="
        kubectl logs deployment/recurring-task-service -n todo-app --tail=10 2>/dev/null || echo "Not deployed"
        echo ""
        echo "=== Audit Service ==="
        kubectl logs deployment/audit-service -n todo-app --tail=10 2>/dev/null || echo "Not deployed"
        echo ""
        echo "=== WebSocket Service ==="
        kubectl logs deployment/websocket-service -n todo-app --tail=10 2>/dev/null || echo "Not deployed"
        echo ""
        echo "=== Kafka ==="
        if [ -n "$KAFKA_POD" ]; then
            kubectl logs $KAFKA_POD -n kafka --tail=10 2>/dev/null
        else
            echo "Not running"
        fi
        ;;
    *)
        echo "Usage: ./logs.sh [service] [--follow]"
        echo ""
        echo "Services:"
        echo "  frontend     - Next.js frontend"
        echo "  backend      - FastAPI backend"
        echo "  mcp          - MCP server"
        echo "  postgres/db  - PostgreSQL database"
        echo "  adminer      - Adminer DB UI"
        echo "  kafka        - Kafka broker"
        echo "  dapr         - Dapr sidecar"
        echo "  notification - Notification service"
        echo "  recurring    - Recurring task service"
        echo "  audit        - Audit service"
        echo "  websocket    - WebSocket service"
        echo "  all          - All services (summary)"
        ;;
esac
