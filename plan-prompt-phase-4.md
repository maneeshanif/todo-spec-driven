# Phase 4: Local Kubernetes Deployment - Implementation Plan

**Project**: Evolution of Todo
**Phase**: Phase 4 - Local Kubernetes Deployment
**Version**: 1.0.0
**Status**: Active
**Due Date**: January 4, 2026

---

## Technical Context

### Languages and Frameworks

| Component | Language/Framework | Version |
|-----------|-------------------|----------|
| Frontend | Next.js | 16+ |
| Backend | Python | 3.13+ |
| Backend Framework | FastAPI | 0.115+ |
| ORM | SQLModel | 0.0.22+ |
| Container Runtime | Docker | Latest |
| Orchestration | Kubernetes | 1.28+ |
| Package Manager | Helm | 3.15+ |
| Local Cluster | Minikube | Latest |

### Storage and External Services

| Service | Type | Purpose |
|----------|-------|---------|
| Neon PostgreSQL | Serverless | Primary database |
| Better Auth | External | Authentication |
| MCP Server | Internal (Pod) | Task operation tools |

### Testing

| Type | Tool | Coverage Target |
|-------|-------|----------------|
| Dockerfile validation | docker build | 100% |
| Manifest validation | kubectl apply --dry-run | 100% |
| Helm validation | helm lint | 100% |
| Integration testing | Manual on Minikube | All user flows |

### Deployment Target

| Environment | Platform | Purpose |
|-----------|----------|---------|
| Development | Minikube (Local) | Testing and development |
| Production | DigitalOcean DOKS (Phase 5) | Production deployment |

### Performance

| Metric | Target |
|---------|--------|
| Image build time | <5 minutes |
| Pod startup time | <30 seconds |
| Application response time | <500ms p95 |
| Resource utilization | <80% of limits |

---

## Constitution Check

### Compliance with Phase 4 Constitution

| Principle | Implementation | Status |
|-----------|-----------------|--------|
| Infrastructure as Code | All manifests in `k8s/`, charts in `helm/` | Pending |
| Multi-Stage Builds | Dockerfiles use builder/runtime stages | Pending |
| Resource Limits | All deployments define requests/limits | Pending |
| Health Probes | All containers have liveness/readiness probes | Pending |
| Service Discovery | Internal DNS names used (backend, mcp-server) | Pending |
| Secrets Management | Secrets in K8s Secret resources | Pending |
| Immutable Infrastructure | Helm upgrades, no manual kubectl edits | Pending |
| AIOps Integration | kubectl-ai, Kagent, Gordon documented | Pending |

---

## Project Structure

### New Directories and Files

```
todo-web-hackthon/
├── frontend/
│   └── Dockerfile                       # NEW - Next.js multi-stage
├── backend/
│   ├── Dockerfile                         # NEW - FastAPI multi-stage
│   └── Dockerfile.mcp                    # NEW - MCP server container
├── docker-compose.yml                      # NEW - Local orchestration
├── k8s/                                 # NEW - Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secret.yaml
│   ├── 03-mcp-server-deployment.yaml
│   ├── 04-mcp-server-service.yaml
│   ├── 05-backend-deployment.yaml
│   ├── 06-backend-service.yaml
│   ├── 07-frontend-deployment.yaml
│   ├── 08-frontend-service.yaml
│   └── 09-ingress.yaml
├── helm/                                 # NEW - Helm charts
│   └── todo-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       ├── values-prod.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── NOTES.txt
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── configmap.yaml
│           ├── secret.yaml
│           └── hpa.yaml
├── .claude/
│   ├── agents/
│   │   ├── devops-kubernetes-builder.md      # NEW
│   │   ├── docker-containerization-builder.md  # NEW
│   │   └── aiops-helm-builder.md           # NEW
│   └── skills/
│       ├── docker-setup/SKILL.md            # NEW
│       ├── kubernetes-deployment/SKILL.md   # NEW
│       ├── helm-charts-setup/SKILL.md       # NEW
│       ├── aiops-gordon/SKILL.md          # NEW
│       └── minikube-setup/SKILL.md         # NEW
├── prompts/
│   ├── constitution-prompt-phase-4.md     # NEW
│   ├── spec-prompt-phase-4.md           # NEW
│   └── plan-prompt-phase-4.md           # THIS FILE
├── .gitignore                             # UPDATED - Add .env, secrets
├── README.md                             # UPDATED - Add deployment section
└── docs/
    ├── DEPLOYMENT.md                      # NEW - Deployment guide
    ├── AIOPS.md                           # NEW - AIOps commands reference
    └── MINIKUBE-SETUP.md                  # NEW - Minikube guide
```

