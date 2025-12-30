# Claude Code Rules

This file is generated during init for the selected agent.

You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your primary goal is to work with the architext to build products.

---

## 🚨 ABSOLUTE REQUIREMENTS - ENFORCED FOR ALL QUERIES

### ⛔ STOP! Before ANY Action

**You MUST complete these steps IN ORDER before writing ANY code:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: INVOKE SKILL (if applicable)                                   │
│  → Check if a skill matches the task                                    │
│  → Use Skill tool to invoke it BEFORE any code generation               │
│                                                                         │
│  STEP 2: FETCH CONTEXT7 DOCS                                            │
│  → mcp_context7_resolve-library-id → mcp_context7_get-library-docs      │
│  → Fetch docs for ALL technologies being used                           │
│                                                                         │
│  STEP 3: DELEGATE TO SUBAGENT                                           │
│  → Use Task tool with appropriate subagent_type                         │
│  → NEVER write code directly - always delegate                          │
│                                                                         │
│  STEP 4: READ SPECS                                                     │
│  → Read constitution, spec, plan before implementation                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**VIOLATION OF THESE STEPS IS FORBIDDEN. NO EXCEPTIONS.**

---

## 🎯 SKILL INVOCATION - MANDATORY FIRST STEP

### How Skills Work

Skills are specialized, reusable procedures stored in `.claude/skills/`. You MUST invoke them using the **Skill tool** BEFORE any implementation.

**Invocation Pattern:**
```
Skill(skill: "skill-name")
```

### Skill Matching Table - USE FOR EVERY QUERY

| When User Asks About... | INVOKE SKILL | Then Use Agent |
|-------------------------|--------------|----------------|
| FastAPI setup, backend project init | `fastapi-setup` | `backend-api-builder` |
| Next.js setup, frontend project init | `nextjs-setup` | `frontend-ui-builder` |
| Shadcn/ui components, button, card, input | `shadcn-ui-setup` | `frontend-ui-builder` |
| Neon database, PostgreSQL, connection | `neon-db-setup` | `database-designer` |
| Authentication, login, signup, JWT | `better-auth-integration` | `backend-api-builder` |
| OpenAI Agents SDK, AI agent, Gemini | `openai-agents-setup` | `ai-agent-builder` |
| FastMCP server, MCP tools | `fastmcp-server-setup` | `mcp-server-builder` |
| ChatKit frontend, chat UI, useChatKit | `chatkit-frontend` | `chatbot-ui-builder` |
| ChatKit backend, SSE streaming, /chatkit endpoint | `chatkit-backend` | `backend-api-builder` |
| Conversation history, chat sidebar | `conversation-management` | `chatbot-ui-builder` |
| Dockerfile, Docker Compose, containers | `docker-setup` | `docker-containerization-builder` |
| Kubernetes, K8s manifests, deployments | `kubernetes-deployment` | `devops-kubernetes-builder` |
| Helm charts, K8s packaging | `helm-charts-setup` | `aiops-helm-builder` |
| Minikube, local K8s cluster | `minikube-setup` | `devops-kubernetes-builder` |
| Docker AI, Gordon, container optimization | `aiops-gordon` | `docker-containerization-builder` |
| Dapr integration, pub/sub, state | `dapr-integration` | `event-driven-builder` |
| Kafka, Strimzi, event streaming | `kafka-setup` | `event-driven-builder` |
| GitHub Actions, CI/CD pipelines | `github-actions-cicd` | `cloud-deployer` |
| Cloud K8s, DOKS, production deploy | `cloud-k8s-deployment` | `cloud-deployer` |
| Advanced features, priorities, tags, due dates | `advanced-features` | `microservice-builder` |
| WebSocket, real-time sync | `websocket-realtime` | `microservice-builder` |
| Urdu language, i18n, RTL | `urdu-language-support` | `frontend-ui-builder` |

### Skill Directory Reference

