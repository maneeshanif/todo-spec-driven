# Implementation Plan: Local Kubernetes Deployment for Todo Application

**Branch**: `001-k8s-local-deploy` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-k8s-local-deploy/spec.md`

## Summary

Deploy the Phase 3 AI-powered Todo Chatbot to a local Kubernetes cluster using Docker containerization, Kubernetes manifests, and Helm charts. This phase transforms the application into a cloud-native, production-ready deployment with multi-container architecture, enabling local testing on Minikube before Phase 5 cloud deployment.

**Key Deliverables**:
1. Multi-stage Dockerfiles for frontend, backend, and MCP server
2. Docker Compose for local development orchestration
3. Kubernetes manifests for Minikube deployment
4. Helm chart for reusable deployment packaging
5. AIOps integration (Docker AI Gordon, kubectl-ai, Kagent)

## Technical Context

**Language/Version**:
- Frontend: Node.js 20 (Next.js 16+)
- Backend: Python 3.13+ (FastAPI 0.115+)
- MCP Server: Python 3.13+ (FastMCP)

**Primary Dependencies**:
- Docker (latest)
- Kubernetes 1.28+ (Minikube)
- Helm 3.15+
- kubectl (compatible with cluster version)

**Storage**:
- Neon Serverless PostgreSQL (external - no in-cluster database)
- No PVC/PV required - all state in external database

**Testing**:
- Dockerfile validation: `docker build`
- Manifest validation: `kubectl apply --dry-run=client`
- Helm validation: `helm lint`
- Integration testing: Manual on Minikube

**Target Platform**: Minikube (local Kubernetes cluster for development)

**Project Type**: Containerized Web Application (3 services: frontend, backend, mcp-server)

**Performance Goals**:
- Image build time: <5 minutes total
- Pod startup time: <30 seconds
- Application response time: <500ms p95
- Resource utilization: <80% of limits

**Constraints**:
- Frontend image: <200MB
- Backend image: <500MB
- MCP Server image: <100MB
- Minikube resources: 4 CPU, 8GB RAM minimum
- All containers run as non-root user

**Scale/Scope**:
- Frontend: 2 replicas
- Backend: 2 replicas
- MCP Server: 1 replica
- Single namespace: `todo-app`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan Compliance | Status |
|-----------|-------------|-----------------|--------|
| I. Infrastructure as Code | All manifests version-controlled | All K8s manifests in `k8s/`, Helm charts in `helm/` | ✅ PASS |
| II. Multi-Stage Builds | Docker images use builder/runtime stages | Frontend, backend, MCP all use multi-stage | ✅ PASS |
| III. Resource Limits | All deployments define requests/limits | Specified for all 3 services | ✅ PASS |
| IV. Health Probes | All containers have liveness/readiness probes | All services have HTTP health checks | ✅ PASS |
| V. Service Discovery | Internal DNS names used | `backend:8000`, `mcp-server:8001` | ✅ PASS |
| VI. Secrets Management | Secrets in K8s Secret resources | All API keys via `secretKeyRef` | ✅ PASS |
| VII. Immutable Infrastructure | Helm upgrades, no manual kubectl edits | All changes via Helm upgrade | ✅ PASS |
| VIII. AIOps Integration | kubectl-ai, Kagent, Gordon documented | All 3 tools documented | ✅ PASS |

**Constitution Gate**: ✅ PASSED - All 8 principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-k8s-local-deploy/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - technology research
├── data-model.md        # Phase 1 output - K8s resource models
├── quickstart.md        # Phase 1 output - deployment guide
├── contracts/           # Phase 1 output - service contracts
│   ├── health-endpoints.md
│   ├── service-discovery.md
│   └── resource-specs.md
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
# Phase 4: Local Kubernetes Deployment Structure

## Docker Configuration
frontend/
└── Dockerfile                    # Multi-stage Next.js container

backend/
├── Dockerfile                    # Multi-stage FastAPI container
└── Dockerfile.mcp                # MCP Server container (optional, can share)

docker-compose.yml                # Local development orchestration

## Kubernetes Manifests
k8s/
├── 00-namespace.yaml             # Namespace definition
├── 01-configmap.yaml             # Non-sensitive configuration
├── 02-secret.yaml                # Sensitive configuration (template)
├── 03-mcp-server-deployment.yaml # MCP Server Deployment
├── 04-mcp-server-service.yaml    # MCP Server Service (ClusterIP)
├── 05-backend-deployment.yaml    # Backend Deployment
├── 06-backend-service.yaml       # Backend Service (ClusterIP)
├── 07-frontend-deployment.yaml   # Frontend Deployment
├── 08-frontend-service.yaml      # Frontend Service (NodePort)
└── 09-ingress.yaml               # Ingress for external access

## Helm Charts
helm/
└── todo-app/
    ├── Chart.yaml                # Chart metadata
    ├── values.yaml               # Default values
    ├── values-dev.yaml           # Development (Minikube)
    ├── values-staging.yaml       # Staging environment
    ├── values-prod.yaml          # Production (Phase 5)
    └── templates/
        ├── _helpers.tpl          # Template helper functions
        ├── NOTES.txt             # Post-install instructions
        ├── namespace.yaml        # Namespace template
        ├── configmap.yaml        # ConfigMap template
        ├── secret.yaml           # Secret template
        ├── mcp-deployment.yaml   # MCP Server Deployment
        ├── mcp-service.yaml      # MCP Server Service
        ├── backend-deployment.yaml
        ├── backend-service.yaml
        ├── frontend-deployment.yaml
        ├── frontend-service.yaml
        ├── ingress.yaml          # Ingress template
        └── hpa.yaml              # HPA (for Phase 5)

## Claude Code Configuration
.claude/
├── agents/
│   ├── devops-kubernetes-builder.md      # K8s manifests agent
│   ├── docker-containerization-builder.md # Docker agent
│   └── aiops-helm-builder.md             # Helm charts agent
└── skills/
    ├── docker-setup/SKILL.md             # Dockerfile skill
    ├── kubernetes-deployment/SKILL.md    # K8s manifests skill
    ├── helm-charts-setup/SKILL.md        # Helm charts skill
    ├── aiops-gordon/SKILL.md             # Docker AI skill
    └── minikube-setup/SKILL.md           # Minikube skill

## Documentation
docs/
├── DEPLOYMENT.md                 # Full deployment guide
├── AIOPS.md                      # AIOps commands reference
└── MINIKUBE-SETUP.md             # Minikube setup guide

README.md                         # Updated with deployment section
```

