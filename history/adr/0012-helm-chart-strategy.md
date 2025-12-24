# ADR-0012: Helm Chart Strategy

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-24
- **Feature:** 001-k8s-local-deploy
- **Context:** Phase 4 requires deploying application to Kubernetes. Two approaches are possible: raw Kubernetes manifests (YAML files applied with kubectl) or Helm charts (packaged with values files for templating). Constitution Principle VII mandates immutable infrastructure via Helm upgrades. A decision is needed for local development (Minikube) while preparing for Phase 5 cloud deployment.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? YES - Defines deployment automation strategy
     2) Alternatives: Multiple viable options considered with tradeoffs? YES - Kustomize, raw manifests only evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? YES - Affects deployment, upgrades, and multi-environment management
-->

## Decision

We will adopt a dual-strategy approach: raw Kubernetes manifests for initial development learning, Helm charts for production-ready deployment.

**Phase 1: Development with Raw Manifests**
- Location: `k8s/` directory in repository root
- Purpose: Initial learning, direct kubectl operations, simpler debugging
- Files:
  - `00-namespace.yaml`
  - `01-configmap.yaml`
  - `02-secret.yaml`
  - `03-mcp-server-deployment.yaml`
  - `04-mcp-server-service.yaml`
  - `05-backend-deployment.yaml`
  - `06-backend-service.yaml`
  - `07-frontend-deployment.yaml`
  - `08-frontend-service.yaml`
  - `09-ingress.yaml`
- Deployment: `kubectl apply -f k8s/`

**Phase 2: Production with Helm Charts**
- Location: `helm/todo-app/` directory
- Purpose: Multi-environment deployment, templating, production upgrades
- Structure:
  ```
  helm/todo-app/
  ├── Chart.yaml              # Chart metadata (version 1.0.0)
  ├── values.yaml             # Default values
  ├── values-dev.yaml         # Minikube overrides
  ├── values-staging.yaml     # Staging environment overrides
  ├── values-prod.yaml        # Production (Phase 5) overrides
  └── templates/
      ├── _helpers.tpl         # Reusable template functions
      ├── NOTES.txt            # Post-install instructions
      ├── namespace.yaml        # Namespace template
      ├── configmap.yaml        # ConfigMap template
      ├── secret.yaml           # Secret template
      ├── mcp-deployment.yaml  # MCP Server Deployment template
      ├── mcp-service.yaml     # MCP Server Service template
      ├── backend-deployment.yaml
      ├── backend-service.yaml
      ├── frontend-deployment.yaml
      ├── frontend-service.yaml
      ├── ingress.yaml          # Ingress template
      └── hpa.yaml              # HorizontalPodAutoscaler (Phase 5)
  ```
- Deployment: `helm install todo-app ./helm/todo-app -n todo-app --values values-dev.yaml`

### Rationale

The dual-strategy approach allows learning Kubernetes fundamentals with raw manifests before introducing Helm abstraction. Raw manifests are simpler for initial development and debugging. Helm charts provide production-ready features: multi-environment management (dev/staging/prod), templating (DRY principle), and immutable upgrades (Constitution Principle VII). This progressive approach reduces cognitive load while ensuring production quality.

## Consequences

### Positive

- **Learning Path:** Raw manifests teach Kubernetes fundamentals (Deployments, Services, Secrets) before Helm abstraction
- **Multi-Environment Support:** Helm values files (dev/staging/prod) enable configuration differences without code changes
- **Constitution Alignment:** Satisfies Principle VII (Immutable Infrastructure) via `helm upgrade` vs manual kubectl edits
- **Production Ready:** Helm is industry standard for Kubernetes deployment; knowledge transfers to any cloud provider
- **Templating Power:** Helm conditionals, loops, and helpers reduce manifest duplication
- **Upgrade Safety:** `helm upgrade` provides rollback capability (`helm rollback`)
- **Version Management:** Chart versioning links deployments to Git commits
- **Community Ecosystem:** Access to Helm stable charts and community patterns

### Negative

- **Dual Maintenance:** Must maintain both raw manifests and Helm templates
  - *Mitigation:* Raw manifests are temporary for learning; can remove after Phase 4 completion
- **Helm Learning Curve:** Helm template syntax (`{{ .Values.x }}`) adds complexity
  - *Mitigation:* Use standard patterns (_helpers.tpl), document conventions in Chart.md
- **Template Debugging:** Helm template errors can be cryptic compared to raw YAML errors
  - *Mitigation:* Use `helm template --debug` to render manifests without installing
- **Values Overhead:** Must track which values apply to which environment
  - *Mitigation:* Use descriptive values file names (values-dev.yaml, values-prod.yaml)
- **Release History:** Helm stores release history in cluster; requires cleanup for long-running clusters
  - *Mitigation:* Use `helm uninstall` before major changes; `helm list` for visibility

## Alternatives Considered

### Alternative A: Raw Manifests Only
- **Pros:** Simplest approach, no Helm learning curve, direct kubectl control
- **Cons:** No templating, no multi-environment support, manual updates for each change
- **Why Rejected:** Raw manifests don't support multi-environment deployment. Every configuration change would require editing YAML files. Helm's values files provide clean separation between dev/staging/prod. Also violates Constitution Principle VII which mandates Helm upgrades for immutable infrastructure.

### Alternative B: Helm Charts Only
- **Pros:** Single deployment method, consistent across environments, no dual maintenance
- **Cons:** Higher learning curve initially, harder to debug template issues during learning phase
- **Why Rejected:** Learning Kubernetes directly with raw manifests provides better understanding of underlying concepts. After understanding Deployments, Services, etc., Helm abstraction makes more sense. The dual approach is explicitly documented in plan.md §Phase 1-4 progression.

### Alternative C: Kustomize
- **Pros:** Native Kubernetes tool, simple overlay pattern, no Go template language
- **Cons:** Less powerful than Helm, smaller ecosystem, not as widely adopted
- **Why Rejected:** Kustomize is simpler than Helm but less powerful. Helm is the de-facto standard for Kubernetes packaging with larger ecosystem and more community resources. Our multi-environment needs (dev/staging/prod) are better served by Helm's values files.

### Alternative D: Argo CD (GitOps)
- **Pros:** Automated deployments from Git, drift detection, rollback capability
- **Cons:** Overkill for Phase 4, requires additional infrastructure, more complexity
- **Why Rejected:** Argo CD is excellent for production GitOps but adds unnecessary complexity for local Minikube development. Consider for Phase 5 when deploying to cloud with GitOps requirements.

## References

- Feature Spec: [specs/001-k8s-local-deploy/spec.md](../../specs/001-k8s-local-deploy/spec.md)
- Implementation Plan: [specs/001-k8s-local-deploy/plan.md](../../specs/001-k8s-local-deploy/plan.md) AD-04
- Research Notes: [specs/001-k8s-local-deploy/research.md](../../specs/001-k8s-local-deploy/research.md) §3
- Data Model: [specs/001-k8s-local-deploy/data-model.md](../../specs/001-k8s-local-deploy/data-model.md) §Helm Values Schema
- Related ADRs: ADR-0009 (Three-Container Architecture), ADR-0010 (Service Discovery and Networking)
- Constitution Phase 4: [constitution-prompt-phase-4.md](../../constitution-prompt-phase-4.md) Principle VII
- Helm Documentation: https://helm.sh/docs/
- Helm Best Practices: https://helm.sh/docs/chart_best_practices/
