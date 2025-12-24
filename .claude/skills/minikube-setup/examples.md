# Minikube Setup Skill - Examples

## Example 1: Basic Cluster Setup

```bash
#!/bin/bash
# scripts/minikube-setup.sh

# Start minikube with multi-node cluster
minikube start \
    --nodes=3 \
    --cpus=2 \
    --memory=4096 \
    --driver=docker \
    --container-runtime=containerd \
    --kubernetes-version=v1.29.0

# Verify cluster status
minikube status

# Check nodes
kubectl get nodes
```

## Example 2: Development Profile

```bash
#!/bin/bash
# Create development profile

# Start with dev profile
minikube start --profile=dev \
    --nodes=1 \
    --cpus=2 \
    --memory=4096 \
    --driver=docker

# Enable required addons
minikube addons enable ingress --profile=dev
minikube addons enable dashboard --profile=dev
minikube addons enable metrics-server --profile=dev

echo "Development cluster ready!"
minikube profile list
```

## Example 3: Production-like Profile

```bash
#!/bin/bash
# Create production-like profile

# Start with prod profile (3 nodes)
minikube start --profile=prod \
    --nodes=3 \
    --cpus=4 \
    --memory=8192 \
    --driver=docker \
    --kubernetes-version=v1.29.0

# Enable production addons
minikube addons enable ingress --profile=prod
minikube addons enable metrics-server --profile=prod
minikube addons enable dashboard --profile=prod

# Label nodes
kubectl label nodes prod-m02 node-role.kubernetes.io/worker=worker
kubectl label nodes prod-m03 node-role.kubernetes.io/worker=worker

echo "Production-like cluster ready!"
kubectl get nodes --show-labels
```

## Example 4: Load Local Docker Images

```bash
#!/bin/bash
# Load locally built images into minikube

# Option 1: Load existing images
minikube image load evolution-todo/backend:latest
minikube image load evolution-todo/frontend:latest
minikube image load evolution-todo/mcp-server:latest
minikube image load evolution-todo/ai-agent:latest

# Verify images are loaded
minikube image list | grep evolution-todo

# Option 2: Build directly in minikube's Docker
eval $(minikube docker-env)

# Now docker builds go to minikube
docker build -t evolution-todo/backend:latest ./backend
docker build -t evolution-todo/frontend:latest ./frontend
docker build -t evolution-todo/mcp-server:latest -f ./backend/Dockerfile.mcp ./backend
docker build -t evolution-todo/ai-agent:latest -f ./backend/Dockerfile.agent ./backend

# Return to host Docker
eval $(minikube docker-env --unset)
```

## Example 5: Accessing Services

```bash
#!/bin/bash
# Access services in minikube

# Get service URL
minikube service frontend --url -n todo-app

# Open service in browser
minikube service frontend -n todo-app

# Port forwarding
kubectl port-forward svc/backend 8000:8000 -n todo-app &
kubectl port-forward svc/frontend 3000:3000 -n todo-app &

# Tunnel for LoadBalancer services
minikube tunnel

# Add host entry for ingress
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
```

## Example 6: Dashboard Access

```bash
#!/bin/bash
# Access Kubernetes dashboard

# Enable dashboard addon
minikube addons enable dashboard
minikube addons enable metrics-server

# Open dashboard
minikube dashboard

# Or get URL without opening
minikube dashboard --url
```

## Example 7: Multi-Cluster Setup

```bash
#!/bin/bash
# Manage multiple minikube clusters

# Create development cluster
minikube start --profile=dev --nodes=1 --memory=2048

# Create staging cluster
minikube start --profile=staging --nodes=2 --memory=4096

# Create production-like cluster
minikube start --profile=prod --nodes=3 --memory=8192

# List all profiles
minikube profile list

# Switch between profiles
minikube profile dev
kubectl config current-context  # dev

minikube profile prod
kubectl config current-context  # prod

# Delete specific profile
minikube delete --profile=staging
```

## Example 8: Addon Management