| Skill Name | Path | Purpose |
|------------|------|---------|
| `fastapi-setup` | `.claude/skills/fastapi-setup/SKILL.md` | FastAPI project initialization |
| `nextjs-setup` | `.claude/skills/nextjs-setup/SKILL.md` | Next.js project initialization |
| `shadcn-ui-setup` | `.claude/skills/shadcn-ui-setup/SKILL.md` | Shadcn/ui component setup |
| `neon-db-setup` | `.claude/skills/neon-db-setup/SKILL.md` | Neon PostgreSQL configuration |
| `better-auth-integration` | `.claude/skills/better-auth-integration/SKILL.md` | Better Auth implementation |
| `openai-agents-setup` | `.claude/skills/openai-agents-setup/SKILL.md` | OpenAI Agents + Gemini |
| `fastmcp-server-setup` | `.claude/skills/fastmcp-server-setup/SKILL.md` | FastMCP server creation |
| `chatkit-frontend` | `.claude/skills/chatkit-frontend/SKILL.md` | ChatKit React UI + useChatKit hook |
| `chatkit-backend` | `.claude/skills/chatkit-backend/SKILL.md` | ChatKit SSE endpoint + conversation persistence |
| `conversation-management` | `.claude/skills/conversation-management/SKILL.md` | Conversation history sidebar |
| `docker-setup` | `.claude/skills/docker-setup/SKILL.md` | Dockerfile & Docker Compose setup |
| `kubernetes-deployment` | `.claude/skills/kubernetes-deployment/SKILL.md` | K8s manifests & deployments |
| `helm-charts-setup` | `.claude/skills/helm-charts-setup/SKILL.md` | Helm chart creation |
| `minikube-setup` | `.claude/skills/minikube-setup/SKILL.md` | Local K8s cluster setup |
| `aiops-gordon` | `.claude/skills/aiops-gordon/SKILL.md` | Docker AI (Gordon) operations |
| `dapr-integration` | `.claude/skills/dapr-integration/SKILL.md` | Dapr pub/sub, state, service invocation |
| `kafka-setup` | `.claude/skills/kafka-setup/SKILL.md` | Strimzi Kafka, Redpanda Cloud |
| `github-actions-cicd` | `.claude/skills/github-actions-cicd/SKILL.md` | GitHub Actions CI/CD pipelines |
| `cloud-k8s-deployment` | `.claude/skills/cloud-k8s-deployment/SKILL.md` | DigitalOcean DOKS deployment |
| `advanced-features` | `.claude/skills/advanced-features/SKILL.md` | Priorities, tags, due dates, reminders |
| `websocket-realtime` | `.claude/skills/websocket-realtime/SKILL.md` | WebSocket real-time sync |
| `urdu-language-support` | `.claude/skills/urdu-language-support/SKILL.md` | Urdu i18n, RTL support |

### Deprecated Skills (Use Alternatives)

| Deprecated Skill | Use Instead | Reason |
|------------------|-------------|--------|
| `openai-chatkit-setup` | `chatkit-frontend` | Consolidated into comprehensive ChatKit frontend skill |
| `streaming-sse-setup` | `chatkit-backend` | SSE is part of ChatKit backend integration |
| `chat-api-integration` | `chatkit-backend` | Consolidated into ChatKit backend skill |

---

## 🤖 SUBAGENT DELEGATION - MANDATORY FOR ALL CODE

### ABSOLUTE RULE: NEVER WRITE CODE DIRECTLY

**All code generation MUST be delegated to a specialized subagent using the Task tool.**

```
Task(
  subagent_type: "agent-name",
  prompt: "detailed task description",
  description: "short description"
)
```

### Agent Matching Table - USE FOR EVERY CODE TASK

| Code Type | DELEGATE TO AGENT | subagent_type |
|-----------|-------------------|---------------|
| FastAPI endpoints, routes, middleware | Backend API Builder | `backend-api-builder` |
| FastAPI services, business logic | Backend API Builder | `backend-api-builder` |
| ChatKit SSE endpoint, /chatkit route | Backend API Builder | `backend-api-builder` |
| SQLModel models, schemas | Database Designer | `database-designer` |
| Alembic migrations | Database Designer | `database-designer` |
| React components, pages | Frontend UI Builder | `frontend-ui-builder` |
| Next.js pages, layouts | Frontend UI Builder | `frontend-ui-builder` |
| Zustand stores | Frontend UI Builder | `frontend-ui-builder` |
| OpenAI Agents SDK code | AI Agent Builder | `ai-agent-builder` |
| FastMCP server, tools | MCP Server Builder | `mcp-server-builder` |
| ChatKit React UI, useChatKit | Chatbot UI Builder | `chatbot-ui-builder` |
| Conversation sidebar, history UI | Chatbot UI Builder | `chatbot-ui-builder` |
| Dockerfile, Docker Compose | Docker Containerization Builder | `docker-containerization-builder` |
| Kubernetes manifests, deployments | DevOps Kubernetes Builder | `devops-kubernetes-builder` |
| Helm charts, K8s packaging | AIOps Helm Builder | `aiops-helm-builder` |
| Dapr, Kafka, event-driven patterns | Event-Driven Builder | `event-driven-builder` |
| Microservices, new services | Microservice Builder | `microservice-builder` |
| Cloud deployment, CI/CD | Cloud Deployer | `cloud-deployer` |
| AIOps, monitoring, automation | AIOps Operator | `aiops-operator` |

### Agent Definitions

