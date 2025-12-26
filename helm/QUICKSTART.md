# Helm Chart Quick Start Guide

This guide will help you deploy the Evolution of Todo application using Helm to your Minikube cluster.

## Prerequisites

1. **Minikube running**:
   ```bash
   minikube start --nodes=3 --cpus=2 --memory=4096
   ```

2. **Docker images built and loaded** into Minikube:
   ```bash
   # Set Minikube Docker environment
   eval $(minikube docker-env)

   # Build images
   docker build -t todo-frontend:latest -f frontend/Dockerfile frontend/
   docker build -t todo-backend:latest -f backend/Dockerfile backend/
   docker build -t todo-mcp-server:latest -f backend/Dockerfile.mcp backend/

   # Unset Minikube Docker environment
   eval $(minikube docker-env --unset)
   ```

3. **NGINX Ingress Controller enabled**:
   ```bash
   minikube addons enable ingress
   ```

## Step 1: Prepare Secrets

Create a `values-secrets.yaml` file with your actual secrets (DO NOT commit this file):

```bash
cat > helm/todo-app/values-secrets.yaml <<EOF
secrets:
  databaseUrl: "postgresql://user:password@host:5432/database?sslmode=require"
  geminiApiKey: "your-gemini-api-key"
  betterAuthSecret: "$(openssl rand -hex 32)"
  openaiDomainKey: "your-openai-domain-key"
EOF
```

Or use `--set` flags during installation (see Step 2).

## Step 2: Install Helm Chart

### Option A: With values-secrets.yaml

```bash
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --values helm/todo-app/values-secrets.yaml
```

### Option B: With --set flags

```bash
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --set secrets.databaseUrl="postgresql://user:pass@host:5432/db" \
  --set secrets.geminiApiKey="your-key" \
  --set secrets.betterAuthSecret="$(openssl rand -hex 32)" \
  --set secrets.openaiDomainKey="your-key"
```

## Step 3: Verify Deployment

```bash
# Check Helm release
helm list -n todo-app

# Check pods
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# Check ingress
kubectl get ingress -n todo-app
```

## Step 4: Access Application

### Method 1: Via Ingress (Recommended)

1. Add to `/etc/hosts`:
   ```bash
   echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
   ```

2. Open browser: `http://todo.local`

### Method 2: Via Port Forward

```bash
kubectl port-forward -n todo-app service/todo-app-frontend 3000:80
```

Then open: `http://localhost:3000`

### Method 3: Via NodePort

```bash
minikube service todo-app-frontend -n todo-app --url
```

## Step 5: View Logs

```bash
# All pods
kubectl logs -n todo-app -l app.kubernetes.io/instance=todo-app --tail=100

# Frontend only
kubectl logs -n todo-app -l app.kubernetes.io/component=frontend --tail=100 -f

# Backend only
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=100 -f

# MCP Server only
kubectl logs -n todo-app -l app.kubernetes.io/component=mcp-server --tail=100 -f
```

## Upgrading

### Update Image Tags

```bash
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-dev.yaml \
  --values helm/todo-app/values-secrets.yaml \
  --set frontend.image.tag=v1.1.0 \
  --set backend.image.tag=v1.1.0
```

### Scale Replicas

```bash
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-dev.yaml \
  --values helm/todo-app/values-secrets.yaml \
  --set frontend.replicaCount=3 \
  --set backend.replicaCount=3
```

## Rollback

```bash
# View history
helm history todo-app -n todo-app

# Rollback to previous version
helm rollback todo-app -n todo-app

# Rollback to specific revision
helm rollback todo-app 2 -n todo-app
```

## Uninstalling

```bash
helm uninstall todo-app --namespace todo-app
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod -n todo-app <pod-name>

# Check events
kubectl get events -n todo-app --sort-by='.lastTimestamp'
```

### Image Pull Errors

If you see `ImagePullBackOff` or `ErrImagePull`:

```bash
# Verify images exist in Minikube
eval $(minikube docker-env)
docker images | grep todo
eval $(minikube docker-env --unset)

# If missing, rebuild images with Minikube Docker daemon
```

### Configuration Issues

```bash
# Check ConfigMap
kubectl get configmap todo-app-config -n todo-app -o yaml

# Check Secret
kubectl get secret todo-app-secrets -n todo-app -o yaml

# Edit ConfigMap
kubectl edit configmap todo-app-config -n todo-app

# After editing, restart deployments
kubectl rollout restart deployment -n todo-app
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress todo-app -n todo-app

# Verify NGINX ingress controller
kubectl get pods -n ingress-nginx

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Advanced Usage

### Enable Autoscaling

```bash
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-dev.yaml \
  --values helm/todo-app/values-secrets.yaml \
  --set frontend.autoscaling.enabled=true \
  --set backend.autoscaling.enabled=true
```

### Custom Values File

Create `my-values.yaml`:

```yaml
frontend:
  replicaCount: 3
  resources:
    requests:
      cpu: 200m
      memory: 256Mi

backend:
  replicaCount: 3
  resources:
    requests:
      cpu: 300m
      memory: 512Mi
```

Install with:

```bash
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --values my-values.yaml \
  --values helm/todo-app/values-secrets.yaml
```

## Monitoring

### Kubernetes Dashboard

```bash
minikube dashboard
```

### Resource Usage

```bash
# CPU and Memory usage
kubectl top pods -n todo-app
kubectl top nodes
```

### Health Checks

```bash
# Check readiness
kubectl get pods -n todo-app -o wide

# Test health endpoints
kubectl port-forward -n todo-app service/todo-app-backend 8000:8000
curl http://localhost:8000/health

kubectl port-forward -n todo-app service/todo-app-mcp-server 8001:8001
curl http://localhost:8001/health
```

## Next Steps

1. **Set up monitoring**: Add Prometheus and Grafana
2. **Configure CI/CD**: Automate Helm deployments
3. **Add SSL/TLS**: Use cert-manager for HTTPS
4. **Database backups**: Set up automated backups for Neon PostgreSQL
5. **Production deployment**: Use `values-prod.yaml` for production clusters

For more details, see the [full README](todo-app/README.md).
