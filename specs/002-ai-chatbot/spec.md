# Feature Specification: AI-Powered Todo Chatbot

**Feature Branch**: `002-ai-chatbot`
**Created**: 2025-12-17
**Status**: Draft
**Priority**: P1 (Critical - Foundation for AI capabilities)
**Phase**: Phase 3 - AI-Powered Todo Chatbot
**Builds Upon**: Phase 2 - Full-Stack Web Application

---

## Executive Summary

Transform the Phase 2 web application into an AI-powered chatbot interface that allows users to manage their todos through natural language conversation. This feature introduces the conversational AI layer using OpenAI Agents SDK, FastMCP server, and OpenAI ChatKit.

**Key Deliverables**:
- AI Agent using OpenAI Agents SDK with Gemini model
- MCP Server exposing task operations as tools
- ChatKit-based conversational interface
- Server-Sent Events (SSE) for real-time streaming
- Conversation history persistence in database
- Stateless architecture for horizontal scalability

---

## User Scenarios & Testing

### User Story 1 - Natural Language Task Creation (Priority: P1)

As a logged-in user, I want to create tasks by typing natural language messages so that I can quickly capture my todos without filling forms.

**Why this priority**: Natural language task creation is the core value proposition of the chatbot - enabling intuitive task management. Users can bypass traditional form UIs for faster task capture.

**Independent Test**: Can be tested by sending "Add a task to buy groceries" and verifying the task appears in the task list.

**Acceptance Scenarios**:

1. **Given** I am on the chat page, **When** I type "Add a task to call mom", **Then** a new task "Call mom" is created and the bot confirms the action
2. **Given** I am chatting, **When** I say "I need to remember to pay bills", **Then** the bot creates a task "Pay bills" and confirms
3. **Given** I am chatting, **When** I say "Add task: finish project report with description: Complete the quarterly analysis", **Then** a task with title and description is created
4. **Given** I am chatting, **When** I send an empty message, **Then** I see an error prompting me to type something
5. **Given** the agent fails to create a task, **When** I see the response, **Then** I get a friendly error message and suggestion to retry

---

### User Story 2 - Natural Language Task Listing (Priority: P1)

As a user, I want to ask the bot to show my tasks so that I can see what I need to do through conversation.

**Why this priority**: Viewing tasks is essential to understand the current state before taking actions. This complements task creation for a complete basic workflow.

**Independent Test**: Can be tested by asking "Show me my tasks" and verifying the bot responds with the task list.

**Acceptance Scenarios**:

1. **Given** I have 5 tasks, **When** I ask "Show me all my tasks", **Then** the bot lists all 5 tasks with their status
2. **Given** I have pending and completed tasks, **When** I ask "What's pending?", **Then** the bot shows only incomplete tasks
3. **Given** I have completed tasks, **When** I ask "What have I completed?", **Then** the bot shows only completed tasks
4. **Given** I have no tasks, **When** I ask "Show my tasks", **Then** the bot says "You have no tasks yet" and suggests adding one
5. **Given** I have many tasks, **When** I list them, **Then** tasks are formatted readably with status indicators

---

### User Story 3 - Natural Language Task Completion (Priority: P1)

As a user, I want to mark tasks complete by telling the bot so that I can track progress through conversation.

**Why this priority**: Completing tasks is the primary satisfaction driver and progress indicator. Core to the todo workflow.

**Independent Test**: Can be tested by saying "Mark task 3 as complete" and verifying the task status changes.

**Acceptance Scenarios**:

1. **Given** I have task ID 3 pending, **When** I say "Mark task 3 as complete", **Then** the task is marked complete and bot confirms
2. **Given** I have task "Buy groceries", **When** I say "I finished buying groceries", **Then** the bot identifies and completes the task
3. **Given** I say "Complete task 999" (non-existent), **When** I send the message, **Then** the bot says "Task not found" and lists available tasks
4. **Given** I have an already completed task, **When** I try to complete it again, **Then** the bot informs me it's already complete
5. **Given** multiple similar tasks exist, **When** I say "Complete the meeting task", **Then** the bot asks for clarification or shows options

---

### User Story 4 - Natural Language Task Deletion (Priority: P2)

As a user, I want to delete tasks by telling the bot so that I can clean up my task list conversationally.

**Why this priority**: Deletion is less frequent than other operations but necessary for list management and housekeeping.

**Independent Test**: Can be tested by saying "Delete task 2" and verifying the task is removed.

**Acceptance Scenarios**:

1. **Given** I have task ID 2, **When** I say "Delete task 2", **Then** the task is deleted and bot confirms
2. **Given** I have task "Old meeting", **When** I say "Remove the old meeting task", **Then** the bot deletes it
3. **Given** I say "Delete all tasks", **When** I send the message, **Then** the bot asks for confirmation before proceeding
4. **Given** I try to delete non-existent task, **When** I send the message, **Then** the bot says "Task not found"
5. **Given** I delete a task, **When** I realize it was a mistake, **Then** the bot confirms deletion is permanent (no undo)

