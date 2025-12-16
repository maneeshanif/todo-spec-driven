# Tasks: AI-Powered Todo Chatbot

**Feature**: 002-ai-chatbot
**Branch**: `002-ai-chatbot`
**Generated**: 2025-12-17
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## User Story Summary

| Story | Description | Priority | Dependencies |
|-------|-------------|----------|--------------|
| US1 | Natural Language Task Creation | P1 | Setup, Foundational |
| US2 | Natural Language Task Listing | P1 | Setup, Foundational |
| US3 | Natural Language Task Completion | P1 | Setup, Foundational |
| US4 | Natural Language Task Deletion | P2 | Setup, Foundational |
| US5 | Natural Language Task Update | P2 | Setup, Foundational |
| US6 | Conversation History | P2 | Setup, Foundational |
| US7 | Real-Time Streaming Responses | P2 | Setup, Foundational |

---

## Phase 1: Setup

**Goal**: Install dependencies and configure environment for Phase 3.

### Tasks

- [ ] T001 Install backend dependencies in backend/pyproject.toml (openai-agents, fastmcp, litellm, sse-starlette)
- [ ] T002 [P] Install frontend dependencies in frontend/package.json (eventsource-parser)
- [ ] T003 [P] Add GEMINI_API_KEY and MCP_SERVER_URL to backend/.env.example
- [ ] T004 [P] Update backend/src/config.py with Phase 3 settings (gemini_api_key, mcp_server_url)
- [ ] T005 Create backend/src/agents/__init__.py module structure
- [ ] T006 [P] Create backend/src/mcp_server/__init__.py module structure
- [ ] T007 [P] Create frontend/types/chat.ts with Conversation, Message, ToolCall types
- [ ] T008 [P] Create frontend/lib/api/chat.ts API module skeleton

---

## Phase 2: Foundational (Database & Models)

**Goal**: Create database models, migrations, schemas, and services needed by all user stories.

**Blocking**: Must complete before any user story phase.

### Tasks

- [ ] T009 Create Conversation SQLModel in backend/src/models/conversation.py
- [ ] T010 Create Message SQLModel with JSONB tool_calls in backend/src/models/message.py
- [ ] T011 Export models in backend/src/models/__init__.py
- [ ] T012 Create Alembic migration for conversations and messages tables
- [ ] T013 Run migration: uv run alembic upgrade head
- [ ] T014 [P] Create ConversationCreate, ConversationUpdate, ConversationResponse schemas in backend/src/schemas/conversation.py
- [ ] T015 [P] Create MessageCreate, MessageResponse schemas in backend/src/schemas/message.py
- [ ] T016 [P] Create ChatRequest, ChatResponse schemas in backend/src/schemas/chat.py
- [ ] T017 Create ConversationService with CRUD methods in backend/src/services/conversation_service.py
- [ ] T018 Add get_most_recent and auto_generate_title methods to ConversationService

---

## Phase 3: MCP Server (Core Infrastructure)

**Goal**: Create FastMCP server with 5 task tools - foundation for AI agent.

**Blocking**: Must complete before AI Agent phase.

### Tasks

- [ ] T019 Create FastMCP server instance in backend/src/mcp_server/server.py
- [ ] T020 Implement add_task MCP tool in backend/src/mcp_server/tools/add_task.py
- [ ] T021 [P] Implement list_tasks MCP tool in backend/src/mcp_server/tools/list_tasks.py
- [ ] T022 [P] Implement complete_task MCP tool in backend/src/mcp_server/tools/complete_task.py
- [ ] T023 [P] Implement delete_task MCP tool in backend/src/mcp_server/tools/delete_task.py
- [ ] T024 [P] Implement update_task MCP tool in backend/src/mcp_server/tools/update_task.py
- [ ] T025 Export all tools in backend/src/mcp_server/tools/__init__.py
- [ ] T026 Register all 5 tools in MCP server in backend/src/mcp_server/server.py
- [ ] T027 Add MCP server run script in backend/src/mcp_server/__main__.py

---

## Phase 4: AI Agent (Core Infrastructure)

