# Data Model: Kubernetes Resources

**Feature**: 001-k8s-local-deploy
**Phase**: Phase 1 - Design
**Date**: 2025-12-24

## Overview

This document defines the Kubernetes resource models for deploying the Todo application. Unlike traditional database entities, this phase deals with infrastructure entities (Kubernetes resources).

---

## 1. Namespace

**Purpose**: Isolate all Todo application resources

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todo-app
  labels:
    app.kubernetes.io/name: todo-app
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/managed-by: helm
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Namespace identifier |
| labels | map | Yes | Standard K8s labels |

---

## 2. ConfigMap

**Purpose**: Store non-sensitive configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: todo-app
data:
  NODE_ENV: "production"
  NEXT_PUBLIC_API_URL: "http://backend:8000"
  NEXT_PUBLIC_MCP_URL: "http://mcp-server:8001"
  MCP_SERVER_URL: "http://mcp-server:8001"
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| NODE_ENV | string | Yes | Environment mode |
| NEXT_PUBLIC_API_URL | string | Yes | Backend URL for frontend |
| NEXT_PUBLIC_MCP_URL | string | Yes | MCP URL for frontend |
| MCP_SERVER_URL | string | Yes | MCP URL for backend |

---

## 3. Secret

**Purpose**: Store sensitive configuration (API keys, secrets)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: todo-app
type: Opaque
stringData:
  DATABASE_URL: ""      # Set via kubectl or Helm --set
  GEMINI_API_KEY: ""    # Set via kubectl or Helm --set
  BETTER_AUTH_SECRET: "" # Set via kubectl or Helm --set
  NEXT_PUBLIC_OPENAI_DOMAIN_KEY: "" # Set via kubectl or Helm --set
```

**Fields**:
| Field | Type | Required | Description | Sensitive |
|-------|------|----------|-------------|-----------|
| DATABASE_URL | string | Yes | Neon PostgreSQL connection | Yes |
| GEMINI_API_KEY | string | Yes | Google Gemini API key | Yes |
| BETTER_AUTH_SECRET | string | Yes | Better Auth JWT secret | Yes |
| NEXT_PUBLIC_OPENAI_DOMAIN_KEY | string | No | OpenAI ChatKit key | Yes |

---

## 4. Deployment: MCP Server

**Purpose**: Run FastMCP server pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  namespace: todo-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
        tier: backend
    spec:
      containers:
        - name: mcp-server
          image: todo-mcp-server:latest
          ports:
            - containerPort: 8001
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 300m
              memory: 128Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - secretRef:
                name: app-secrets
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| replicas | int | Yes | 1 | Number of pod replicas |
| image | string | Yes | todo-mcp-server:latest | Container image |
| containerPort | int | Yes | 8001 | Exposed port |
| cpu.requests | string | Yes | 100m | Minimum CPU |
| cpu.limits | string | Yes | 300m | Maximum CPU |
| memory.requests | string | Yes | 64Mi | Minimum memory |
| memory.limits | string | Yes | 128Mi | Maximum memory |

---

## 5. Deployment: Backend

**Purpose**: Run FastAPI backend pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: todo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
        tier: backend
    spec:
      containers:
        - name: backend
          image: todo-backend:latest
          ports:
            - containerPort: 8000
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| replicas | int | Yes | 2 | Number of pod replicas |
| image | string | Yes | todo-backend:latest | Container image |
| containerPort | int | Yes | 8000 | Exposed port |
| cpu.requests | string | Yes | 200m | Minimum CPU |
| cpu.limits | string | Yes | 1000m | Maximum CPU |
| memory.requests | string | Yes | 256Mi | Minimum memory |
| memory.limits | string | Yes | 512Mi | Maximum memory |

---

## 6. Deployment: Frontend

**Purpose**: Run Next.js frontend pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: todo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        tier: frontend
    spec:
      containers:
        - name: frontend
          image: todo-frontend:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| replicas | int | Yes | 2 | Number of pod replicas |
| image | string | Yes | todo-frontend:latest | Container image |
| containerPort | int | Yes | 3000 | Exposed port |
| cpu.requests | string | Yes | 100m | Minimum CPU |
| cpu.limits | string | Yes | 500m | Maximum CPU |
| memory.requests | string | Yes | 128Mi | Minimum memory |
| memory.limits | string | Yes | 256Mi | Maximum memory |

---

## 7. Service: MCP Server

**Purpose**: Internal access to MCP Server pods

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
  namespace: todo-app
spec:
  type: ClusterIP
  selector:
    app: mcp-server
  ports:
    - port: 8001
      targetPort: 8001
      protocol: TCP
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | string | Yes | ClusterIP | Service type |
| port | int | Yes | 8001 | Service port |
| targetPort | int | Yes | 8001 | Pod port |

**DNS Name**: `mcp-server.todo-app.svc.cluster.local` (or `mcp-server`)

---

## 8. Service: Backend

**Purpose**: Internal access to Backend pods

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: todo-app
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | string | Yes | ClusterIP | Service type |
| port | int | Yes | 8000 | Service port |
| targetPort | int | Yes | 8000 | Pod port |

**DNS Name**: `backend.todo-app.svc.cluster.local` (or `backend`)

---

## 9. Service: Frontend

**Purpose**: External access to Frontend pods

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: todo-app
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      nodePort: 30080  # Optional: auto-assigned if not specified
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | string | Yes | NodePort | Service type (NodePort for Minikube) |
| port | int | Yes | 80 | Service port |
| targetPort | int | Yes | 3000 | Pod port |
| nodePort | int | No | Auto | External port (30000-32767) |

**Access Methods**:
- `minikube service frontend -n todo-app`
- `http://<minikube-ip>:30080`