| Agent | File | Skills Coupled | Capabilities |
|-------|------|----------------|--------------|
| `backend-api-builder` | `.claude/agents/backend-api-builder.md` | `chatkit-backend`, `better-auth-integration` | FastAPI, services, middleware, auth, SSE streaming |
| `frontend-ui-builder` | `.claude/agents/frontend-ui-builder.md` | - | React, Next.js, Shadcn, Zustand |
| `database-designer` | `.claude/agents/database-designer.md` | - | SQLModel, Alembic, PostgreSQL |
| `ai-agent-builder` | `.claude/agents/ai-agent-builder.md` | - | OpenAI Agents SDK, Gemini |
| `mcp-server-builder` | `.claude/agents/mcp-server-builder.md` | - | FastMCP, tool definitions |
| `chatbot-ui-builder` | `.claude/agents/chatbot-ui-builder.md` | `chatkit-frontend`, `conversation-management` | ChatKit React, conversation UI |
| `ui-ux-designer` | `.claude/agents/ui-ux-designer.md` | - | UI/UX design, wireframes |
| `docker-containerization-builder` | `.claude/agents/docker-containerization-builder.md` | `docker-setup`, `aiops-gordon` | Dockerfile, Docker Compose, container optimization |
| `devops-kubernetes-builder` | `.claude/agents/devops-kubernetes-builder.md` | `kubernetes-deployment`, `minikube-setup` | K8s manifests, deployments, services |
| `aiops-helm-builder` | `.claude/agents/aiops-helm-builder.md` | `helm-charts-setup` | Helm charts, K8s packaging |
| `event-driven-builder` | `.claude/agents/event-driven-builder.md` | `dapr-integration`, `kafka-setup` | Kafka, Dapr pub/sub, event streaming |
| `microservice-builder` | `.claude/agents/microservice-builder.md` | `advanced-features`, `websocket-realtime` | New microservices, service patterns |
| `cloud-deployer` | `.claude/agents/cloud-deployer.md` | `cloud-k8s-deployment`, `github-actions-cicd` | DOKS, CI/CD, Helm deployments |
| `aiops-operator` | `.claude/agents/aiops-operator.md` | `aiops-gordon`, `docker-setup`, `kubernetes-deployment` | AIOps, monitoring, automation |

---

## 🔍 CONTEXT7 MCP - MANDATORY DOCUMENTATION LOOKUP

### BEFORE Writing ANY Code

**You MUST fetch latest documentation using Context7 MCP:**

```
Step 1: mcp__context7__resolve-library-id(libraryName: "library-name")
Step 2: mcp__context7__get-library-docs(context7CompatibleLibraryID: "/org/project")
```

### Required Lookups by Technology

**Phase 2 (Foundation):**
- `nextjs` - Next.js 16+ App Router patterns
- `fastapi` - FastAPI 0.115+ best practices
- `sqlmodel` - SQLModel ORM usage
- `better-auth` - Authentication patterns
- `shadcn-ui` - Component library
- `framer-motion` - Animation patterns
- `tailwindcss` - Tailwind CSS 4.0
- `zustand` - State management
- `axios` - HTTP client
- `aceternity-ui` - Visual effects

**Phase 3 (AI Chatbot):**
- `openai-agents-sdk` - OpenAI Agents SDK patterns
- `fastmcp` - FastMCP server implementation
- `litellm` - Multi-LLM support (for Gemini)
- `sse-starlette` - Server-Sent Events

**Phase 4 (Kubernetes Deployment):**
- `docker` - Docker best practices
- `kubernetes` - Kubernetes API and patterns
- `helm` - Helm chart development
- `minikube` - Local Kubernetes development

**Phase 5 (Advanced Cloud Deployment):**
- `dapr` - Dapr building blocks and SDK
- `strimzi` - Strimzi Kafka operator
- `kafka` - Apache Kafka patterns
- `github-actions` - GitHub Actions workflows
- `digitalocean` - DigitalOcean DOKS
- `next-intl` - Next.js internationalization
- `prometheus` - Monitoring and alerting
- `grafana` - Dashboard visualization

**NEVER ASSUME API PATTERNS - ALWAYS VERIFY WITH CONTEXT7!**

---

## 📋 SPEC READING - MANDATORY BEFORE IMPLEMENTATION

### Required Reading Order

**For Phase 5 (Current):**

| Order | Document | Purpose | Path |
|-------|----------|---------|------|
| 1 | Constitution | Project laws & principles | `constitution-prompt-phase-5.md` |
| 2 | Specification | User stories & acceptance | `spec-prompt-phase-5.md` |
| 3 | Plan | Architecture & approach | `plan-prompt-phase-5.md` |

**For Phase 4 (Reference):**

| Order | Document | Purpose | Path |
|-------|----------|---------|------|
| 1 | Constitution | Project laws & principles | `constitution-prompt-phase-4.md` |
| 2 | Specification | User stories & acceptance | `spec-prompt-phase-4.md` |
| 3 | Plan | Architecture & approach | `plan-prompt-phase-4.md` |

**For Phase 3 (Reference):**

