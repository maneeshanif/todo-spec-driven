# ADR-0009: Three-Container Microservice Architecture

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-24
- **Feature:** 001-k8s-local-deploy
- **Context:** Phase 4 requires deploying the Todo application to Kubernetes. The application consists of a Next.js frontend, FastAPI backend with chat endpoints, and a FastMCP server exposing task tools. Each service has different resource requirements, scaling needs, and deployment patterns. Constitution Principles III, IV, and V mandate resource limits, health probes, and service discovery.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? YES - Defines service boundaries for all phases
     2) Alternatives: Multiple viable options considered with tradeoffs? YES - Monolith, 2-service variants evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? YES - Affects all services, scaling, and networking
-->

## Decision

We will deploy as three separate containers with independent scaling:

**Service 1: Frontend (Next.js)**
- Image: todo-frontend:latest
- Replicas: 2
- Port: 3000 (exposed via NodePort: 80)
- Resources: 100m-500m CPU, 128Mi-256Mi RAM
- Health Check: HTTP GET /

**Service 2: Backend (FastAPI)**
- Image: todo-backend:latest
- Replicas: 2
- Port: 8000 (ClusterIP only)
- Resources: 200m-1000m CPU, 256Mi-512Mi RAM
- Health Check: HTTP GET /health
- Responsibilities: REST API, ChatKit SSE, Auth, DB access

**Service 3: MCP Server (FastMCP)**
- Image: todo-mcp-server:latest
- Replicas: 1
- Port: 8001 (ClusterIP only)
- Resources: 100m-300m CPU, 64Mi-128Mi RAM
- Health Check: HTTP GET /health
- Responsibilities: Task tool endpoints, user isolation

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Minikube Cluster                      │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐             │
│  │   Frontend   │    │   Backend    │◀────────────┐│
│  │   (2 pods)   │───▶│   (2 pods)   │             ││
│  │  Port: 3000  │    │  Port: 8000  │             ││
│  └──────────────┘    └──────┬───────┘             ││
│                            │                      ││
│                            ▼                      ││
│                      ┌──────────────┐           ││
│                      │  MCP Server  │           ││
│                      │   (1 pod)   │           ││
│                      │  Port: 8001  │           ││
│                      └──────────────┘           ││
│                             │                  ││
└─────────────────────────────┼──────────────────┘│
                              │                  │
                              ▼                  │
                    ┌─────────────────┐           │
                    │ Neon PostgreSQL │◀──────────┘
                    │   (External)    │
                    └─────────────────┘
```

### Rationale

Separating services into three containers enables independent scaling (frontend and backend can scale differently based on load), independent deployment (MCP server updates don't require backend/frontend redeployment), and clear separation of concerns. This follows microservices best practices and is Kubernetes-native design patterns.

## Consequences

### Positive

- **Independent Scaling:** Each service scales based on its own load patterns (frontend scales with users, backend scales with API calls, MCP scales with tool invocations)
- **Independent Deployment:** MCP server updates don't require frontend/backend redeployment, reducing blast radius
- **Clear Separation:** Each service has single responsibility, making code easier to understand and maintain
- **Kubernetes-Native:** Three-container design maps naturally to Kubernetes Deployments, Services, and HPA
- **Resource Optimization:** Each service has appropriate resource limits tailored to its needs
- **Fault Isolation:** One service failure doesn't directly crash others (requires proper timeout handling)
- **Constitution Alignment:** Satisfies Principles III (Resource Limits), IV (Health Probes), V (Service Discovery)

### Negative

- **Operational Overhead:** Must manage 3 Deployments, 3 Services, and monitoring for each
  - *Mitigation:* Use Helm charts to bundle resources; centralized monitoring via metrics-server
- **Network Complexity:** Inter-service communication adds network latency and potential failure points
  - *Mitigation:* Use Kubernetes internal DNS (service-name.namespace); configure appropriate timeouts
- **Configuration Synchronization:** Services share environment variables that must be kept in sync
  - *Mitigation:* Use ConfigMap for shared non-sensitive values, Secrets for sensitive values
- **Distributed Debugging:** Tracing a request across services requires distributed logging
  - *Mitigation:* Structured logging with correlation IDs; consider Jaeger/Zipkin in Phase 5

## Alternatives Considered

### Alternative A: Single Container (Monolith)
- **Pros:** Simplest deployment, no network overhead, shared state, easier debugging
- **Cons:** Can't scale independently, all services fail together, violates microservices best practices
- **Why Rejected:** Chat SSE, REST API, and MCP tools have very different scaling characteristics. Scaling for chat load would waste resources on MCP tool capacity. Monolith would require complete redeployment for any change.

### Alternative B: Frontend + Backend Combined, MCP Separate
- **Pros:** Reduces container count to 2, simpler than 3 containers
- **Cons:** Frontend and backend still have different scaling needs, tighter coupling
- **Why Rejected:** Backend needs CPU for AI processing (LLM calls) while frontend is mostly serving static assets and handling UI. Combined container would waste resources or under-provision one component.

### Alternative C: All Services in One Pod (Multi-Container)
- **Pros:** Shared localhost networking (no service discovery), simpler one-pod deployment
- **Cons:** Sidecar pattern requires containers share lifecycle, can't scale independently, violates 1:1 container:replica best practice
- **Why Rejected:** Kubernetes best practice is one container per pod for proper lifecycle management. Multi-container pods should only be used for true sidecars (like logging proxies), not independent services.

## References

- Feature Spec: [specs/001-k8s-local-deploy/spec.md](../../specs/001-k8s-local-deploy/spec.md)
- Implementation Plan: [specs/001-k8s-local-deploy/plan.md](../../specs/001-k8s-local-deploy/plan.md) AD-01
- Data Model: [specs/001-k8s-local-deploy/data-model.md](../../specs/001-k8s-local-deploy/data-model.md)
- Related ADRs: ADR-0001 (Frontend Stack), ADR-0002 (Backend Stack), ADR-0006 (MCP Server Architecture)
- Constitution Phase 4: [constitution-prompt-phase-4.md](../../constitution-prompt-phase-4.md)
