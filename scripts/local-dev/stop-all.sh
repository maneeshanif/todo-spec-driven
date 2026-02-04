#!/bin/bash
##############################################################################
# Stop All Local Development Services
##############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }

echo "=============================================="
echo "  TaskWhisper - Stopping Services"
echo "=============================================="
echo ""

# Kill port-forwards
log_info "Stopping port-forwards..."
pkill -f "kubectl port-forward.*todo-app" 2>/dev/null || true
pkill -f "kubectl port-forward.*monitoring" 2>/dev/null || true
pkill -f "kubectl port-forward.*kafka" 2>/dev/null || true
pkill -f "dapr dashboard" 2>/dev/null || true
pkill -f "minikube dashboard" 2>/dev/null || true
log_success "Port-forwards stopped"

if [[ "$1" == "--pods" ]]; then
    log_info "Deleting all pods in todo-app namespace..."
    kubectl delete pods --all -n todo-app 2>/dev/null || true
    log_success "All pods deleted (will restart if deployments exist)"

elif [[ "$1" == "--uninstall" ]]; then
    log_info "Uninstalling Helm release..."
    helm uninstall todo-app -n todo-app 2>/dev/null || true
    log_success "Helm release uninstalled"

    log_info "Deleting all resources in todo-app namespace..."
    kubectl delete all --all -n todo-app 2>/dev/null || true
    kubectl delete pvc --all -n todo-app 2>/dev/null || true
    kubectl delete configmap --all -n todo-app 2>/dev/null || true
    kubectl delete secret --all -n todo-app 2>/dev/null || true
    log_success "All resources deleted"

elif [[ "$1" == "--full" ]]; then
    log_info "Deleting all pods first..."
    kubectl delete pods --all -n todo-app 2>/dev/null || true
    kubectl delete pods --all -n monitoring 2>/dev/null || true
    kubectl delete pods --all -n kafka 2>/dev/null || true
    log_success "All pods deleted"

    log_info "Stopping Minikube..."
    minikube stop
    log_success "Minikube stopped (frees all memory)"

elif [[ "$1" == "--delete" ]]; then
    log_info "Deleting Minikube cluster..."
    minikube delete
    log_success "Minikube cluster deleted completely"

else
    echo ""
    echo "Minikube still running. Pods consuming resources."
    echo ""
    echo "Options:"
    echo "  ./stop-all.sh --pods      # Delete all pods (they will restart)"
    echo "  ./stop-all.sh --uninstall # Uninstall Helm + delete all resources"
    echo "  ./stop-all.sh --full      # Stop Minikube (frees all memory)"
    echo "  ./stop-all.sh --delete    # Delete Minikube cluster completely"
fi

echo ""
log_success "Done!"