```bash
#!/bin/bash
# Configure minikube addons

# List available addons
minikube addons list

# Enable essential addons
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable dashboard
minikube addons enable metrics-server
minikube addons enable storage-provisioner

# For development
minikube addons enable registry

# Configure addon
minikube addons configure ingress

# Disable addon
minikube addons disable dashboard
```

## Example 9: Persistent Storage

```bash
#!/bin/bash
# Configure persistent storage

# Enable storage provisioner
minikube addons enable storage-provisioner

# Create storage class
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-storage
provisioner: k8s.io/minikube-hostpath
volumeBindingMode: Immediate
reclaimPolicy: Delete
EOF

# Create PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: todo-app
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-storage
  resources:
    requests:
      storage: 5Gi
EOF

# Verify
kubectl get pvc -n todo-app
kubectl get pv
```

## Example 10: Network Configuration

```bash
#!/bin/bash
# Configure networking

# Enable ingress
minikube addons enable ingress

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get minikube IP
MINIKUBE_IP=$(minikube ip)
echo "Minikube IP: $MINIKUBE_IP"

# Add hosts entry
echo "$MINIKUBE_IP todo.local" | sudo tee -a /etc/hosts

# Verify ingress
kubectl get ingress -n todo-app
curl -H "Host: todo.local" http://$MINIKUBE_IP/
```

## Example 11: Resource Monitoring

```bash
#!/bin/bash
# Monitor cluster resources

# Enable metrics server
minikube addons enable metrics-server

# Wait for metrics server
kubectl wait --for=condition=ready pod \
  -l k8s-app=metrics-server \
  -n kube-system \
  --timeout=60s

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n todo-app

# View cluster resource usage
minikube ssh -- "free -h && df -h"
```

## Example 12: Debugging

```bash
#!/bin/bash
# Debug minikube issues

# Check minikube status
minikube status

# View minikube logs
minikube logs

# SSH into minikube node
minikube ssh

# SSH into specific node
minikube ssh -n minikube-m02

# Check Docker in minikube
minikube ssh -- docker ps

# View kubelet logs
minikube ssh -- "journalctl -u kubelet -f"

# Restart minikube
minikube stop && minikube start

# Reset to clean state
minikube delete && minikube start
```

## Example 13: Complete Setup Script

```bash
#!/bin/bash
# scripts/setup-local-k8s.sh
# Complete local Kubernetes setup with minikube

set -e

PROFILE="${PROFILE:-todo-dev}"
NODES="${NODES:-3}"
CPUS="${CPUS:-2}"
MEMORY="${MEMORY:-4096}"
K8S_VERSION="${K8S_VERSION:-v1.29.0}"

echo "=== Setting up Minikube Cluster ==="
echo "Profile: $PROFILE"
echo "Nodes: $NODES"
echo "CPUs: $CPUS"
echo "Memory: $MEMORY MB"

# Start cluster
minikube start \
    --profile="$PROFILE" \
    --nodes="$NODES" \
    --cpus="$CPUS" \
    --memory="$MEMORY" \
    --driver=docker \
    --kubernetes-version="$K8S_VERSION"

# Enable addons
echo "Enabling addons..."
minikube addons enable ingress --profile="$PROFILE"
minikube addons enable dashboard --profile="$PROFILE"
minikube addons enable metrics-server --profile="$PROFILE"
minikube addons enable storage-provisioner --profile="$PROFILE"

# Wait for system pods
echo "Waiting for system pods..."
kubectl wait --for=condition=ready pod -l k8s-app=kube-dns -n kube-system --timeout=120s

# Create namespace
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -

# Load images
echo "Loading Docker images..."
eval $(minikube docker-env --profile="$PROFILE")
if [ -d "backend" ]; then
    docker build -t evolution-todo/backend:latest ./backend
fi
if [ -d "frontend" ]; then
    docker build -t evolution-todo/frontend:latest ./frontend
fi
eval $(minikube docker-env --unset)

# Show status
echo ""
echo "=== Cluster Ready ==="
minikube status --profile="$PROFILE"
kubectl get nodes
echo ""
echo "Dashboard: minikube dashboard --profile=$PROFILE"
echo "IP: $(minikube ip --profile=$PROFILE)"
```
