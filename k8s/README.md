# Kubernetes Manifests for Evolution of Todo

This directory contains all Kubernetes manifests for deploying the Evolution of Todo application to a Kubernetes cluster (Minikube for local development).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER (Minikube)                    │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  FRONTEND POD   │  │  BACKEND POD    │  │ MCP SERVER POD   │   │
│  │  (Next.js)      │  │  (FastAPI)      │  │ (FastMCP)        │   │
│  │  Replicas: 2    │  │  Replicas: 2    │  │ Replicas: 1      │   │
│  │  Port: 3000     │  │  Port: 8000     │  │ Port: 8001       │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘   │
│           │                    │                     │             │
│           │                    │                     │             │
│  ┌────────▼────────────────────▼─────────────────────▼─────────┐   │
│  │               KUBERNETES SERVICE LAYER                     │   │
│  │  - frontend (NodePort)                                     │   │
│  │  - backend (ClusterIP)                                     │   │
│  │  - mcp-server (ClusterIP)                                  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  External:                                                          │
│  - Neon PostgreSQL (cloud.neon.tech)                               │
│  - Better Auth (authentication)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Files Overview

| File | Description |
|------|-------------|
| `00-namespace.yaml` | Creates the `todo-app` namespace |
| `01-configmap.yaml` | Non-sensitive configuration (API URLs, env vars) |
| `02-secret.yaml` | Sensitive data (API keys, secrets) - **MUST BE CONFIGURED** |
| `03-mcp-server-deployment.yaml` | MCP Server deployment (1 replica) |
| `04-mcp-server-service.yaml` | MCP Server service (ClusterIP) |
| `05-backend-deployment.yaml` | Backend API deployment (2 replicas) |
| `06-backend-service.yaml` | Backend service (ClusterIP) |
| `07-frontend-deployment.yaml` | Frontend deployment (2 replicas) |
| `08-frontend-service.yaml` | Frontend service (NodePort) |

## Prerequisites

1. **Minikube installed and running**:
   ```bash
   minikube start --cpus=4 --memory=8192 --disk-size=50gb
   ```

2. **kubectl installed and configured**:
   ```bash
   kubectl version --client
   ```

3. **Docker images built**:
   ```bash
   # From project root
   docker build -t todo-frontend:latest ./frontend
   docker build -t todo-backend:latest ./backend
   docker build -t todo-mcp-server:latest -f backend/Dockerfile.mcp ./backend
   ```

4. **Images loaded into Minikube**:
   ```bash
   minikube image load todo-frontend:latest
   minikube image load todo-backend:latest
   minikube image load todo-mcp-server:latest
   ```

## Secrets Configuration

**IMPORTANT**: Before deploying, you MUST set the following secrets in `02-secret.yaml`:

### Required Secrets

| Secret Key | Source | Example |
|-----------|--------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `GEMINI_API_KEY` | Google AI Studio | `AIzaSy...` |
| `BETTER_AUTH_SECRET` | Generate random string | `openssl rand -base64 32` |
| `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` | OpenAI ChatKit | `sk-...` |

### How to Set Secrets

**Option 1: Edit the manifest directly** (NOT RECOMMENDED for production):
```bash
# Edit 02-secret.yaml and replace empty strings with actual values
nano k8s/02-secret.yaml
```

**Option 2: Use kubectl to create secret from file** (RECOMMENDED):
```bash
# Create .env file (DO NOT COMMIT)
cat > /tmp/k8s-secrets.env <<EOF
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
GEMINI_API_KEY=AIzaSy...
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=sk-...
EOF

# Create secret from file
kubectl create secret generic app-secrets \
  --from-env-file=/tmp/k8s-secrets.env \
  -n todo-app

# Clean up temp file
rm /tmp/k8s-secrets.env
```

**Option 3: Use kubectl to create secret from literal values**:
```bash
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" \
  --from-literal=GEMINI_API_KEY="AIzaSy..." \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=NEXT_PUBLIC_OPENAI_DOMAIN_KEY="sk-..." \
  -n todo-app
```

## Deployment Instructions

### Step 1: Create Namespace
```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Step 2: Create ConfigMap
```bash
kubectl apply -f k8s/01-configmap.yaml
```

### Step 3: Create Secrets
```bash
# Option A: If you edited 02-secret.yaml with values
kubectl apply -f k8s/02-secret.yaml

# Option B: If using kubectl create (see above)
# Secret already created
```

### Step 4: Deploy MCP Server
```bash
kubectl apply -f k8s/03-mcp-server-deployment.yaml
kubectl apply -f k8s/04-mcp-server-service.yaml
```

### Step 5: Deploy Backend
```bash
kubectl apply -f k8s/05-backend-deployment.yaml
kubectl apply -f k8s/06-backend-service.yaml
```

### Step 6: Deploy Frontend
```bash
kubectl apply -f k8s/07-frontend-deployment.yaml
kubectl apply -f k8s/08-frontend-service.yaml
```

### Step 7: Deploy All at Once (Alternative)
```bash
# Apply all manifests in order
kubectl apply -f k8s/ -n todo-app
```

## Verification

### Check All Resources
```bash
# Check namespace
kubectl get namespace todo-app

