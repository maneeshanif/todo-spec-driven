# Phase 0 Research: AI-Powered Todo Chatbot

**Feature**: 002-ai-chatbot
**Date**: 2025-12-17
**Status**: Complete

---

## 1. OpenAI Agents SDK

### Decision
Use OpenAI Agents SDK with LiteLLM extension for Gemini model support.

### Rationale
- Official SDK provides standardized agent patterns
- LitellmModel extension enables Gemini model usage
- Built-in support for function tools, hooks, and streaming
- Runner.run_streamed() provides SSE-compatible streaming

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| LangChain | Heavier dependency, more complexity than needed |
| Direct Gemini API | Would need to build agent orchestration from scratch |
| CrewAI | Overkill for single-agent scenario |

### Key Patterns
```python
from agents import Agent, Runner, function_tool
from agents.extensions.models.litellm import LitellmModel

# Model configuration
model = LitellmModel(model="gemini/gemini-2.5-flash", api_key=GEMINI_API_KEY)

# Function tool definition
@function_tool
async def add_task(ctx, user_id: str, title: str) -> str:
    """Add a new task."""
    result = await mcp_client.call_tool("add_task", {"user_id": user_id, "title": title})
    return json.dumps(result)

# Agent creation
agent = Agent(name="TodoBot", instructions=SYSTEM_PROMPT, model=model, tools=[add_task])

# Streaming execution
async for event in Runner.run_streamed(agent, messages):
    # Handle streaming events
```

### Documentation Reference
- https://openai.github.io/openai-agents-python/

---

## 2. FastMCP

### Decision
Use FastMCP Python SDK for MCP server implementation on port 8001.

### Rationale
- Simple decorator-based tool definition
- Built-in HTTP transport support
- Async-first design matches FastAPI
- Clean separation from main API server

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Raw MCP protocol | Too low-level, more boilerplate |
| Embedded in FastAPI | Would complicate main API, harder to scale |
| Node.js MCP server | Team expertise is Python |

### Key Patterns
```python
from fastmcp import FastMCP

mcp = FastMCP("Todo MCP Server")

@mcp.tool()
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Create a new task for the user."""
    # Database operation
    return {"task_id": task.id, "status": "created"}

# Run server
if __name__ == "__main__":
    mcp.run(host="0.0.0.0", port=8001)
```

### Documentation Reference
- https://github.com/jlowin/fastmcp

---

## 3. OpenAI ChatKit

### Decision
Use OpenAI ChatKit React components (@openai/chatkit-react) for chat UI.

### Rationale
- Production-ready chat components
- Built-in streaming support
- Consistent with OpenAI design language
- Reduces frontend development time

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Custom Shadcn/ui chat | More development time |
| react-chat-elements | Less polished, no streaming |
| Stream Chat | Paid service, overkill |

### Key Patterns
```typescript
// Note: Verify exact imports from documentation
import { ChatKit, MessageList, MessageInput } from '@openai/chatkit-react';

function ChatInterface() {
  return (
    <ChatKit>
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
    </ChatKit>
  );
}
```

### Domain Allowlist (Production)
1. Deploy frontend to get URL
2. Add domain to: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Get domain key, add to env: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`

### Fallback Strategy
If ChatKit doesn't work, implement custom chat UI with Shadcn/ui components.

### Documentation Reference
- https://platform.openai.com/docs/guides/chatkit

---

## 4. Gemini API Configuration

### Decision
Use server-side GEMINI_API_KEY environment variable with application-provided shared key.

### Rationale
- Simpler for users (no key management)
- More secure (keys never exposed to frontend)
- Rate limiting protects against abuse
- Standard SaaS pattern

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| User-provided keys | Complex UX, security concerns |
| Hybrid approach | Unnecessary complexity for MVP |

### Configuration
```python
# backend/src/agents/config.py
from agents.extensions.models.litellm import LitellmModel
from src.config import settings

def get_model():
    return LitellmModel(
        model="gemini/gemini-2.5-flash",
        api_key=settings.gemini_api_key
    )