**Goal**: Create OpenAI Agents SDK agent with Gemini model and function tools.

**Blocking**: Must complete before Chat API phase.

### Tasks

- [ ] T028 Configure LiteLLM model for Gemini in backend/src/agents/config.py
- [ ] T029 Create @function_tool wrapper for add_task in backend/src/agents/tools.py
- [ ] T030 [P] Create @function_tool wrapper for list_tasks in backend/src/agents/tools.py
- [ ] T031 [P] Create @function_tool wrapper for complete_task in backend/src/agents/tools.py
- [ ] T032 [P] Create @function_tool wrapper for delete_task in backend/src/agents/tools.py
- [ ] T033 [P] Create @function_tool wrapper for update_task in backend/src/agents/tools.py
- [ ] T034 Define TodoBot Agent with system prompt in backend/src/agents/todo_agent.py
- [ ] T035 Create AgentHooks for logging in backend/src/agents/hooks.py
- [ ] T036 Create run_agent and run_agent_streamed utilities in backend/src/agents/runner.py

---

## Phase 5: User Story 1 - Natural Language Task Creation [P1]

**Goal**: Users can create tasks by typing natural language messages.

**Independent Test**: Send "Add a task to buy groceries" and verify task appears in task list.

### Tasks

- [ ] T037 [US1] Create SSE utilities in backend/src/utils/sse.py
- [ ] T038 [US1] Create chat router in backend/src/routers/api/routes/chat.py
- [ ] T039 [US1] Implement POST /api/{user_id}/chat endpoint (non-streaming)
- [ ] T040 [US1] Add JWT authentication to chat endpoints
- [ ] T041 [US1] Register chat router in backend/src/routers/api/__init__.py
- [ ] T042 [US1] Create conversation-store.ts with Zustand in frontend/stores/conversation-store.ts
- [ ] T043 [US1] Implement sendMessage action in conversation store
- [ ] T044 [US1] Create ChatContainer component in frontend/components/chat/ChatContainer.tsx
- [ ] T045 [US1] Create MessageInput component in frontend/components/chat/MessageInput.tsx
- [ ] T046 [US1] Create MessageList component in frontend/components/chat/MessageList.tsx
- [ ] T047 [US1] Create chat page in frontend/app/chat/page.tsx
- [ ] T048 [US1] Create chat layout in frontend/app/chat/layout.tsx
- [ ] T049 [US1] Implement chat API module sendMessage in frontend/lib/api/chat.ts

---

## Phase 6: User Story 2 - Natural Language Task Listing [P1]

**Goal**: Users can ask the bot to show their tasks.

**Independent Test**: Ask "Show me my tasks" and verify bot responds with task list.

### Tasks

- [ ] T050 [US2] Verify list_tasks MCP tool returns formatted task list
- [ ] T051 [US2] Update system prompt to handle listing variations in backend/src/agents/todo_agent.py
- [ ] T052 [US2] Add task status indicators (pending/completed) to list_tasks output

---

## Phase 7: User Story 3 - Natural Language Task Completion [P1]

**Goal**: Users can mark tasks complete by telling the bot.

**Independent Test**: Say "Mark task 3 as complete" and verify task status changes.

### Tasks

- [ ] T053 [US3] Verify complete_task MCP tool works with task ID
- [ ] T054 [US3] Update system prompt to handle completion variations in backend/src/agents/todo_agent.py
- [ ] T055 [US3] Add task disambiguation logic when multiple matches found

---

## Phase 8: User Story 4 - Natural Language Task Deletion [P2]

**Goal**: Users can delete tasks by telling the bot.

**Independent Test**: Say "Delete task 2" and verify task is removed.

### Tasks

- [ ] T056 [US4] Verify delete_task MCP tool works with task ID
- [ ] T057 [US4] Update system prompt to handle deletion variations in backend/src/agents/todo_agent.py
- [ ] T058 [US4] Add confirmation prompt for bulk deletions in agent logic

---

## Phase 9: User Story 5 - Natural Language Task Update [P2]

**Goal**: Users can update tasks by describing changes.