---

### User Story 5 - Natural Language Task Update (Priority: P2)

As a user, I want to update tasks by describing changes to the bot so that I can refine my todos conversationally.

**Why this priority**: Updates are important but less frequent than create/read/complete operations.

**Independent Test**: Can be tested by saying "Change task 1 to 'Call mom tonight'" and verifying the update.

**Acceptance Scenarios**:

1. **Given** I have task 1 "Call mom", **When** I say "Change task 1 to 'Call mom tonight'", **Then** the title is updated
2. **Given** I have task 2, **When** I say "Update task 2 description to 'Include milk and eggs'", **Then** description is updated
3. **Given** I have task "Meeting", **When** I say "Rename meeting task to Team standup", **Then** the bot updates it
4. **Given** I try to update non-existent task, **When** I send the message, **Then** the bot says "Task not found"
5. **Given** I provide an empty title, **When** I try to update, **Then** the bot requires a valid title

---

### User Story 6 - Conversation History (Priority: P2)

As a user, I want my chat history to be saved so that I can continue conversations and review past interactions.

**Why this priority**: Persistence is essential for context continuity and user experience across sessions.

**Independent Test**: Can be tested by having a conversation, refreshing the page, and seeing history intact.

**Acceptance Scenarios**:

1. **Given** I had a conversation yesterday, **When** I open the chat page, **Then** my most recent conversation loads automatically
2. **Given** I have multiple conversations, **When** I view the sidebar, **Then** I see a list of conversations with titles
3. **Given** I click a previous conversation, **When** the chat loads, **Then** I see all messages from that conversation
4. **Given** I want a fresh start, **When** I click "New Chat", **Then** a new conversation starts
5. **Given** I am in a conversation, **When** I continue chatting, **Then** the context is maintained
6. **Given** I want to rename a conversation, **When** I click the kebab menu and select "Rename", **Then** I can edit the title inline
7. **Given** I want to delete a conversation, **When** I click the kebab menu and select "Delete", **Then** a confirmation dialog appears before deletion

---

### User Story 7 - Real-Time Streaming Responses (Priority: P2)

As a user, I want to see the bot's response appear word by word so that I know the bot is working and don't wait for long responses.

**Why this priority**: Streaming provides better UX and feedback during AI processing, reducing perceived wait time.

**Independent Test**: Can be tested by sending a message and seeing tokens appear incrementally.

**Acceptance Scenarios**:

1. **Given** I send a message, **When** the bot starts responding, **Then** I see text appear incrementally (token by token)
2. **Given** the bot is calling a tool, **When** I wait, **Then** I see an indicator that an action is being performed
3. **Given** the response is complete, **When** I look at the chat, **Then** the full response is displayed
4. **Given** I lose internet connection, **When** streaming stops, **Then** I see an error and can retry
5. **Given** streaming is in progress, **When** I send another message, **Then** the current response completes first

---

### Edge Cases

**Conversation Management**:
- What happens when user has 1000+ messages in a conversation?
  - System implements pagination when loading history (load 50 messages per page, lazy load on scroll)
  - System stores up to 10,000 messages per user, 1,000 conversations per user
- What happens when user deletes a conversation while viewing it?
  - Redirect to new chat, show confirmation
- What happens when authentication token expires during a conversation?
  - Prompt re-authentication, preserve message in draft

**Agent & Tool Execution**:
- What happens when AI model is unavailable?
  - Show error message, suggest retry, log incident for monitoring
- What happens when MCP tool fails?
  - Agent receives error, provides user-friendly message
- What happens when user sends malicious prompt injection?
  - System prompt guards, input sanitization, rate limiting protects against abuse

**Network & Performance**:
- What happens when SSE connection drops?
  - Auto-reconnect, resume from last message
- What happens when response takes more than 30 seconds?
  - Show timeout error, suggest retry
- What happens on slow mobile connection?
  - Streaming still works, just slower token delivery

---

## Requirements

### Functional Requirements

#### Chat Interface (FR-CHAT-001 to FR-CHAT-008)

- **FR-CHAT-001**: System MUST provide a chat input for sending natural language messages
- **FR-CHAT-002**: System MUST display messages in a scrollable conversation view
- **FR-CHAT-003**: System MUST show user messages on the right, bot messages on the left
- **FR-CHAT-004**: System MUST support markdown rendering in bot responses
- **FR-CHAT-005**: System MUST show loading indicator while waiting for response
- **FR-CHAT-006**: System MUST auto-scroll to new messages
- **FR-CHAT-007**: System MUST support keyboard shortcuts (Enter to send)
- **FR-CHAT-008**: System MUST be responsive on mobile devices

