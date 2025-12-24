# Quickstart: Local Kubernetes Deployment

**Feature**: 001-k8s-local-deploy
**Phase**: Phase 1 - Design
**Date**: 2025-12-24

## Overview

This guide provides step-by-step instructions for deploying the Todo application to a local Kubernetes cluster using Minikube.

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Docker | Latest | [docker.com](https://docs.docker.com/get-docker/) |
| Minikube | Latest | [minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/start/) |
| kubectl | Latest | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| Helm | 3.15+ | [helm.sh](https://helm.sh/docs/intro/install/) |

### Required Environment Variables

Before deployment, ensure you have the following in your local `.env` files:

**backend/.env**:
```env
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx.neon.tech/neondb
GEMINI_API_KEY=your-gemini-api-key
BETTER_AUTH_SECRET=your-auth-secret
MCP_SERVER_URL=http://mcp-server:8001
```

**frontend/.env**:
```env
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-openai-domain-key
```

---

## Quick Deploy (5 Minutes)

### Option A: Using Raw Kubernetes Manifests

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192 --driver=docker

# 2. Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# 3. Build and load Docker images
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
# Build MCP server if separate Dockerfile exists
eval $(minikube docker-env --unset)

# 4. Create secrets from your .env files
kubectl create namespace todo-app
kubectl create secret generic app-secrets \
  --from-env-file=backend/.env \
  -n todo-app

# 5. Apply all manifests
kubectl apply -f k8s/ -n todo-app

# 6. Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n todo-app --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend -n todo-app --timeout=120s

# 7. Add to /etc/hosts
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts

# 8. Access the application
open http://todo.local
# Or use: minikube service frontend -n todo-app
```

### Option B: Using Helm Chart

```bash
# 1. Start Minikube (same as above)
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server

# 2. Build and load Docker images (same as above)
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
eval $(minikube docker-env --unset)

# 3. Install Helm chart with secrets
helm install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app --create-namespace \
  --set secrets.databaseUrl="$(grep DATABASE_URL backend/.env | cut -d= -f2-)" \
  --set secrets.geminiApiKey="$(grep GEMINI_API_KEY backend/.env | cut -d= -f2-)" \
  --set secrets.betterAuthSecret="$(grep BETTER_AUTH_SECRET backend/.env | cut -d= -f2-)"

# 4. Wait for deployment
kubectl wait --for=condition=ready pod -l app=frontend -n todo-app --timeout=120s

# 5. Add to /etc/hosts and access
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
open http://todo.local
```

---

## Detailed Steps

### Step 1: Start Minikube

```bash
# Start with recommended resources
minikube start \
  --cpus=4 \
  --memory=8192 \
  --disk-size=20g \
  --driver=docker

# Verify cluster is running
minikube status

# Expected output:
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured
```

### Step 2: Enable Addons

```bash
# Enable NGINX Ingress Controller
minikube addons enable ingress

# Enable Metrics Server for resource monitoring
minikube addons enable metrics-server

# Optional: Enable Dashboard for web UI
minikube addons enable dashboard

# Verify addons
minikube addons list | grep enabled
```

### Step 3: Build Docker Images

```bash
# Point Docker to Minikube's Docker daemon
eval $(minikube docker-env)

# Build frontend image
docker build -t todo-frontend:latest ./frontend

# Build backend image
docker build -t todo-backend:latest ./backend

# Build MCP server image (if separate)
# docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend

# Verify images
docker images | grep todo

# Reset Docker environment
eval $(minikube docker-env --unset)
```

### Step 4: Create Namespace and Secrets

```bash
# Create namespace
kubectl create namespace todo-app

# Create secrets from .env file
kubectl create secret generic app-secrets \
  --from-env-file=backend/.env \
  -n todo-app

# Verify secrets created
kubectl get secrets -n todo-app
```

### Step 5: Deploy Application

**Using Raw Manifests**:
```bash
# Apply all manifests in order
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
kubectl apply -f k8s/03-mcp-server-deployment.yaml
kubectl apply -f k8s/04-mcp-server-service.yaml
kubectl apply -f k8s/05-backend-deployment.yaml
kubectl apply -f k8s/06-backend-service.yaml
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-frontend-service.yaml
kubectl apply -f k8s/09-ingress.yaml

# Or apply all at once
kubectl apply -f k8s/ -n todo-app
```

**Using Helm**:
```bash
helm install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app --create-namespace \
  --set secrets.databaseUrl="<your-db-url>" \
  --set secrets.geminiApiKey="<your-api-key>" \
  --set secrets.betterAuthSecret="<your-secret>"
```

### Step 6: Verify Deployment

```bash
# Check all pods are Running
kubectl get pods -n todo-app

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# frontend-5d8c9b7f6-abc12      1/1     Running   0          2m
# frontend-5d8c9b7f6-def34      1/1     Running   0          2m
# backend-7f9d8e6c5-ghi56       1/1     Running   0          2m
# backend-7f9d8e6c5-jkl78       1/1     Running   0          2m
# mcp-server-3a4b5c6d7-mno90    1/1     Running   0          2m

# Check services have endpoints
kubectl get endpoints -n todo-app

# Check ingress is configured
kubectl get ingress -n todo-app
```

### Step 7: Configure Local Access

```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Add to /etc/hosts (requires sudo)
echo "$MINIKUBE_IP todo.local" | sudo tee -a /etc/hosts

# Verify entry was added
grep todo.local /etc/hosts
```

### Step 8: Access Application

```bash
# Option 1: Via Ingress
open http://todo.local

# Option 2: Via Minikube Service (opens browser automatically)
minikube service frontend -n todo-app

# Option 3: Via Port Forward (for debugging)
kubectl port-forward svc/frontend 3000:80 -n todo-app
# Then access http://localhost:3000
```

---

## Verification Checklist

- [ ] Minikube is running (`minikube status`)
- [ ] All pods are Running (`kubectl get pods -n todo-app`)
- [ ] All services have endpoints (`kubectl get endpoints -n todo-app`)
- [ ] Ingress is configured (`kubectl get ingress -n todo-app`)
- [ ] Application loads in browser
- [ ] User can sign in
- [ ] Chat functionality works
- [ ] Tasks can be created/listed

---

## Common Commands

### View Logs

```bash
# View all pod logs
kubectl logs -l app=frontend -n todo-app
kubectl logs -l app=backend -n todo-app
kubectl logs -l app=mcp-server -n todo-app

# Follow logs in real-time
kubectl logs -f -l app=backend -n todo-app

# View specific pod logs
kubectl logs <pod-name> -n todo-app
```

### Restart Deployments

```bash
# Restart frontend
kubectl rollout restart deployment/frontend -n todo-app

# Restart backend
kubectl rollout restart deployment/backend -n todo-app

# Restart all
kubectl rollout restart deployment -n todo-app
```

### Scale Deployments

```bash
# Scale frontend to 3 replicas
kubectl scale deployment/frontend --replicas=3 -n todo-app

# Scale backend to 1 replica
kubectl scale deployment/backend --replicas=1 -n todo-app
```

### Monitor Resources

```bash
# View resource usage
kubectl top pods -n todo-app

# View node resources
kubectl top nodes

# Open Minikube dashboard
minikube dashboard
```

---

## Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace todo-app

# Or using Helm
helm uninstall todo-app -n todo-app

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete

# Remove /etc/hosts entry
sudo sed -i '/todo.local/d' /etc/hosts
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n todo-app

# Check container logs
kubectl logs <pod-name> -n todo-app

# Common issues:
# - ImagePullBackOff: Image not in Minikube, rebuild with eval $(minikube docker-env)
# - CrashLoopBackOff: Application error, check logs
# - Pending: Insufficient resources, check kubectl describe
```

### Cannot Access Application

```bash
# Verify Ingress is working
kubectl get ingress -n todo-app
kubectl describe ingress todo-ingress -n todo-app

# Verify /etc/hosts has correct IP
cat /etc/hosts | grep todo.local
echo $(minikube ip)  # Should match

# Try direct service access
minikube service frontend -n todo-app --url
```

### Database Connection Failed

```bash
# Verify secret has correct value
kubectl get secret app-secrets -n todo-app -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Test from inside pod
kubectl exec -it <backend-pod> -n todo-app -- sh
# Inside pod: try connecting to database
```

---

## Next Steps

1. **Test all features**: Authentication, task creation, chatbot
2. **Run AIOps tools**: Gordon, kubectl-ai, Kagent
3. **Monitor resources**: `kubectl top pods -n todo-app`
4. **Prepare for Phase 5**: Review production values file

---

**Quickstart Version**: 1.0.0
**Created**: December 24, 2025