| Order | Document | Purpose | Path |
|-------|----------|---------|------|
| 1 | Constitution | Project laws & principles | `constitution-prompt-phase-3.md` |
| 2 | Specification | User stories & acceptance | `spec-prompt-phase-3.md` |
| 3 | Plan | Architecture & approach | `plan-prompt-phase-3.md` |
| 4 | Feature Spec | Specific feature details | `specs/features/*.md` |
| 5 | API Spec | Endpoint contracts | `specs/api/rest-endpoints.md` |
| 6 | DB Schema | Database design | `specs/database/schema.md` |

**For Phase 2 (Reference):**

| Order | Document | Purpose | Path |
|-------|----------|---------|------|
| 1 | Constitution | Project laws & principles | `prompts/constitution-prompt-phase-2.md` |
| 2 | Specification | User stories & acceptance | `prompts/spec-prompt-phase-2.md` |
| 3 | Plan | Architecture & approach | `prompts/plan-prompt-phase-2.md` |

**ENFORCEMENT: If you haven't read the relevant specs, STOP and read them first.**

---

## 🔄 COMPLETE WORKFLOW - FOLLOW FOR EVERY REQUEST

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANDATORY WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. ANALYZE REQUEST                                                     │
│     └─ Identify: What technology? What type of code?                    │
│                                                                         │
│  2. INVOKE SKILL (if applicable)                                        │
│     └─ Skill(skill: "matching-skill-name")                              │
│     └─ Read SKILL.md for patterns and examples                          │
│                                                                         │
│  3. FETCH CONTEXT7 DOCS                                                 │
│     └─ mcp__context7__resolve-library-id                                │
│     └─ mcp__context7__get-library-docs                                  │
│                                                                         │
│  4. READ SPECS (if implementation task)                                 │
│     └─ Constitution → Spec → Plan → Feature specs                       │
│                                                                         │
│  5. DELEGATE TO SUBAGENT                                                │
│     └─ Task(subagent_type: "matching-agent", prompt: "...")             │
│     └─ Include skill patterns and Context7 info in prompt               │
│                                                                         │
│  6. CREATE PHR (after completion)                                       │
│     └─ Record prompt history in history/prompts/                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Example: User asks "Add a new task API endpoint"

```
1. ANALYZE: Backend code, FastAPI endpoint
2. SKILL: Skill(skill: "fastapi-setup") - read patterns
3. CONTEXT7: Fetch FastAPI docs
4. SPECS: Read specs/api/rest-endpoints.md
5. DELEGATE: Task(subagent_type: "backend-api-builder", prompt: "...")
6. PHR: Create prompt history record
```

### Example: User asks "Create chat UI with streaming"

```
1. ANALYZE: Frontend code, ChatKit, SSE
2. SKILLS:
   - Skill(skill: "openai-chatkit-setup")
   - Skill(skill: "streaming-sse-setup")
3. CONTEXT7: Fetch Next.js, ChatKit docs
4. SPECS: Read specs/ui/chat-components.md
5. DELEGATE: Task(subagent_type: "chatbot-ui-builder", prompt: "...")
6. PHR: Create prompt history record
```

---

## 🔌 MCP Server Integration

### Available MCP Tools

| MCP Server | Purpose | When to Use |
|------------|---------|-------------|
| **Context7** | Fetch latest library docs | Before ANY implementation |
| **GitHub** | Repo management, PRs | Code commits, PR creation |
| **Filesystem** | File operations | Reading/writing project files |

### MCP Workflow

```
1. Context7: Resolve library ID → Get documentation
2. Read: Constitution → Spec → Plan → Feature specs
3. Delegate: Use appropriate agent (@backend/@frontend/@database)
4. Reference: Use skill for setup tasks
5. Implement: Generate code following specs
6. Record: Create PHR in history/prompts/
```

---

## 🌿 Branch Strategy

### Phase-Prefixed Branches

```
main (production)
├── phase2/setup        → Project initialization (COMPLETED)
├── phase2/database     → Schema & migrations (COMPLETED)
├── phase2/backend-api  → FastAPI endpoints (COMPLETED)
├── phase2/frontend-ui  → Next.js pages & components (COMPLETED)
├── phase2/integration  → Connect frontend ↔ backend (COMPLETED)
├── phase2/deploy       → Vercel + Neon deployment (COMPLETED)
│
├── phase3/setup-ai-chatbot  → AI Chatbot implementation (COMPLETED)
├── phase3/mcp-server        → MCP server with task tools (COMPLETED)
├── phase3/ai-agent          → OpenAI Agents SDK integration (COMPLETED)
├── phase3/chat-ui           → ChatKit frontend (COMPLETED)
├── phase3/streaming         → SSE streaming responses (COMPLETED)
│
├── phase4/setup             → Docker & K8s setup (COMPLETED)
├── phase4/docker            → Dockerfiles & Compose (COMPLETED)
├── phase4/kubernetes        → K8s manifests & deployments (COMPLETED)
├── phase4/helm              → Helm chart creation (COMPLETED)
├── phase4/minikube          → Local K8s cluster (COMPLETED)
│
├── phase5/setup             → Phase 5 project setup (CURRENT)
├── phase5/dapr              → Dapr pub/sub integration
├── phase5/kafka             → Strimzi Kafka deployment
├── phase5/advanced-features → Priorities, tags, due dates
├── phase5/microservices     → New microservices
├── phase5/websocket         → WebSocket real-time service
├── phase5/cicd              → GitHub Actions pipelines
├── phase5/cloud-deploy      → DOKS production deployment
├── phase5/aiops             → Monitoring & automation
└── phase5/urdu              → Urdu language support
```

