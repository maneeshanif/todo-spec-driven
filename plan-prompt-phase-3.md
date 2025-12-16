# Implementation Plan: Todo AI Chatbot - Phase 3

**Project**: Todo AI Chatbot Application
**Phase**: Phase 3 - AI-Powered Todo Chatbot
**Branch**: `phase3/setup-ai-chatbot`
**Date**: 2025-12-16
**Spec**: [spec-prompt-phase-3.md](./spec-prompt-phase-3.md)
**Constitution**: [constitution-prompt-phase-3.md](./constitution-prompt-phase-3.md)
**Due Date**: December 21, 2025

---

## Summary

Build an AI-powered chatbot interface that allows users to manage their todos through natural language conversation. The implementation follows a staged approach: Database Models → MCP Server → AI Agent → Chat API → Frontend ChatKit UI → Integration Testing.

**Primary Requirement**: Create a conversational AI interface using OpenAI Agents SDK with Gemini model, FastMCP server for task operations, and OpenAI ChatKit for the frontend.

**Technical Approach**:
- Stateless architecture with database-persisted conversations
- FastMCP server exposing task tools
- OpenAI Agents SDK for AI orchestration with Gemini model
- Server-Sent Events (SSE) for real-time streaming
- ChatKit React components for chat UI
- Zustand store for conversation state management

---

## Technical Context

**Language/Version**:
- Backend: Python 3.13+ with UV package manager
- Frontend: TypeScript 5.0+ with Node.js 20+

**Primary New Dependencies**:
- Backend: openai-agents, fastmcp, litellm, sse-starlette
- Frontend: OpenAI ChatKit (verify package name from docs), eventsource-parser

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
- 10,000 messages per user (with pagination: 50 per page)
- 1,000 conversations per user (with pagination: 20 per page)

**Security**:
- Rate limiting: 30 messages/minute per user
- Message length limit: 4000 characters
- Input sanitization for prompt injection prevention

---

## Constitution Check

*GATE: Must pass before implementation begins*

### ✅ Spec-Driven Development
- [ ] Feature specification complete and approved
- [ ] All user stories have acceptance criteria
- [ ] Technical architecture documented
- [ ] API contracts defined

### ✅ Stateless Architecture
- [ ] No in-memory conversation state
- [ ] All state persisted to database
- [ ] Server can restart without data loss

### ✅ MCP-First Tool Design
- [ ] All task operations as MCP tools
- [ ] Clear input schemas and return types
- [ ] User isolation enforced in tools

### ✅ Agent-Centric Design
- [ ] OpenAI Agents SDK integration planned
- [ ] System prompt defined
- [ ] Tool wrappers designed

### ✅ Security & Authentication
- [ ] JWT validation on chat endpoints
- [ ] User isolation for conversations
- [ ] Rate limiting planned

---

## Project Structure

### New Files (Phase 3 Additions)

```text
backend/src/
├── agents/                         # NEW - AI Agent code
│   ├── __init__.py
│   ├── config.py                  # Gemini/LiteLLM configuration
│   ├── tools.py                   # @function_tool wrappers for MCP
│   ├── hooks.py                   # AgentHooks and RunHooks
│   ├── todo_agent.py              # Agent definition with system prompt
│   └── runner.py                  # Agent execution utilities
│
├── mcp_server/                    # NEW - FastMCP server
│   ├── __init__.py
│   ├── server.py                  # FastMCP server with task tools
│   └── tools/                     # Tool implementations
│       ├── __init__.py
│       ├── add_task.py
│       ├── list_tasks.py
│       ├── complete_task.py
│       ├── delete_task.py
│       └── update_task.py
│
├── models/
│   ├── conversation.py            # NEW - Conversation SQLModel
│   └── message.py                 # NEW - Message SQLModel
│
├── routers/api/routes/
│   └── chat.py                    # NEW - Chat endpoint with SSE
│
├── services/
│   └── conversation_service.py    # NEW - Conversation business logic
│
├── schemas/
│   ├── chat.py                    # NEW - Chat request/response schemas
│   └── conversation.py            # NEW - Conversation schemas
│
└── utils/
    └── sse.py                     # NEW - SSE utilities

frontend/
├── app/
│   └── chat/                      # NEW - Chat page
│       ├── page.tsx
│       └── layout.tsx
│
├── components/
│   ├── chat/                      # NEW - Chat components
│   │   ├── ChatContainer.tsx      # Main chat wrapper
│   │   ├── ChatInterface.tsx      # ChatKit integration
│   │   ├── MessageList.tsx        # Message display
│   │   ├── MessageInput.tsx       # Input component
│   │   └── StreamingMessage.tsx   # SSE message handler
│   │
│   └── conversation/              # NEW - Conversation sidebar
│       ├── ConversationSidebar.tsx
│       ├── ConversationList.tsx
│       ├── ConversationItem.tsx
│       └── NewChatButton.tsx
│
├── stores/
│   └── conversation-store.ts      # NEW - Conversation Zustand store
│
├── lib/
│   ├── api/
│   │   └── chat.ts               # NEW - Chat API module
│   └── sse/
│       └── client.ts             # NEW - SSE client utility
│
└── types/
    └── chat.ts                    # NEW - Chat type definitions
```

