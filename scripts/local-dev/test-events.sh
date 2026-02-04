#!/bin/bash
##############################################################################
# Test Event-Driven Architecture (Dapr + Kafka)
##############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "=============================================="
echo "  TaskWhisper - Event Testing"
echo "=============================================="
echo ""

# 1. Check Kafka is running
log_info "Checking Kafka cluster..."
KAFKA_NAME=$(kubectl get kafka -n kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$KAFKA_NAME" ]; then
    STATUS=$(kubectl get kafka $KAFKA_NAME -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
    if [ "$STATUS" == "True" ]; then
        log_success "Kafka cluster ready ($KAFKA_NAME)"
    else
        log_info "Kafka cluster starting ($KAFKA_NAME)..."
    fi
else
    log_error "Kafka cluster not found. Run start-all.sh first"
    exit 1
fi

# 2. Check Kafka topics
log_info "Checking Kafka topics..."
kubectl get kafkatopics -n kafka
echo ""

# 3. Check Dapr components
log_info "Checking Dapr components..."
kubectl get components -n todo-app
echo ""

# 4. Test publishing event via Dapr
log_info "Testing Dapr pub/sub..."
BACKEND_POD=$(kubectl get pods -n todo-app -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$BACKEND_POD" ]; then
    BACKEND_POD=$(kubectl get pods -n todo-app | grep backend | head -1 | awk '{print $1}')
fi

if [ -n "$BACKEND_POD" ]; then
    log_info "Found backend pod: $BACKEND_POD"
    log_info "Publishing test event to task-events topic..."
    
    # Publish via Dapr sidecar
    kubectl exec -n todo-app $BACKEND_POD -c daprd -- \
        curl -s -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events \
        -H "Content-Type: application/json" \
        -d '{"event_type":"test","task_id":999,"user_id":"test-user","timestamp":"2026-01-07T00:00:00Z"}' \
        2>/dev/null && log_success "Event published!" || log_error "Failed to publish (Dapr sidecar may not be running)"
else
    log_error "Backend pod not found"
fi

echo ""

# 5. Check consumer logs
log_info "Checking for event consumers..."
for svc in notification-service recurring-task-service audit-service; do
    if kubectl get deployment $svc -n todo-app &>/dev/null; then
        log_success "$svc deployed"
    else
        echo -e "  ${YELLOW}○${NC} $svc not deployed"
    fi
done

echo ""

# 6. Kafka consumer test
log_info "Testing Kafka connectivity..."
KAFKA_POD=$(kubectl get pods -n kafka -l strimzi.io/name=${KAFKA_NAME}-kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -n "$KAFKA_POD" ]; then
    log_info "Listing topics from Kafka broker..."
    kubectl exec -n kafka $KAFKA_POD -- bin/kafka-topics.sh \
        --bootstrap-server localhost:9092 \
        --list 2>/dev/null || log_error "Could not list topics"
else
    log_error "Kafka pod not found"
fi

echo ""
echo "=============================================="
echo "  Event Testing Complete"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Open Kafka UI: http://localhost:8080"
echo "  2. Open Dapr Dashboard: http://localhost:9999"
echo "  3. Create a task via API to trigger real events"
echo ""
