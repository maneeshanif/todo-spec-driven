# Phase 4: Complete Deployment Flow

> A-to-Z guide explaining how the Todo Web Application is deployed from source code to running Kubernetes cluster.

## Deployment Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT PIPELINE OVERVIEW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STAGE 1         STAGE 2          STAGE 3            STAGE 4         STAGE 5   │
│  Create          Enable           Build Images       Deploy with     Access    │
│  Cluster         Addons           INSIDE Cluster     Helm            via       │
│                                                                      Port-Fwd  │
│                                                                                  │
│  minikube        minikube         eval $(minikube    helm install    kubectl   │
│  start           addons enable    docker-env) &&     todo-app        port-fwd  │
│                  ingress          docker build       ./helm/...                 │
│                                                                                  │
│     │               │                  │                  │             │       │
│     ▼               ▼                  ▼                  ▼             ▼       │
│  ┌──────┐       ┌──────┐          ┌──────────┐      ┌──────────┐   ┌────────┐  │
│  │K8s   │       │Ingress│         │Images in │      │Namespace │   │Browser │  │
│  │Nodes │       │Metrics│         │Minikube  │      │Secrets   │   │Access  │  │
│  │Ready │       │Server │         │Docker    │      │Deploys   │   │:3000   │  │
│  └──────┘       └──────┘          └──────────┘      │Services  │   └────────┘  │
│                                                      └──────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## What Each Stage Does

| Stage | Command | What It Creates |
|-------|---------|-----------------|
| **1. Create Cluster** | `minikube start` | Kubernetes control plane + worker node (VM/container) |
| **2. Enable Addons** | `minikube addons enable ingress` | Extra K8s features (ingress controller for routing, metrics for monitoring) |
| **3. Build Images** | `eval $(minikube docker-env) && docker build` | Docker images **INSIDE** Minikube's Docker daemon (not local Docker!) |
| **4. Deploy Helm** | `helm install` | Namespace → Secrets → ConfigMaps → Deployments → Services → Ingress |
| **5. Port-Forward** | `kubectl port-forward` | Network tunnel from localhost:3000 → K8s pod |

### Key Insight: Build Images INSIDE Minikube

```bash
# WRONG: Building locally requires "minikube image load" to copy images
docker build -t app:latest .          # ❌ Builds in Docker Desktop
minikube image load app:latest        # ❌ Extra step to copy to Minikube

# CORRECT: Build directly inside Minikube's Docker
eval $(minikube docker-env)           # ✅ Connect terminal to Minikube's Docker
docker build -t app:latest .          # ✅ Image built INSIDE Minikube
                                      # ✅ No loading/copying needed!
```

---

## Stage 1: Source Code Structure

```
todo-web-hackthon/
├── frontend/                 # Next.js application (Port 3000)
│   ├── app/                  # Pages and routes
│   ├── components/           # React components
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # ← How to containerize frontend
│
├── backend/                  # FastAPI application (Port 8000)
│   ├── src/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── routers/         # API endpoints
│   │   └── mcp_server/      # MCP server code (Port 8001)
│   ├── pyproject.toml       # Python dependencies
│   ├── Dockerfile           # ← How to containerize backend
│   └── Dockerfile.mcp       # ← How to containerize MCP server
│
├── k8s/                      # Raw Kubernetes manifests (Option A)
├── helm/todo-app/            # Helm chart (Option B - we use this)
└── docker-compose.yml        # Local Docker orchestration
```

---

## Stage 2: Building Docker Images

### What is a Docker Image?
A Docker image is a **packaged version of your application** with all dependencies, ready to run anywhere.

### Files Used:

#### 1. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                          # Install dependencies
COPY . .
RUN npm run build                   # Build Next.js (creates .next/)

# Stage 2: Run the app (smaller image)
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000                         # Frontend listens on 3000
CMD ["node", "server.js"]
```

#### 2. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen               # Install Python dependencies

FROM python:3.13-slim AS runner
WORKDIR /app
COPY --from=builder /app/.venv ./.venv
COPY src/ ./src/
EXPOSE 8000                        # Backend listens on 8000
CMD [".venv/bin/uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 3. MCP Server Dockerfile (`backend/Dockerfile.mcp`)
```dockerfile
FROM python:3.13-slim
WORKDIR /app
# Similar to backend, but runs MCP server
EXPOSE 8001                        # MCP listens on 8001
CMD [".venv/bin/python", "-m", "src.mcp_server.server"]
```

### Build Commands:
```bash
# Step 1: Connect Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Step 2: Build all 3 images (names must match values-dev.yaml)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend

