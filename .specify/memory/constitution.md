<!--
Sync Impact Report:
- Version Change: 2.0.0 → 3.0.0 (MAJOR: Phase 5 advanced cloud deployment additions)
- Modified Principles:
  - Principle XVII → "Event-Driven Architecture" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XVIII → "Dapr Abstraction Layer" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XIX → "Stateless Services" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XX → "GitOps Deployment" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XXI → "Multi-Environment Parity" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XXII → "Observability First" (Enhanced for Phase 5)
  - Principle XXIII → "Resilience Patterns" (NEW for Phase 5 - NON-NEGOTIABLE)
  - Principle XXIV → "Security by Default" (Enhanced for Phase 5)
- Added Sections:
  - Phase 5 Technology Stack (Event Streaming, Dapr Building Blocks, Cloud K8s, CI/CD)
  - Phase 5 Specialized Agents (Event-Driven Builder, Microservice Builder, Cloud Deployer, AIOps Operator)
  - Phase 5 Skills Reference (7 new skills: dapr-integration, kafka-setup, github-actions-cicd, cloud-k8s-deployment, advanced-features, websocket-realtime, urdu-language-support)
  - Kafka Event Schemas (Task Event, Reminder Event, Task Update Event)
  - Dapr Component Configurations
  - New Services (WebSocket, Notification, Recurring Task, Audit)
  - New Database Models (Priority enum, Tag model, Reminder model)
  - GitHub Actions Workflow reference
  - Environment Configuration (Local/Staging/Production)
  - Security Checklist (Phase 5 additions)
  - Bonus Features section
- Removed Sections: None (Phase 2/3/4 content preserved)
- Templates Status:
  ✅ plan-template.md - Constitution Check reference remains valid
  ✅ spec-template.md - Aligned with spec-driven development principles
  ✅ tasks-template.md - Aligned with test-first and progressive enhancement principles
- Follow-up TODOs: None
-->

# Todo App - Phase 5 Constitution

**Project**: Evolution of Todo - Advanced Cloud Deployment
**Phase**: Phase 5 - Advanced Cloud Deployment
**Version**: 3.0.0
**Ratified**: 2025-12-11
**Status**: Active
**Last Amended**: 2025-12-30
**Builds Upon**: Phase 4 Constitution (Kubernetes Local Deployment)

---

## CLAUDE.md Integration (READ FIRST)

**This constitution is coupled with the CLAUDE.md hierarchy. Before any work:**

1. **Read CLAUDE.md files in order:**
   - `CLAUDE.md` (root) - Master project rules and agent/skill references
   - `frontend/CLAUDE.md` - Frontend-specific guidelines
   - `backend/CLAUDE.md` - Backend-specific guidelines

2. **Use Context7 MCP BEFORE implementation:**
   - Always fetch latest library documentation via Context7
   - Required lookups: `dapr`, `kafka`, `strimzi`, `github-actions`, `helm`, `kubernetes`
   - Never assume API patterns - verify first

3. **Delegate to Specialized Agents:**
   - `@event-driven-builder` for Kafka and Dapr pub/sub integration
   - `@microservice-builder` for new microservices (Notification, Recurring, Audit, WebSocket)
   - `@cloud-deployer` for DOKS deployment and GitHub Actions CI/CD
   - `@aiops-operator` for Docker AI (Gordon), monitoring, automation
   - `@backend-api-builder` for FastAPI services with Dapr integration
   - `@frontend-ui-builder` for Next.js UI components
   - `@database-designer` for database schema changes (Priority, Tags, Reminders)

4. **Reference Skills for Setup Tasks:**
   - Check `.claude/skills/` before any initialization
   - Phase 5 skills: `dapr-integration`, `kafka-setup`, `github-actions-cicd`, `cloud-k8s-deployment`, `advanced-features`, `websocket-realtime`, `urdu-language-support`

**Coupling:** All CLAUDE.md files reference this constitution. This constitution references all CLAUDE.md files. They work together as a unified system.

---

## Project Overview

This is the constitution for the Todo App Hackathon Phase 5, where we transform the Phase 4 locally deployed application into a production-grade, event-driven, distributed system deployable on cloud Kubernetes.

**Goal**: Build an enterprise-grade, event-driven microservices platform with real-time synchronization, advanced task features, and cloud-native deployment.

**Phase 5 Adds**:
- **Advanced Features**: Recurring Tasks, Due Dates, Reminders, Priorities, Tags, Search, Filter, Sort
- **Event-Driven Architecture**: Kafka for decoupled microservices communication
- **Dapr Integration**: Full building blocks (Pub/Sub, State, Secrets, Service Invocation, Jobs API)
- **Real-time Sync**: Dedicated WebSocket service for multi-client synchronization
- **CI/CD Pipeline**: GitHub Actions for automated deployment
- **Cloud Deployment**: Production Kubernetes on Azure/GKE/OKE/DOKS
- **Multi-language Support**: Urdu language support in chatbot (Bonus +100 points)

