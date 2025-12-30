# Phase 4: Local Kubernetes Deployment - Feature Specification

**Project**: Evolution of Todo
**Phase**: Phase 4 - Local Kubernetes Deployment
**Version**: 1.0.0
**Status**: Active
**Due Date**: January 4, 2026

---

## Executive Summary

Phase 4 transforms the Phase 3 AI-powered Todo Chatbot into a containerized, cloud-native application deployable on Kubernetes. The phase focuses on:

1. **Docker Containerization** - Creating optimized Docker images for all 3 services
2. **Kubernetes Orchestration** - Deploying to Minikube for local testing
3. **Helm Chart Packaging** - Creating reusable Helm charts for deployment
4. **AIOps Integration** - Using kubectl-ai, Kagent, and Docker AI (Gordon)

This phase prepares the application for Phase 5 production deployment on DigitalOcean DOKS.

---

## User Stories

### US-01: Containerize Frontend Application

**As a developer**, I want to containerize the Next.js frontend so that it can be deployed consistently across environments.

**Acceptance Criteria**:
- [ ] Frontend Dockerfile uses multi-stage build
- [ ] Final image size is under 200MB
- [ ] Container runs as non-root user
- [ ] Health check endpoint configured on port 3000
- [ ] Environment variables are configurable
- [ ] Production build is standalone (no external dependencies)

### US-02: Containerize Backend Application

**As a developer**, I want to containerize the FastAPI backend so that it can be deployed alongside the MCP server.

**Acceptance Criteria**:
- [ ] Backend Dockerfile uses multi-stage build
- [ ] Python dependencies installed in builder stage only
- [ ] Runtime stage contains only necessary dependencies
- [ ] Container runs as non-root user
- [ ] Health check endpoint `/health` on port 8000
- [ ] All environment variables are configurable via ConfigMap/Secret

### US-03: Containerize MCP Server

**As a developer**, I want to containerize the FastMCP server so that it can be scaled independently.

**Acceptance Criteria**:
- [ ] MCP Server Dockerfile is minimal (Python slim base)
- [ ] Only FastMCP dependencies included
- [ ] Container runs as non-root user
- [ ] Health check endpoint `/health` on port 8001
- [ ] Environment variables configurable

### US-04: Create Docker Compose for Local Development

**As a developer**, I want to run all 3 services locally with Docker Compose so that I can test the full application.

**Acceptance Criteria**:
- [ ] docker-compose.yml defines all 3 services
- [ ] Services communicate via Docker network
- [ ] Health checks configured for all services
- [ ] Depends-on relationships configured
- [ ] Environment variables loaded from .env file
- [ ] `docker-compose up -d` starts all services successfully

### US-05: Create Kubernetes Namespace and Configuration

**As a DevOps engineer**, I want to create a dedicated namespace and configuration so that the application is isolated.

**Acceptance Criteria**:
- [ ] Namespace `todo-app` created
- [ ] ConfigMap created for non-sensitive configuration
- [ ] Secret created for sensitive data (API keys, secrets)
- [ ] All environment variables reference ConfigMap or Secret
- [ ] No secrets hardcoded in manifests

### US-06: Deploy MCP Server to Kubernetes

**As a DevOps engineer**, I want to deploy the MCP server as a separate pod so that the backend can scale independently.

**Acceptance Criteria**:
- [ ] Deployment created with 1 replica
- [ ] Service type is ClusterIP (internal only)
- [ ] Resource limits: 100m-300m CPU, 64-128Mi memory
- [ ] Liveness probe on `/health` port 8001
- [ ] Readiness probe on `/health` port 8001
- [ ] Service accessible as `mcp-server` from backend

### US-07: Deploy Backend to Kubernetes

**As a DevOps engineer**, I want to deploy the FastAPI backend with 2 replicas for high availability.