### Documentation Updates

```text
/
├── constitution-prompt-phase-3.md  # Phase 3 constitution
├── spec-prompt-phase-3.md          # Phase 3 specification
├── plan-prompt-phase-3.md          # This implementation plan
│
├── specs/
│   ├── features/
│   │   └── chatbot.md             # Chatbot feature spec
│   ├── api/
│   │   └── chat-endpoints.md      # Chat API documentation
│   └── database/
│       └── chat-schema.md         # Conversation/Message schema
│
└── history/
    └── prompts/
        └── phase-3-chatbot/       # Phase 3 PHRs
```

---

## Implementation Phases

### Phase 0: Research & Setup (Day 1)

**Goal**: Understand technologies and set up development environment.

**Tasks**:

1. **Research OpenAI Agents SDK**
   - Study documentation at openai.github.io/openai-agents-python
   - Understand Agent, Runner, function_tool patterns
   - Test basic agent with Gemini model

2. **Research FastMCP**
   - Study FastMCP documentation and examples
   - Understand @mcp.tool decorator pattern
   - Test basic MCP server

3. **Research ChatKit**
   - Study OpenAI ChatKit documentation at https://platform.openai.com/docs/guides/chatkit
   - Verify exact package name and import patterns
   - Understand domain allowlist configuration for production
   - Review integration patterns and components

4. **Set up Gemini API**
   - Create Google AI account
   - Generate API key
   - Test API connectivity
   - Add to environment variables

5. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   uv add openai-agents fastmcp litellm sse-starlette

   # Frontend
   cd frontend
   # Note: Verify ChatKit package name from https://platform.openai.com/docs/guides/chatkit
   npm install eventsource-parser
   # Install ChatKit package after verifying exact name
   ```

6. **Configure ChatKit Domain Allowlist**
   - **Local Development**: `localhost` works without domain allowlist configuration
   - **Production Deployment**:
     1. Deploy frontend first to get production URL
     2. Add domain to: https://platform.openai.com/settings/organization/security/domain-allowlist
     3. Get domain key and add to environment variables: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`

   **UI Strategy**: 90% ChatKit, 10% Custom Fallback
   - Primary: Use OpenAI ChatKit components
   - Fallback: If ChatKit doesn't work, implement custom chat UI with Shadcn/ui

**Deliverables**:
- [ ] OpenAI Agents SDK basic test working
- [ ] FastMCP basic server working
- [ ] Gemini API key configured
- [ ] Dependencies installed
- [ ] ChatKit domain allowlist configured (for production)

**Use Skills**:
- `openai-agents-setup` - Agent configuration
- `fastmcp-server-setup` - MCP server setup

**Use Agents**:
- `@ai-agent-builder` - For agent research
- `@mcp-server-builder` - For MCP research

---

### Phase 1: Database Models & Migrations (Day 1-2)

**Goal**: Create conversation and message tables.

**Tasks**:

1. **Design Conversation Schema**
   - Create `backend/src/models/conversation.py`
   - Fields: id, user_id, title, created_at, updated_at
   - Add relationship to messages
   - Add indexes on user_id, created_at

2. **Design Message Schema**
   - Create `backend/src/models/message.py`
   - Fields: id, conversation_id, role, content, tool_calls, created_at
   - Add relationship to conversation
   - Add indexes on conversation_id, created_at

3. **Create Migration**
   ```bash
   cd backend
   uv run alembic revision --autogenerate -m "Add conversations and messages tables"
   uv run alembic upgrade head
   ```