**Structure Decision**: Monorepo with containerization layer. Frontend/backend/MCP server each get Dockerfiles. Kubernetes manifests in `k8s/` for raw deployment, `helm/` for packaged deployment. AIOps documentation in `docs/`.

## Complexity Tracking

No constitution violations to justify. All principles satisfied with standard patterns.

## Architecture Decisions

### AD-01: Three-Container Architecture

**Decision**: Deploy as 3 separate containers (frontend, backend, mcp-server)

**Rationale**:
- Independent scaling: Each service scales based on its load
- Independent deployment: MCP server updates don't affect frontend
- Follows microservices best practices
- Clear separation of concerns
- Kubernetes-native design

**Alternatives Considered**:
1. Single container with all services - Rejected (coupling, monolith pattern)
2. Frontend + Backend combined, MCP separate - Rejected (too coupled)

### AD-02: NodePort for Minikube, LoadBalancer for Cloud

**Decision**: Use NodePort service type for frontend in Minikube

**Rationale**:
- Minikube doesn't fully support LoadBalancer without `minikube tunnel`
- NodePort works reliably with `minikube service` command
- Easy transition to LoadBalancer in Phase 5

**Alternatives Considered**:
1. LoadBalancer only - Rejected (Minikube limitation)
2. ClusterIP + port-forward only - Rejected (inconvenient for testing)

### AD-03: External Database (Neon)

**Decision**: Continue using Neon PostgreSQL (external to cluster)

**Rationale**:
- Already configured and working from Phase 3
- No need for StatefulSet/PVC complexity
- Serverless scaling
- Built-in backups

