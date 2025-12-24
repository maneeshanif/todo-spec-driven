# Contract: Service Discovery

**Feature**: 001-k8s-local-deploy
**Type**: Infrastructure Contract
**Date**: 2025-12-24

## Overview

This contract defines how services discover and communicate with each other within the Kubernetes cluster.

---

## Service DNS Names

Kubernetes provides automatic DNS for Services. Within the `todo-app` namespace:

| Service | Short Name | Full DNS Name |
|---------|------------|---------------|
| Frontend | `frontend` | `frontend.todo-app.svc.cluster.local` |
| Backend | `backend` | `backend.todo-app.svc.cluster.local` |
| MCP Server | `mcp-server` | `mcp-server.todo-app.svc.cluster.local` |

**Usage**: Use short names within the same namespace.

---

## Communication Paths

### Frontend → Backend

**From**: Frontend pods (Next.js)
**To**: Backend service (FastAPI)
**URL**: `http://backend:8000`
**Protocol**: HTTP (internal, no TLS)

**Environment Variable**:
```yaml
env:
  - name: NEXT_PUBLIC_API_URL
    value: "http://backend:8000"
```

**Usage in Frontend**:
```typescript
// Frontend calls backend API
const response = await fetch('http://backend:8000/api/tasks');
```

**Note**: For server-side rendering, Next.js can use internal K8s DNS. For client-side, CORS must be configured.

---

### Backend → MCP Server

**From**: Backend pods (FastAPI)
**To**: MCP Server service (FastMCP)
**URL**: `http://mcp-server:8001`
**Protocol**: HTTP (internal, no TLS)

**Environment Variable**:
```yaml
env:
  - name: MCP_SERVER_URL
    value: "http://mcp-server:8001"
```

**Usage in Backend**:
```python
# Backend calls MCP server
import httpx

mcp_url = os.getenv("MCP_SERVER_URL", "http://mcp-server:8001")
async with httpx.AsyncClient() as client:
    response = await client.post(f"{mcp_url}/mcp", json={"tool": "add_task", ...})
```

---

### Backend → External Database (Neon)

**From**: Backend pods
**To**: Neon PostgreSQL (external)
**URL**: `postgresql+asyncpg://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`
**Protocol**: PostgreSQL over TLS

**Environment Variable** (from Secret):
```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: DATABASE_URL
```

**Note**: External connections require internet access from pods. Neon connection string includes SSL mode.

---

### External → Frontend (User Access)

**From**: User browser
**To**: Frontend service via Ingress
**URL**: `http://todo.local` (development)
**Protocol**: HTTP

**Ingress Configuration**:
```yaml
spec:
  rules:
    - host: todo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

**Local Setup Required**:
```bash
# Add to /etc/hosts
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
```

---

## Port Mapping

| Service | Container Port | Service Port | External Port |
|---------|----------------|--------------|---------------|
| Frontend | 3000 | 80 | via Ingress |
| Backend | 8000 | 8000 | Internal only |
| MCP Server | 8001 | 8001 | Internal only |

---

## Network Policy (Future)

For enhanced security, network policies can restrict traffic:

```yaml
# Example: Only allow backend to access MCP server
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mcp-server-policy
  namespace: todo-app
spec:
  podSelector:
    matchLabels:
      app: mcp-server
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: backend
      ports:
        - protocol: TCP
          port: 8001
```

**Note**: NetworkPolicy is not implemented in Phase 4. Consider for Phase 5.

---

## CORS Configuration

Backend must allow requests from frontend domain:

```python
# backend/src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://todo.local",
        "http://frontend",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Service Discovery Testing

**Verify DNS Resolution**:
```bash
# From a debug pod
kubectl run dns-test --rm -it --image=busybox -n todo-app -- sh

# Inside the pod
nslookup backend
nslookup mcp-server
nslookup frontend
```

**Verify Connectivity**:
```bash
# From a test pod
kubectl run test-pod --rm -it --image=curlimages/curl -n todo-app -- sh

# Inside the pod
curl http://backend:8000/health
curl http://mcp-server:8001/health
curl http://frontend:80/
```

---

## Troubleshooting

### DNS Resolution Fails

**Symptom**: `nslookup: can't resolve 'backend'`

**Causes**:
1. Service not created
2. Wrong namespace
3. CoreDNS not running

**Solutions**:
```bash
# Check service exists
kubectl get svc -n todo-app

# Check CoreDNS pods
kubectl get pods -n kube-system | grep coredns

# Restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

### Connection Refused

**Symptom**: `curl: (7) Failed to connect to backend port 8000`

**Causes**:
1. No pods running
2. Pods not ready
3. Service selector mismatch

**Solutions**:
```bash
# Check pods are running
kubectl get pods -n todo-app

# Check service has endpoints
kubectl get endpoints -n todo-app

# Check pod labels match service selector
kubectl describe svc backend -n todo-app
```

---

**Contract Version**: 1.0.0
**Created**: December 24, 2025