4. **Create Conversation Service**
   - Create `backend/src/services/conversation_service.py`
   - Methods: create_conversation, get_conversation, list_conversations
   - Methods: add_message, get_messages, delete_conversation

5. **Create Pydantic Schemas**
   - Create `backend/src/schemas/conversation.py`
   - Create `backend/src/schemas/chat.py`

**Deliverables**:
- [ ] Conversation model created
- [ ] Message model created
- [ ] Migration applied successfully
- [ ] ConversationService with CRUD operations
- [ ] Schema documentation in `specs/database/chat-schema.md`

**Use Agents**:
- `@database-designer` - For schema design

---

### Phase 2: MCP Server Implementation (Day 2-3)

**Goal**: Create FastMCP server with task tools.

**Tasks**:

1. **Create MCP Server Structure**
   - Create `backend/src/mcp_server/` directory
   - Create `server.py` with FastMCP instance
   - Configure server on port 8001

2. **Implement Task Tools**
   ```python
   # server.py
   from fastmcp import FastMCP

   mcp = FastMCP("Todo MCP Server")

   @mcp.tool()
   async def add_task(user_id: str, title: str, description: str = "") -> dict:
       """Add a new task for the user."""
       # Implementation using existing task_service
       pass

   @mcp.tool()
   async def list_tasks(user_id: str, status: str = "all") -> list:
       """List user's tasks, optionally filtered by status."""
       pass

   @mcp.tool()
   async def complete_task(user_id: str, task_id: int) -> dict:
       """Mark a task as complete."""
       pass

   @mcp.tool()
   async def delete_task(user_id: str, task_id: int) -> dict:
       """Delete a task."""
       pass

   @mcp.tool()
   async def update_task(user_id: str, task_id: int, title: str = None, description: str = None) -> dict:
       """Update a task's title or description."""
       pass
   ```

3. **Integrate with Existing Services**
   - Reuse `task_service.py` for database operations
   - Add user_id validation in each tool
   - Return structured responses

4. **Add MCP Server Startup Script**
   - Create startup script for MCP server on port 8001
   - Document how to run alongside main API (port 8000)
   - Architecture is Kubernetes-ready for Phase 4 containerization

5. **Test MCP Server**
   - Test each tool manually
   - Verify database operations
   - Check error handling

**Deliverables**:
- [ ] FastMCP server running on port 8001
- [ ] All 5 task tools implemented
- [ ] User isolation enforced
- [ ] Error handling implemented
- [ ] MCP server documented

**Use Skills**:
- `fastmcp-server-setup` - MCP patterns

**Use Agents**:
- `@mcp-server-builder` - For tool implementation

---

### Phase 3: AI Agent Implementation (Day 3-4)

**Goal**: Create OpenAI Agents SDK agent with Gemini model.

**Tasks**:

1. **Configure Gemini Model**
   - Create `backend/src/agents/config.py`
   - Set up AsyncOpenAI with Gemini endpoint
   - Configure LiteLLM for Gemini support

   ```python
   # config.py
   from agents.extensions.models.litellm import LitellmModel

   def get_model():
       return LitellmModel(
           model="gemini/gemini-2.5-flash",
           api_key=settings.gemini_api_key
       )
   ```

2. **Create Function Tool Wrappers**
   - Create `backend/src/agents/tools.py`
   - Wrap each MCP tool with @function_tool decorator
   - Connect to MCP server via HTTP client

   ```python
   # tools.py
   from agents import function_tool

   @function_tool
   async def add_task(ctx: RunContextWrapper, user_id: str, title: str, description: str = "") -> str:
       """Add a new task for the user."""
       result = await mcp_client.call_tool("add_task", {
           "user_id": user_id,
           "title": title,
           "description": description
       })
       return json.dumps(result)
   ```

3. **Define Agent with System Prompt**
   - Create `backend/src/agents/todo_agent.py`
   - Define clear system prompt for todo assistant
   - Add all task tools to agent

   ```python
   # todo_agent.py
   from agents import Agent

   SYSTEM_PROMPT = """
   You are a helpful todo assistant. You help users manage their tasks through natural language.

   Available actions:
   - Add new tasks
   - List tasks (all, pending, or completed)
   - Mark tasks as complete
   - Delete tasks
   - Update task details

   Always confirm actions with the user and provide helpful responses.
   If you're unsure which task the user means, ask for clarification.
   """

   def create_agent(user_id: str):
       return Agent(
           name="TodoBot",
           instructions=SYSTEM_PROMPT,
           model=get_model(),
           tools=[add_task, list_tasks, complete_task, delete_task, update_task]
       )
   ```