**Alternatives Considered**:
1. In-cluster PostgreSQL - Rejected (adds complexity, no benefit for dev)
2. SQLite embedded - Rejected (not production-ready)

### AD-04: Helm for Production, Raw Manifests for Development

**Decision**: Use both raw K8s manifests and Helm charts

**Rationale**:
- Raw manifests simpler for initial development and learning
- Helm provides value for multi-environment deployment
- Progressive approach: Learn K8s first, then use Helm

**Alternatives Considered**:
1. Helm only - Rejected (overhead for initial development)
2. Raw manifests only - Rejected (no templating for prod)

## Component Breakdown

### Docker Layer

| Component | Base Image | Final Size Target | Port | Health Check |
|-----------|------------|-------------------|------|--------------|
| Frontend | node:20-alpine | <200MB | 3000 | GET / |
| Backend | python:3.13-slim | <500MB | 8000 | GET /health |
| MCP Server | python:3.13-slim | <100MB | 8001 | GET /health |

### Kubernetes Resources

| Resource Type | Name | Purpose | Replicas |
|---------------|------|---------|----------|
| Namespace | todo-app | Isolation | - |
| ConfigMap | app-config | Non-sensitive config | - |
| Secret | app-secrets | API keys, secrets | - |
| Deployment | mcp-server | MCP Server pods | 1 |
| Deployment | backend | FastAPI pods | 2 |
| Deployment | frontend | Next.js pods | 2 |
| Service | mcp-server | Internal MCP access | - |
| Service | backend | Internal API access | - |
| Service | frontend | External app access | - |
| Ingress | todo-ingress | External routing | - |

### Resource Allocations

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Frontend | 100m | 500m | 128Mi | 256Mi |
| Backend | 200m | 1000m | 256Mi | 512Mi |
| MCP Server | 100m | 300m | 64Mi | 128Mi |

## Implementation Phases

### Phase 1: Dockerization

1. **Create Frontend Dockerfile**
   - Multi-stage build (builder + runner)
   - Node 20 Alpine base
   - Standalone Next.js output
   - Non-root user

2. **Create Backend Dockerfile**
   - Multi-stage build (builder + runtime)
   - Python 3.13 slim base
   - UV for dependency management
   - Non-root user

3. **Create MCP Server Dockerfile**
   - Minimal Python 3.13 slim
   - FastMCP dependencies only
   - Non-root user

4. **Create docker-compose.yml**
   - All 3 services
   - Health checks
   - Networking
   - Environment loading

5. **Test with Docker Compose**
   - Build all images
   - Start all services
   - Verify communication
   - Test end-to-end

### Phase 2: Kubernetes Manifests

6. **Create namespace and configuration**
   - Namespace: todo-app
   - ConfigMap: non-sensitive vars
   - Secret: API keys (template)

7. **Create MCP Server resources**
   - Deployment (1 replica)
   - Service (ClusterIP)

8. **Create Backend resources**
   - Deployment (2 replicas)
   - Service (ClusterIP)

9. **Create Frontend resources**
   - Deployment (2 replicas)
   - Service (NodePort)

10. **Create Ingress**
    - Route to frontend
    - todo.local hostname

11. **Validate manifests**
    - kubectl apply --dry-run
    - Check all resources

### Phase 3: Minikube Deployment

12. **Install and configure Minikube**
    - Start with 4 CPU, 8GB RAM
    - Enable ingress addon
    - Enable metrics-server addon

13. **Build and load images**
    - Build all Docker images
    - Load into Minikube

14. **Deploy to Minikube**
    - Apply all manifests
    - Verify pods Running
    - Verify services have endpoints

15. **Test application**
    - Access via browser
    - Test authentication
    - Test chatbot functionality

### Phase 4: Helm Charts & AIOps

16. **Create Helm chart structure**
    - Chart.yaml
    - values.yaml (defaults)
    - _helpers.tpl

17. **Create values files**
    - values-dev.yaml (Minikube)
    - values-staging.yaml
    - values-prod.yaml (Phase 5)

18. **Create Helm templates**
    - Convert all manifests
    - Add conditionals
    - Add HPA template

19. **Test Helm chart**
    - helm lint
    - helm install (Minikube)
    - Verify deployment

