# Research: Local Kubernetes Deployment

**Feature**: 001-k8s-local-deploy
**Phase**: Phase 0 - Research
**Date**: 2025-12-24

## Research Summary

This document captures research findings for containerizing and deploying the Todo application to a local Kubernetes cluster.

---

## 1. Docker Multi-Stage Builds

### Decision: Use multi-stage builds for all containers

**Rationale**:
- Separates build dependencies from runtime
- Reduces final image size by 60-80%
- Improves security by removing build tools
- Follows Docker best practices

**Research Findings**:

#### Next.js Standalone Output
- Next.js 13+ supports `output: 'standalone'` in `next.config.js`
- Creates a minimal server without `node_modules`
- Final image can be as small as 50-150MB with Alpine
- Requires copying `.next/standalone`, `.next/static`, and `public`

**Pattern**:
```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

#### FastAPI with UV
- UV is a fast Python package manager (Rust-based)
- Supports `uv pip compile` for lock files
- Can export requirements for Docker builds
- Final image should only include runtime deps

**Pattern**:
```dockerfile
# Stage 1: Builder
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache-dir -e .

# Stage 2: Runtime
FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY ./src ./src
RUN useradd -m appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Alternatives Considered**:
1. Single-stage build - Rejected (image too large, includes build tools)
2. Distroless images - Considered for future (more complex debugging)

---

## 2. Kubernetes Service Types

### Decision: Use ClusterIP for internal, NodePort for frontend

**Rationale**:
- ClusterIP: Internal services don't need external access
- NodePort: Exposes frontend on high port for Minikube access
- Ingress: Provides clean URL routing

**Research Findings**:

| Service Type | Use Case | Minikube Support |
|--------------|----------|------------------|
| ClusterIP | Internal services | ✅ Full support |
| NodePort | Direct port access | ✅ Full support |
| LoadBalancer | Cloud load balancer | ⚠️ Requires `minikube tunnel` |
| Ingress | URL-based routing | ✅ With addon |

**For Minikube**:
- Enable Ingress: `minikube addons enable ingress`
- Access via NodePort: `minikube service <name>`
- Access via Ingress: Add to `/etc/hosts`

**Alternatives Considered**:
1. LoadBalancer only - Rejected (requires tunnel, more complex)
2. Port-forward only - Rejected (inconvenient for testing)

---

## 3. Helm Chart Structure

### Decision: Use standard Helm chart structure with values overlays

**Rationale**:
- Enables multi-environment deployment
- Provides templating and conditionals
- Standard structure for team familiarity
- Supports `helm upgrade` for updates

**Research Findings**:

**Standard Structure**:
```
helm/todo-app/
├── Chart.yaml           # Chart metadata
├── values.yaml          # Default values
├── values-dev.yaml      # Development overrides
├── values-staging.yaml  # Staging overrides
├── values-prod.yaml     # Production overrides
└── templates/
    ├── _helpers.tpl     # Template helpers
    ├── NOTES.txt        # Post-install notes
    ├── deployment.yaml  # Deployment template
    ├── service.yaml     # Service template
    └── ingress.yaml     # Ingress template
```

**Best Practices**:
- Use `{{ .Values.x | default "value" }}` for defaults
- Use `{{ include "chart.labels" . }}` for reusable labels
- Use `{{ range }}` for lists/arrays
- Keep secrets separate with `--set` or external secrets

**Alternatives Considered**:
1. Kustomize - Rejected (less flexible for complex templating)
2. Raw manifests only - Rejected (no templating for multi-env)

---

## 4. Health Check Endpoints

### Decision: Use HTTP GET probes for all services

**Rationale**:
- Simple to implement
- Works with existing endpoints
- Standard Kubernetes pattern
- Easy to debug

**Research Findings**:

| Service | Endpoint | Expected Response | Timeout |
|---------|----------|-------------------|---------|
| Frontend | GET / | HTTP 200 | 5s |
| Backend | GET /health | {"status": "healthy"} | 5s |
| MCP Server | GET /health | {"status": "healthy"} | 5s |

**Probe Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Alternatives Considered**:
1. TCP probes - Rejected (less informative)
2. Exec probes - Rejected (more overhead)

---

## 5. Resource Limits

### Decision: Conservative limits for local development

**Rationale**:
- Minikube has limited resources (4 CPU, 8GB RAM)
- Prevent resource starvation
- Allow room for Kubernetes system pods
- Can scale up in production

**Research Findings**:

**Total Cluster Allocation** (Minikube with 4 CPU, 8GB):
- Kubernetes system: ~500m CPU, ~1GB RAM
- Available for app: ~3500m CPU, ~7GB RAM

**Per-Service Allocation**:
| Service | CPU Req | CPU Lim | Mem Req | Mem Lim |
|---------|---------|---------|---------|---------|
| Frontend (x2) | 200m | 1000m | 256Mi | 512Mi |
| Backend (x2) | 400m | 2000m | 512Mi | 1024Mi |
| MCP Server (x1) | 100m | 300m | 64Mi | 128Mi |
| **Total Max** | **700m** | **3300m** | **832Mi** | **1664Mi** |

**Safe Margin**: 200m CPU, 5GB RAM available for bursts

**Alternatives Considered**:
1. No limits - Rejected (resource starvation risk)
2. Higher limits - Rejected (Minikube constraints)