#### AI Agent (FR-AGENT-001 to FR-AGENT-006)

- **FR-AGENT-001**: System MUST use OpenAI Agents SDK for AI orchestration
- **FR-AGENT-002**: System MUST use Gemini model (gemini-2.5-flash) via AsyncOpenAI wrapper
- **FR-AGENT-003**: System MUST interpret natural language commands for task operations
- **FR-AGENT-004**: System MUST call appropriate MCP tools based on user intent
- **FR-AGENT-005**: System MUST provide professional but warm responses (helpful, clear, occasionally friendly tone)
- **FR-AGENT-006**: System MUST confirm actions with clear feedback

#### MCP Server (FR-MCP-001 to FR-MCP-007)

- **FR-MCP-001**: System MUST implement MCP server using FastMCP SDK
- **FR-MCP-002**: System MUST expose `add_task` tool for task creation
- **FR-MCP-003**: System MUST expose `list_tasks` tool for viewing tasks
- **FR-MCP-004**: System MUST expose `complete_task` tool for marking complete
- **FR-MCP-005**: System MUST expose `delete_task` tool for removal
- **FR-MCP-006**: System MUST expose `update_task` tool for modifications
- **FR-MCP-007**: System MUST enforce user_id isolation in all tools

#### Conversation Persistence (FR-CONV-001 to FR-CONV-006)

- **FR-CONV-001**: System MUST store conversations in database
- **FR-CONV-002**: System MUST store all messages with role (user/assistant)
- **FR-CONV-003**: System MUST auto-generate conversation title from first message
- **FR-CONV-004**: System MUST support listing user's conversations
- **FR-CONV-004a**: System MUST load most recent conversation on chat page entry (if exists), otherwise show empty new conversation
- **FR-CONV-005**: System MUST support continuing existing conversations
- **FR-CONV-006**: System MUST support deleting conversations
- **FR-CONV-007**: System MUST support renaming conversations via inline edit in sidebar
- **FR-CONV-008**: System MUST show kebab menu (three-dot) with Rename and Delete options for each conversation

#### Streaming (FR-SSE-001 to FR-SSE-004)

- **FR-SSE-001**: System MUST use Server-Sent Events for response streaming
- **FR-SSE-002**: System MUST stream tokens as they are generated
- **FR-SSE-003**: System MUST send tool call notifications in stream
- **FR-SSE-004**: System MUST handle SSE connection drops gracefully

#### API Endpoint (FR-API-001 to FR-API-004)

- **FR-API-001**: System MUST expose chat endpoint for message submission
- **FR-API-002**: System MUST accept conversation_id (optional) and message in request
- **FR-API-003**: System MUST return conversation_id, response, and tool_calls in response
- **FR-API-004**: System MUST support both streaming (SSE) and non-streaming modes

### Non-Functional Requirements

#### Performance (NFR-PERF-001 to NFR-PERF-004)

- **NFR-PERF-001**: First token MUST appear within 2 seconds of sending message
- **NFR-PERF-002**: Full response MUST complete within 30 seconds
- **NFR-PERF-003**: Conversation history MUST load within 1 second
- **NFR-PERF-004**: MCP tool execution MUST complete within 500ms

#### Security (NFR-SEC-001 to NFR-SEC-006)

- **NFR-SEC-001**: All chat endpoints MUST require authentication
- **NFR-SEC-002**: Users MUST only access their own conversations
- **NFR-SEC-003**: Message length MUST be limited to 4000 characters to prevent abuse
- **NFR-SEC-004**: Rate limiting MUST be applied: 30 messages/minute per user
- **NFR-SEC-005**: Tool calls MUST be logged for audit trail
- **NFR-SEC-006**: Input sanitization MUST be applied to prevent prompt injection

#### Reliability (NFR-REL-001 to NFR-REL-003)

- **NFR-REL-001**: System MUST handle AI model failures gracefully
- **NFR-REL-002**: System MUST persist messages immediately (no loss on crash)
- **NFR-REL-003**: System MUST recover from SSE connection drops

#### Scalability (NFR-SCALE-001 to NFR-SCALE-002)

- **NFR-SCALE-001**: Architecture MUST be stateless for horizontal scaling
- **NFR-SCALE-002**: System MUST support 100 concurrent chat sessions

---

## Key Entities

### Conversation Entity (New)

- **Purpose**: Represents a chat conversation thread between user and AI assistant
- **Key attributes**:
  - Unique identifier
  - Owner (user reference)
  - Title (auto-generated from first message)
  - Creation and update timestamps
- **Relationships**: One conversation has many messages
- **Constraints**: Users can only access their own conversations

### Message Entity (New)

