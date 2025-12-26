# Kubernetes Manifests Quick Reference Guide

## Files Created

```
k8s/
├── 00-namespace.yaml              # Namespace: todo-app
├── 01-configmap.yaml              # ConfigMap: app-config
├── 02-secret.yaml                 # Secret: app-secrets (MUST CONFIGURE)
├── 03-mcp-server-deployment.yaml  # MCP Server Deployment (1 replica)
├── 04-mcp-server-service.yaml     # MCP Server Service (ClusterIP:8001)
├── 05-backend-deployment.yaml     # Backend Deployment (2 replicas)
├── 06-backend-service.yaml        # Backend Service (ClusterIP:8000)
├── 07-frontend-deployment.yaml    # Frontend Deployment (2 replicas)
├── 08-frontend-service.yaml       # Frontend Service (NodePort:80)
├── README.md                      # Complete deployment guide
├── validate.sh                    # Manifest validation script
├── deploy.sh                      # Automated deployment script
└── MANIFEST-GUIDE.md              # This file
```

## Quick Start

### 1. Prerequisites
```bash
# Start Minikube
minikube start --cpus=4 --memory=8192

# Build Docker images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -t todo-mcp-server:latest -f backend/Dockerfile.mcp ./backend

# Load images into Minikube
minikube image load todo-frontend:latest
minikube image load todo-backend:latest
minikube image load todo-mcp-server:latest
```

### 2. Configure Secrets (IMPORTANT!)
```bash
# Create secrets from environment variables
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=GEMINI_API_KEY="your-api-key" \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=NEXT_PUBLIC_OPENAI_DOMAIN_KEY="your-openai-key" \
  -n todo-app
```

### 3. Deploy
```bash
# Option A: Use automated script
cd k8s/
./deploy.sh

# Option B: Apply manually
kubectl apply -f k8s/ -n todo-app
```

### 4. Access Application
```bash
# Open in browser
minikube service frontend -n todo-app
```

## Manifest Details

### 00-namespace.yaml
Creates the `todo-app` namespace with labels:
- `name: todo-app`
- `app: evolution-todo`
- `phase: "4"`
- `environment: development`

### 01-configmap.yaml
Non-sensitive configuration:
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=http://backend:8000`
- `NEXT_PUBLIC_MCP_URL=http://mcp-server:8001`
- `MCP_SERVER_URL=http://mcp-server:8001`
- `NEXT_TELEMETRY_DISABLED=1`

### 02-secret.yaml
Sensitive data (MUST BE CONFIGURED):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `BETTER_AUTH_SECRET` - Authentication secret
- `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` - OpenAI ChatKit key

### 03-mcp-server-deployment.yaml
MCP Server deployment:
- **Image**: `todo-mcp-server:latest`
- **Replicas**: 1
- **Port**: 8001
- **CPU**: 100m request, 300m limit
- **Memory**: 64Mi request, 128Mi limit
- **Probes**: Liveness and readiness on `/health:8001`

### 04-mcp-server-service.yaml
MCP Server service:
- **Type**: ClusterIP (internal only)
- **Port**: 8001

### 05-backend-deployment.yaml
Backend deployment:
- **Image**: `todo-backend:latest`
- **Replicas**: 2
- **Port**: 8000
- **CPU**: 200m request, 1000m limit
- **Memory**: 256Mi request, 512Mi limit
- **Probes**: Liveness and readiness on `/health:8000`

### 06-backend-service.yaml
Backend service:
- **Type**: ClusterIP (internal only)
- **Port**: 8000

### 07-frontend-deployment.yaml
Frontend deployment:
- **Image**: `todo-frontend:latest`
- **Replicas**: 2
- **Port**: 3000
- **CPU**: 100m request, 500m limit
- **Memory**: 128Mi request, 256Mi limit
- **Probes**: Liveness and readiness on `/:3000`

### 08-frontend-service.yaml
Frontend service:
- **Type**: NodePort (external access)
- **Port**: 80 (target: 3000)
- **NodePort**: Auto-assigned (30000-32767)