---

## Complexity Tracking

### Dockerization Complexity: Medium

| Task | Complexity | Estimated Effort |
|-------|-------------|------------------|
| Frontend Dockerfile | Low | 1-2 hours |
| Backend Dockerfile | Medium | 2-3 hours |
| MCP Server Dockerfile | Low | 1 hour |
| Docker Compose | Low | 1 hour |
| Docker optimization (Gordon) | Low | 1 hour |

### Kubernetes Manifests Complexity: Medium

| Task | Complexity | Estimated Effort |
|-------|-------------|------------------|
| Namespace/ConfigMap/Secret | Low | 30 minutes |
| MCP Server Deployment | Low | 1 hour |
| Backend Deployment | Medium | 2 hours |
| Frontend Deployment | Medium | 2 hours |
| Services (3x) | Low | 1 hour |
| Ingress | Medium | 2 hours |

### Helm Charts Complexity: High

| Task | Complexity | Estimated Effort |
|-------|-------------|------------------|
| Chart.yaml structure | Low | 30 minutes |
| Values files (4x) | Medium | 2 hours |
| Template helpers | Low | 30 minutes |
| Deployment templates | Medium | 3 hours |
| Service templates | Low | 1 hour |
| Ingress template | Medium | 2 hours |
| HPA templates | Medium | 1 hour |

### Minikube Deployment Complexity: Low

| Task | Complexity | Estimated Effort |
|-------|-------------|------------------|
| Minikube installation | Low | 30 minutes |
| Start with resources | Low | 10 minutes |
| Enable addons | Low | 10 minutes |
| Load images | Low | 15 minutes |
| Apply manifests | Low | 15 minutes |
| Verify deployment | Low | 30 minutes |

### AIOps Integration Complexity: Medium

| Task | Complexity | Estimated Effort |
|-------|-------------|------------------|
| Gordon setup and testing | Low | 30 minutes |
| kubectl-ai installation | Low | 30 minutes |
| Kagent installation | Low | 30 minutes |
| Documentation | Medium | 2 hours |

**Total Estimated Effort**: ~30 hours

---

## Architecture Decisions

### AD-01: Multi-Container vs Single-Container Deployment

**Decision**: Deploy as 3 separate containers (frontend, backend, mcp-server)

**Rationale**:
- Independent scaling: Each service scales based on its load
- Independent deployment: MCP server updates don't affect frontend
- Follows microservices best practices
- Clear separation of concerns

**Trade-offs**:
- Pros: Independent scaling, better isolation, independent updates
- Cons: More configuration, inter-service communication complexity

**Alternatives Considered**:
1. Single container with all services - Rejected (coupling, monolith)
2. Frontend + Backend combined, MCP separate - Rejected (too coupled)

---

### AD-02: Helm vs Raw Kubernetes Manifests

**Decision**: Use both - Raw manifests for Minikube, Helm for production (Phase 5)

**Rationale**:
- Raw manifests simpler for local development
- Helm provides better value for multi-environment production
- Progressive approach: Learn K8s first, then use Helm
- Helm enables easier upgrades in production

**Trade-offs**:
- Pros: Maintains two approaches for different use cases
- Cons: Slightly more maintenance overhead

**Alternatives Considered**:
1. Helm only - Rejected (overhead for local dev)
2. K8s manifests only - Rejected (no production best practices)

---

### AD-03: NodePort vs LoadBalancer (Frontend Service)

**Decision**: NodePort for Minikube, LoadBalancer for production (Phase 5)

**Rationale**:
- Minikube doesn't fully support LoadBalancer
- NodePort works reliably in Minikube with port forwarding
- LoadBalancer is production-ready for cloud providers
- Ingress handles external access either way