4. **Implement Agent Hooks**
   - Create `backend/src/agents/hooks.py`
   - Add logging for tool calls
   - Add error handling hooks

5. **Create Runner Utilities**
   - Create `backend/src/agents/runner.py`
   - Implement run_agent() for non-streaming
   - Implement run_agent_streamed() for SSE

**Deliverables**:
- [ ] Gemini model configured and working
- [ ] All function tools wrapped
- [ ] Agent with system prompt created
- [ ] Hooks for observability
- [ ] Runner utilities for execution

**Use Skills**:
- `openai-agents-setup` - Agent patterns
- `chat-api-integration` - Integration patterns

**Use Agents**:
- `@ai-agent-builder` - For agent implementation

---

### Phase 4: Chat API Endpoint (Day 4-5)

**Goal**: Create chat endpoint with SSE streaming.

**Tasks**:

1. **Create Chat Router**
   - Create `backend/src/routers/api/routes/chat.py`
   - Implement POST /api/{user_id}/chat endpoint
   - Add JWT authentication

2. **Implement Stateless Flow**
   ```python
   @router.post("/{user_id}/chat")
   async def chat(
       user_id: str,
       request: ChatRequest,
       current_user: CurrentUser = Depends(get_current_user)
   ):
       # 1. Verify user access
       verify_user_access(current_user, user_id)

       # 2. Get or create conversation
       conversation = await conversation_service.get_or_create(
           user_id, request.conversation_id
       )

       # 3. Fetch message history
       history = await conversation_service.get_messages(conversation.id)

       # 4. Store user message
       await conversation_service.add_message(
           conversation.id, "user", request.message
       )

       # 5. Run agent
       response = await run_agent(user_id, history, request.message)

       # 6. Store assistant response
       await conversation_service.add_message(
           conversation.id, "assistant", response.content
       )

       # 7. Return response
       return ChatResponse(
           conversation_id=conversation.id,
           response=response.content,
           tool_calls=response.tool_calls
       )
   ```

3. **Implement SSE Streaming**
   - Create streaming version of endpoint
   - Use sse-starlette for SSE support
   - Stream tokens and tool calls

   ```python
   @router.post("/{user_id}/chat/stream")
   async def chat_stream(
       user_id: str,
       request: ChatRequest,
       current_user: CurrentUser = Depends(get_current_user)
   ):
       # ... setup same as non-streaming ...

       async def generate():
           async for event in run_agent_streamed(user_id, history, request.message):
               if event.type == "token":
                   yield f"event: token\ndata: {json.dumps({'content': event.content})}\n\n"
               elif event.type == "tool_call":
                   yield f"event: tool_call\ndata: {json.dumps(event.data)}\n\n"

           # Store final response
           await conversation_service.add_message(...)
           yield f"event: done\ndata: {json.dumps({'conversation_id': conversation.id})}\n\n"

       return StreamingResponse(generate(), media_type="text/event-stream")
   ```

4. **Add Conversation Endpoints**
   - GET /api/{user_id}/conversations - List conversations
   - GET /api/{user_id}/conversations/{id} - Get conversation with messages
   - DELETE /api/{user_id}/conversations/{id} - Delete conversation

5. **Update API Documentation**
   - Update OpenAPI specs
   - Document SSE event format
   - Add examples

**Deliverables**:
- [ ] Chat endpoint working (non-streaming)
- [ ] Chat endpoint working (SSE streaming)
- [ ] Conversation CRUD endpoints
- [ ] JWT authentication enforced
- [ ] API documentation updated

**Use Skills**:
- `chat-api-integration` - Chat patterns
- `streaming-sse-setup` - SSE patterns

**Use Agents**:
- `@backend-api-builder` - For endpoint implementation

---

### Phase 5: Frontend Chat UI (Day 5-6)

**Goal**: Build ChatKit-based chat interface.

**Tasks**:

1. **Set Up ChatKit**
   - Verify package name from https://platform.openai.com/docs/guides/chatkit
   - Install ChatKit package
   - Configure domain allowlist for production deployment
   - Create provider wrapper component
   - Configure with backend endpoint