# Check all resources in namespace
kubectl get all -n todo-app

# Check pods
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# Check deployments
kubectl get deployments -n todo-app
```

### Expected Output
```
NAME                         READY   STATUS    RESTARTS   AGE
pod/backend-xxxxx-xxxxx      1/1     Running   0          2m
pod/backend-xxxxx-xxxxx      1/1     Running   0          2m
pod/frontend-xxxxx-xxxxx     1/1     Running   0          2m
pod/frontend-xxxxx-xxxxx     1/1     Running   0          2m
pod/mcp-server-xxxxx-xxxxx   1/1     Running   0          2m

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
service/backend      ClusterIP   10.96.1.1       <none>        8000/TCP       2m
service/frontend     NodePort    10.96.1.2       <none>        80:30000/TCP   2m
service/mcp-server   ClusterIP   10.96.1.3       <none>        8001/TCP       2m

NAME                         READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/backend      2/2     2            2           2m
deployment.apps/frontend     2/2     2            2           2m
deployment.apps/mcp-server   1/1     1            1           2m
```

## Accessing the Application

### Using Minikube Service
```bash
# Open frontend in browser
minikube service frontend -n todo-app

# Get URL without opening browser
minikube service frontend -n todo-app --url
```

### Using Port Forwarding
```bash
# Forward frontend to localhost:8080
kubectl port-forward svc/frontend 8080:80 -n todo-app

# Access at http://localhost:8080
```

### Using Minikube IP and NodePort
```bash
# Get Minikube IP
minikube ip

# Get NodePort
kubectl get svc frontend -n todo-app -o jsonpath='{.spec.ports[0].nodePort}'

# Access at http://<minikube-ip>:<nodeport>
```

## Health Checks

### Check Pod Health
```bash
# Check pod status
kubectl get pods -n todo-app

# Describe pod for events
kubectl describe pod <pod-name> -n todo-app

# Check pod logs
kubectl logs -f <pod-name> -n todo-app

# Check specific deployment logs
kubectl logs -f deployment/backend -n todo-app
kubectl logs -f deployment/frontend -n todo-app
kubectl logs -f deployment/mcp-server -n todo-app
```

### Test Service Connectivity
```bash
# Test backend health
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
  -- curl http://backend:8000/health

# Test MCP server health
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
  -- curl http://mcp-server:8001/health

# Test frontend
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app \
  -- curl http://frontend:80
```

## Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n todo-app

# Check pod logs
kubectl logs <pod-name> -n todo-app

# Common issues:
# 1. Image not loaded: minikube image load <image>
# 2. Secrets not set: kubectl get secret app-secrets -n todo-app
# 3. Resource limits: kubectl top pods -n todo-app
```

### CrashLoopBackOff
```bash
# Check logs for error
kubectl logs <pod-name> -n todo-app --previous

# Common causes:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port already in use
# 4. Application error
```

### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n todo-app

# Check service selector matches pod labels
kubectl get svc frontend -n todo-app -o yaml
kubectl get pod <frontend-pod> -n todo-app -o yaml

# Verify NodePort
kubectl get svc frontend -n todo-app
```

## Scaling

### Scale Deployments
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n todo-app

# Scale frontend to 4 replicas
kubectl scale deployment frontend --replicas=4 -n todo-app

# Scale down
kubectl scale deployment backend --replicas=1 -n todo-app
```

### Auto-scaling (HPA)
```bash
# Enable metrics server addon
minikube addons enable metrics-server

# Create HPA for backend
kubectl autoscale deployment backend \
  --cpu-percent=80 \
  --min=2 \
  --max=5 \
  -n todo-app

# Check HPA status
kubectl get hpa -n todo-app
```

## Cleanup

### Delete All Resources
```bash
# Delete all resources in namespace
kubectl delete all --all -n todo-app

# Delete namespace (includes all resources)
kubectl delete namespace todo-app
```

### Delete Specific Resources
```bash
# Delete deployments
kubectl delete deployment backend frontend mcp-server -n todo-app

# Delete services
kubectl delete svc backend frontend mcp-server -n todo-app

# Delete configmap and secret
kubectl delete configmap app-config -n todo-app
kubectl delete secret app-secrets -n todo-app
```

## Resource Allocation

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
|---------|-------------|-----------|----------------|--------------|----------|
| Frontend | 100m | 500m | 128Mi | 256Mi | 2 |
| Backend | 200m | 1000m | 256Mi | 512Mi | 2 |
| MCP Server | 100m | 300m | 64Mi | 128Mi | 1 |

## Next Steps

1. Deploy application to Minikube (follow instructions above)
2. Test all features end-to-end
3. Create Helm chart for easier deployment (see `../helm/` directory)
4. Prepare for production deployment (Phase 5)

## References

- [Phase 4 Constitution](../constitution-prompt-phase-4.md)
- [Phase 4 Plan](../plan-prompt-phase-4.md)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