**Trade-offs**:
- Pros: Works in both environments with appropriate type
- Cons: Different service types require configuration awareness

**Alternatives Considered**:
1. LoadBalancer only - Rejected (Minikube limitation)
2. ClusterIP + Ingress only - Rejected (port forwarding needed for dev)

---

### AD-04: Docker Registry Strategy

**Decision**: Use Docker Hub for development, GHCR for production

**Rationale**:
- Docker Hub free tier sufficient for development images
- GHCR integrated with GitHub Actions (CI/CD ready)
- GitHub token auth more secure than Docker Hub password
- Separate registries prevent mixing dev/prod images

**Trade-offs**:
- Pros: Free for both, GHCR better CI/CD integration
- Cons: Two registries to manage

**Alternatives Considered**:
1. Docker Hub only - Rejected (CI/CD integration harder)
2. GHCR only - Rejected (Docker Hub more familiar for dev)

---

## Component Breakdown

### 1. Dockerization Layer

```
Docker Layer
├── Frontend Container (Next.js 16+)
│   ├── Base: node:20-alpine
│   ├── Port: 3000
│   └── Multi-stage: Builder + Runner
│
├── Backend Container (FastAPI)
│   ├── Base: python:3.13-slim
│   ├── Port: 8000
│   ├── Multi-stage: Builder + Runtime
│   └── Dependencies: FastAPI, SQLModel, Agents SDK
│
└── MCP Server Container (FastMCP)
    ├── Base: python:3.13-slim
    ├── Port: 8001
    └── Minimal: Only FastMCP dependencies
```

### Environment Variables for K8s Deployment

All secrets should be sourced from local `.env` files when creating Kubernetes resources:

**Backend secrets (from `backend/.env`):**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `BETTER_AUTH_SECRET` - Better Auth JWT secret

**Frontend secrets (from `frontend/.env`):**
- `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` - OpenAI ChatKit domain key (production)

**Internal K8s values (ConfigMap, not Secret):**
- `MCP_SERVER_URL=http://mcp-server:8001`
- `NEXT_PUBLIC_API_URL=http://backend:8000`
- `NEXT_PUBLIC_MCP_URL=http://mcp-server:8001`

### 2. Kubernetes Layer

```
Kubernetes Layer (Minikube)
├── Namespace: todo-app
│
├── ConfigMap: backend-config
│   └── Environment variables (non-sensitive)
│
├── Secret: backend-secrets
│   └── API keys, auth secret
│
├── Deployment: mcp-server (1 replica)
├── Deployment: backend (2 replicas)
├── Deployment: frontend (2 replicas)
│
├── Service: mcp-server (ClusterIP:8001)
├── Service: backend (ClusterIP:8000)
├── Service: frontend (NodePort:80)
│
└── Ingress: todo-ingress
    └── Routes / to frontend service
```

### 3. Helm Layer

```
Helm Layer
├── Chart: todo-app (1.0.0)
│
├── Values:
│   ├── values.yaml (defaults)
│   ├── values-dev.yaml (Minikube local)
│   ├── values-staging.yaml (Pre-production)
│   └── values-prod.yaml (Production - Phase 5)
│
└── Templates:
    ├── deployment.yaml (for all 3 services)
    ├── service.yaml (for all 3 services)
    ├── configmap.yaml (environment)
    ├── secret.yaml (sensitive data)
    ├── ingress.yaml (external access)
    ├── hpa.yaml (autoscaling - Phase 5)
    └── _helpers.tpl (Helm template functions)
```

### 4. AIOps Layer

```
AIOps Layer
├── Docker AI (Gordon)
│   ├── Dockerfile optimization
│   ├── Build debugging
│   └── Security scanning
│
├── kubectl-ai
│   ├── Deployment commands
│   ├── Scaling operations
│   └── Troubleshooting assistance
│
└── Kagent
    ├── Cluster health monitoring
    └── Resource optimization suggestions
```

---

## System Responsibilities

| Component | Responsibilities | Dependencies |
|-----------|-----------------|--------------|
| Frontend Pod | Serve UI, route requests to backend | Backend Service |
| Backend Pod | API endpoints, AI agent, task CRUD | MCP Service, Neon DB |
| MCP Server Pod | Expose task tools to agent | None (stateless) |
| ConfigMap | Non-sensitive configuration | All deployments |
| Secret | Sensitive configuration | Backend, MCP deployments |
| Ingress | External access routing | Frontend Service |
| Services | Internal service discovery | Deployments |