**Independent Test**: Say "Change task 1 to 'Call mom tonight'" and verify update.

### Tasks

- [ ] T059 [US5] Verify update_task MCP tool works with title and description
- [ ] T060 [US5] Update system prompt to handle update variations in backend/src/agents/todo_agent.py
- [ ] T061 [US5] Validate non-empty title in update logic

---

## Phase 10: User Story 6 - Conversation History [P2]

**Goal**: Chat history is saved and users can continue conversations.

**Independent Test**: Have conversation, refresh page, verify history intact.

### Tasks

- [ ] T062 [US6] Implement GET /api/{user_id}/conversations endpoint in backend/src/routers/api/routes/chat.py
- [ ] T063 [US6] Implement GET /api/{user_id}/conversations/{id} endpoint
- [ ] T064 [US6] Implement PUT /api/{user_id}/conversations/{id} (rename) endpoint
- [ ] T065 [US6] Implement DELETE /api/{user_id}/conversations/{id} endpoint
- [ ] T066 [US6] Add fetchConversations action to conversation store
- [ ] T067 [US6] Add selectConversation action to load conversation with messages
- [ ] T068 [US6] Add createConversation action for new chat
- [ ] T069 [US6] Add renameConversation action to conversation store
- [ ] T070 [US6] Add deleteConversation action to conversation store
- [ ] T071 [US6] Create ConversationSidebar component in frontend/components/conversation/ConversationSidebar.tsx
- [ ] T072 [US6] Create ConversationList component in frontend/components/conversation/ConversationList.tsx
- [ ] T073 [US6] Create ConversationItem with kebab menu in frontend/components/conversation/ConversationItem.tsx
- [ ] T074 [US6] Create NewChatButton component in frontend/components/conversation/NewChatButton.tsx
- [ ] T075 [US6] Implement inline rename editing in ConversationItem
- [ ] T076 [US6] Implement delete confirmation dialog
- [ ] T077 [US6] Update chat page to load most recent conversation on entry
- [ ] T078 [US6] Implement conversation API module in frontend/lib/api/chat.ts

---

## Phase 11: User Story 7 - Real-Time Streaming [P2]

**Goal**: Bot responses appear word by word via SSE streaming.

**Independent Test**: Send message, see tokens appear incrementally.

### Tasks

- [ ] T079 [US7] Implement POST /api/{user_id}/chat/stream SSE endpoint in backend/src/routers/api/routes/chat.py
- [ ] T080 [US7] Stream tokens with event: token format
- [ ] T081 [US7] Stream tool calls with event: tool_call format
- [ ] T082 [US7] Send event: done with conversation_id at completion
- [ ] T083 [US7] Create SSE client utility in frontend/lib/sse/client.ts
- [ ] T084 [US7] Create StreamingMessage component in frontend/components/chat/StreamingMessage.tsx
- [ ] T085 [US7] Add appendStreamToken action to conversation store
- [ ] T086 [US7] Update MessageInput to use streaming endpoint
- [ ] T087 [US7] Handle SSE connection drops with error message
- [ ] T088 [US7] Add tool call indicator during streaming

---

## Phase 12: Polish & Cross-Cutting Concerns

**Goal**: Finalize error handling, security, performance, and UI polish.

### Tasks

- [ ] T089 Add rate limiting middleware (30 msg/min) in backend/src/middleware/rate_limit.py
- [ ] T090 [P] Add message length validation (max 4000 chars) in ChatRequest schema
- [ ] T091 [P] Add input sanitization for prompt injection in backend/src/utils/sanitize.py
- [ ] T092 Add graceful error messages for AI model failures
- [ ] T093 [P] Add loading indicator while waiting for response in frontend
- [ ] T094 [P] Add auto-scroll to new messages in MessageList
- [ ] T095 [P] Implement keyboard shortcut (Enter to send) in MessageInput
- [ ] T096 Make chat UI responsive for mobile devices
- [ ] T097 [P] Add markdown rendering for bot responses
- [ ] T098 [P] Add dark mode support for chat components
- [ ] T099 Update API documentation with chat endpoints
- [ ] T100 Update README with Phase 3 features and env variables