- **Purpose**: Represents a single message in a conversation
- **Key attributes**:
  - Unique identifier
  - Parent conversation reference
  - Role (user, assistant, or system)
  - Content (message text)
  - Tool calls (optional, stored as native JSONB column containing tool name, arguments, and results)
  - Timestamp
- **Relationships**: Many messages belong to one conversation
- **Constraints**: Messages are immutable once created

### Task Entity (Existing from Phase 2)

- **Purpose**: No changes to existing Task model
- **Note**: MCP tools operate on existing Task table, maintaining data consistency

---

## Out of Scope (Future Phases)

These features are explicitly OUT OF SCOPE for this phase:

- Voice input/output (Bonus feature)
- Multi-language support (Bonus feature)
- Docker containerization (Phase 4)
- Kubernetes deployment (Phase 4)
- Advanced features: recurring tasks, reminders (Phase 5)
- Kafka event streaming (Phase 5)
- Dapr integration (Phase 5)
- Real-time collaboration between users

---

## Dependencies

### External Services (New)

- **Gemini API**: AI model provider (via Google AI), configured via server-side GEMINI_API_KEY environment variable (application-provided shared key)
- **Neon**: PostgreSQL database (existing from Phase 2)
- **Vercel**: Hosting (existing from Phase 2)

### Phase 2 Dependencies (Preserved)

- FastAPI, SQLModel, Better Auth (backend)
- Next.js, Zustand, Axios, Shadcn/ui (frontend)

---

## Assumptions

1. **Authentication**: Better Auth from Phase 2 continues to work and provides user_id for isolation
2. **Database**: Neon PostgreSQL can handle conversation/message tables alongside existing tables
3. **AI Model**: Gemini 2.5 Flash is available and provides acceptable response quality
4. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) support SSE natively
5. **Network**: Users have stable internet connections for real-time streaming
6. **Load**: Initial deployment targets up to 100 concurrent users
7. **Message Size**: Average message size is under 500 characters; max 4000 characters

---

## Risks & Mitigation

| Risk                          | Impact | Probability | Mitigation                                      |
|-------------------------------|--------|-------------|-------------------------------------------------|
| AI model latency              | High   | Medium      | Implement streaming, show loading states        |
| MCP integration complexity    | High   | Medium      | Study FastMCP docs, use simple HTTP transport   |
| ChatKit customization limits  | Medium | Medium      | Have fallback to custom chat UI                 |
| SSE browser compatibility     | Medium | Low         | Test on multiple browsers, provide fallback     |
| Prompt injection attacks      | High   | Low         | Sanitize inputs, guard system prompt            |
| Rate limiting from AI provider| Medium | Medium      | Implement request queuing, backoff              |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create tasks via natural language with 90%+ success rate
- **SC-002**: Users can list, complete, delete, and update tasks via chat
- **SC-003**: First token appears within 2 seconds of sending message
- **SC-004**: Conversation history persists across page refreshes
- **SC-005**: SSE streaming works on Chrome, Firefox, Safari
- **SC-006**: Zero unauthorized access to other users' conversations
- **SC-007**: System handles 100 concurrent chat sessions
- **SC-008**: All MCP tools complete within 500ms

---

## Acceptance Checklist

Before this phase is considered complete, verify:

- [ ] All 7 user stories have passing acceptance tests
- [ ] AI agent correctly interprets task commands
- [ ] MCP server exposes all 5 task tools
- [ ] Chat endpoint works with SSE streaming
- [ ] Conversation history saves and loads correctly
- [ ] Chat UI renders messages properly
- [ ] Conversation sidebar shows history
- [ ] User isolation enforced (can't see others' conversations)
- [ ] Error handling shows friendly messages
- [ ] Mobile responsive chat interface
- [ ] Lighthouse score > 85 for chat page
- [ ] Security checklist complete
- [ ] API documentation updated for chat endpoint

---

## Clarifications

### Session 2025-12-17

- Q: How can users rename or delete conversations from the UI? → A: Both rename and delete available via dropdown/kebab menu in sidebar
- Q: What storage format should be used for tool_calls in Message entity? → A: Native JSONB column in PostgreSQL
- Q: How should the Gemini API key be configured? → A: Server-side environment variable (GEMINI_API_KEY), application provides shared key
- Q: What is the default landing behavior when user navigates to chat page? → A: Load most recent conversation if exists, otherwise start new conversation
- Q: What persona/tone should the AI agent use? → A: Professional but warm (helpful, clear, occasionally friendly)

---

## References

- [Phase 3 Constitution](../../constitution-prompt-phase-3.md)
- [Phase 2 Specification](../../prompts/spec-prompt-phase-2.md)
- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)

---

**Next Step**: Run `/sp.clarify` to address any ambiguities, or `/sp.plan` to create implementation plan.
