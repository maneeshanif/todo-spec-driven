# Implementation Plan: AI-Powered Todo Chatbot

**Branch**: `002-ai-chatbot` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-chatbot/spec.md`
**Constitution**: [constitution.md](../../.specify/memory/constitution.md)
**Due Date**: December 21, 2025

---

## Summary

Build an AI-powered chatbot interface that allows users to manage their todos through natural language conversation. The implementation follows a staged approach: Database Models → MCP Server → AI Agent → Chat API → Frontend ChatKit UI → Integration Testing.

**Primary Requirement**: Create a conversational AI interface using OpenAI Agents SDK with Gemini model, FastMCP server for task operations, and OpenAI ChatKit for the frontend.

**Technical Approach**:
- Stateless architecture with database-persisted conversations
- FastMCP server exposing task tools (runs on port 8001)
- OpenAI Agents SDK for AI orchestration with Gemini model
- Server-Sent Events (SSE) for real-time streaming
- ChatKit React components for chat UI
- Zustand store for conversation state management

---

## Clarifications Applied (from /sp.clarify)

The following clarifications from the specification session are incorporated:

| Clarification | Decision | Impact |
|---------------|----------|--------|
| Conversation management UI | Kebab menu with Rename and Delete options | Sidebar component design |
| tool_calls storage format | Native JSONB column in PostgreSQL | Message model schema |
| Gemini API key configuration | Server-side env var (GEMINI_API_KEY), app-provided | Backend config |
| Chat page landing behavior | Load most recent conversation, else new | Frontend routing logic |
| Agent persona/tone | Professional but warm | System prompt design |

---

## Technical Context

**Language/Version**:
- Backend: Python 3.13+ with UV package manager
- Frontend: TypeScript 5.0+ with Node.js 20+

**Primary New Dependencies**:
- Backend: openai-agents, fastmcp, litellm, sse-starlette
- Frontend: @openai/chatkit-react (verify from docs), eventsource-parser

**MCP Server**:
- Runs as separate Python process on port 8001
- FastAPI main app runs on port 8000
- Agent connects via HTTP: `http://localhost:8001`
- Kubernetes-ready architecture for Phase 4

**Existing Stack (from Phase 2)**:
- Backend: FastAPI 0.115+, SQLModel 0.0.24+, Pydantic 2.0
- Frontend: Next.js 16+, React 19, Zustand 5.0+, Axios, Shadcn/ui

**Storage**:
- Neon Serverless PostgreSQL (existing)
- New tables: conversations, messages
- tool_calls stored as JSONB (clarified)

**Target Platform**:
- Same as Phase 2 (Vercel + Neon)

**Project Type**: AI Chatbot extension to existing web application

**Performance Goals**:
- First token: < 2 seconds
- Full response: < 30 seconds
- MCP tool execution: < 500ms
- Conversation load: < 1 second

**Constraints**:
- Must use spec-driven development
- Must be stateless (no in-memory state)
- Must integrate with existing Phase 2 authentication
- Must preserve existing REST API endpoints

**Scale/Scope**:
- 100 concurrent chat sessions
- 10,000 messages per user (pagination: 50 per page)
- 1,000 conversations per user (pagination: 20 per page)

**Security**:
- Rate limiting: 30 messages/minute per user
- Message length limit: 4000 characters
- Input sanitization for prompt injection prevention

---

## Constitution Check

*GATE: Must pass before implementation begins*

### ✅ Spec-Driven Development (Principle I)
- [x] Feature specification complete and approved
- [x] All user stories have acceptance criteria (7 stories with scenarios)
- [x] Technical architecture documented
- [x] API contracts defined

### ✅ Stateless Architecture (Principle X)
- [x] No in-memory conversation state
- [x] All state persisted to database
- [x] Server can restart without data loss

### ✅ MCP-First Tool Design (Principle XI)
- [x] All task operations as MCP tools (5 tools)
- [x] Clear input schemas and return types
- [x] User isolation enforced in tools

### ✅ Agent-Centric Design (Principle XII)
- [x] OpenAI Agents SDK integration planned
- [x] System prompt defined (professional but warm tone)
- [x] Tool wrappers designed