# Step 3: Disconnect from Minikube's Docker
eval $(minikube docker-env --unset)
```

### Result:
```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER IMAGES                             │
├─────────────────────────────────────────────────────────────┤
│  todo-frontend:latest    (301 MB)  - Next.js app            │
│  todo-backend:latest     (524 MB)  - FastAPI + AI deps      │
│  todo-mcp-server:latest  (524 MB)  - FastMCP server         │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 3: Creating the Kubernetes Cluster (Minikube)

### What is Minikube?
Minikube creates a **local Kubernetes cluster** on your machine - a mini version of what runs in production clouds.

### Commands:
```bash
# Start Minikube with resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable required addons
minikube addons enable ingress         # For external access
minikube addons enable metrics-server  # For monitoring
```

### Result:
```
┌─────────────────────────────────────────────────────────────┐
│                    MINIKUBE CLUSTER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Control Plane (minikube)                │    │
│  │  - API Server (kubectl talks to this)               │    │
│  │  - Scheduler (decides where pods run)               │    │
│  │  - Controller Manager (maintains desired state)     │    │
│  │  - etcd (cluster database)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Docker Images loaded:                                       │
│  - todo-app/frontend:latest                                  │
│  - todo-app/backend:latest                                   │
│  - todo-app/mcp-server:latest                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 4: Deploying with Helm (or Raw K8s)

### Two Options for Deployment:

| Option | Files Used | When to Use |
|--------|-----------|-------------|
| **A) Raw K8s** | `k8s/*.yaml` | Simple, one-off deployments |
| **B) Helm** | `helm/todo-app/` | Reusable, multi-environment (WE USE THIS) |

---

### Option A: Raw Kubernetes Manifests (`k8s/` directory)

```
k8s/
├── 00-namespace.yaml          # Creates "todo-app" namespace
├── 01-configmap.yaml          # Environment variables (non-secret)
├── 02-secret.yaml             # Secrets (DB URL, API keys)
├── 03-mcp-server-deployment.yaml
├── 04-mcp-server-service.yaml
├── 05-backend-deployment.yaml
├── 06-backend-service.yaml
├── 07-frontend-deployment.yaml
├── 08-frontend-service.yaml
└── 09-ingress.yaml            # External access rules
```

**Deploy with:**
```bash
kubectl apply -f k8s/
```

---

### Option B: Helm Chart (`helm/todo-app/` directory) - **WE USE THIS**

```
helm/todo-app/
├── Chart.yaml                 # Chart metadata (name, version)
├── values.yaml                # DEFAULT configuration values
├── values-dev.yaml            # Minikube-specific overrides
├── values-staging.yaml        # Staging environment
├── values-prod.yaml           # Production environment
│
└── templates/                 # TEMPLATES (generate K8s YAML)
    ├── _helpers.tpl           # Reusable template functions
    ├── NOTES.txt              # Post-install instructions
    ├── namespace.yaml         # Namespace template
    ├── configmap.yaml         # ConfigMap template
    ├── secret.yaml            # Secret template
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── mcp-deployment.yaml
    ├── mcp-service.yaml
    ├── ingress.yaml
    └── hpa.yaml               # Horizontal Pod Autoscaler
```

### How Helm Works:

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   values.yaml    │  +   │ values-dev.yaml  │  →   │  Final Values    │
│  (defaults)      │      │  (overrides)     │      │  (merged)        │
└──────────────────┘      └──────────────────┘      └────────┬─────────┘
                                                              │
                                                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     templates/*.yaml                                  │
│                                                                       │
│  Example: templates/backend-deployment.yaml                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  replicas: {{ .Values.backend.replicaCount }}     ← from values │  │
│  │  image: {{ .Values.backend.image.repository }}:{{ .tag }}      │  │
│  │  resources:                                                     │  │
│  │    limits:                                                      │  │
│  │      cpu: {{ .Values.backend.resources.limits.cpu }}           │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                GENERATED Kubernetes YAML                              │
│  (Same as what's in k8s/ but with values filled in)                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Helm Deploy Command:
```bash
helm install todo-app ./helm/todo-app \
  -n todo-app \
  --create-namespace \
  -f ./helm/todo-app/values-dev.yaml \
  --set secrets.databaseUrl="postgresql+asyncpg://..." \
  --set secrets.geminiApiKey="AIza..." \
  --set secrets.betterAuthSecret="riI0..." \
  --set secrets.openaiDomainKey="domain_pk_..."
```

### What Helm Creates in Kubernetes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES RESOURCES CREATED                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. NAMESPACE: todo-app                                                  │
│     └─ Isolated space for all our resources                             │
│                                                                          │
│  2. CONFIGMAP: todo-app-config                                          │
│     ├─ NODE_ENV=production                                              │
│     ├─ NEXT_PUBLIC_API_URL=http://todo-app-backend:8000                │
│     ├─ NEXT_PUBLIC_MCP_URL=http://todo-app-mcp-server:8001             │
│     ├─ MCP_SERVER_URL=http://todo-app-mcp-server:8001/mcp              │
│     └─ BETTER_AUTH_URL=http://todo-app-frontend:80                     │
│                                                                          │
│  3. SECRET: todo-app-secrets                                            │
│     ├─ DATABASE_URL (encrypted)                                         │
│     ├─ FRONTEND_DATABASE_URL (encrypted)                                │
│     ├─ GEMINI_API_KEY (encrypted)                                       │
│     ├─ BETTER_AUTH_SECRET (encrypted)                                   │
│     └─ NEXT_PUBLIC_OPENAI_DOMAIN_KEY (encrypted)                       │
│                                                                          │
│  4. DEPLOYMENTS (manage pods):                                          │
│     ├─ todo-app-frontend    (1 replica)                                 │
│     ├─ todo-app-backend     (1 replica)                                 │
│     └─ todo-app-mcp-server  (1 replica)                                 │
│                                                                          │
│  5. SERVICES (network endpoints):                                        │
│     ├─ todo-app-frontend    (NodePort 80 → 3000)                       │
│     ├─ todo-app-backend     (NodePort 8000 → 8000)                     │
│     └─ todo-app-mcp-server  (ClusterIP 8001 → 8001)                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 5: How Pods Run and Communicate

### What Gets Created:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MINIKUBE CLUSTER                                 │
│                         Namespace: todo-app                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        PODS (Running Containers)                 │    │
│  │                                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │    │
│  │  │ frontend Pod     │  │ backend Pod      │  │ mcp-server Pod│  │    │
│  │  │                  │  │                  │  │               │  │    │
│  │  │ Image:           │  │ Image:           │  │ Image:        │  │    │
│  │  │ todo-app/frontend│  │ todo-app/backend │  │ todo-app/mcp  │  │    │
│  │  │                  │  │                  │  │               │  │    │
│  │  │ Container Port:  │  │ Container Port:  │  │ Container:    │  │    │
│  │  │ 3000             │  │ 8000             │  │ 8001          │  │    │
│  │  │                  │  │                  │  │               │  │    │
│  │  │ Env vars from:   │  │ Env vars from:   │  │ Env vars from:│  │    │
│  │  │ - ConfigMap      │  │ - ConfigMap      │  │ - ConfigMap   │  │    │
│  │  │ - Secret         │  │ - Secret         │  │ - Secret      │  │    │
│  │  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘  │    │
│  │           │                     │                     │          │    │
│  └───────────┼─────────────────────┼─────────────────────┼──────────┘    │
│              │                     │                     │               │
│  ┌───────────┼─────────────────────┼─────────────────────┼──────────┐    │
│  │           ▼                     ▼                     ▼          │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │    │
│  │  │ frontend Service │  │ backend Service  │  │ mcp Service   │  │    │
│  │  │                  │  │                  │  │               │  │    │
│  │  │ Type: NodePort   │  │ Type: NodePort   │  │ Type:ClusterIP│  │    │
│  │  │ Port: 80         │  │ Port: 8000       │  │ Port: 8001    │  │    │
│  │  │ NodePort: 30453  │  │ NodePort: 32513  │  │ (internal)    │  │    │
│  │  │ Target: 3000     │  │ Target: 8000     │  │ Target: 8001  │  │    │
│  │  │                  │  │                  │  │               │  │    │
│  │  │ DNS Name:        │  │ DNS Name:        │  │ DNS Name:     │  │    │
│  │  │ todo-app-frontend│  │ todo-app-backend │  │ todo-app-mcp  │  │    │
│  │  └──────────────────┘  └──────────────────┘  └───────────────┘  │    │
│  │                    SERVICES LAYER                                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Types Explained:

| Type | Purpose | Accessible From |
|------|---------|-----------------|
| **ClusterIP** | Internal only | Other pods in cluster |
| **NodePort** | External via node IP | Outside cluster via `<NodeIP>:<NodePort>` |
| **LoadBalancer** | Cloud load balancer | Internet (cloud only) |

### Internal Communication (Pod to Pod):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     HOW SERVICES TALK TO EACH OTHER                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend Pod                                                            │
│      │                                                                   │
│      │ User clicks "Sign In"                                            │
│      │ Frontend calls: NEXT_PUBLIC_API_URL/api/auth/...                 │
│      │                                                                   │
│      ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Kubernetes DNS resolves:                                         │   │
│  │  "todo-app-backend" → 10.110.170.37 (ClusterIP)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      ▼                                                                   │
│  Backend Pod                                                             │
│      │                                                                   │
│      │ Backend validates JWT by fetching JWKS from:                     │
│      │ BETTER_AUTH_URL/api/auth/.well-known/jwks.json                  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Kubernetes DNS resolves:                                         │   │
│  │  "todo-app-frontend" → 10.109.230.30 (ClusterIP)                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      │ User sends chat message                                          │
│      │ Backend calls MCP Server:                                        │
│      │ MCP_SERVER_URL/mcp (http://todo-app-mcp-server:8001/mcp)        │
│      │                                                                   │
│      ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Kubernetes DNS resolves:                                         │   │
│  │  "todo-app-mcp-server" → 10.105.54.235 (ClusterIP)               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│      │                                                                   │
│      ▼                                                                   │
│  MCP Server Pod                                                          │
│      │                                                                   │
│      │ MCP executes task tools (list_tasks, create_task, etc.)         │
│      │ Returns result to Backend → Backend streams to Frontend         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 6: Accessing the Application (Port Forwarding)

### Why Port Forwarding?
Minikube runs inside Docker. To access services from your browser, you need to forward ports.

```bash
# Forward frontend (browser access)
kubectl port-forward svc/todo-app-frontend 3000:80 -n todo-app &

# Forward backend (API access)
kubectl port-forward svc/todo-app-backend 8000:8000 -n todo-app &
```

### Port Flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PORT FORWARDING FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  YOUR BROWSER                                                            │
│       │                                                                  │
│       │  http://localhost:3000                                          │
│       ▼                                                                  │
│  ┌─────────────────┐                                                    │
│  │ Port Forward    │  kubectl port-forward                              │
│  │ localhost:3000  │  ════════════════════                              │
│  └────────┬────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     MINIKUBE CLUSTER                             │    │
│  │                                                                  │    │
│  │    ┌──────────────────┐                                         │    │
│  │    │ frontend Service │                                         │    │
│  │    │ Port: 80         │                                         │    │
│  │    └────────┬─────────┘                                         │    │
│  │             │                                                    │    │
│  │             ▼                                                    │    │
│  │    ┌──────────────────┐                                         │    │
│  │    │ frontend Pod     │                                         │    │
│  │    │ Container: 3000  │  ← Next.js server running here          │    │
│  │    └──────────────────┘                                         │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Complete End-to-End Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DEPLOYMENT PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: CREATE KUBERNETES CLUSTER                                      │
│  ─────────────────────────────────                                      │
│  Command: minikube start --cpus=4 --memory=8192 --driver=docker         │
│  Result: Local Kubernetes cluster with control plane running            │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  STEP 2: ENABLE ADDONS                                                  │
│  ─────────────────────                                                  │
│  Command: minikube addons enable ingress metrics-server                 │
│  Result: Ingress controller + metrics server ready                      │
│  (Addons = extra K8s features not enabled by default)                   │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  STEP 3: BUILD DOCKER IMAGES (INSIDE MINIKUBE)                          │
│  ──────────────────────────────────────────────                         │
│  Command: eval $(minikube docker-env) && docker build ...               │
│  Files: frontend/Dockerfile, backend/Dockerfile, backend/Dockerfile.mcp │
│  Result: 3 images inside Minikube's Docker daemon (NOT local Docker!)   │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  STEP 4: DEPLOY WITH HELM                                               │
│  ────────────────────────────                                           │
│  Command: helm install todo-app ./helm/todo-app -f values-dev.yaml ...  │
│  Files: helm/todo-app/Chart.yaml, values.yaml, templates/*.yaml         │
│                                                                          │
│  What Helm creates (in order):                                          │
│    1. Namespace (todo-app) - isolated space for resources               │
│    2. ConfigMaps - environment variables (non-secret)                   │
│    3. Secrets - encrypted sensitive data (DB URL, API keys)             │
│    4. Deployments - pod specifications (replicas, images, resources)    │
│    5. Services - network endpoints (how pods are accessed)              │
│    6. Ingress - external routing rules                                  │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  STEP 5: PODS START AND COMMUNICATE                                     │
│  ───────────────────────────────────                                    │
│  - Deployments create Pods → Pods run Containers from Docker images     │
│  - Each pod gets env vars from ConfigMap + Secret                       │
│  - Pods find each other via Kubernetes DNS (service names)              │
│  - Health checks verify pods are ready                                  │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  STEP 6: ACCESS VIA PORT FORWARDING                                     │
│  ───────────────────────────────────                                    │
│  Command: kubectl port-forward svc/todo-app-frontend 3000:80            │
│  Result: localhost:3000 → frontend Service → frontend Pod → Container   │
│                                                                          │
│                              ▼                                           │
│                                                                          │
│  ✅ APPLICATION RUNNING AT http://localhost:3000                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files Summary by Stage

| Stage | Files Used | Purpose |
|-------|-----------|---------|
| **Build Images** | `frontend/Dockerfile`, `backend/Dockerfile`, `backend/Dockerfile.mcp` | Define how to package each app |
| **Cluster Setup** | (Minikube CLI) | Create local K8s environment |
| **Helm Chart** | `helm/todo-app/Chart.yaml` | Chart metadata |
| | `helm/todo-app/values.yaml` | Default configuration |
| | `helm/todo-app/values-dev.yaml` | Minikube overrides |
| | `helm/todo-app/templates/_helpers.tpl` | Template functions |
| | `helm/todo-app/templates/namespace.yaml` | Namespace template |
| | `helm/todo-app/templates/configmap.yaml` | Environment variables |
| | `helm/todo-app/templates/secret.yaml` | Secrets (DB, API keys) |
| | `helm/todo-app/templates/backend-deployment.yaml` | Backend pod spec |
| | `helm/todo-app/templates/backend-service.yaml` | Backend network |
| | `helm/todo-app/templates/frontend-deployment.yaml` | Frontend pod spec |
| | `helm/todo-app/templates/frontend-service.yaml` | Frontend network |
| | `helm/todo-app/templates/mcp-deployment.yaml` | MCP pod spec |
| | `helm/todo-app/templates/mcp-service.yaml` | MCP network |
| **Raw K8s** (alternative) | `k8s/*.yaml` | Direct K8s manifests (not templated) |

---

## Key Concepts Glossary

| Term | What It Is |
|------|-----------|
| **Docker Image** | Packaged app with all dependencies |
| **Container** | Running instance of an image |
| **Pod** | Smallest K8s unit (1+ containers) |
| **Deployment** | Manages pods (replicas, updates) |
| **Service** | Stable network endpoint for pods |
| **ConfigMap** | Non-secret environment variables |
| **Secret** | Encrypted sensitive data |
| **Namespace** | Isolated group of resources |
| **Helm Chart** | Package of K8s templates + values |
| **Port Forward** | Tunnel from localhost to K8s service |

---

## Quick Reference Commands

### Build and Deploy
```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192 --driver=docker

# 2. Build images inside Minikube (names must match values-dev.yaml)
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend
eval $(minikube docker-env --unset)

# 3. Deploy with Helm
helm install todo-app ./helm/todo-app \
  -n todo-app --create-namespace \
  -f ./helm/todo-app/values-dev.yaml \
  --set secrets.databaseUrl="..." \
  --set secrets.geminiApiKey="..." \
  --set secrets.betterAuthSecret="..." \
  --set secrets.openaiDomainKey="..."

# 4. Access the application
kubectl port-forward svc/todo-app-frontend 3000:80 -n todo-app &
kubectl port-forward svc/todo-app-backend 8000:8000 -n todo-app &
```

### Monitoring
```bash
# Check pod status
kubectl get pods -n todo-app

# Check logs
kubectl logs -f deployment/todo-app-frontend -n todo-app
kubectl logs -f deployment/todo-app-backend -n todo-app
kubectl logs -f deployment/todo-app-mcp-server -n todo-app

# Check Helm release
helm list -n todo-app
```

### Upgrade and Rollback
```bash
# Upgrade after code changes
helm upgrade todo-app ./helm/todo-app -n todo-app -f ./helm/todo-app/values-dev.yaml

# Rollback to previous version
helm rollback todo-app -n todo-app
```

---

**Document Version**: 1.0.0
**Last Updated**: December 25, 2025
**Phase**: 4 - Local Kubernetes Deployment