**Acceptance Criteria**:
- [ ] Deployment created with 2 replicas
- [ ] Service type is ClusterIP (internal only)
- [ ] Resource limits: 200m-1000m CPU, 256-512Mi memory
- [ ] Liveness probe on `/health` port 8000
- [ ] Readiness probe on `/health` port 8000
- [ ] Environment variables loaded from ConfigMap and Secret
- [ ] MCP server URL configured as `http://mcp-server:8001`
- [ ] Database URL configured (Neon - external)

### US-08: Deploy Frontend to Kubernetes

**As a DevOps engineer**, I want to deploy the Next.js frontend with 2 replicas and external access.

**Acceptance Criteria**:
- [ ] Deployment created with 2 replicas
- [ ] Service type is NodePort (Minikube) or LoadBalancer (cloud)
- [ ] Resource limits: 100m-500m CPU, 128-256Mi memory
- [ ] Liveness probe on `/` port 3000
- [ ] Readiness probe on `/` port 3000
- [ ] Environment variables point to internal backend URL

### US-09: Configure Ingress for External Access

**As a DevOps engineer**, I want to configure Ingress so that users can access the application via a friendly URL.

**Acceptance Criteria**:
- [ ] Ingress resource created
- [ ] Routes `/` path to frontend service
- [ ] Configured for `todo.local` (development)
- [ ] Nginx ingress controller used
- [ ] Optional TLS configuration documented for production

### US-10: Use Docker AI (Gordon) for Optimization

**As a developer**, I want to use Docker AI to optimize the Dockerfiles so that images are smaller and more secure.

**Acceptance Criteria**:
- [ ] Gordon enabled in Docker Desktop (version 4.53+)
- [ ] Gordon can generate Dockerfile suggestions
- [ ] Gordon can optimize existing Dockerfiles
- [ ] Gordon can analyze build errors
- [ ] Dockerfile improvements documented

### US-11: Use kubectl-ai for Operations

**As a DevOps engineer**, I want to use kubectl-ai for intelligent Kubernetes operations so that I can troubleshoot faster.

**Acceptance Criteria**:
- [ ] kubectl-ai installed and configured
- [ ] kubectl-ai can deploy the application
- [ ] kubectl-ai can scale deployments
- [ ] kubectl-ai can analyze pod failures
- [ ] kubectl-ai can suggest resource optimizations
- [ ] kubectl-ai commands documented

### US-12: Use Kagent for Cluster Monitoring

**As a DevOps engineer**, I want to use Kagent to monitor cluster health so that I can proactively address issues.

**Acceptance Criteria**:
- [ ] Kagent installed and configured
- [ ] Kagent can analyze cluster health
- [ ] Kagent can check resource utilization
- [ ] Kagent can suggest scaling strategies
- [ ] Kagent commands documented

### US-13: Create Helm Chart for Application

**As a DevOps engineer**, I want to create a Helm chart so that deployment is consistent across environments.

**Acceptance Criteria**:
- [ ] Helm chart structure follows best practices
- [ ] Chart.yaml contains correct metadata
- [ ] Values files created for dev, staging, prod
- [ ] Templates use Helm helper functions
- [ ] Namespace is configurable
- [ ] Resource requests/limits configurable
- [ ] Image tags configurable
- [ ] Ingress configuration configurable
- [ ] `helm lint` passes without warnings

### US-14: Deploy to Minikube Successfully

**As a developer**, I want to deploy the application to Minikube so that I can test Kubernetes deployment locally.

**Acceptance Criteria**:
- [ ] Minikube started with 4 CPU and 8GB RAM
- [ ] Ingress addon enabled
- [ ] All Docker images loaded to Minikube
- [ ] Namespace `todo-app` created
- [ ] All deployments applied successfully
- [ ] All pods are in Running state
- [ ] All services have endpoints
- [ ] Application accessible at http://todo.local

### US-15: Test End-to-End Application on Kubernetes

**As a QA engineer**, I want to test the full application on Kubernetes so that all features work as expected.