## Resource Allocation Summary

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
|---------|-------------|-----------|----------------|--------------|----------|
| Frontend | 100m | 500m | 128Mi | 256Mi | 2 |
| Backend | 200m | 1000m | 256Mi | 512Mi | 2 |
| MCP Server | 100m | 300m | 64Mi | 128Mi | 1 |
| **TOTAL** | **400m** | **2300m** | **512Mi** | **1024Mi** | **5 pods** |

## Service Discovery

Internal service communication uses Kubernetes DNS:

```
Frontend → Backend:     http://backend:8000
Backend → MCP Server:   http://mcp-server:8001
External → Frontend:    http://<minikube-ip>:<nodeport>
```

## Health Probes

All deployments have configured health probes:

| Service | Liveness Probe | Readiness Probe |
|---------|----------------|-----------------|
| Frontend | GET /:3000 (30s delay, 10s period) | GET /:3000 (5s delay, 5s period) |
| Backend | GET /health:8000 (30s delay, 10s period) | GET /health:8000 (5s delay, 5s period) |
| MCP Server | GET /health:8001 (10s delay, 10s period) | GET /health:8001 (5s delay, 5s period) |

## ImagePullPolicy

All deployments use `imagePullPolicy: Never` for Minikube:
- This tells Kubernetes to use local images
- Images must be loaded into Minikube before deployment
- For production, change to `IfNotPresent` or `Always`

## Common Commands

### Deployment
```bash
# Deploy all
kubectl apply -f k8s/

# Deploy specific resource
kubectl apply -f k8s/05-backend-deployment.yaml
```

### Monitoring
```bash
# Get all resources
kubectl get all -n todo-app

# Get pods
kubectl get pods -n todo-app

# Get services
kubectl get svc -n todo-app

# Get logs
kubectl logs -f deployment/backend -n todo-app
```

### Debugging
```bash
# Describe pod
kubectl describe pod <pod-name> -n todo-app

# Shell into pod
kubectl exec -it <pod-name> -n todo-app -- sh

# Test service connectivity
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
  -- curl http://backend:8000/health
```

### Scaling
```bash
# Scale backend
kubectl scale deployment backend --replicas=3 -n todo-app

# Scale frontend
kubectl scale deployment frontend --replicas=4 -n todo-app
```

### Cleanup
```bash
# Delete all resources
kubectl delete namespace todo-app

# Delete specific deployment
kubectl delete deployment backend -n todo-app
```

## Troubleshooting

### Pods in Pending State
```bash
# Check events
kubectl describe pod <pod-name> -n todo-app

# Common causes:
# 1. Insufficient resources
# 2. Image not loaded
# 3. Node selector mismatch
```

### Pods in CrashLoopBackOff
```bash
# Check logs
kubectl logs <pod-name> -n todo-app --previous

# Common causes:
# 1. Missing secrets
# 2. Database connection failed
# 3. Application error
```

### Service Not Accessible
```bash
# Check endpoints
kubectl get endpoints -n todo-app

# Verify service
kubectl describe svc frontend -n todo-app

# Test connectivity
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
  -- curl http://frontend:80
```

## Security Notes

1. **Secrets Management**: Never commit secrets to git
2. **Non-Root Containers**: All containers should run as non-root (configure in Dockerfiles)
3. **Resource Limits**: All deployments have resource limits to prevent resource starvation
4. **Health Probes**: All deployments have health probes for self-healing
5. **Minimal Images**: Use slim/alpine base images to reduce attack surface

## Next Steps

1. Test deployment on Minikube
2. Create Helm chart for easier management (see `../helm/`)
3. Prepare for production deployment (Phase 5)
4. Add monitoring and logging
5. Configure autoscaling (HPA)

## References

- [README.md](./README.md) - Complete deployment guide
- [Phase 4 Constitution](../constitution-prompt-phase-4.md)
- [Phase 4 Plan](../plan-prompt-phase-4.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