### ✅ Security & Authentication (Principle IV)
- [x] JWT validation on chat endpoints
- [x] User isolation for conversations
- [x] Rate limiting planned (30 msg/min)

**Gate Status**: ✅ PASSED - All constitution gates satisfied

---

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-chatbot/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output - API contracts
│   ├── chat-api.yaml    # Chat endpoint OpenAPI
│   └── conversation-api.yaml
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (New Phase 3 Files)

```text
backend/src/
├── agents/                         # AI Agent code
│   ├── __init__.py
│   ├── config.py                  # Gemini/LiteLLM configuration
│   ├── tools.py                   # @function_tool wrappers for MCP
│   ├── hooks.py                   # AgentHooks and RunHooks
│   ├── todo_agent.py              # Agent with system prompt
│   └── runner.py                  # Agent execution utilities
│
├── mcp_server/                    # FastMCP server
│   ├── __init__.py
│   ├── server.py                  # FastMCP server (port 8001)
│   └── tools/                     # Tool implementations
│       ├── __init__.py
│       ├── add_task.py
│       ├── list_tasks.py
│       ├── complete_task.py
│       ├── delete_task.py
│       └── update_task.py
│
├── models/
│   ├── conversation.py            # Conversation SQLModel
│   └── message.py                 # Message SQLModel (JSONB tool_calls)
│
├── routers/api/routes/
│   └── chat.py                    # Chat endpoint with SSE
│
├── services/
│   └── conversation_service.py    # Conversation CRUD + rename
│
├── schemas/
│   ├── chat.py                    # Chat request/response
│   └── conversation.py            # Conversation schemas
│
└── utils/
    └── sse.py                     # SSE utilities

frontend/
├── app/
│   └── chat/                      # Chat page
│       ├── page.tsx              # Load most recent conversation
│       └── layout.tsx
│
├── components/
│   ├── chat/                      # Chat components
│   │   ├── ChatContainer.tsx
│   │   ├── ChatInterface.tsx      # ChatKit integration
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── StreamingMessage.tsx
│   │
│   └── conversation/              # Conversation sidebar
│       ├── ConversationSidebar.tsx
│       ├── ConversationList.tsx
│       ├── ConversationItem.tsx   # Kebab menu (Rename/Delete)
│       └── NewChatButton.tsx
│
├── stores/
│   └── conversation-store.ts      # Zustand store
│
├── lib/
│   ├── api/
│   │   └── chat.ts               # Chat API module
│   └── sse/
│       └── client.ts             # SSE client utility
│
└── types/
    └── chat.ts                    # Chat type definitions
```

**Structure Decision**: Web application with backend/ and frontend/ directories, following Phase 2 monorepo architecture.

---

## Complexity Tracking

No constitution violations requiring justification. All implementations follow prescribed patterns.

---

## Implementation Phases

### Phase 0: Research & Setup (Day 1)

**Goal**: Understand technologies and set up development environment.

**Research Tasks**:
1. OpenAI Agents SDK - Agent, Runner, function_tool patterns
2. FastMCP - @mcp.tool decorator, server setup
3. OpenAI ChatKit - Package name, components, domain allowlist
4. Gemini API - Authentication, model configuration

**Setup Tasks**:
```bash
# Backend dependencies
cd backend && uv add openai-agents fastmcp litellm sse-starlette

# Frontend dependencies
cd frontend && npm install eventsource-parser
# ChatKit: npm install @openai/chatkit-react (verify name)
```

**Deliverables**: research.md with all findings

---

### Phase 1: Database Models & Migrations (Day 1-2)

**Goal**: Create conversation and message tables.

**Models**:

**Conversation**:
- id (int, PK)
- user_id (str, FK -> users.id, indexed)
- title (str, nullable - auto-generated)
- created_at (timestamp)
- updated_at (timestamp)

**Message**:
- id (int, PK)
- conversation_id (int, FK -> conversations.id, indexed)
- role (enum: user | assistant | system)
- content (text)
- tool_calls (JSONB, nullable) ← Clarified
- created_at (timestamp)