---

## Core Principles (Phase 2 Foundation)

### I. Spec-Driven Development (NON-NEGOTIABLE)

**Description**: Every feature begins with a specification. Implementation follows specification, never precedes it.

**Rules**:
- Write a complete Markdown specification for every feature before any implementation
- Specifications MUST include user stories, acceptance criteria, and success metrics
- No code may be written manually - all implementation MUST be generated by Claude Code from specifications
- Refine specifications until Claude Code generates correct output
- All specifications MUST be version controlled under `/specs` directory

**Rationale**: Spec-driven development ensures clear requirements, maintainable code, and alignment between intent and implementation.

---

### II. Monorepo Architecture

**Description**: Frontend and backend coexist in a single repository with clear boundaries.

**Structure**:
```
/frontend    - Next.js 16+ application (App Router)
/backend     - Python FastAPI application
/specs       - All specifications organized by type
/history     - All PHRs and ADRs
/helm        - Helm charts for Kubernetes deployment
/k8s         - Raw Kubernetes manifests
/.github     - GitHub Actions workflows
```

**Rules**:
- Each service (frontend/backend) MUST be independently deployable
- Shared types and contracts MUST be documented in `/specs/api`
- No circular dependencies between frontend and backend
- Each service has its own CLAUDE.md with specific guidelines

**Rationale**: Monorepo enables coordinated changes while maintaining clear service boundaries.

---

### III. Test-First Development

**Description**: Tests are written and approved before implementation begins.

**Rules**:
- For every feature, write acceptance tests first
- Tests MUST fail initially (Red phase)
- Implement until tests pass (Green phase)
- Refactor while keeping tests green
- No feature is complete without passing tests
- Minimum test coverage: 80% for backend, 70% for frontend

**Test Pyramid**:
- Backend: Unit tests, integration tests, API contract tests
- Frontend: Component tests, integration tests, E2E tests (critical paths)

**Rationale**: Test-first development catches bugs early and ensures requirements are met.

---

### IV. Authentication & Authorization First

**Description**: Security is foundational, not an afterthought.

**Rules**:
- Implement Better Auth with JWT tokens from the start
- All API endpoints MUST validate JWT tokens
- User isolation: users only access their own data
- Store secrets in environment variables, never in code
- Use HTTPS in production
- Implement rate limiting on authentication endpoints

**Security Standards**:
- Passwords: bcrypt hashing with salt
- JWT: Signed with secret, 7-day expiration
- Sessions: Secure, HttpOnly cookies
- CORS: Whitelist frontend origin only

**Rationale**: Security by design prevents vulnerabilities and data breaches.

---

### V. API-First Design

**Description**: Design and document API contracts before implementation.

**Rules**:
- All API endpoints MUST be documented in `/specs/api/rest-endpoints.md`
- Follow RESTful conventions:
  - GET for retrieval
  - POST for creation
  - PUT for full update
  - PATCH for partial update
  - DELETE for removal
- Return appropriate HTTP status codes
- Use consistent error response format
- Version APIs when breaking changes are needed

**API Response Format**:
```json
{
  "success": true/false,
  "data": { ... },
  "error": { "code": "ERROR_CODE", "message": "Human-readable message" }
}
```

**Rationale**: API-first design ensures frontend and backend can be developed in parallel.

---

### VI. Database-First Schema Design

**Description**: Define database schema before implementing models or queries.

**Rules**:
- Document complete schema in `/specs/database/schema.md`
- Use SQLModel for ORM (combines SQLAlchemy + Pydantic)
- Apply migrations for all schema changes
- Index frequently queried fields
- Enforce foreign key constraints
- Use UUIDs for user IDs, integers for task IDs

**Schema Standards**:
- Every table has: `created_at`, `updated_at` timestamps
- Soft deletes where appropriate (add `deleted_at` field)
- Consistent naming: snake_case for columns
- Document all relationships and constraints

**Rationale**: Schema-first design prevents data integrity issues and migration headaches.

---

### VII. Modern UI/UX Standards

**Description**: Build beautiful, accessible, responsive user interfaces.

**Tech Stack**:
- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS 4.0
- **Components**: Shadcn/ui (copy-paste components)
- **Animations**: Framer Motion (smooth transitions)
- **Effects**: Aceternity UI (stunning visual effects)

**Rules**:
- Mobile-first responsive design
- Dark mode support from day one
- Accessibility: WCAG 2.1 Level AA compliance
- Loading states for all async operations
- Error boundaries for graceful error handling
- Optimistic UI updates for better UX

**Performance Standards**:
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Lighthouse score > 90

**Rationale**: Modern UI/UX standards create delightful user experiences and professional applications.