**Naming Convention**: `phase{N}/{task-type}`

### Branch Lifecycle

```bash
# 1. Create branch from main
git checkout -b phase2/setup

# 2. Run SP commands
/sp.specify → /sp.plan → /sp.tasks

# 3. Implement & commit
git commit -m "feat(scope): description"

# 4. Push & PR
git push -u origin phase2/setup
/sp.git.commit_pr

# 5. Merge to main, delete branch
```

### Commit Convention

```
<type>(<scope>): <description>
Types: feat, fix, docs, test, refactor, chore
```

---

## 🔧 SpecKit Plus Commands

Run in Claude Code CLI:

| Command | Purpose |
|---------|---------|
| `/sp.constitution` | Define project principles |
| `/sp.specify` | Create feature specification |
| `/sp.plan` | Generate implementation plan |
| `/sp.tasks` | Break plan into testable tasks |
| `/sp.implement` | Execute implementation |
| `/sp.clarify` | Ask clarifying questions |
| `/sp.analyze` | Analyze existing code |
| `/sp.checklist` | Generate completion checklist |
| `/sp.adr` | Document architecture decision |
| `/sp.phr` | Create prompt history record |
| `/sp.git.commit_pr` | Commit and create PR |

### Typical Flow

```
/sp.specify → /sp.plan → /sp.tasks → /sp.implement → /sp.checklist → /sp.git.commit_pr
```

---

## 🚀 Phase 5: Advanced Cloud Deployment (CURRENT)

**Current Phase**: Phase 5 - Advanced Cloud Deployment
**Due Date**: January 18, 2026
**Main Branch**: `main` | **Feature Branches**: `phase5/*`

### Phase 5 Overview

Evolve the Todo application into a production-grade, cloud-native microservices platform:
- **Event-Driven Architecture**: Kafka/Redpanda + Dapr pub/sub for decoupled services
- **New Microservices**: Notification (8002), Recurring Task (8003), Audit (8004), WebSocket (8005)
- **Advanced Features**: Priorities, tags, due dates, reminders, recurring tasks, search/filter/sort
- **Real-time Sync**: WebSocket service for instant updates across clients
- **Cloud Deployment**: GitHub Actions CI/CD + DigitalOcean DOKS
- **AIOps**: Docker AI (Gordon) + monitoring + automated remediation
- **Urdu Language Support**: RTL layout, i18n with next-intl (+100 bonus points)

### Key Documents

| Document | Purpose |
|----------|---------|
| `constitution-prompt-phase-5.md` | Project principles and cloud-native standards |
| `spec-prompt-phase-5.md` | User stories and acceptance criteria |
| `plan-prompt-phase-5.md` | Implementation plan and architecture |

### Phase 5 Specialized Agents

| Agent | When to Use |
|-------|-------------|
| `@event-driven-builder` | Kafka, Dapr pub/sub, event streaming |
| `@microservice-builder` | New microservices (Notification, Recurring, Audit, WebSocket) |
| `@cloud-deployer` | DOKS deployment, GitHub Actions CI/CD |
| `@aiops-operator` | Docker AI (Gordon), monitoring, automation |

### Phase 5 Skills

| Skill | Purpose |
|-------|---------|
| `dapr-integration` | Dapr pub/sub, state, service invocation |
| `kafka-setup` | Strimzi Kafka, Redpanda Cloud |
| `github-actions-cicd` | CI/CD pipelines for staging and production |
| `cloud-k8s-deployment` | DigitalOcean DOKS deployment |
| `advanced-features` | Priorities, tags, due dates, reminders |
| `websocket-realtime` | WebSocket real-time sync service |
| `urdu-language-support` | Urdu i18n, RTL layout support |

### Phase 5 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOKS KUBERNETES CLUSTER                                  │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Backend   │  │ MCP Server  │  │  AI Agent   │        │
│  │  (Next.js)  │  │  (FastAPI)  │  │  (FastMCP)  │  │  (Gemini)   │        │
│  │   :3000     │  │   :8000     │  │   :8001     │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────┘        │
│         │                │                │                                 │
│  ┌──────▼────────────────▼────────────────▼──────────────────────────────┐ │
│  │              EVENT BUS (Kafka/Redpanda + Dapr)                        │ │
│  │  Topics: task-events, reminder-events, audit-events, task-updates     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│         │                │                │                │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐       │
│  │Notification │  │  Recurring  │  │   Audit     │  │  WebSocket  │       │
│  │  Service    │  │   Service   │  │  Service    │  │  Service    │       │
│  │   :8002     │  │   :8003     │  │   :8004     │  │   :8005     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  Infrastructure: Ingress (NGINX), cert-manager, HPA, NetworkPolicies       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 5 Implementation Steps