**Deliverables**: data-model.md, migration applied

---

### Phase 2: MCP Server Implementation (Day 2-3)

**Goal**: Create FastMCP server with 5 task tools.

**Tools**:
| Tool | Parameters | Returns |
|------|------------|---------|
| add_task | user_id, title, description? | {task_id, status, title} |
| list_tasks | user_id, status? | [{id, title, completed}] |
| complete_task | user_id, task_id | {task_id, status} |
| delete_task | user_id, task_id | {task_id, status} |
| update_task | user_id, task_id, title?, description? | {task_id, status} |

**Deliverables**: MCP server on port 8001, all tools tested

---

### Phase 3: AI Agent Implementation (Day 3-4)

**Goal**: Create OpenAI Agents SDK agent with Gemini model.

**System Prompt** (incorporating clarified tone):
```
You are a helpful todo assistant with a professional but warm personality.
You help users manage their tasks through natural language conversation.

Be clear and helpful, occasionally friendly but never overly casual.
Always confirm actions with the user.
If unsure which task the user means, ask for clarification.
```

**Deliverables**: Agent with Gemini model, all function tools wrapped

---

### Phase 4: Chat API Endpoint (Day 4-5)

**Goal**: Create chat endpoint with SSE streaming.

**Endpoints**:
- POST /api/{user_id}/chat - Non-streaming chat
- POST /api/{user_id}/chat/stream - SSE streaming
- GET /api/{user_id}/conversations - List conversations
- GET /api/{user_id}/conversations/{id} - Get with messages
- PUT /api/{user_id}/conversations/{id} - Rename conversation ← Clarified
- DELETE /api/{user_id}/conversations/{id} - Delete conversation

**Deliverables**: contracts/ with OpenAPI specs, endpoints implemented

---

### Phase 5: Frontend Chat UI (Day 5-6)

**Goal**: Build ChatKit-based chat interface.

**Key Behaviors** (from clarifications):
- Chat page loads most recent conversation (if exists)
- Conversation sidebar with kebab menu (Rename/Delete)
- Inline rename editing
- Confirmation dialog for delete

**Deliverables**: Chat page, conversation sidebar, SSE streaming

---

### Phase 6: Integration & Testing (Day 6-7)

**Goal**: Test full flow and fix issues.

**Test Coverage**:
- Backend: 80%
- Frontend: 70%
- Critical paths: 100%

---

### Phase 7: Documentation & Deployment (Day 7)

**Goal**: Deploy and document.

**Environment Variables**:
```env
GEMINI_API_KEY=your_gemini_api_key  # Application-provided (clarified)
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001/mcp
```

---

## Success Criteria

1. ✅ Users can create tasks via natural language
2. ✅ All 5 MCP tools working
3. ✅ SSE streaming responses working
4. ✅ Conversation history persists
5. ✅ Conversation rename/delete via kebab menu
6. ✅ Chat page loads most recent conversation
7. ✅ Agent uses professional but warm tone
8. ✅ tool_calls stored as JSONB
9. ✅ User isolation enforced
10. ✅ Deployed and accessible

---

## Specialized Resources

### Agents to Use
- `@ai-agent-builder` - OpenAI Agents SDK, MCP integration
- `@mcp-server-builder` - FastMCP server development
- `@chatbot-ui-builder` - ChatKit UI implementation
- `@backend-api-builder` - Chat API endpoints
- `@frontend-ui-builder` - Chat components
- `@database-designer` - Conversation schema

### Skills to Reference
- `openai-agents-setup` - Agent configuration
- `fastmcp-server-setup` - MCP server patterns
- `chat-api-integration` - Chat endpoint patterns
- `openai-chatkit-setup` - ChatKit integration
- `streaming-sse-setup` - SSE implementation
- `conversation-management` - History UI

---

## Next Steps

1. Run `/sp.tasks` to generate detailed task breakdown
2. Run `/sp.implement` to begin execution
3. Create PHR after each major milestone

---

**Status**: Ready for task breakdown
**Next Command**: `/sp.tasks`