2. **Create Conversation Store**
   - Create `frontend/stores/conversation-store.ts`
   - State: conversations, currentConversation, messages
   - Actions: fetchConversations, sendMessage, etc.

   ```typescript
   // conversation-store.ts
   import { create } from 'zustand';

   interface ConversationStore {
     conversations: Conversation[];
     currentConversation: Conversation | null;
     messages: Message[];
     isLoading: boolean;
     isStreaming: boolean;

     fetchConversations: () => Promise<void>;
     selectConversation: (id: number) => Promise<void>;
     createConversation: () => void;
     sendMessage: (content: string) => Promise<void>;
     appendStreamToken: (token: string) => void;
   }

   export const useConversationStore = create<ConversationStore>((set, get) => ({
     // ... implementation
   }));
   ```

3. **Create Chat Page**
   - Create `frontend/app/chat/page.tsx`
   - Layout with sidebar and main chat area
   - Protected route (require auth)

4. **Create Chat Components**
   - ChatContainer.tsx - Main wrapper
   - ChatInterface.tsx - ChatKit integration
   - MessageList.tsx - Display messages
   - MessageInput.tsx - User input
   - StreamingMessage.tsx - Handle SSE

5. **Create Conversation Sidebar**
   - ConversationSidebar.tsx - Sidebar container
   - ConversationList.tsx - List of conversations
   - ConversationItem.tsx - Single conversation
   - NewChatButton.tsx - Start new chat

6. **Implement SSE Client**
   - Create `frontend/lib/sse/client.ts`
   - Handle SSE connection and events
   - Update store with streamed tokens

   ```typescript
   // sse/client.ts
   export async function streamChat(
     userId: string,
     conversationId: number | null,
     message: string,
     onToken: (token: string) => void,
     onToolCall: (call: ToolCall) => void,
     onDone: (data: { conversationId: number }) => void
   ) {
     const response = await fetch(`/api/${userId}/chat/stream`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
       body: JSON.stringify({ conversation_id: conversationId, message }),
     });

     const reader = response.body?.getReader();
     // ... parse SSE events
   }
   ```

7. **Style Components**
   - Use Tailwind CSS for styling
   - Match existing app design
   - Add dark mode support
   - Make responsive for mobile

**Deliverables**:
- [ ] ChatKit integrated and working
- [ ] Conversation store with all actions
- [ ] Chat page with sidebar layout
- [ ] Message sending and receiving
- [ ] SSE streaming with token display
- [ ] Conversation history in sidebar
- [ ] Mobile responsive design

**Use Skills**:
- `openai-chatkit-setup` - ChatKit patterns
- `conversation-management` - Sidebar patterns
- `streaming-sse-setup` - SSE client

**Use Agents**:
- `@chatbot-ui-builder` - For chat UI
- `@frontend-ui-builder` - For components

---

### Phase 6: Integration & Testing (Day 6-7)

**Goal**: Test full conversation flow and fix issues.

**Tasks**:

1. **End-to-End Testing**
   - Test complete flow: login → chat → create task → verify
   - Test conversation persistence
   - Test SSE streaming
   - Test error handling

2. **Unit Tests**
   - Test agent tool functions
   - Test MCP tool handlers
   - Test conversation service

3. **Integration Tests**
   - Test chat API endpoint
   - Test conversation CRUD
   - Test user isolation

4. **Performance Testing**
   - Measure first token latency
   - Measure full response time
   - Test concurrent sessions

5. **Security Testing**
   - Test JWT validation
   - Test user isolation
   - Test rate limiting (if implemented)

6. **Browser Testing**
   - Test on Chrome, Firefox, Safari
   - Test SSE compatibility
   - Test mobile responsiveness

7. **Fix Issues**
   - Address bugs found in testing
   - Optimize performance bottlenecks
   - Improve error messages

**Deliverables**:
- [ ] E2E tests passing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Security checklist verified
- [ ] Cross-browser compatibility verified

---

### Phase 7: Documentation & Deployment (Day 7)

**Goal**: Complete documentation and deploy.

**Tasks**:

1. **Update README**
   - Add Phase 3 features description
   - Add chat endpoint documentation
   - Add environment variables (GEMINI_API_KEY)
   - Add MCP server setup instructions