20. **Set up AIOps tools**
    - Docker AI Gordon (latest stable v1.0+): Built into Docker Desktop, requires AI enabled
    - kubectl-ai (latest stable): `go install github.com/GoogleCloudPlatform/kubectl-ai@latest`
    - Kagent (latest stable): `go install github.com/kagent-dev/kagent@latest`

21. **Document AIOps workflows**
    - Common commands and usage patterns
    - Troubleshooting guide with real examples
    - Optimization guide with before/after comparisons

22. **Create documentation**
    - DEPLOYMENT.md
    - AIOPS.md
    - MINIKUBE-SETUP.md
    - Update README.md

## Service Communication

```
┌────────────────────────────────────────────────────────────────────┐
│                       Minikube Cluster                             │
│                                                                    │
│  External Access (Ingress)                                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  todo.local → frontend-service:80 → frontend pods:3000     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Internal Communication                                            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│  │   Frontend  │────▶│   Backend   │────▶│ MCP Server  │          │
│  │   :3000     │     │   :8000     │     │   :8001     │          │
│  └─────────────┘     └─────────────┘     └─────────────┘          │
│                              │                                     │
│                              ▼                                     │
│                    ┌─────────────────┐                             │
│                    │ Neon PostgreSQL │                             │
│                    │   (External)    │                             │
│                    └─────────────────┘                             │
└────────────────────────────────────────────────────────────────────┘
```

## Environment Variables

### ConfigMap (Non-Sensitive)

| Variable | Service | Value |
|----------|---------|-------|
| NODE_ENV | Frontend | production |
| NEXT_PUBLIC_API_URL | Frontend | http://backend:8000 |
| NEXT_PUBLIC_MCP_URL | Frontend | http://mcp-server:8001 |
| MCP_SERVER_URL | Backend | http://mcp-server:8001 |

### Secret (Sensitive)

| Variable | Service | Source |
|----------|---------|--------|
| DATABASE_URL | Backend | backend/.env |
| GEMINI_API_KEY | Backend, MCP | backend/.env |
| BETTER_AUTH_SECRET | Backend | backend/.env |
| NEXT_PUBLIC_OPENAI_DOMAIN_KEY | Frontend | frontend/.env |

## Quality Gates

Each phase must pass its quality gate before proceeding:

| Phase | Quality Gate | Success Criteria |
|--------|---------------|-----------------|
| Phase 1: Dockerization | All images build and run | `docker build` succeeds, images < size limits, health checks respond |
| Phase 2: K8s Manifests | All manifests validate | `kubectl apply --dry-run=client` succeeds, 0 errors |
| Phase 3: Minikube Deployment | Application functional | All pods Running, services have endpoints, app accessible via Ingress |
| Phase 4: Helm & AIOps | Chart installable and documented | `helm lint` passes, `helm install` succeeds, AIOPS.md complete |

**Blocking Rule**: Do not proceed to next phase until current phase quality gate passes.

## Validation Criteria

### Docker Images

- [ ] Frontend image builds successfully
- [ ] Frontend image < 200MB
- [ ] Frontend runs as non-root
- [ ] Backend image builds successfully
- [ ] Backend image < 500MB
- [ ] Backend runs as non-root
- [ ] MCP Server image builds successfully
- [ ] MCP Server image < 100MB
- [ ] MCP Server runs as non-root

### Kubernetes

- [ ] All manifests pass `kubectl apply --dry-run`
- [ ] All pods reach Running state
- [ ] All services have endpoints
- [ ] Ingress routes correctly
- [ ] Health probes work correctly

### Helm

- [ ] `helm lint` passes with 0 warnings
- [ ] `helm install` succeeds
- [ ] `helm upgrade` works
- [ ] Values override correctly

### End-to-End

- [ ] Application loads in browser
- [ ] User can sign in
- [ ] Chatbot responds to messages
- [ ] Tasks can be created/listed/completed
- [ ] No pod restart loops

## Rollback Strategy

When deployment fails or produces undesirable behavior:

