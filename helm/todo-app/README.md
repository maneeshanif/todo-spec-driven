# Todo App Helm Chart

This Helm chart deploys the Evolution of Todo application - an AI-powered task manager with a Next.js frontend, FastAPI backend, and FastMCP server.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- NGINX Ingress Controller (for ingress)
- cert-manager (optional, for TLS)

## Installation

### Development (Minikube)

```bash
# Install with development values
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --set secrets.databaseUrl="postgresql://user:pass@host:5432/db" \
  --set secrets.geminiApiKey="your-key" \
  --set secrets.betterAuthSecret="$(openssl rand -hex 32)" \
  --set secrets.openaiDomainKey="your-key"
```

### Staging

```bash
# Install with staging values
helm install todo-app ./helm/todo-app \
  --namespace todo-app-staging \
  --create-namespace \
  --values helm/todo-app/values-staging.yaml \
  --set secrets.databaseUrl="$DATABASE_URL" \
  --set secrets.geminiApiKey="$GEMINI_API_KEY" \
  --set secrets.betterAuthSecret="$BETTER_AUTH_SECRET" \
  --set secrets.openaiDomainKey="$OPENAI_DOMAIN_KEY"
```

### Production

```bash
# Install with production values
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-prod.yaml \
  --set secrets.databaseUrl="$DATABASE_URL" \
  --set secrets.geminiApiKey="$GEMINI_API_KEY" \
  --set secrets.betterAuthSecret="$BETTER_AUTH_SECRET" \
  --set secrets.openaiDomainKey="$OPENAI_DOMAIN_KEY"
```

## Configuration

The following table lists the configurable parameters of the Todo App chart and their default values.

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Namespace to deploy resources | `todo-app` |
| `global.imagePullPolicy` | Image pull policy | `IfNotPresent` |
| `global.registry` | Container registry | `docker.io` |

### Frontend Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of frontend replicas | `2` |
| `frontend.image.repository` | Frontend image repository | `todo-frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.service.type` | Frontend service type | `ClusterIP` |
| `frontend.service.port` | Frontend service port | `80` |
| `frontend.resources.requests.cpu` | CPU request | `100m` |
| `frontend.resources.requests.memory` | Memory request | `128Mi` |
| `frontend.autoscaling.enabled` | Enable HPA | `false` |
| `frontend.autoscaling.minReplicas` | Minimum replicas | `2` |
| `frontend.autoscaling.maxReplicas` | Maximum replicas | `5` |

### Backend Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Number of backend replicas | `2` |
| `backend.image.repository` | Backend image repository | `todo-backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.service.type` | Backend service type | `ClusterIP` |
| `backend.service.port` | Backend service port | `8000` |
| `backend.resources.requests.cpu` | CPU request | `200m` |
| `backend.resources.requests.memory` | Memory request | `256Mi` |
| `backend.autoscaling.enabled` | Enable HPA | `false` |

### MCP Server Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mcpServer.enabled` | Enable MCP server deployment | `true` |
| `mcpServer.replicaCount` | Number of MCP server replicas | `1` |
| `mcpServer.image.repository` | MCP server image repository | `todo-mcp-server` |
| `mcpServer.image.tag` | MCP server image tag | `latest` |
| `mcpServer.service.port` | MCP server service port | `8001` |

### Ingress Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts[0].host` | Hostname | `todo.local` |
| `ingress.tls` | TLS configuration | `[]` |

### Secret Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.databaseUrl` | Database connection string | `""` |
| `secrets.geminiApiKey` | Gemini API key | `""` |
| `secrets.betterAuthSecret` | Better Auth secret | `""` |
| `secrets.openaiDomainKey` | OpenAI domain key | `""` |

## Upgrading

```bash
# Upgrade with new values
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app \
  --values helm/todo-app/values-dev.yaml \
  --set frontend.image.tag=v1.1.0
```

## Uninstalling

```bash
helm uninstall todo-app --namespace todo-app
```

## Accessing the Application

### Minikube (Development)

1. Add to `/etc/hosts`:
   ```bash
   echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
   ```

2. Access via browser:
   ```
   http://todo.local
   ```

### Port Forwarding

```bash
# Frontend
kubectl port-forward -n todo-app service/todo-app-frontend 3000:80

# Backend
kubectl port-forward -n todo-app service/todo-app-backend 8000:8000

# MCP Server
kubectl port-forward -n todo-app service/todo-app-mcp-server 8001:8001
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n todo-app
```

### View Logs

```bash
# Frontend
kubectl logs -n todo-app -l app.kubernetes.io/component=frontend --tail=100 -f

# Backend
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=100 -f

# MCP Server
kubectl logs -n todo-app -l app.kubernetes.io/component=mcp-server --tail=100 -f
```

### Debug Failed Pods

```bash
kubectl describe pod -n todo-app <pod-name>
```

### Verify ConfigMap and Secrets

```bash
kubectl get configmap -n todo-app
kubectl get secret -n todo-app
```

## Chart Development

### Linting

```bash
helm lint ./helm/todo-app
```

### Template Rendering

```bash
helm template todo-app ./helm/todo-app --values helm/todo-app/values-dev.yaml
```

### Dry Run

```bash
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-dev.yaml \
  --dry-run --debug
```

## License

MIT