2. **Update Environment Variables**
   - Add GEMINI_API_KEY
   - Add MCP_SERVER_URL
   - Update .env.example files

3. **Deploy Backend**
   - Deploy to Vercel/Railway
   - Configure Gemini API key
   - Verify chat endpoint works

4. **Deploy Frontend**
   - Deploy to Vercel
   - Verify chat page loads
   - Test SSE streaming in production

5. **Create Demo Video**
   - Record 90-second walkthrough
   - Show natural language task management
   - Demonstrate streaming responses

6. **Create PHR**
   - Document Phase 3 implementation
   - Record all decisions and changes
   - Archive in `history/prompts/phase-3-chatbot/`

**Deliverables**:
- [ ] README updated
- [ ] Environment variables documented
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Demo video created (<90 seconds)
- [ ] PHR created

---

## Testing Strategy

### Unit Tests
- **Agent Tools**: Test each @function_tool
- **MCP Tools**: Test each @mcp.tool handler
- **Services**: Test conversation service methods

### Integration Tests
- **Chat API**: Test full chat flow
- **Conversation API**: Test CRUD operations
- **User Isolation**: Test access control

### E2E Tests
- **Full Flow**: Login → Chat → Create Task → Verify in task list
- **Streaming**: Verify tokens appear incrementally
- **History**: Verify conversations persist

**Coverage Goals**:
- Backend: 80%
- Frontend: 70%
- Critical paths: 100%

---

## Security Considerations

### Authentication
- JWT validation on all chat endpoints
- Extract user_id from token payload
- Verify user owns conversation

### Data Isolation
- Filter conversations by user_id
- MCP tools enforce user_id
- No cross-user data access

### Input Validation
- Limit message length: **max 4000 characters**
- Sanitize content before processing (prevent prompt injection)
- Validate conversation ownership

### Rate Limiting
- **30 messages/minute per user**
- Prevent API abuse
- Graceful degradation with clear error messages

---

## Performance Optimization

### Backend
- Connection pooling for database
- Async agent execution
- Efficient message history loading

### Frontend
- Optimistic UI updates
- Virtualized message list (for long conversations)
- Lazy load conversation history
- Message pagination: 50 messages per page
- Conversation pagination: 20 conversations per page

### Agent
- Stream responses (don't wait for full response)
- Efficient tool execution
- Cache agent configuration

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Gemini API latency | Implement streaming, show loading states |
| MCP integration complexity | Use FastMCP simple patterns, thorough testing |
| ChatKit limitations | 90% ChatKit, 10% custom fallback with Shadcn/ui |
| SSE browser issues | Test early on Chrome/Firefox/Safari |
| Prompt injection | Sanitize inputs (max 4000 chars), guard system prompt |
| Rate limit abuse | 30 messages/minute per user with clear error messages |

---

## Timeline Estimate

**Total Duration**: 7 days (Dec 16-21, 2025)

- **Day 1**: Research + Setup + Database Models
- **Day 2**: MCP Server Implementation
- **Day 3**: AI Agent Implementation
- **Day 4**: Chat API Endpoint
- **Day 5**: Frontend Chat UI
- **Day 6**: Integration & Testing
- **Day 7**: Documentation & Deployment

---

## Success Metrics

Phase 3 is successful when:

1. ✅ Users can create tasks via natural language
2. ✅ All 5 MCP tools working
3. ✅ SSE streaming responses working
4. ✅ Conversation history persists
5. ✅ ChatKit UI responsive and functional
6. ✅ User isolation enforced
7. ✅ Deployed and accessible
8. ✅ PHR created and archived

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

After completing this plan:

1. Run `/sp.tasks` to generate detailed task breakdown
2. Run `/sp.implement` to begin execution
3. Create PHR after each major milestone
4. Suggest ADR for significant architectural decisions

---

## References

- [Phase 3 Specification](./spec-prompt-phase-3.md)
- [Phase 3 Constitution](./constitution-prompt-phase-3.md)
- [Hackathon II Documentation](./Hackathon%20II%20-%20Todo%20Spec-Driven%20Development.md)
- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [OpenAI ChatKit Domain Allowlist](https://platform.openai.com/settings/organization/security/domain-allowlist)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Status**: Ready for task breakdown
**Next Command**: `/sp.tasks`
**Est. Completion**: December 21, 2025