| Scenario | Rollback Command | Recovery Time |
|-----------|------------------|----------------|
| Docker Compose issue | `docker-compose down && git checkout HEAD~1 && docker-compose up` | <2 minutes |
| K8s manifest rollback | `kubectl rollout undo deployment/<name>` | <1 minute |
| Helm chart rollback | `helm rollback todo-app` -n todo-app | <1 minute |
| Complete Minikube reset | `minikube delete && minikube start` | <5 minutes |

**Version Tagging Policy**: Tag each successful deployment with semantic version (v1.0.0, v1.0.1, etc.)

## Monitoring Strategy

| Component | Monitoring Tool | Key Metrics | Alert Threshold |
|-----------|-----------------|--------------|-----------------|
| Docker Images | `docker images`, `docker history` | Size limits, build times |
| Docker Compose | `docker-compose ps`, `docker-compose logs` | Container health, restart count |
| Minikube | `kubectl get pods -w`, `minikube dashboard` | Pod status, resource usage |
| Applications | Health endpoints, browser testing | Response time <500ms, uptime >99% |

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-------------|----------|-------------------|
| Minikube resource constraints | Medium | High | Allocate minimum 4 CPU, 8GB RAM; monitor usage via `minikube dashboard` |
| Image build failures | Low | High | Test each Dockerfile independently before integration; use Docker AI Gordon for optimization analysis |
| Service discovery issues | Low | High | Use Kubernetes internal DNS (`service-name.namespace.svc.cluster.local`); verify with test pod |
| Secrets in version control | Medium | Critical | Use `.gitignore` enforcement, never commit actual secrets, use Secret manifests with placeholders |
| Ingress configuration errors | Medium | Medium | Enable ingress addon before deployment (`minikube addons enable ingress`); test with simple hostname first |
| Pod crash loops | Low | Medium | Configure proper liveness/readiness probes; set appropriate resource requests/limits; check logs with `kubectl logs` |
| Network policies blocking traffic | Low | Medium | Start with permissive policies; validate connectivity between services; tighten after verification |
| Helm chart validation errors | Low | Medium | Run `helm lint` before installation; test with `--dry-run` flag; maintain consistent templating patterns |

## References

- [Phase 4 Constitution](../../constitution-prompt-phase-4.md)
- [Phase 4 Specification](../../spec-prompt-phase-4.md)
- [Phase 4 Tasks](./tasks.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Docker AI (Gordon)](https://docs.docker.com/ai/gordon/)
- [kubectl-ai](https://github.com/GoogleCloudPlatform/kubectl-ai)
- [Kagent](https://github.com/kagent-dev/kagent)

## Conclusion

This implementation plan provides a comprehensive, phased approach to containerizing and deploying the Evolution of Todo application. The strategy follows Kubernetes and Helm best practices while maintaining alignment with the Phase 4 constitution principles:

1. **Infrastructure as Code**: All manifests and charts are version-controlled and reproducible
2. **Multi-Stage Builds**: Dockerfiles use builder/runtime separation for minimal image sizes
3. **Resource Limits**: All deployments have explicit requests and limits to prevent resource starvation
4. **Health Probes**: Every container has liveness and readiness probes for self-healing
5. **Service Discovery**: Kubernetes DNS names enable inter-service communication
6. **Secrets Management**: Sensitive values stored in Kubernetes Secrets, never committed
7. **Immutable Infrastructure**: Helm upgrades are the only modification mechanism for deployed resources
8. **AIOps Integration**: Gordon, kubectl-ai, and Kagent provide intelligent operational insights

The plan emphasizes incremental delivery with quality gates at each phase, ensuring that issues are caught early and resolved before proceeding. This approach minimizes risk while maintaining momentum toward full production readiness.

**Next Steps**:
1. Execute `/sp.implement` to begin task execution
2. Follow MVP scope (T001-T020) for quick feedback loop
3. Complete remaining user stories for full Kubernetes deployment
4. Validate against all acceptance criteria before declaring Phase 4 complete

---

**Plan Version**: 2.0.0 (Finalized)
**Created**: December 24, 2025
**Updated**: December 24, 2025 (Removed timeline references, strengthened content, added quality gates)
**Phase**: Phase 4 - Local Kubernetes Deployment