---

## Dependencies

```
Phase 1 (Setup)
    │
    v
Phase 2 (Foundational)
    │
    v
Phase 3 (MCP Server)
    │
    v
Phase 4 (AI Agent)
    │
    ├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
    v         v         v         v         v         v         v
 Phase 5   Phase 6   Phase 7   Phase 8   Phase 9   Phase 10  Phase 11
  (US1)     (US2)     (US3)     (US4)     (US5)     (US6)     (US7)
    │         │         │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
                                  │
                                  v
                            Phase 12 (Polish)
```

### Story Independence

- **US1 (Task Creation)**: Independent after Phase 4
- **US2 (Task Listing)**: Independent after Phase 4
- **US3 (Task Completion)**: Independent after Phase 4
- **US4 (Task Deletion)**: Independent after Phase 4
- **US5 (Task Update)**: Independent after Phase 4
- **US6 (Conversation History)**: Independent after Phase 4, can run in parallel with US1-5
- **US7 (Streaming)**: Independent after Phase 4, can run in parallel with US1-6

---

## Parallel Execution Opportunities

### Phase 1 (Setup)
```
T001 (backend deps) → T002 (frontend deps) [P]
                   → T003 (env vars) [P]
                   → T004 (config) [P]
T005 (agents init) | T006 (mcp init) [P]
                   | T007 (types) [P]
                   | T008 (api skeleton) [P]
```

### Phase 2 (Foundational)
```
T009 (Conversation) → T010 (Message) → T011 (exports) → T012 (migration) → T013 (run migration)
                                                      → T014 (conv schemas) [P]
                                                      → T015 (msg schemas) [P]
                                                      → T016 (chat schemas) [P]
T017 (ConversationService) → T018 (additional methods)
```

### Phase 3 (MCP Server)
```
T019 (server) → T020 (add_task) → T021 (list_tasks) [P]
                               → T022 (complete_task) [P]
                               → T023 (delete_task) [P]
                               → T024 (update_task) [P]
                               → T025 (exports) → T026 (register) → T027 (run script)
```

### Phase 4 (AI Agent)
```
T028 (config) → T029 (add_task tool) → T030 (list tool) [P]
                                    → T031 (complete tool) [P]
                                    → T032 (delete tool) [P]
                                    → T033 (update tool) [P]
T034 (agent) → T035 (hooks) [P] → T036 (runner)
```

### User Stories (Phases 5-11) - Can run in parallel after Phase 4
```
Phase 5 (US1) ──┐
Phase 6 (US2) ──┼── All can run in parallel
Phase 7 (US3) ──┤
Phase 8 (US4) ──┤
Phase 9 (US5) ──┤
Phase 10 (US6) ─┤
Phase 11 (US7) ─┘
```

---

## Implementation Strategy

### MVP Scope (Recommended First)
1. **Phase 1**: Setup
2. **Phase 2**: Foundational
3. **Phase 3**: MCP Server
4. **Phase 4**: AI Agent
5. **Phase 5 (US1)**: Task Creation - Core value proposition

After MVP validation, continue with remaining user stories.

### Incremental Delivery
Each user story phase produces a working increment:
- US1: Create tasks via chat
- US2: Add list functionality
- US3: Add completion functionality
- US4: Add deletion functionality
- US5: Add update functionality
- US6: Add conversation persistence
- US7: Add streaming for better UX

---

## Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Setup | 8 | 6 |
| Foundational | 10 | 3 |
| MCP Server | 9 | 4 |
| AI Agent | 9 | 5 |
| US1 (Create) | 13 | 0 |
| US2 (List) | 3 | 0 |
| US3 (Complete) | 3 | 0 |
| US4 (Delete) | 3 | 0 |
| US5 (Update) | 3 | 0 |
| US6 (History) | 17 | 0 |
| US7 (Streaming) | 10 | 0 |
| Polish | 12 | 7 |
| **Total** | **100** | **25** |

---

**Status**: Ready for implementation
**Next Command**: `/sp.implement`
**MVP Tasks**: T001-T049 (Phase 1-5)