---

## 10. Ingress

**Purpose**: URL-based external access

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

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ingressClassName | string | Yes | nginx | Ingress controller |
| host | string | Yes | todo.local | Hostname |
| path | string | Yes | / | URL path |
| pathType | string | Yes | Prefix | Path matching |
| service.name | string | Yes | frontend | Backend service |
| service.port | int | Yes | 80 | Backend port |

**Local Setup**:
```bash
echo "$(minikube ip) todo.local" | sudo tee -a /etc/hosts
```

---

## Resource Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                       Namespace: todo-app                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌─────────────┐                           │
│  │  ConfigMap  │      │   Secret    │                           │
│  │ app-config  │      │ app-secrets │                           │
│  └──────┬──────┘      └──────┬──────┘                           │
│         │                    │                                   │
│         └────────┬───────────┘                                   │
│                  ▼                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Deployments                           │    │
│  │                                                          │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │    │
│  │  │  mcp-server  │ │   backend    │ │   frontend   │     │    │
│  │  │   (1 pod)    │ │  (2 pods)    │ │  (2 pods)    │     │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │    │
│  └─────────┼────────────────┼────────────────┼──────────────┘    │
│            ▼                ▼                ▼                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     Services                             │    │
│  │                                                          │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │    │
│  │  │  mcp-server  │ │   backend    │ │   frontend   │     │    │
│  │  │ ClusterIP    │ │ ClusterIP    │ │  NodePort    │     │    │
│  │  │   :8001      │ │   :8000      │ │   :80        │     │    │
│  │  └──────────────┘ └──────────────┘ └──────┬───────┘     │    │
│  └───────────────────────────────────────────┼──────────────┘    │
│                                              ▼                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Ingress                             │    │
│  │              todo.local → frontend:80                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Helm Values Schema

For Helm chart templating, values follow this structure:

```yaml
# values.yaml schema
namespace: todo-app

frontend:
  replicaCount: 2
  image:
    repository: todo-frontend
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: NodePort
    port: 80
    targetPort: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 256Mi

backend:
  replicaCount: 2
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 8000
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi

mcpServer:
  replicaCount: 1
  image:
    repository: todo-mcp-server
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 8001
  resources:
    requests:
      cpu: 100m
      memory: 64Mi
    limits:
      cpu: 300m
      memory: 128Mi

ingress:
  enabled: true
  className: nginx
  host: todo.local

config:
  nodeEnv: production
  apiUrl: http://backend:8000
  mcpUrl: http://mcp-server:8001

secrets:
  # Set via --set or --set-file
  databaseUrl: ""
  geminiApiKey: ""
  betterAuthSecret: ""
  openaiDomainKey: ""
```

---

**Data Model Version**: 1.0.0
**Created**: December 24, 2025