1. **Dapr Integration**: Configure pub/sub, state, service invocation
2. **Kafka Setup**: Deploy Strimzi Kafka or configure Redpanda Cloud
3. **Advanced Features**: Add priorities, tags, due dates, reminders
4. **New Microservices**: Build Notification, Recurring, Audit, WebSocket services
5. **Event-Driven Backend**: Publish/subscribe to task events
6. **WebSocket Service**: Real-time sync across clients
7. **GitHub Actions CI/CD**: Automated testing and deployment
8. **Cloud Deployment**: Deploy to DigitalOcean DOKS
9. **AIOps**: Configure monitoring, alerting, automation
10. **Urdu Support**: Add i18n with RTL layout

### Quick Commands

```bash
# Start Dapr sidecar with Kafka
dapr run --app-id backend --app-port 8000 --dapr-http-port 3500 -- uvicorn src.main:app

# Deploy Strimzi Kafka
kubectl apply -f k8s/kafka/strimzi-cluster.yaml

# Run GitHub Actions locally
act -j build

# Deploy to DOKS
doctl kubernetes cluster kubeconfig save todo-production
helm upgrade --install evolution-todo ./helm/evolution-todo -f values-production.yaml
```

---

## ☸️ Phase 4: Local Kubernetes Deployment (COMPLETED)

**Status**: ✅ COMPLETED
**Completed Date**: December 30, 2025
**Main Branch**: `main` | **Feature Branches**: `phase4/*`

### Phase 4 Overview

Deploy the Evolution of Todo application to a local Kubernetes cluster:
- **Containerization**: Multi-stage Dockerfiles for all 4 services
- **Docker Compose**: Development and production configurations
- **Kubernetes**: Manifests with Kustomize for environment overlays
- **Helm Charts**: Package management for Kubernetes deployment
- **Minikube**: Local multi-node cluster (1 control plane + 2 workers)
- **Docker AI (Gordon)**: Intelligent container operations

### Key Documents

| Document | Purpose |
|----------|---------|
| `constitution-prompt-phase-4.md` | Project principles and DevOps standards |
| `spec-prompt-phase-4.md` | User stories and acceptance criteria |
| `plan-prompt-phase-4.md` | Implementation plan and architecture |

### Phase 4 Specialized Agents

| Agent | When to Use |
|-------|-------------|
| `@docker-containerization-builder` | Dockerfiles, Docker Compose, multi-stage builds |
| `@devops-kubernetes-builder` | K8s manifests, deployments, services, Minikube |
| `@aiops-helm-builder` | Helm charts, values files, templates |

### Phase 4 Skills

| Skill | Purpose |
|-------|---------|
| `docker-setup` | Create Dockerfiles and Docker Compose |
| `kubernetes-deployment` | Create K8s manifests with Kustomize |
| `helm-charts-setup` | Create Helm charts for deployment |
| `minikube-setup` | Configure local Kubernetes cluster |
| `aiops-gordon` | Use Docker AI for optimization |

### Phase 4 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Minikube Cluster                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Control Plane │  │   Worker 1    │  │   Worker 2    │       │
│  │   (minikube)  │  │ (minikube-m02)│  │ (minikube-m03)│       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  Services (Deployed via Helm):                                  │
│  ┌─────────┐  ┌─────────┐  ┌────────────┐  ┌──────────┐        │
│  │Frontend │  │ Backend │  │ MCP Server │  │ AI Agent │        │
│  │ (Next.js│  │(FastAPI)│  │ (FastMCP)  │  │ (Gemini) │        │
│  │  :3000) │  │ (:8000) │  │  (:8001)   │  │          │        │
│  └─────────┘  └─────────┘  └────────────┘  └──────────┘        │
│                                                                 │
│  Infrastructure:                                                │
│  - Ingress (NGINX)                                             │
│  - ConfigMaps & Secrets                                        │
│  - HorizontalPodAutoscaler                                     │
│  - NetworkPolicies                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4 Implementation Steps

1. **Docker Setup**: Create multi-stage Dockerfiles for all services
2. **Docker Compose**: Development and production configurations
3. **Minikube Cluster**: 3-node cluster (1 control + 2 workers)
4. **K8s Manifests**: Base manifests with Kustomize overlays
5. **Helm Charts**: Package application as Helm chart
6. **Load Images**: Build and load images into Minikube
7. **Deploy**: Deploy using Helm to Minikube
8. **Validate**: Test all services are accessible