```

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### Documentation Reference
- https://ai.google.dev/docs

---

## 5. Server-Sent Events (SSE)

### Decision
Use sse-starlette for SSE streaming from FastAPI chat endpoint.

### Rationale
- Native Starlette/FastAPI integration
- Simple generator-based API
- Browser-native EventSource support
- No WebSocket complexity

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| WebSockets | More complex, bidirectional not needed |
| Long polling | Inefficient for streaming |
| GraphQL subscriptions | Overkill, different paradigm |

### Key Patterns

**Backend (FastAPI)**:
```python
from sse_starlette.sse import EventSourceResponse

@router.post("/{user_id}/chat/stream")
async def chat_stream(user_id: str, request: ChatRequest):
    async def generate():
        async for event in run_agent_streamed(user_id, request.message):
            if event.type == "token":
                yield {"event": "token", "data": json.dumps({"content": event.content})}
            elif event.type == "tool_call":
                yield {"event": "tool_call", "data": json.dumps(event.data)}
        yield {"event": "done", "data": json.dumps({"conversation_id": conv_id})}

    return EventSourceResponse(generate())
```

**Frontend (TypeScript)**:
```typescript
// Using eventsource-parser
import { createParser } from 'eventsource-parser';

async function streamChat(message: string, onToken: (t: string) => void) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  const parser = createParser((event) => {
    if (event.type === 'event' && event.event === 'token') {
      const data = JSON.parse(event.data);
      onToken(data.content);
    }
  });

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(new TextDecoder().decode(value));
  }
}
```

### Documentation Reference
- https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## 6. Conversation Persistence

### Decision
Store conversations and messages in PostgreSQL with JSONB for tool_calls.

### Rationale
- JSONB provides flexible schema for tool call data
- PostgreSQL native JSON support is performant
- Consistent with existing Neon database
- Supports indexing if needed later

### Schema Design
```sql
-- Conversation table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Message table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

### tool_calls JSONB Structure
```json
{
  "calls": [
    {
      "id": "call_123",
      "tool": "add_task",
      "arguments": {"user_id": "u1", "title": "Buy groceries"},
      "result": {"task_id": 42, "status": "created"}
    }
  ]
}
```

---

## 7. Agent System Prompt

### Decision
Professional but warm tone as clarified in specification.

### System Prompt
```
You are a helpful todo assistant with a professional but warm personality.
You help users manage their tasks through natural language conversation.

Available actions:
- Add new tasks: "Add a task to [description]"
- List tasks: "Show my tasks" or "What's pending?"
- Complete tasks: "Mark task [id] as complete"
- Delete tasks: "Delete task [id]"
- Update tasks: "Change task [id] to [new title]"

Guidelines:
- Be clear and helpful, occasionally friendly but never overly casual
- Always confirm actions with a brief summary
- If multiple tasks match a description, ask for clarification
- Format task lists clearly with IDs for easy reference
- Acknowledge when tasks don't exist
```

---

## 8. Frontend Landing Behavior

### Decision
Chat page loads most recent conversation if exists, otherwise starts new conversation.

### Implementation
```typescript
// app/chat/page.tsx
export default async function ChatPage() {
  const user = await getUser();
  const conversations = await getConversations(user.id, { limit: 1, orderBy: 'updated_at' });

  if (conversations.length > 0) {
    // Load most recent
    redirect(`/chat/${conversations[0].id}`);
  }

  // Show empty new conversation state
  return <ChatContainer conversation={null} />;
}
```

---

## Summary

All research items resolved. Key decisions:

| Item | Decision |
|------|----------|
| Agent SDK | OpenAI Agents SDK + LitellmModel |
| MCP Server | FastMCP on port 8001 |
| Chat UI | OpenAI ChatKit (fallback: Shadcn/ui) |
| API Key | Server-side env var, app-provided |
| Streaming | SSE with sse-starlette |
| Storage | PostgreSQL JSONB for tool_calls |
| Tone | Professional but warm |
| Landing | Load most recent conversation |

**Status**: Ready for Phase 1 (Database Models)