---

### VIII. Observability & Debugging

**Description**: Applications must be observable and debuggable in production.

**Rules**:
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Include request IDs in all logs for tracing
- Log all authentication attempts
- Log all database errors
- Never log sensitive data (passwords, tokens)

**Monitoring**:
- API response times
- Error rates
- Database query performance
- Authentication failures

**Rationale**: Observability enables rapid debugging and performance optimization.

---

### IX. Documentation & Knowledge Capture

**Description**: Every decision, conversation, and architectural choice must be documented.

**Documentation Requirements**:
1. **Prompt History Records (PHRs)**: Record every user interaction and Claude Code session
2. **Architecture Decision Records (ADRs)**: Document significant architectural decisions
3. **README.md**: Setup instructions, tech stack, deployment guide
4. **API Documentation**: Complete endpoint documentation with examples
5. **Component Documentation**: Storybook or similar for UI components

**PHR Creation** (after every user request):
- Route to appropriate subfolder: `history/prompts/{constitution|general|feature-name}/`
- Include: ID, title, stage, user prompt, assistant response, files changed
- Use templates from `.specify/templates/phr-template.prompt.md`

**ADR Suggestion** (for significant decisions):
- Test for significance: Impact + Alternatives + Scope
- Suggest: "Architectural decision detected: [brief] - Document? Run `/sp.adr [title]`"
- Never auto-create; wait for user consent

**Rationale**: Documentation preserves knowledge and accelerates onboarding.

---

## Core Principles (Phase 3 AI Chatbot)

### X. Stateless Architecture (CRITICAL FOR PHASE 3+)

**Description**: The chatbot server MUST be completely stateless - all conversation state persists in the database.

**Rules**:
- Server holds NO in-memory conversation state
- Every request includes conversation_id to fetch history from database
- Messages stored in database immediately after generation
- Agent can be restarted without losing conversation context
- MCP tools are stateless - they operate on database state

**Rationale**: Stateless architecture enables horizontal scaling, fault tolerance, and seamless server restarts.

---

### XI. MCP-First Tool Design

**Description**: All task operations are exposed as MCP tools that the AI agent calls.

**Rules**:
- Use FastMCP Python SDK for MCP server implementation
- Each tool has clear input schema and return type
- Tools are thin wrappers around database operations
- Tools handle their own error responses
- Never expose raw database errors to AI agent

**MCP Server Architecture**:
- **Phase 3**: MCP Server runs as separate Python process on **port 8001**
- **Phase 4+**: MCP Server runs as separate Kubernetes pod
- Agent connects via HTTP: `http://localhost:8001` (local) or `http://mcp-server:8001` (K8s)

**Rationale**: MCP standardizes AI-to-application communication and enables tool reuse across different AI frameworks.

---

### XII. Agent-Centric Design

**Description**: The OpenAI Agents SDK agent is the brain that interprets user intent and orchestrates tool calls.

**Rules**:
- Use OpenAI Agents SDK with Gemini model (via AsyncOpenAI wrapper)
- Agent has clear system prompt defining personality and capabilities
- Agent uses @function_tool decorators for MCP tool integration
- Implement AgentHooks and RunHooks for observability
- Use Runner.run() for synchronous execution or Runner.run_streamed() for SSE

**Rationale**: Centralizing AI logic in the agent ensures consistent behavior and maintainable code.

---

### XIII. Real-Time Streaming (SSE)

**Description**: Use Server-Sent Events for real-time response streaming from AI agent.

**Rules**:
- Implement SSE endpoint for chat responses
- Stream tokens as they're generated by the agent
- Include tool call notifications in stream
- Handle connection drops gracefully
- Support both streaming and non-streaming modes

**Rationale**: Streaming provides better UX by showing responses as they're generated.

---

### XIV. ChatKit UI Integration

**Description**: Use OpenAI ChatKit for the chat interface frontend.

**Rules**:
- Use OpenAI ChatKit for chatbot UI (as specified in hackathon requirements)
- Configure ChatKit with custom backend endpoint
- Implement themed components for dark mode support
- Add conversation sidebar for thread management
- Use Zustand for conversation state management

**Rationale**: ChatKit provides production-ready chat UI components that match OpenAI's design language.

---

### XV. Conversation Persistence

**Description**: Store all conversations and messages in PostgreSQL database.