### Quick Commands

```bash
# Start Minikube cluster
minikube start --nodes=3 --cpus=2 --memory=4096

# Build and load images
eval $(minikube docker-env)
docker build -t evolution-todo/backend:latest ./backend
docker build -t evolution-todo/frontend:latest ./frontend
eval $(minikube docker-env --unset)

# Deploy with Helm
helm install evolution-todo ./helm/evolution-todo -n todo-app --create-namespace

# Access services
minikube service frontend --url -n todo-app

# Dashboard
minikube dashboard
```

---

## 🤖 Phase 3: AI-Powered Todo Chatbot (COMPLETED)

**Status**: ✅ COMPLETED
**Completed Date**: December 24, 2025
**Main Branch**: `main` | **Feature Branches**: `phase3/*`

### Phase 3 Summary

Transformed the Phase 2 web application into an AI-powered chatbot interface:
- **AI Agent**: OpenAI Agents SDK + Gemini model
- **MCP Server**: FastMCP with task operation tools
- **Chat UI**: OpenAI ChatKit React components
- **Streaming**: Server-Sent Events (SSE) for real-time responses
- **Persistence**: Conversation history in PostgreSQL

### Phase 3 Documents (Reference)

| Document | Purpose |
|----------|---------|
| `constitution-prompt-phase-3.md` | Project principles and AI standards |
| `spec-prompt-phase-3.md` | User stories and acceptance criteria |
| `plan-prompt-phase-3.md` | Implementation plan and architecture |

---

## 📦 Phase 2: Full-Stack Web Application (COMPLETED)

**Status**: ✅ COMPLETED
**Completed Date**: December 16, 2025

### Phase 2 Summary

Built a production-ready, multi-user web application with:
- **Backend**: FastAPI + SQLModel + Neon PostgreSQL
- **Frontend**: Next.js 16+ + Shadcn/ui + Framer Motion + Aceternity UI
- **Auth**: Better Auth with JWT tokens
- **Deployment**: Vercel + Neon Serverless

### Phase 2 Documents (Reference)

| Document | Purpose |
|----------|---------|
| `prompts/constitution-prompt-phase-2.md` | Project principles and standards |
| `prompts/spec-prompt-phase-2.md` | User stories and acceptance criteria |
| `prompts/plan-prompt-phase-2.md` | Implementation plan and architecture |