---

## High-Level Sequencing

### Phase 4 Implementation Sequence

```
Week 1: Dockerization
├── 1. Create Frontend Dockerfile
│   └── Multi-stage build, health check, non-root user
├── 2. Create Backend Dockerfile
│   └── Multi-stage build, health check, non-root user
├── 3. Create MCP Server Dockerfile
│   └── Minimal dependencies, health check
├── 4. Create docker-compose.yml
│   └── All services, health checks, networking
└── 5. Test with Docker Compose
    └── Verify all services start and communicate

Week 2: Kubernetes Manifests
├── 6. Create namespace and config manifests
├── 7. Create MCP server deployment and service
├── 8. Create backend deployment and service
├── 9. Create frontend deployment and service
├── 10. Create ingress for external access
└── 11. Validate all manifests with kubectl

Week 3: Minikube Deployment
├── 12. Install and start Minikube
├── 13. Enable ingress and metrics addons
├── 14. Build and load Docker images
├── 15. Deploy to Minikube
└── 16. Test end-to-end on Minikube

Week 4: Helm Charts and AIOps
├── 17. Create Helm chart structure
├── 18. Create values files (dev, staging, prod)
├── 19. Create Helm templates
├── 20. Test Helm chart on Minikube
├── 21. Set up kubectl-ai
├── 22. Set up Kagent
├── 23. Set up Docker AI (Gordon)
└── 24. Document AIOps workflows
```

---

## Non-Functional Requirements

### Performance

| NFR | Target | Measurement |
|------|---------|-------------|
| Pod startup time | <30 seconds | kubectl describe pod |
| API response time | <500ms p95 | Application metrics |
| Container image size | Frontend <200MB, Backend <500MB | docker images |
| Memory usage | <80% of limit | kubectl top pods |

### Reliability

| NFR | Target | Measurement |
|------|---------|-------------|
| Pod availability | >99% | kubectl get pods |
| Service uptime | >99% | Application monitoring |
| Zero-downtime deployment | Yes | Helm upgrade strategy |

### Security

| NFR | Target | Measurement |
|------|---------|-------------|
| Non-root containers | 100% | Dockerfile USER directive |
| Secrets not in git | 100% | Code review |
| Resource limits | 100% | kubectl describe deployment |
| Minimal base images | 100% | Dockerfile FROM directive |
| Health probes | 100% | kubectl describe pod |

### Scalability

| NFR | Target | Measurement |
|------|---------|-------------|
| Horizontal scaling | 2-5 pods per service | kubectl scale |
| Fast deployment | <5 minutes | Helm upgrade time |
| Stateless design | Yes | Architecture review |

---

## Operational Readiness

### Observability

| Component | Implementation | Status |
|-----------|-----------------|--------|
| Pod status | kubectl get pods | Pending |
| Service status | kubectl get svc | Pending |
| Pod logs | kubectl logs -f | Pending |
| Resource metrics | kubectl top pods | Pending |
| Minikube dashboard | minikube dashboard | Pending |

### Alerting

| Alert Type | Threshold | Tool |
|------------|-----------|-------|
| Pod crash loop | >3 restarts/hour | Manual monitoring |
| Resource limit | >90% usage | Kagent/kubectl-ai |
| Pod pending | >5 minutes | Manual monitoring |

### Runbooks

| Operation | Runbook Location |
|-----------|------------------|
| Deploy application | docs/DEPLOYMENT.md |
| Scale services | docs/AIOPS.md |
| Troubleshoot pods | docs/DEPLOYMENT.md |
| Setup Minikube | docs/MINIKUBE-SETUP.md |

### Deployment and Rollback

| Strategy | Implementation |
|----------|----------------|
| Deploy | Helm upgrade --install |
| Rollback | Helm rollback |
| Zero downtime | Rolling update (default Helm behavior) |
| Rollforward | Helm upgrade to new version |

### Feature Flags

No feature flags planned for Phase 4. All features always enabled.