**Rules**:
- Create new conversation if conversation_id not provided
- Auto-generate conversation title from first user message
- Store all messages immediately (don't wait for response)
- Support listing conversations by user
- Support deleting conversations

**Rationale**: Persistent conversations enable history viewing, context continuation, and user experience continuity.

---

### XVI. Progressive Enhancement from Phase 2

**Description**: Build on Phase 2 foundation without breaking existing functionality.

**Rules**:
- Preserve all Phase 2 REST API endpoints
- Add new endpoints alongside existing APIs
- Share database models and services
- Reuse authentication middleware
- Maintain existing frontend routes

**Rationale**: Progressive enhancement delivers value incrementally without regression.

---

## Core Principles (Phase 5 Advanced Cloud Deployment)

### XVII. Event-Driven Architecture (NON-NEGOTIABLE)

**Description**: Services must communicate through events, not direct API calls for async operations.

**Rules**:
- All task CRUD operations MUST publish to `task-events` Kafka topic
- Reminder scheduling MUST use `reminders` topic
- Real-time sync across clients MUST use `task-updates` topic
- Services consume events asynchronously - no blocking waits
- Events are immutable facts - never modify published events

**Event Topics**:
| Topic | Purpose | Publishers | Consumers |
|-------|---------|------------|-----------|
| `task-events` | Task CRUD operations | Backend | Recurring, Audit, WebSocket |
| `reminders` | Scheduled reminders | Backend | Notification |
| `task-updates` | Real-time sync | All services | WebSocket |

**Rationale**:
- Decouples services for independent scaling
- Enables audit trail and event replay
- Supports eventual consistency patterns
- Allows new consumers without modifying producers

---

### XVIII. Dapr Abstraction Layer (NON-NEGOTIABLE)

**Description**: All infrastructure dependencies must be abstracted through Dapr building blocks.

**Rules**:
- Use Dapr Pub/Sub for Kafka - no direct Kafka client libraries
- Use Dapr State for conversation state - no direct database calls for state
- Use Dapr Service Invocation for inter-service calls - built-in retries/mTLS
- Use Dapr Secrets for API keys - no hardcoded credentials
- **Use Dapr Jobs API for scheduled reminders (PRIMARY)** - exact-time scheduling

**Dapr Building Blocks**:
| Building Block | Purpose | Local | Production |
|----------------|---------|-------|------------|
| Pub/Sub | Event streaming | pubsub.kafka | pubsub.kafka (cloud) |
| State | Conversation state | state.postgresql | state.postgresql |
| Service Invocation | Service calls | Built-in | Built-in |
| Secrets | API keys | secretstores.kubernetes | Azure KeyVault / GCP Secret Manager |
| Jobs API | Scheduled reminders | Built-in scheduler | Built-in scheduler |

**Rationale**:
- Enables infrastructure swapping without code changes (Kafka → RabbitMQ)
- Provides consistent APIs across all building blocks
- Includes built-in observability and resilience
- Simplifies multi-cloud deployment
- Jobs API provides exact-time scheduling required for reminder accuracy

---

### XIX. Stateless Services (NON-NEGOTIABLE)

**Description**: All services must be stateless - state managed externally via Dapr or database.

**Rules**:
- No in-memory session state - use Dapr State Management
- No local file storage - use external object storage
- Configuration via environment variables or Dapr Secrets
- Conversation context stored in PostgreSQL, not memory
- Any pod can handle any request - no sticky sessions

**Rationale**:
- Enables horizontal scaling without session affinity
- Supports rolling deployments without state loss
- Facilitates disaster recovery
- Simplifies debugging and testing

---

### XX. GitOps Deployment (NON-NEGOTIABLE)

**Description**: All deployments must be triggered through Git - no manual kubectl or helm commands in production.

**Rules**:
- Production deployments only via GitHub Actions
- All Helm values versioned in Git
- Infrastructure changes through Pull Requests
- Rollback by reverting Git commits
- No `kubectl edit` or `kubectl apply` in production - only via CI/CD

**Rationale**:
- Complete audit trail of all deployments
- Reproducible infrastructure from Git history
- Enables automated testing before deployment
- Supports approval workflows

---

### XXI. Multi-Environment Parity (NON-NEGOTIABLE)

**Description**: Development, staging, and production environments must be as similar as possible.

**Rules**:
- Same Dapr components in all environments (different backends)
- Same Helm chart with environment-specific values
- Minikube topology mirrors cloud topology
- Local Kafka/Redpanda for development
- Cloud Kafka (Redpanda Cloud/Confluent) for production

**Rationale**:
- Reduces "works on my machine" issues
- Enables realistic local testing
- Simplifies debugging production issues
- Faster onboarding for new developers

---

### XXII. Observability First (ENHANCED for Phase 5)

**Description**: All services must be observable - logs, metrics, and traces.

**Rules**:
- Structured JSON logging in all services
- Prometheus metrics endpoint on all services
- Distributed tracing via Dapr (OpenTelemetry)
- Centralized log aggregation (Loki or cloud equivalent)
- Dashboard for key metrics (Grafana)

**Rationale**:
- Enables rapid incident diagnosis
- Supports proactive alerting
- Provides visibility into system behavior
- Facilitates capacity planning

---

### XXIII. Resilience Patterns (NON-NEGOTIABLE)

**Description**: All services must implement resilience patterns for fault tolerance.

**Rules**:
- Circuit breakers via Dapr resiliency policies
- Retry with exponential backoff for external calls
- Timeout configuration on all HTTP calls
- Graceful degradation when dependencies fail
- Health checks for liveness and readiness

**Rationale**:
- Prevents cascade failures
- Improves user experience during partial outages
- Enables self-healing systems
- Reduces on-call burden

---

### XXIV. Security by Default (ENHANCED for Phase 5)

**Description**: Security is built-in, not bolted on.

**Rules**:
- mTLS between all services via Dapr
- RBAC for Kubernetes resources
- Network policies to restrict pod communication
- Secrets never in Git - use Sealed Secrets or external vault
- Image scanning in CI/CD pipeline
- Pod Security Standards enforced

**Rationale**:
- Reduces attack surface
- Meets compliance requirements
- Protects against internal threats
- Enables audit trails

---

## Technology Stack

### Event Streaming (Phase 5)

| Component | Local (Minikube) | Production (Cloud) |
|-----------|------------------|-------------------|
| Kafka | Redpanda (Docker) or Strimzi | Redpanda Cloud / Confluent Cloud |
| Topics | task-events, reminders, task-updates | Same topics, managed service |
| Schema | JSON events | JSON with optional Avro/Protobuf |

### AI & Agent Framework (Phase 3)
- **OpenAI Agents SDK**: 0.1.0+ - Agent orchestration
- **Gemini**: gemini-2.5-flash - LLM model (via OpenAI-compatible API)
- **FastMCP**: Latest - MCP server implementation
- **SSE**: Server-Sent Events - Real-time streaming

### Backend (Phase 2 + Phase 3 + Phase 5)
- **Framework**: FastAPI 0.115+
- **Language**: Python 3.13+
- **ORM**: SQLModel 0.0.24+ (SQLAlchemy 2.0 + Pydantic 2.0)
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth (JWT tokens)
- **Validation**: Pydantic 2.0
- **Testing**: pytest 8.0+, httpx (for API tests)
- **Package Manager**: UV (fast Python package manager)

### Frontend (Phase 2 + Phase 3)
- **Framework**: Next.js 16+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 4.0
- **Components**: Shadcn/ui (Radix UI primitives)
- **Animation**: Framer Motion 11+
- **Effects**: Aceternity UI (stunning visual effects)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios 1.7+ (MANDATORY - NO fetch for API calls)
- **State**: Zustand 5.0+ (MANDATORY - NO React Context for state)
- **Chat UI**: @openai/chatkit-react (Phase 3)

### Cloud Kubernetes (Phase 5)

| Provider | Service | Free Tier | Recommendation |
|----------|---------|-----------|----------------|
| Oracle Cloud | OKE | Always free (4 OCPU, 24GB) | Best for learning |
| Google Cloud | GKE | $300 credit / 90 days | Good documentation |
| Azure | AKS | $200 credit / 30 days | Enterprise features |
| DigitalOcean | DOKS | $200 credit / 60 days | Simple setup |

### CI/CD (Phase 5)

| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD pipeline |
| Helm | Package deployment |
| Container Registry | GHCR / Docker Hub / Cloud Registry |
| ArgoCD (optional) | GitOps deployment |

### Advanced Features Stack (Phase 5)

| Feature | Implementation |
|---------|----------------|
| Recurring Tasks | Dapr Jobs API + Kafka events |
| Due Dates | Task model field + reminder scheduling |
| Reminders | In-app notifications via Kafka → WebSocket (NOT browser push) |
| Priorities | Task model field (high/medium/low) |
| Tags/Categories | Many-to-many relationship with Tag model |
| Search | Simple SQL LIKE/ILIKE queries |
| Filter/Sort | API query parameters + database queries |
| Real-time Sync | Dedicated WebSocket service consuming `task-updates` topic |

---

## Claude Code Integration

### Phase 2 Specialized Agents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **Backend API Builder** | `@backend-api-builder` | FastAPI development: endpoints, services, middleware, testing |
| **Frontend UI Builder** | `@frontend-ui-builder` | Next.js development: components, pages, hooks, animations |
| **Database Designer** | `@database-designer` | PostgreSQL schema, SQLModel models, Alembic migrations |

### Phase 3 Specialized Agents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **AI Agent Builder** | `@ai-agent-builder` | OpenAI Agents SDK, MCP integration, Gemini config |
| **MCP Server Builder** | `@mcp-server-builder` | FastMCP server, tool definitions |
| **Chatbot UI Builder** | `@chatbot-ui-builder` | ChatKit integration, conversation UI |

### Phase 4 Specialized Agents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **Docker Containerization Builder** | `@docker-containerization-builder` | Dockerfiles, Docker Compose, multi-stage builds |
| **DevOps Kubernetes Builder** | `@devops-kubernetes-builder` | K8s manifests, deployments, services |
| **AIOps Helm Builder** | `@aiops-helm-builder` | Helm charts, values files, templates |

### Phase 5 Specialized Agents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| **Event-Driven Builder** | `@event-driven-builder` | Kafka, Dapr pub/sub, event streaming |
| **Microservice Builder** | `@microservice-builder` | New microservices (Notification, Recurring, Audit, WebSocket) |
| **Cloud Deployer** | `@cloud-deployer` | DOKS deployment, GitHub Actions CI/CD |
| **AIOps Operator** | `@aiops-operator` | Docker AI (Gordon), monitoring, automation |

### Phase 2 Skills Reference

| Skill | Location | Purpose |
|-------|----------|---------|
| **FastAPI Setup** | `.claude/skills/fastapi-setup/SKILL.md` | Initialize FastAPI project with UV |
| **Next.js Setup** | `.claude/skills/nextjs-setup/SKILL.md` | Initialize Next.js 16+ with App Router |
| **Shadcn/ui Setup** | `.claude/skills/shadcn-ui-setup/SKILL.md` | Configure component library |
| **Neon DB Setup** | `.claude/skills/neon-db-setup/SKILL.md` | Configure PostgreSQL database |
| **Better Auth** | `.claude/skills/better-auth-integration/SKILL.md` | JWT authentication for both ends |

### Phase 3 Skills Reference

| Skill | Location | Purpose |
|-------|----------|---------|
| **OpenAI Agents Setup** | `.claude/skills/openai-agents-setup/SKILL.md` | Initialize agent with Gemini |
| **FastMCP Server Setup** | `.claude/skills/fastmcp-server-setup/SKILL.md` | Create MCP server |
| **ChatKit Frontend** | `.claude/skills/chatkit-frontend/SKILL.md` | ChatKit React UI + useChatKit hook |
| **ChatKit Backend** | `.claude/skills/chatkit-backend/SKILL.md` | ChatKit SSE endpoint + conversation persistence |
| **Conversation Management** | `.claude/skills/conversation-management/SKILL.md` | History UI |

### Phase 4 Skills Reference

| Skill | Location | Purpose |
|-------|----------|---------|
| **Docker Setup** | `.claude/skills/docker-setup/SKILL.md` | Dockerfile & Docker Compose setup |
| **Kubernetes Deployment** | `.claude/skills/kubernetes-deployment/SKILL.md` | K8s manifests with Kustomize |
| **Helm Charts Setup** | `.claude/skills/helm-charts-setup/SKILL.md` | Helm chart creation |
| **Minikube Setup** | `.claude/skills/minikube-setup/SKILL.md` | Local Kubernetes cluster |
| **AIOps Gordon** | `.claude/skills/aiops-gordon/SKILL.md` | Docker AI (Gordon) operations |

### Phase 5 Skills Reference

| Skill | Location | Purpose | Bonus Target |
|-------|----------|---------|--------------|
| **Dapr Integration** | `.claude/skills/dapr-integration/SKILL.md` | Dapr building blocks (Pub/Sub, State, Jobs API, Secrets) | +200 |
| **Kafka Setup** | `.claude/skills/kafka-setup/SKILL.md` | Kafka/Redpanda configuration (local + cloud) | +200 |
| **GitHub Actions CI/CD** | `.claude/skills/github-actions-cicd/SKILL.md` | CI/CD pipeline for K8s deployment | +200 |
| **Cloud K8s Deployment** | `.claude/skills/cloud-k8s-deployment/SKILL.md` | AKS/GKE/OKE/DOKS deployment patterns | +200 |
| **Advanced Features** | `.claude/skills/advanced-features/SKILL.md` | Recurring tasks, reminders, priorities, tags | +200 |
| **WebSocket Realtime** | `.claude/skills/websocket-realtime/SKILL.md` | WebSocket service for multi-client sync | +200 |
| **Urdu Language Support** | `.claude/skills/urdu-language-support/SKILL.md` | Urdu chatbot responses | +100 |

---

## Kafka Event Schemas (Phase 5)

### Task Event

```json
{
  "event_type": "created | updated | completed | deleted",
  "task_id": 123,
  "user_id": "user-uuid",
  "task_data": {
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "priority": "high | medium | low",
    "due_date": "2026-01-15T10:00:00Z",
    "tags": ["work", "urgent"],
    "recurring": {
      "enabled": true,
      "pattern": "weekly",
      "next_occurrence": "2026-01-22T10:00:00Z"
    }
  },
  "timestamp": "2026-01-10T14:30:00Z",
  "correlation_id": "uuid-for-tracing"
}
```

### Reminder Event

```json
{
  "task_id": 123,
  "user_id": "user-uuid",
  "title": "Task title",
  "due_at": "2026-01-15T10:00:00Z",
  "remind_at": "2026-01-15T09:00:00Z",
  "notification_type": "push | email | both",
  "correlation_id": "uuid-for-tracing"
}
```

### Task Update Event (Real-time Sync)

```json
{
  "event_type": "sync",
  "task_id": 123,
  "user_id": "user-uuid",
  "changes": {
    "completed": true
  },
  "source_client": "web | mobile | api",
  "timestamp": "2026-01-10T14:30:00Z"
}
```

---

## New Database Models (Phase 5)

### Task Model (Updated)

```python
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: datetime | None = Field(default=None)
    reminder_at: datetime | None = Field(default=None)
    recurring_pattern: str | None = Field(default=None)  # "daily", "weekly", "monthly"
    next_occurrence: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)
```

### Tag Model (New)

```python
class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str = Field(max_length=50)
    color: str = Field(default="#808080")  # Hex color

    # Relationships
    tasks: list["Task"] = Relationship(back_populates="tags", link_model=TaskTag)

class TaskTag(SQLModel, table=True):
    task_id: int = Field(foreign_key="task.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)
```

### Reminder Model (New)

```python
class ReminderStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"

class Reminder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    user_id: str = Field(index=True)
    remind_at: datetime
    status: ReminderStatus = Field(default=ReminderStatus.PENDING)
    sent_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## New Services (Phase 5)

### WebSocket Service (NEW)

| Aspect | Details |
|--------|---------|
| **Port** | 8005 |
| **Purpose** | Real-time multi-client sync via WebSocket fan-out |
| **Consumes** | `task-updates` topic (via Dapr Pub/Sub) |
| **Publishes** | None (broadcasts to connected WebSocket clients) |
| **Dapr App ID** | `websocket-service` |
| **Technology** | FastAPI + WebSockets + Dapr Pub/Sub subscription |

### Notification Service (NEW)

| Aspect | Details |
|--------|---------|
| **Port** | 8002 |
| **Purpose** | In-app notifications for reminders (NOT browser push) |
| **Consumes** | `reminders` topic |
| **Publishes** | `task-updates` topic (to trigger WebSocket broadcast) |
| **Dapr App ID** | `notification-service` |

### Recurring Task Service (NEW)

| Aspect | Details |
|--------|---------|
| **Port** | 8003 |
| **Purpose** | Auto-create next occurrence of recurring tasks |
| **Consumes** | `task-events` (completed events for recurring tasks) |
| **Publishes** | `task-events` (created events for new occurrence) |
| **Dapr App ID** | `recurring-task-service` |

### Audit Service (NEW)

| Aspect | Details |
|--------|---------|
| **Port** | 8004 |
| **Purpose** | Log all task operations for audit trail |
| **Consumes** | `task-events` (all events) |
| **Publishes** | None |
| **Dapr App ID** | `audit-service` |

---

## Development Workflow

### 1. Specification Phase (`/sp.specify`)
- Write or update feature specification in `/specs/features/`
- Define user stories with acceptance criteria
- Document API contracts in `/specs/api/`
- Define database schema in `/specs/database/`
- Get user approval before proceeding

### 2. Planning Phase (`/sp.plan`)
- Research technical approach
- Design architecture
- Identify dependencies
- Create implementation plan
- Document in `/specs/[feature]/plan.md`

### 3. Task Generation (`/sp.tasks`)
- Break down plan into testable tasks
- Prioritize tasks by dependency order
- Document in `/specs/[feature]/tasks.md`
- Each task MUST be independently verifiable

### 4. Implementation Phase (`/sp.implement`)
- Execute tasks in order
- Generate code using Claude Code from specs
- Write tests first (Red phase)
- Implement until tests pass (Green phase)
- Refactor while keeping tests green

### 5. Review Phase
- Run all tests
- Check code quality
- Verify spec compliance
- Create PHR for the session

### 6. Deployment Phase (Phase 5)
- Push to feature branch
- GitHub Actions runs CI pipeline
- Deploy to staging via Helm
- Run smoke tests
- PR approval triggers production deploy
- Monitor for errors

---

## Environment Configuration (Phase 5)

### Local (Minikube with Dapr)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | redpanda:9092 | Redpanda in cluster |
| DATABASE_URL | Neon connection | Secret |

### Staging (Cloud K8s)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | staging.redpanda.cloud:9092 | Redpanda Cloud |
| DATABASE_URL | Neon staging branch | Secret |

### Production (Cloud K8s)

| Variable | Value | Source |
|----------|-------|--------|
| DAPR_HTTP_PORT | 3500 | Dapr sidecar |
| KAFKA_BROKERS | prod.redpanda.cloud:9092 | Redpanda Cloud |
| DATABASE_URL | Neon production branch | Secret |
| ENABLE_MONITORING | true | ConfigMap |

---

## Security Checklist

### Phase 2 Security
- [ ] All API endpoints validate JWT tokens
- [ ] User data is isolated by user_id
- [ ] Passwords are hashed (never stored plain)
- [ ] SQL injection prevented (use ORM)
- [ ] XSS prevented (React auto-escapes)
- [ ] CSRF tokens on mutations (if using cookies)
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS in production
- [ ] Environment variables for secrets
- [ ] No secrets in git repository
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints

### Phase 3 Security (Chat-Specific)
- [ ] Chat endpoints validate JWT tokens
- [ ] User can only access their own conversations
- [ ] MCP tools validate user_id ownership
- [ ] Message content length limited (max 4000 characters)
- [ ] Rate limiting on chat endpoints (30 msg/min)
- [ ] Tool calls logged for audit
- [ ] No sensitive data in agent responses
- [ ] SSE connections properly authenticated
- [ ] Input sanitization to prevent prompt injection

### Phase 5 Security (Cloud-Specific)
- [ ] All services communicate via Dapr mTLS
- [ ] RBAC configured for Kubernetes resources
- [ ] Network policies restrict pod communication
- [ ] Secrets stored in cloud secret manager (not K8s secrets)
- [ ] GitHub Actions secrets for CI/CD credentials
- [ ] Image scanning in CI pipeline
- [ ] Pod Security Standards enforced
- [ ] Dapr API tokens configured
- [ ] Kafka SASL authentication enabled
- [ ] TLS for Ingress (cert-manager + Let's Encrypt)

---

## Bonus Features (Phase 5)

### Hackathon Bonus Points Targets

| Bonus Feature | Points | Status | Implementation |
|--------------|--------|--------|----------------|
| **Reusable Intelligence** (Agent Skills) | +200 | Target | Create Phase 5 skills for Dapr, Kafka, CI/CD, Cloud K8s |
| **Cloud-Native Blueprints** (Agent Skills) | +200 | Target | Skills for deployment patterns |
| **Multi-language Support (Urdu)** | +100 | Target | Urdu chatbot responses via language-aware prompts |
| **Voice Commands** | +200 | Done | Already implemented in Phase 3 |

**Total Potential Bonus**: +600 points (Voice already done = +200 secured)

### Urdu Language Support Implementation

**Scope**:
- Chatbot understands and responds in Urdu
- Language toggle in chat UI (optional)
- System prompt language switching
- UI translation is out of scope (Urdu responses only)

**Acceptance Criteria**:
- [ ] Agent responds in Urdu when user writes in Urdu
- [ ] Agent responds in English when user writes in English
- [ ] Task titles/descriptions can be in Urdu
- [ ] Language preference stored per user (optional)

---

## Git & Version Control

### Branch Strategy
- `main` - production-ready code
- `phase5/[task-name]` - Phase 5 feature branches
- Create PR for all changes
- Squash commits on merge

### Commit Messages
```
feat: add Kafka event publishing for task operations
fix: resolve WebSocket connection drop issue
docs: update Dapr component documentation
refactor: simplify event consumer logic
test: add integration tests for Dapr pub/sub
chore: update GitHub Actions workflow
```

Format: `type: description`
Types: feat, fix, docs, refactor, test, chore

---

## Governance

### Constitution Authority
- This constitution supersedes all other practices
- Previous phase constitutions remain valid for their respective features
- All code reviews MUST verify compliance
- Violations MUST be justified and documented
- Amendments require user approval and documentation

### Change Management
- Constitution changes require new version number
- Document rationale for all amendments
- Update CLAUDE.md to reflect changes
- Communicate changes to all stakeholders

### Versioning Policy
- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Amendment Procedure
1. Propose change via PR to constitution file
2. Document rationale in PR description
3. Get user approval
4. Update version number based on change type
5. Update Sync Impact Report at top of file
6. Update all dependent templates if needed

### Compliance Review
- All agents MUST verify constitution compliance before code generation
- Constitution Check gates MUST pass before implementation
- Violations require explicit justification

---

## References

- [Phase 5 Constitution Source](./constitution-prompt-phase-5.md)
- [Phase 4 Constitution](./constitution-prompt-phase-4.md)
- [Phase 3 Constitution](./constitution-prompt-phase-3.md)
- [Phase 2 Constitution](./prompts/constitution-prompt-phase-2.md)
- [Dapr Documentation](https://docs.dapr.io/)
- [Dapr Pub/Sub](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Jobs API](https://docs.dapr.io/developing-applications/building-blocks/jobs/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redpanda Documentation](https://docs.redpanda.com/)
- [Strimzi Operator](https://strimzi.io/documentation/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Better Auth Documentation](https://www.better-auth.com/)

---

**Version**: 3.0.0 | **Ratified**: 2025-12-11 | **Last Amended**: 2025-12-30