**Acceptance Criteria**:
- [ ] Frontend loads successfully in browser
- [ ] User can sign in (Better Auth)
- [ ] User can create tasks via chatbot
- [ ] User can list tasks via chatbot
- [ ] User can complete tasks via chatbot
- [ ] Backend can connect to MCP server
- [ ] All pods have no restart loops
- [ ] Resource usage within limits

### US-16: Prepare for Phase 5 Production Deployment

**As a DevOps engineer**, I want to prepare the Helm chart and manifests for Phase 5 production deployment.

**Acceptance Criteria**:
- [ ] Helm values-prod.yaml configured for production
- [ ] Container registry specified (GHCR or Docker Hub)
- [ ] Autoscaling (HPA) configuration documented
- [ ] TLS/SSL configuration documented
- [ ] Dapr annotations added (disabled in Phase 4, ready for Phase 5)
- [ ] Kafka integration points documented

---

## API Contracts

### Internal Service Communication

| From Service | To Service | URL | Protocol |
|-------------|-------------|-----|----------|
| Frontend | Backend | http://backend:8000 | HTTP |
| Backend | MCP Server | http://mcp-server:8001 | HTTP |
| Backend | Neon DB | postgresql://... | PostgreSQL |
| External | Frontend | http://todo.local | HTTP (Ingress) |

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|----------|-----------|-----------------|
| Frontend | GET / | HTML page (Next.js) |
| Backend | GET /health | `{"status": "healthy"}` |
| MCP Server | GET /health | `{"status": "healthy"}` |

---

## Database Requirements

### External Database

**Provider**: Neon Serverless PostgreSQL
- **Connection**: String from Neon console
- **Storage**: External (not managed by K8s)
- **Backups**: Managed by Neon
- **No PVC/PV required** for database

### Schema

No schema changes in Phase 4. Phase 3 schema (tasks, conversations, messages) is used.

---

## Acceptance Criteria Summary

### Dockerization
- [ ] Frontend Dockerfile created and builds successfully
- [ ] Backend Dockerfile created and builds successfully
- [ ] MCP Server Dockerfile created and builds successfully
- [ ] docker-compose.yml created and runs successfully
- [ ] All images under 500MB total size
- [ ] All containers run as non-root user

### Kubernetes Deployment
- [ ] All K8s manifests created and valid
- [ ] Namespace `todo-app` created
- [ ] ConfigMap and Secret created
- [ ] 3 Deployments created (mcp, backend, frontend)
- [ ] 3 Services created
- [ ] Ingress created
- [ ] All manifests applied successfully

### Minikube Deployment
- [ ] Minikube starts with sufficient resources
- [ ] Ingress addon enabled
- [ ] All images loaded to Minikube
- [ ] All pods reach Running state
- [ ] Application accessible via browser

### Helm Charts
- [ ] Helm chart structure created
- [ ] Chart.yaml valid
- [ ] 3 values files created (dev, staging, prod)
- [ ] All templates valid and use helpers
- [ ] `helm lint` passes
- [ ] Chart can be installed successfully

### AIOps Integration
- [ ] Docker AI (Gordon) tested and documented
- [ ] kubectl-ai tested and documented
- [ ] Kagent tested and documented
- [ ] Commands documented for each tool

### Testing
- [ ] All unit tests pass (Docker build, K8s dry-run)
- [ ] Integration tests pass on Minikube
- [ ] End-to-end user flows tested
- [ ] No critical bugs found

### Documentation
- [ ] README updated with deployment instructions
- [ ] Minikube setup guide created
- [ ] Troubleshooting guide created
- [ ] Architecture diagram updated
- [ ] All AIOps commands documented

---

## Out of Scope (Phase 4)

