#!/bin/bash
##############################################################################
# Port-forward All Dashboards (Unique Ports)
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Port assignments
PORT_FRONTEND=3000
PORT_BACKEND=8000
PORT_MCP=8001
PORT_GRAFANA=3001
PORT_PROMETHEUS=9090
PORT_KAFKA_UI=8080
PORT_DAPR=9999
PORT_POSTGRES=5432
PORT_ADMINER=8082

check_port() {
    if lsof -i :$1 &>/dev/null; then
        return 0
    fi
    return 1
}

start_forward() {
    local name=$1
    local port=$2
    local svc=$3
    local ns=$4
    local target=${5:-$port}
    
    if ! kubectl get svc $svc -n $ns &>/dev/null; then
        log_warn "$name service not found ($svc)"
        return
    fi
    
    if check_port $port; then
        log_warn "$name already on port $port"
    else
        kubectl port-forward svc/$svc $port:$target -n $ns &>/dev/null &
        sleep 1
        if check_port $port; then
            log_success "$name: http://localhost:$port"
        else
            log_warn "$name failed to start"
        fi
    fi
}

echo "=============================================="
echo "  TaskWhisper - Dashboard Access"
echo "=============================================="
echo ""

# Kill old port-forwards
log_info "Cleaning up old port-forwards..."
pkill -f "kubectl port-forward" 2>/dev/null || true
pkill -f "dapr dashboard" 2>/dev/null || true
sleep 2

log_info "Starting port-forwards..."
echo ""

# Database
start_forward "PostgreSQL" $PORT_POSTGRES "postgres" "todo-app" 5432
start_forward "Adminer (DB UI)" $PORT_ADMINER "adminer" "todo-app" 8080

# Application - actual service names from helm
start_forward "Frontend" $PORT_FRONTEND "evolution-todo-todo-app-frontend" "todo-app" 80
start_forward "Backend API" $PORT_BACKEND "evolution-todo-todo-app-backend" "todo-app" 8000
start_forward "MCP Server" $PORT_MCP "evolution-todo-todo-app-mcp-server" "todo-app" 8001

# Monitoring - actual service names
start_forward "Grafana" $PORT_GRAFANA "monitoring-grafana" "monitoring" 80
start_forward "Prometheus" $PORT_PROMETHEUS "monitoring-kube-prometheus-prometheus" "monitoring" 9090

# Kafka UI
start_forward "Kafka UI" $PORT_KAFKA_UI "kafka-ui" "kafka" 8080

# Dapr Dashboard
log_info "Starting Dapr Dashboard..."
if check_port $PORT_DAPR; then
    log_warn "Dapr Dashboard already on port $PORT_DAPR"
else
    dapr dashboard -k -p $PORT_DAPR &>/dev/null &
    sleep 2
    if check_port $PORT_DAPR; then
        log_success "Dapr Dashboard: http://localhost:$PORT_DAPR"
    fi
fi

# K8s Dashboard
log_info "Starting K8s Dashboard..."
minikube dashboard &>/dev/null &

echo ""
echo "=============================================="
echo "  All Dashboards"
echo "=============================================="
echo ""
echo "┌───────────────────┬──────────────────────────────────────────┐"
echo "│ Service           │ URL / Connection                         │"
echo "├───────────────────┼──────────────────────────────────────────┤"
echo "│ Frontend          │ http://localhost:$PORT_FRONTEND                       │"
echo "│ Backend API       │ http://localhost:$PORT_BACKEND                       │"
echo "│ API Docs          │ http://localhost:$PORT_BACKEND/docs                  │"
echo "│ MCP Server        │ http://localhost:$PORT_MCP                       │"
echo "├───────────────────┼──────────────────────────────────────────┤"
echo "│ PostgreSQL        │ localhost:$PORT_POSTGRES                           │"
echo "│ Adminer (DB UI)   │ http://localhost:$PORT_ADMINER                       │"
echo "├───────────────────┼──────────────────────────────────────────┤"
echo "│ Grafana           │ http://localhost:$PORT_GRAFANA (admin/admin)   │"
echo "│ Prometheus        │ http://localhost:$PORT_PROMETHEUS                       │"
echo "│ Kafka UI          │ http://localhost:$PORT_KAFKA_UI                       │"
echo "│ Dapr Dashboard    │ http://localhost:$PORT_DAPR                       │"
echo "│ K8s Dashboard     │ (opens in browser)                       │"
echo "└───────────────────┴──────────────────────────────────────────┘"
echo ""
echo "Database Credentials (for Adminer):"
echo "  System:   PostgreSQL"
echo "  Server:   postgres"
echo "  Username: postgres"
echo "  Password: postgres"
echo "  Database: todo"
echo ""
echo "Press Ctrl+C to stop all port-forwards"
echo ""

wait