---

## 6. AIOps Tools

### Decision: Document all three tools (Gordon, kubectl-ai, Kagent)

**Rationale**:
- Accelerates troubleshooting
- Reduces learning curve
- Provides optimization suggestions
- Modern DevOps practice

**Research Findings**:

#### Docker AI (Gordon)
- **Version**: Docker Desktop 4.53+ (beta feature)
- **Enable**: Settings → Features in Development → Docker AI
- **Usage**: `docker ai "analyze my Dockerfile for optimizations"`
- **Capabilities**:
  - Generate Dockerfiles
  - Optimize existing Dockerfiles
  - Debug build errors
  - Suggest security improvements

#### kubectl-ai
- **Install**: `go install github.com/GoogleCloudPlatform/kubectl-ai`
- **Config**: Requires OpenAI API key
- **Usage**: `kubectl-ai "deploy my application"`
- **Capabilities**:
  - Generate kubectl commands
  - Troubleshoot pods
  - Analyze resource usage
  - Suggest scaling strategies

#### Kagent
- **Install**: `go install github.com/kagent-dev/kagent`
- **Usage**: `kagent "check cluster health"`
- **Capabilities**:
  - Cluster health analysis
  - Resource optimization
  - Security recommendations
  - Performance tuning

**Alternatives Considered**:
1. Skip AIOps - Rejected (valuable for productivity)
2. Only one tool - Rejected (each has unique strengths)

---

## 7. Secrets Management

### Decision: Kubernetes Secrets with external references

**Rationale**:
- Native Kubernetes feature
- Supports environment variable injection
- Works with Helm values
- Prepares for external secrets (Phase 5)

**Research Findings**:

**Secret Creation**:
```bash
# From literal values
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=GEMINI_API_KEY=...

# From .env file
kubectl create secret generic app-secrets \
  --from-env-file=backend/.env
```

**Usage in Deployment**:
```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: DATABASE_URL
```

**Security Rules**:
- Never commit secret values to Git
- Use `kubectl apply -f secret.yaml` with empty values as template
- Actual values set via `--set` or separate secure process

**Alternatives Considered**:
1. External Secrets Operator - Rejected (overkill for Phase 4)
2. HashiCorp Vault - Rejected (complex for local dev)
3. SOPS - Considered for Phase 5

---

## 8. Minikube Configuration

### Decision: Single-node cluster with 4 CPU, 8GB RAM

**Rationale**:
- Sufficient for 5 pods (2+2+1)
- Leaves room for system pods
- Works on most dev machines
- Matches production-like behavior

**Research Findings**:

**Recommended Start Command**:
```bash
minikube start \
  --cpus=4 \
  --memory=8192 \
  --driver=docker \
  --addons=ingress,metrics-server
```

**Required Addons**:
| Addon | Purpose |
|-------|---------|
| ingress | External access via URLs |
| metrics-server | Resource monitoring |
| dashboard | Web UI (optional) |

**Image Loading**:
```bash
# Option 1: Build in Minikube's Docker
eval $(minikube docker-env)
docker build -t app:latest .

# Option 2: Load from local
minikube image load app:latest
```

**Alternatives Considered**:
1. Multi-node cluster - Rejected (overkill for dev)
2. Kind - Rejected (Minikube more feature-rich)
3. k3s - Considered for lightweight alternative

---

## 9. Ingress Configuration

### Decision: NGINX Ingress Controller with host-based routing

**Rationale**:
- Standard Kubernetes pattern
- Built into Minikube addons
- Supports path-based routing
- Easy SSL termination in production

**Research Findings**:

**Ingress Resource**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-ingress
  namespace: todo-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
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

**Local Access Setup**:
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Add to /etc/hosts
echo "$MINIKUBE_IP todo.local" | sudo tee -a /etc/hosts
```

**Alternatives Considered**:
1. Traefik - Rejected (NGINX more common)
2. No Ingress (NodePort only) - Rejected (not production-like)

---

## 10. Existing Dockerfiles Review

### Decision: Use existing Dockerfiles as base, optimize if needed

**Research Findings**:

**Frontend Dockerfile** (frontend/Dockerfile):
- Already exists and uses multi-stage build
- Needs review for standalone output configuration
- May need optimization for image size

**Backend Dockerfile** (backend/Dockerfile):
- Already exists
- Needs review for UV compatibility
- Should ensure non-root user

**Next Steps**:
1. Review existing Dockerfiles
2. Verify they meet constitution requirements
3. Optimize with Gordon if needed
4. Add health check endpoints if missing

---

## Research Conclusions

All technology choices have been researched and validated:

| Area | Decision | Confidence |
|------|----------|------------|
| Docker builds | Multi-stage | High |
| Service types | ClusterIP + NodePort | High |
| Helm structure | Standard with overlays | High |
| Health checks | HTTP GET probes | High |
| Resource limits | Conservative for Minikube | High |
| AIOps tools | Gordon + kubectl-ai + Kagent | Medium |
| Secrets | K8s Secrets | High |
| Minikube config | 4 CPU, 8GB RAM | High |
| Ingress | NGINX with host routing | High |

**No NEEDS CLARIFICATION items remain.**

---

**Research Version**: 1.0.0
**Completed**: December 24, 2025