The following are explicitly **out of scope** for Phase 4:
- Dapr sidecar integration (Phase 5)
- Kafka deployment (Phase 5)
- Production cloud deployment (Phase 5 - DigitalOcean DOKS)
- TLS/SSL certificate management (Phase 5)
- Horizontal Pod Autoscaler (Phase 5)
- Monitoring/Prometheus/Grafana setup (Phase 5)
- Advanced recurring tasks feature (Phase 5)
- Kafka event-driven architecture (Phase 5)

---

## Dependencies

### Internal Dependencies
- Phase 3 backend and frontend code must be complete
- Phase 3 database models must be deployed
- Neon database connection string must be available

### External Dependencies
- Docker Desktop 4.53+ (for Docker AI/Gordon)
- Minikube latest version
- kubectl compatible with cluster version
- Container registry account (for Phase 5)
- Neon database account

---

## Environment Variables Reference

All required environment variables should be stored in local `.env` files. When deploying to Kubernetes, these values will be referenced from ConfigMap and Secret resources.

### Backend `.env` Example

```env
DATABASE_URL=postgresql+asyncpg://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
GEMINI_API_KEY=your-gemini-api-key-here
BETTER_AUTH_SECRET=your-better-auth-secret-here
MCP_SERVER_URL=http://mcp-server:8001
```

### Frontend `.env` Example

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MCP_URL=http://localhost:8001
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-openai-domain-key-here
```

### For Kubernetes Deployment

When deploying with `/sp.implement` or manually:
1. Keep secrets in local `.env` files (committed to `.gitignore`)
2. Reference values in Kubernetes Secret resources using:
   - `kubectl create secret generic backend-secrets --from-env-file=backend/.env`
   - Or use Helm: `helm install --set-file secrets.env`
3. Non-sensitive values go to ConfigMap

### Required Variables

| Variable | Service | Secret | Source |
|-----------|----------|--------|---------|
| `DATABASE_URL` | Backend | Yes | Neon console |
| `GEMINI_API_KEY` | Backend | Yes | Google AI Studio |
| `BETTER_AUTH_SECRET` | Backend | Yes | Generated or set |
| `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` | Frontend | Yes | OpenAI console |
| `MCP_SERVER_URL` | Backend | No | ConfigMap (http://mcp-server:8001) |
| `NEXT_PUBLIC_API_URL` | Frontend | No | ConfigMap (http://backend:8000) |

---

## Risk Assessment
- Docker Desktop 4.53+ (for Docker AI/Gordon)
- Minikube latest version
- kubectl compatible with cluster version
- Container registry account (for Phase 5)
- Neon database account

---

## Risk Assessment

| Risk | Impact | Mitigation |
|--------|---------|-------------|
| Insufficient Minikube resources | Pods fail to start | Allocate 4 CPU, 8GB RAM |
| Image size too large | Slow deployments | Use multi-stage builds, optimize with Gordon |
| Secrets in version control | Security breach | Use K8s Secrets, add to .gitignore |
| Ingress misconfiguration | App not accessible | Test Ingress rules, verify addon |
| Service discovery failure | Can't communicate | Use correct service names, verify DNS |

---

## Success Metrics

### Deployment Metrics
- **Deployment time**: <5 minutes for full application
- **Pod startup time**: <30 seconds for all pods
- **Image pull time**: <2 minutes per image
- **Resource usage**: <80% of allocated limits

### Quality Metrics
- **Image sizes**: Frontend <200MB, Backend <500MB, MCP <100MB
- **Helm lint**: 0 warnings, 0 errors
- **Pod restarts**: 0 per day (normal operation)
- **Uptime**: >99% during testing

---

## References

- [Phase 4 Constitution](./constitution-prompt-phase-4.md)
- [Phase 4 Implementation Plan](./plan-prompt-phase-4.md)
- [Hackathon II Specification](./Hackathon\ II\ -\ Todo\ Spec-Driven\ Development.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Docker AI (Gordon)](https://docs.docker.com/ai/gordon/)

---

**Specification Version**: 1.0.0
**Last Updated**: December 24, 2025
**Phase**: Phase 4 - Local Kubernetes Deployment
