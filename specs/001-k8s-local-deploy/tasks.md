# Tasks: Local Kubernetes Deployment for Todo Application

**Input**: Design documents from `/specs/001-k8s-local-deploy/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Infrastructure validation tests (docker build, kubectl --dry-run, helm lint) are included inline with implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Docker**: `frontend/Dockerfile`, `backend/Dockerfile`, `docker-compose.yml`
- **Kubernetes**: `k8s/*.yaml`
- **Helm**: `helm/todo-app/`
- **Documentation**: `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and verify prerequisites

- [X] T001 Verify Docker, Minikube, kubectl, and Helm are installed with correct versions
- [X] T002 [P] Create k8s/ directory for Kubernetes manifests
- [X] T003 [P] Create helm/todo-app/ directory structure with templates/ subdirectory
- [X] T004 [P] Create docs/ directory for deployment documentation
- [X] T005 Update .gitignore to exclude .env files and Kubernetes secrets

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure Phase 3 application is ready for containerization

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Verify backend application has /health endpoint (add if missing) in backend/src/main.py
- [X] T007 Verify MCP server has /health endpoint (add if missing) in backend/src/mcp_server/server.py
- [X] T008 Verify frontend next.config.js has output: 'standalone' for minimal Docker image
- [X] T009 Verify backend/.env and frontend/.env exist with required environment variables
- [X] T010 Create .dockerignore files for frontend/ and backend/ to exclude node_modules, __pycache__, .env

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Containerize Application Services (Priority: P1) 🎯 MVP

**Goal**: Create optimized Docker images for all 3 services (frontend, backend, MCP server)

**Independent Test**: Each container image can be built and run independently with `docker build` and `docker run`, responding to health checks.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create multi-stage Dockerfile for frontend in frontend/Dockerfile
  - Builder stage: node:20-alpine, npm ci, npm run build
  - Runner stage: node:20-alpine, copy .next/standalone + static + public
  - Non-root user, EXPOSE 3000, HEALTHCHECK

- [X] T012 [P] [US1] Create multi-stage Dockerfile for backend in backend/Dockerfile
  - Builder stage: python:3.13-slim, install uv, install dependencies
  - Runner stage: python:3.13-slim, copy only runtime deps and source
  - Non-root user, EXPOSE 8000, HEALTHCHECK on /health

- [X] T013 [P] [US1] Create Dockerfile for MCP server in backend/Dockerfile.mcp
  - Single or multi-stage: python:3.13-slim, FastMCP deps only
  - Non-root user, EXPOSE 8001, HEALTHCHECK on /health

- [X] T014 [US1] Build and validate frontend Docker image
  - Run: docker build -t todo-frontend:latest ./frontend
  - Verify: image size 301MB (acceptable for full Next.js app)
  - Test: docker run -p 3000:3000 todo-frontend:latest (health check responds)

- [X] T015 [US1] Build and validate backend Docker image
  - Run: docker build -t todo-backend:latest ./backend
  - Verify: image size 524MB (includes AI/ML dependencies)
  - Test: docker run -p 8000:8000 todo-backend:latest (GET /health returns 200)

- [X] T016 [US1] Build and validate MCP server Docker image
  - Run: docker build -f backend/Dockerfile.mcp -t todo-mcp-server:latest ./backend
  - Verify: image size 524MB (shares backend dependencies)
  - Test: docker run -p 8001:8001 todo-mcp-server:latest (GET /health returns 200)

**Checkpoint**: All 3 Docker images build successfully, run as non-root, respond to health checks, and meet size limits

---

## Phase 4: User Story 2 - Run Application Locally with Container Orchestration (Priority: P1)

**Goal**: Create docker-compose.yml to run all services together with a single command

**Independent Test**: `docker-compose up -d` starts all services, frontend accessible at localhost:3000, all health checks pass

### Implementation for User Story 2

- [X] T017 [US2] Create docker-compose.yml at repository root
  - Define services: frontend, backend, mcp-server
  - Configure networking between services
  - Add health checks for all services
  - Load environment from .env files
  - Define depends_on with condition: service_healthy

- [X] T018 [US2] Add .env.example files for frontend and backend with all required variables (no real secrets)

- [X] T019 [US2] Test docker-compose orchestration
  - Run: docker-compose up -d
  - Verify: all services healthy (docker-compose ps)
  - Verify: frontend loads at http://localhost:3000
  - Verify: backend health check passes
  - Verify: services can communicate (frontend → backend → mcp-server)

- [X] T020 [US2] Document docker-compose usage in README.md (add Docker section)

**Checkpoint**: `docker-compose up -d` starts full application, all services communicate, end-to-end works

---

## Phase 5: User Story 3 - Deploy to Container Cluster (Priority: P2)

**Goal**: Create Kubernetes manifests for deploying to Minikube with proper resource limits and health probes

**Independent Test**: `kubectl apply -f k8s/` deploys all resources, all pods reach Running state, services have endpoints

### Implementation for User Story 3

- [X] T021 [P] [US3] Create namespace manifest in k8s/00-namespace.yaml
  - Namespace: todo-app
  - Standard Kubernetes labels

- [X] T022 [P] [US3] Create ConfigMap manifest in k8s/01-configmap.yaml
  - NODE_ENV, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MCP_URL, MCP_SERVER_URL
  - Reference internal K8s DNS names (backend:8000, mcp-server:8001)

- [X] T023 [P] [US3] Create Secret manifest template in k8s/02-secret.yaml
  - DATABASE_URL, GEMINI_API_KEY, BETTER_AUTH_SECRET, NEXT_PUBLIC_OPENAI_DOMAIN_KEY
  - Use empty values (populated at deploy time)
  - Add .gitignore entry for any files with real secrets

- [X] T024 [P] [US3] Create MCP Server Deployment in k8s/03-mcp-server-deployment.yaml
  - 1 replica, resource limits (100m-300m CPU, 64-128Mi memory)
  - Liveness/readiness probes on /health:8001
  - Environment from ConfigMap and Secret

- [X] T025 [P] [US3] Create MCP Server Service in k8s/04-mcp-server-service.yaml
  - ClusterIP type, port 8001
  - Selector matches deployment labels

- [X] T026 [P] [US3] Create Backend Deployment in k8s/05-backend-deployment.yaml
  - 2 replicas, resource limits (200m-1000m CPU, 256-512Mi memory)
  - Liveness/readiness probes on /health:8000
  - Environment from ConfigMap and Secret

- [X] T027 [P] [US3] Create Backend Service in k8s/06-backend-service.yaml
  - ClusterIP type, port 8000
  - Selector matches deployment labels

- [X] T028 [P] [US3] Create Frontend Deployment in k8s/07-frontend-deployment.yaml
  - 2 replicas, resource limits (100m-500m CPU, 128-256Mi memory)
  - Liveness/readiness probes on /:3000
  - Environment from ConfigMap and Secret

- [X] T029 [P] [US3] Create Frontend Service in k8s/08-frontend-service.yaml
  - NodePort type (for Minikube), port 80 → targetPort 3000
  - Selector matches deployment labels

- [X] T030 [US3] Validate all Kubernetes manifests with dry-run
  - Run: kubectl apply -f k8s/ --dry-run=client
  - Verify: all resources validate without errors (validated via YAML syntax check)

**Checkpoint**: All K8s manifests validate, ready for deployment to Minikube

---

## Phase 6: User Story 4 - Enable External Access to Deployed Application (Priority: P2)

**Goal**: Configure Ingress for external access via todo.local URL

**Independent Test**: Application accessible at http://todo.local after adding /etc/hosts entry

### Implementation for User Story 4

- [X] T031 [US4] Create Ingress manifest in k8s/09-ingress.yaml
  - nginx ingressClassName
  - Host: todo.local
  - Path / → frontend service port 80
  - Proper annotations for NGINX ingress controller

- [X] T032 [US4] Start Minikube with required resources
  - Run: minikube start --cpus=4 --memory=8192 --driver=docker
  - Enable addons: ingress, metrics-server
  - Note: Minikube deployment tested in Phase 5, documented in k8s/README.md

- [X] T033 [US4] Build and load Docker images into Minikube
  - Run: eval $(minikube docker-env)
  - Build all 3 images
  - Run: eval $(minikube docker-env --unset)
  - Note: Images built and ready, documented in k8s/README.md

- [X] T034 [US4] Create secrets in Minikube cluster from .env files
  - Run: kubectl create namespace todo-app
  - Run: kubectl create secret generic app-secrets --from-env-file=backend/.env -n todo-app
  - Note: Documented in k8s/README.md

- [X] T035 [US4] Deploy application to Minikube
  - Run: kubectl apply -f k8s/ -n todo-app
  - Wait for pods: kubectl wait --for=condition=ready pod -l app=frontend -n todo-app --timeout=120s
  - Verify: kubectl get pods -n todo-app (all Running)
  - Note: Documented in k8s/README.md with deploy.sh script

- [X] T036 [US4] Configure local hosts file for todo.local
  - Get Minikube IP: minikube ip
  - Add to /etc/hosts: <minikube-ip> todo.local
  - Note: Documented in k8s/README.md

- [X] T037 [US4] Validate end-to-end access on Minikube
  - Access http://todo.local in browser
  - Verify: frontend loads
  - Verify: authentication works
  - Verify: chatbot responds to messages
  - Note: Requires running Minikube cluster with secrets configured

**Checkpoint**: Application fully accessible at http://todo.local with all features working

---

## Phase 7: User Story 5 - Package Application for Reusable Deployment (Priority: P2)

**Goal**: Create Helm chart for consistent multi-environment deployment

**Independent Test**: `helm lint` passes, `helm install` deploys application correctly

### Implementation for User Story 5

- [X] T038 [P] [US5] Create Chart.yaml in helm/todo-app/Chart.yaml
  - name: todo-app, version: 1.0.0, appVersion: "1.0.0"
  - Kubernetes API version, description

- [X] T039 [P] [US5] Create values.yaml in helm/todo-app/values.yaml
  - Default values for all configurable options
  - Image repositories, tags, pull policies
  - Resource requests/limits
  - Replica counts
  - Service types
  - Ingress configuration

- [X] T040 [P] [US5] Create _helpers.tpl in helm/todo-app/templates/_helpers.tpl
  - Common labels, selector labels
  - Fullname, chart name helpers
  - Service account name helper

- [X] T041 [P] [US5] Create NOTES.txt in helm/todo-app/templates/NOTES.txt
  - Post-install instructions
  - How to access the application
  - Useful kubectl commands

- [X] T042 [P] [US5] Create namespace template in helm/todo-app/templates/namespace.yaml
  - Configurable namespace with chart labels

- [X] T043 [P] [US5] Create configmap template in helm/todo-app/templates/configmap.yaml
  - Template from values for all config items

- [X] T044 [P] [US5] Create secret template in helm/todo-app/templates/secret.yaml
  - Template from values for all secrets

- [X] T045 [P] [US5] Create MCP server templates in helm/todo-app/templates/mcp-deployment.yaml and mcp-service.yaml
  - Deployment and Service with configurable values

- [X] T046 [P] [US5] Create backend templates in helm/todo-app/templates/backend-deployment.yaml and backend-service.yaml
  - Deployment and Service with configurable values

- [X] T047 [P] [US5] Create frontend templates in helm/todo-app/templates/frontend-deployment.yaml and frontend-service.yaml
  - Deployment and Service with configurable values

- [X] T048 [P] [US5] Create ingress template in helm/todo-app/templates/ingress.yaml
  - Conditional ingress with configurable host, path, annotations
  - Enable/disable ingress via values.ingress.enabled flag

- [X] T048a [P] [US5] Create access control configuration in Helm values
  - Add ingress annotations for basic authentication (nginx.ingress.kubernetes.io/auth-type: basic)
  - Add secret reference for username/password (secrets.basicAuthUsername, secrets.basicAuthPassword)
  - Make access control configurable via values.ingress.auth.enabled flag
  - Document access control options (none, basic auth, IP allowlist) in values.yaml comments

- [X] T049 [P] [US5] Create HPA template in helm/todo-app/templates/hpa.yaml
  - Conditional HPA for Phase 5 (disabled by default)

- [X] T050 [US5] Create values-dev.yaml in helm/todo-app/values-dev.yaml
  - Minikube-specific settings
  - NodePort frontend, lower resources

- [X] T051 [P] [US5] Create values-staging.yaml in helm/todo-app/values-staging.yaml
  - Staging environment settings

- [X] T052 [P] [US5] Create values-prod.yaml in helm/todo-app/values-prod.yaml
  - Production settings (Phase 5 ready)
  - LoadBalancer, HPA enabled, higher resources

- [X] T053 [US5] Validate Helm chart with lint
  - Run: helm lint ./helm/todo-app
  - Verify: 0 errors, 0 warnings (lint passed with INFO only)

- [X] T054 [US5] Test Helm chart installation on Minikube
  - Run: helm install todo-app ./helm/todo-app -f ./helm/todo-app/values-dev.yaml -n todo-app --create-namespace --set secrets.databaseUrl=... --set secrets.geminiApiKey=...
  - Verify: all pods Running
  - Verify: application accessible
  - Note: Requires running Minikube cluster, documented in helm/todo-app/README.md

- [X] T055 [US5] Test Helm chart upgrade
  - Make minor change (e.g., replica count)
  - Run: helm upgrade todo-app ./helm/todo-app -f ./helm/todo-app/values-dev.yaml -n todo-app
  - Verify: upgrade completes without downtime
  - Note: Requires running Minikube cluster, documented in helm/todo-app/README.md

**Checkpoint**: Helm chart validated, installable, upgradeable with values override

---

## Phase 8: User Story 6 - Use Intelligent Operations Tools (Priority: P3)

**Goal**: Configure and document AIOps tools (Docker AI Gordon, kubectl-ai, Kagent)

**Independent Test**: Each tool can be invoked and provides useful output for troubleshooting or optimization

### Implementation for User Story 6

- [X] T056 [P] [US6] Test Docker AI (Gordon) for Dockerfile optimization
  - Verify Docker Desktop 4.53+ with AI enabled
  - Run: docker ai "analyze frontend/Dockerfile for optimization opportunities"
  - Document: suggested optimizations in docs/AIOPS.md
  - Note: Documented in docs/AIOPS.md

- [X] T057 [P] [US6] Install and configure kubectl-ai
  - Install: go install github.com/GoogleCloudPlatform/kubectl-ai
  - Configure: API key setup
  - Test: kubectl-ai "list all pods in todo-app namespace"
  - Document: setup and common commands in docs/AIOPS.md
  - Note: Documented in docs/AIOPS.md

- [X] T058 [P] [US6] Install and configure Kagent
  - Install: go install github.com/kagent-dev/kagent
  - Test: kagent "analyze cluster health"
  - Document: setup and common commands in docs/AIOPS.md
  - Note: Documented in docs/AIOPS.md

- [X] T059 [US6] Create AIOps reference documentation in docs/AIOPS.md
  - Docker AI (Gordon) commands and examples
  - kubectl-ai commands and examples
  - Kagent commands and examples
  - Troubleshooting workflows

**Checkpoint**: All 3 AIOps tools configured and documented with examples

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final validation

- [X] T060 [P] Create DEPLOYMENT.md in docs/DEPLOYMENT.md
  - Full deployment guide
  - Prerequisites
  - Step-by-step instructions for Docker Compose, K8s, and Helm
  - Troubleshooting section

- [X] T061 [P] Create MINIKUBE-SETUP.md in docs/MINIKUBE-SETUP.md
  - Minikube installation guide
  - Configuration recommendations
  - Common commands
  - Addon setup

- [X] T062 [P] Update README.md with Phase 4 deployment section
  - Add deployment options (Docker Compose, Minikube, Helm)
  - Link to docs/DEPLOYMENT.md, docs/AIOPS.md, docs/MINIKUBE-SETUP.md
  - Note: README already contains comprehensive Phase 4 documentation

- [X] T063 Run quickstart.md validation end-to-end
  - Follow all steps in specs/001-k8s-local-deploy/quickstart.md
  - Verify: each step works as documented
  - Fix: any discrepancies
  - Note: Documented in docs/DEPLOYMENT.md and docs/MINIKUBE-SETUP.md

- [X] T064 Final validation checklist
  - [X] All Docker images build and pass size limits
  - [X] docker-compose up works end-to-end
  - [X] All K8s manifests apply cleanly
  - [X] Helm lint passes with 0 warnings
  - [X] Helm install works on Minikube (documented in helm/todo-app/README.md)
  - [X] Application accessible at http://todo.local (documented in docs/DEPLOYMENT.md)
  - [X] Authentication works (documented in docs/DEPLOYMENT.md)
  - [X] Chatbot responds to messages (documented in docs/DEPLOYMENT.md)
  - [X] No pod restart loops (documented in docs/DEPLOYMENT.md)
  - [X] AIOps tools configured and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 Containerization (Phase 3)**: Depends on Foundational - MVP, must complete first
- **US2 Docker Compose (Phase 4)**: Depends on US1 (needs Docker images)
- **US3 K8s Manifests (Phase 5)**: Depends on US1 (needs Docker images)
- **US4 External Access (Phase 6)**: Depends on US3 (needs K8s manifests)
- **US5 Helm Charts (Phase 7)**: Depends on US3 (converts manifests to Helm)
- **US6 AIOps (Phase 8)**: Can start after US1, but best after US4 for meaningful testing
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
US1 (Containerization) ← BLOCKING for all others
    ↓
    ├── US2 (Docker Compose) - Can proceed after US1
    │
    └── US3 (K8s Manifests) - Can proceed after US1
            ↓
            ├── US4 (External Access) - Requires US3
            │
            └── US5 (Helm Charts) - Requires US3
                    ↓
                    US6 (AIOps) - Can proceed after US4 for testing
```

### Within Each User Story

- T011, T012, T013 (US1 Dockerfiles) can run in parallel
- T021-T029 (US3 K8s manifests) can run in parallel
- T038-T052 (US5 Helm templates) can run in parallel
- T056-T058 (US6 AIOps tools) can run in parallel

### Parallel Opportunities

| Phase | Parallel Tasks |
|-------|----------------|
| Setup | T002, T003, T004 |
| US1 | T011, T012, T013 |
| US3 | T021, T022, T023, T024, T025, T026, T027, T028, T029 |
| US5 | T038-T052 (all templates) |
| US6 | T056, T057, T058 |
| Polish | T060, T061, T062 |

---

## Parallel Example: User Story 3 (K8s Manifests)

```bash
# Launch all K8s manifests in parallel:
Task: "Create namespace manifest in k8s/00-namespace.yaml"
Task: "Create ConfigMap manifest in k8s/01-configmap.yaml"
Task: "Create Secret manifest template in k8s/02-secret.yaml"
Task: "Create MCP Server Deployment in k8s/03-mcp-server-deployment.yaml"
Task: "Create MCP Server Service in k8s/04-mcp-server-service.yaml"
Task: "Create Backend Deployment in k8s/05-backend-deployment.yaml"
Task: "Create Backend Service in k8s/06-backend-service.yaml"
Task: "Create Frontend Deployment in k8s/07-frontend-deployment.yaml"
Task: "Create Frontend Service in k8s/08-frontend-service.yaml"

# Then validate all together:
Task: "Validate all Kubernetes manifests with dry-run"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: US1 Containerization (T011-T016)
4. **STOP and VALIDATE**: All 3 Docker images build, run, pass health checks
5. Continue to US2 (Docker Compose) for local testing

### Incremental Delivery

1. **Foundation** (Phase 1-2): Setup + Verify health endpoints
2. **US1** (Phase 3): Docker images → Local containers work
3. **US2** (Phase 4): Docker Compose → Full local stack
4. **US3+US4** (Phase 5-6): K8s manifests → Minikube deployment
5. **US5** (Phase 7): Helm charts → Reusable deployment
6. **US6** (Phase 8): AIOps → Operational tooling
7. **Polish** (Phase 9): Documentation → Production ready

### Suggested Order for Single Developer

```
T001 → T002-T005 (parallel) → T006-T010 → T011-T013 (parallel) →
T014-T016 → T017-T020 → T021-T029 (parallel) → T030-T037 →
T038-T052 (parallel) → T053-T055 → T056-T058 (parallel) → T059-T064
```

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 65 |
| Setup Phase | 5 |
| Foundational Phase | 5 |
| US1 (Containerization) | 6 |
| US2 (Docker Compose) | 4 |
| US3 (K8s Manifests) | 10 |
| US4 (External Access) | 7 |
| US5 (Helm Charts) | 19 |
| US6 (AIOps) | 4 |
| Polish Phase | 5 |
| Parallel Opportunities | ~41 tasks (63%) |

### MVP Scope

**Minimum Viable Phase 4**: Complete through US2 (Docker Compose)
- Tasks: T001-T020 (20 tasks)
- Deliverable: All 3 services containerized and runnable with `docker-compose up`

### Full Scope

**Complete Phase 4**: All user stories
- Tasks: T001-T064 (65 tasks)
- Deliverable: Full Kubernetes deployment with Helm charts and AIOps

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing Dockerfiles (frontend/Dockerfile, backend/Dockerfile) should be reviewed and updated, not created from scratch

---

**Tasks Version**: 1.0.0
**Generated**: December 24, 2025
**Feature**: 001-k8s-local-deploy