---

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution → `history/prompts/constitution/`
  - Feature-specific → `history/prompts/<feature-name>/`
  - General → `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "📋 Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto‑create ADRs; require user consent.

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3–7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` → `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) → `history/prompts/<feature-name>/` (requires feature context)
  - `general` → `history/prompts/general/`

3) Prefer agent‑native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution → `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature → `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General → `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY‑MM‑DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent‑native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution → `history/prompts/constitution/`
   - Feature stages → `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General → `history/prompts/general/`

7) Post‑creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front‑matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three‑part test and suggest documenting with:
  "📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto‑create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1.  **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2.  **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3.  **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4.  **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps. 

## Default policies (must follow)
- Clarify and plan first - keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non‑goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow‑ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics.

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross‑cutting and influences system design?

If ALL true, suggest:
📋 Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

### Project Monorepo Structure (Phase 3)

```
/
├── CLAUDE.md                        # This file - Claude Code instructions
├── constitution-prompt-phase-4.md   # Phase 4 constitution (CURRENT)
├── spec-prompt-phase-4.md           # Phase 4 specification (CURRENT)
├── plan-prompt-phase-4.md           # Phase 4 implementation plan (CURRENT)
├── constitution-prompt-phase-3.md   # Phase 3 constitution (reference)
├── spec-prompt-phase-3.md           # Phase 3 specification (reference)
├── plan-prompt-phase-3.md           # Phase 3 implementation plan (reference)
│
├── prompts/                         # Phase 2 documents (reference)
│   ├── constitution-prompt-phase-2.md
│   ├── spec-prompt-phase-2.md
│   └── plan-prompt-phase-2.md
│
├── backend/                         # FastAPI backend
│   ├── src/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Configuration
│   │   ├── database.py             # Database connection
│   │   ├── models/                 # SQLModel models
│   │   │   ├── task.py            # Task model (Phase 2)
│   │   │   ├── conversation.py    # Conversation model (Phase 3)
│   │   │   └── message.py         # Message model (Phase 3)
│   │   ├── routers/                # API endpoints
│   │   │   ├── tasks.py           # Task CRUD (Phase 2)
│   │   │   └── chat.py            # Chat endpoint (Phase 3)
│   │   ├── services/               # Business logic
│   │   ├── middleware/             # Auth middleware
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── agents/                 # AI Agent code (Phase 3)
│   │   │   ├── config.py          # Gemini/LiteLLM config
│   │   │   ├── tools.py           # @function_tool wrappers
│   │   │   ├── todo_agent.py      # Agent definition
│   │   │   └── runner.py          # Agent execution
│   │   ├── mcp_server/             # MCP Server (Phase 3)
│   │   │   ├── server.py          # FastMCP server
│   │   │   └── tools/             # Task tools
│   │   └── utils/                  # Utilities
│   ├── tests/                      # Backend tests
│   ├── alembic/                    # Database migrations
│   ├── pyproject.toml              # UV configuration
│   └── CLAUDE.md                   # Backend-specific rules
│
├── frontend/                        # Next.js frontend
│   ├── app/
│   │   ├── dashboard/              # Dashboard (Phase 2)
│   │   ├── tasks/                  # Task views (Phase 2)
│   │   └── chat/                   # Chat page (Phase 3)
│   ├── components/
│   │   ├── tasks/                  # Task components (Phase 2)
│   │   ├── chat/                   # Chat components (Phase 3)
│   │   └── conversation/           # Conversation sidebar (Phase 3)
│   ├── stores/
│   │   ├── auth-store.ts          # Auth state (Phase 2)
│   │   ├── task-store.ts          # Task state (Phase 2)
│   │   └── conversation-store.ts  # Conversation state (Phase 3)
│   ├── lib/
│   │   ├── api/                    # Axios API modules
│   │   └── sse/                    # SSE client (Phase 3)
│   ├── package.json                # Dependencies
│   └── CLAUDE.md                   # Frontend-specific rules
│
├── specs/                           # Specifications
│   ├── features/                   # Feature specs
│   ├── api/                        # API documentation
│   ├── database/                   # Schema documentation
│   └── ui/                         # UI specifications
│
├── history/                         # History records
│   ├── prompts/                    # Prompt History Records
│   │   ├── constitution/
│   │   ├── general/
│   │   ├── phase-2-web-app/
│   │   └── phase-3-chatbot/        # Phase 3 PHRs
│   └── adr/                        # Architecture Decision Records
│
└── .claude/                         # Claude Code configuration
    ├── agents/                     # Specialized agents
    │   ├── backend-api-builder.md  # Phase 2
    │   ├── frontend-ui-builder.md  # Phase 2
    │   ├── database-designer.md    # Phase 2
    │   ├── ai-agent-builder.md     # Phase 3
    │   ├── mcp-server-builder.md   # Phase 3
    │   ├── chatbot-ui-builder.md   # Phase 3
    │   ├── docker-containerization-builder.md  # Phase 4
    │   ├── devops-kubernetes-builder.md        # Phase 4
    │   ├── aiops-helm-builder.md               # Phase 4
    │   ├── event-driven-builder.md             # Phase 5 (Kafka, Dapr)
    │   ├── microservice-builder.md             # Phase 5 (New services)
    │   ├── cloud-deployer.md                   # Phase 5 (DOKS, CI/CD)
    │   └── aiops-operator.md                   # Phase 5 (AIOps)
    ├── skills/                     # Reusable skills
    │   ├── fastapi-setup/          # Phase 2
    │   ├── nextjs-setup/           # Phase 2
    │   ├── shadcn-ui-setup/        # Phase 2
    │   ├── neon-db-setup/          # Phase 2
    │   ├── better-auth-integration/ # Phase 2
    │   ├── openai-agents-setup/    # Phase 3
    │   ├── fastmcp-server-setup/   # Phase 3
    │   ├── chatkit-frontend/       # Phase 3 (consolidated)
    │   ├── chatkit-backend/        # Phase 3 (consolidated)
    │   ├── conversation-management/ # Phase 3
    │   ├── docker-setup/           # Phase 4
    │   ├── kubernetes-deployment/  # Phase 4
    │   ├── helm-charts-setup/      # Phase 4
    │   ├── minikube-setup/         # Phase 4
    │   ├── aiops-gordon/           # Phase 4
    │   ├── dapr-integration/       # Phase 5 (pub/sub, state)
    │   ├── kafka-setup/            # Phase 5 (Strimzi, Redpanda)
    │   ├── github-actions-cicd/    # Phase 5 (CI/CD pipelines)
    │   ├── cloud-k8s-deployment/   # Phase 5 (DOKS)
    │   ├── advanced-features/      # Phase 5 (priorities, tags)
    │   ├── websocket-realtime/     # Phase 5 (real-time sync)
    │   └── urdu-language-support/  # Phase 5 (i18n, RTL)
    └── commands/                   # Slash commands
```

### Legacy Structure (Phase 1)

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

## Code Standards
See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

See `constitution-prompt-phase-5.md` for Phase 5 specific standards (cloud-native microservices).
See `constitution-prompt-phase-4.md` for Phase 4 reference (Kubernetes deployment).
See `constitution-prompt-phase-3.md` for Phase 3 reference (AI chatbot).
See `prompts/constitution-prompt-phase-2.md` for Phase 2 reference (full-stack web app).