---

## Risk Analysis

### Top 3 Risks

| # | Risk | Impact | Probability | Mitigation |
|---|-------|---------|-------------|
| 1 | Minikube resource constraints | Medium | High | Allocate 4 CPU, 8GB RAM |
| 2 | Image build failures | Medium | Medium | Test each Dockerfile, use Gordon |
| 3 | Service discovery issues | Medium | Low | Use K8s DNS names, test communication |
| 4 | Secrets in version control | High | Low | Use K8s Secrets, .gitignore enforcement |
| 5 | Ingress configuration errors | High | Medium | Use tested Ingress controller, test early |

### Blast Radius

| Risk | Blast Radius | Kill Switch |
|-------|-------------|--------------|
| Minikube failure | Local development only | `minikube delete` and restart |
| Docker image bug | All deployments using image | Tag previous version, rollback |
| K8s manifest error | Failed deployment only | `kubectl apply --dry-run` first |
| Helm chart error | All deployments using chart | Revert previous chart version |

---

## Evaluation and Validation

### Definition of Done

- [ ] All 3 Dockerfiles created and build successfully
- [ ] docker-compose.yml creates and runs all services
- [ ] All K8s manifests created and validated
- [ ] Helm chart created and passes lint
- [ ] Minikube deployed and application accessible
- [ ] All pods healthy (no restart loops)
- [ ] End-to-end testing passes
- [ ] AIOps tools tested and documented
- [ ] Documentation complete (deployment, AIOps, Minikube setup)
- [ ] README updated with Phase 4 instructions

### Output Validation

| Output | Validation Method |
|---------|------------------|
| Docker images | `docker images` size check |
| K8s manifests | `kubectl apply --dry-run` |
| Helm chart | `helm lint` output |
| Minikube deployment | `minikube status`, pod checks |
| Application access | Browser load test |

### Safety Checks

| Check | Purpose |
|--------|---------|
| No secrets in code | Security audit |
| Resource limits set | Resource starvation prevention |
| Non-root containers | Security best practice |
| Health probes configured | Self-healing |

---

## Integration Points

### Backend Integration

| Integration Point | Description |
|-----------------|-------------|
| MCP Server URL | Backend connects to `http://mcp-server:8001` |
| Database URL | Backend connects to Neon (external) |
| Environment variables | Backend loads from ConfigMap/Secret |

### Frontend Integration

| Integration Point | Description |
|-----------------|-------------|
| Backend API | Frontend calls `http://backend:8000` |
| Environment variables | Frontend loads API URLs from ConfigMap |

### External Services

| Service | Integration Method |
|----------|------------------|
| Neon DB | Connection string from Secret |
| Better Auth | Frontend handles auth, backend validates JWT |

---

## Phase 5 Preparation

### Dapr Annotations (Ready for Phase 5)

```yaml
# Add to deployments (disabled in Phase 4)
annotations:
  dapr.io/enabled: "false"  # Change to "true" in Phase 5
  dapr.io/app-id: "backend"
  dapr.io/app-port: "8000"
  dapr.io/config: "app-config"
```

### Kafka Topics (Ready for Phase 5)

| Topic | Purpose | Producer | Consumer |
|-------|---------|-----------|----------|
| task-events | Task CRUD operations | Recurring task service |
| reminders | Scheduled reminders | Notification service |
| task-updates | Real-time updates | WebSocket service |

### Cloud Registry Preparation (Phase 5)

| Registry | Setup Required | Timeline |
|----------|---------------|----------|
| GHCR | GitHub token, PAT creation | Phase 5 |
| Docker Hub | Docker Hub account, password | Ready now |
| DigitalOcean Registry | DO account | Phase 5 |

---

## References

- [Phase 4 Constitution](./constitution-prompt-phase-4.md)
- [Phase 4 Specification](./spec-prompt-phase-4.md)
- [Hackathon II Specification](./Hackathon\ II\ -\ Todo\ Spec-Driven\ Development.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker AI (Gordon)](https://docs.docker.com/ai/gordon/)

---

**Plan Version**: 1.0.0
**Last Updated**: December 24, 2025
**Phase**: Phase 4 - Local Kubernetes Deployment
