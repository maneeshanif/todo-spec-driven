# Phase 3: AI Chatbot - Skills & Subagents Plan

## Overview

Phase 3 transforms the Todo web app into an AI-powered chatbot using:
- **OpenAI Agents SDK** - For AI agent logic (with Gemini model via OpenAIChatCompletionsModel)
- **FastMCP** - For MCP server with task operations as tools
- **OpenAI ChatKit** - For frontend chat UI (`@openai/chatkit-react`)

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

**ChatKit Documentation**: [openai.github.io/chatkit-js](https://openai.github.io/chatkit-js/)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend                          │
│            (OpenAI ChatKit + Shadcn/ui)                     │
└────────────────────────────┬────────────────────────────────┘
                             │ POST /api/{user_id}/chat
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  Chat Endpoint  │────▶│  OpenAI Agents SDK          │   │
│  │  /api/chat      │     │  (Agent + Gemini Model)     │   │
│  └─────────────────┘     └──────────────┬──────────────┘   │
│                                         │                   │
│                          Agent calls MCP tools              │
│                                         │                   │
│                          ┌──────────────▼──────────────┐   │
│                          │  FastMCP Client             │   │
│                          │  (Connects to MCP Server)   │   │
│                          └──────────────┬──────────────┘   │
│                                         │                   │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │  FastMCP Server               │
                          │  (Task Tools: add, list, etc.)│
                          │  → Database Operations        │
                          └───────────────────────────────┘
```

**Key Insight**: The MCP server handles ALL database operations. The Agent uses FastMCP Client to call MCP tools. Agent tools are THIN WRAPPERS, not duplicate implementations!

---

## Skills Status

### 1. `openai-agents-setup` ✅ COMPLETE

**Purpose:** Initialize and configure OpenAI Agents SDK with Gemini models

**Files:**
```
.claude/skills/openai-agents-setup/
├── SKILL.md              # Main instructions & Gemini + MCP integration
├── REFERENCE.md          # API reference with hooks
├── examples.md           # Complete code examples
└── scripts/
    └── validate-setup.py # Validation script
```

**Key Topics:**
- Using Gemini with AsyncOpenAI + OpenAIChatCompletionsModel
- Proper agents folder structure (gemini_config.py, mcp_tools.py, hooks.py, etc.)
- AgentHooks and RunHooks for lifecycle management
- @function_tool decorator wrapping MCP Client calls (NOT database logic!)
- Runner.run() for executing agents
- Conversation state management

---

### 2. `fastmcp-server-setup` ✅ COMPLETE

**Purpose:** Create MCP server exposing task operations as tools

**Files:**
```
.claude/skills/fastmcp-server-setup/
├── SKILL.md              # Main instructions & quick start
├── REFERENCE.md          # FastMCP API reference
├── TOOLS.md              # Tool definition patterns
├── examples.md           # Complete server examples
└── scripts/
    └── test-mcp-server.py # Server test script
```

**Key Topics:**
- FastMCP server initialization (from `fastmcp import FastMCP`)
- @mcp.tool decorator for tools (no parentheses needed)
- Tool input/output schemas
- Server transport options (stdio, http, sse)
- Database integration with SQLModel

---

### 3. `chat-api-integration` ✅ COMPLETE

**Purpose:** Connect OpenAI Agents with MCP tools in FastAPI

**Files:**
```
.claude/skills/chat-api-integration/
├── SKILL.md              # Integration architecture & code
├── REFERENCE.md          # API reference & schemas
└── examples.md           # Complete code examples
```

**Key Topics:**
- POST /api/{user_id}/chat endpoint
- Conversation & Message models
- Loading conversation history from DB (STATELESS!)
- Running agent with MCP tools
- Storing responses back to DB

---

### 4. `openai-chatkit-setup` ✅ COMPLETE

**Purpose:** Set up OpenAI ChatKit for frontend chat interface

**Files:**
```
.claude/skills/openai-chatkit-setup/
├── SKILL.md              # Main instructions & setup
├── REFERENCE.md          # ChatKit API reference
└── examples.md           # Complete integration examples
```

**Key Topics:**
- `@openai/chatkit-react` installation
- `useChatKit` hook configuration
- `<ChatKit />` component styling
- Session token management
- Dark mode and theming
- Mobile responsive layouts

---

### 5. `streaming-sse-setup` ✅ COMPLETE (NEW)

**Purpose:** Implement Server-Sent Events (SSE) streaming for real-time AI chat responses

**Files:**
```
.claude/skills/streaming-sse-setup/
├── SKILL.md              # SSE implementation guide
└── examples.md           # Complete streaming examples
```

**Key Topics:**
- FastAPI StreamingResponse patterns
- SSE event format (`data: {...}\n\n`)
- Chunked response delivery
- Tool call visibility in streams
- Frontend SSE handling with fetch
- React hooks for streaming state
- Error handling and heartbeats

---

### 6. `conversation-management` ✅ COMPLETE (NEW)

**Purpose:** Build conversation history UI with sidebar, thread switching, and CRUD operations

**Files:**
```
.claude/skills/conversation-management/
├── SKILL.md              # Conversation management guide
└── examples.md           # Complete UI examples
```

**Key Topics:**
- Conversation CRUD endpoints (list, create, update, delete)
- Zustand store for conversation state
- Conversation sidebar component
- Thread switching and selection
- Mobile-responsive drawer/sheet
- Conversation search and grouping by date
- Auto-title generation
- Export functionality

---

## Subagents Status

### 1. `ai-agent-builder` ✅ COMPLETE

**File:** `.claude/agents/ai-agent-builder.md`

**Expertise:**
- OpenAI Agents SDK with Gemini models
- AsyncOpenAI + OpenAIChatCompletionsModel patterns
- @function_tool decorator wrapping MCP calls
- AgentHooks and RunHooks lifecycle
- MCP tool integration via FastMCP Client

---

### 2. `mcp-server-builder` ✅ COMPLETE

**File:** `.claude/agents/mcp-server-builder.md`

**Expertise:**
- FastMCP server creation
- MCP tool definition with schemas
- Transport configuration (http recommended)
- Database integration with SQLModel
- Testing MCP servers with FastMCP Client

---

### 3. `chatbot-ui-builder` ✅ COMPLETE

**File:** `.claude/agents/chatbot-ui-builder.md`

**Expertise:**
- OpenAI ChatKit React integration (`@openai/chatkit-react`)
- `useChatKit` hook configuration
- ChatKit component styling and theming
- Session token management
- Dark mode support with CSS custom properties
- Mobile-responsive chat layouts

---

## Backend Agents Folder Structure

```
backend/src/agents/
├── __init__.py           # Public exports
├── gemini_config.py      # AsyncOpenAI + OpenAIChatCompletionsModel setup
├── mcp_tools.py          # @function_tool wrappers for MCP tools (KEY!)
├── hooks.py              # AgentHooks + RunHooks classes
├── todo_agent.py         # Agent definition with instructions
└── runner.py             # Runner execution helpers
```

**Critical Pattern - mcp_tools.py:**
```python
from fastmcp import Client
from agents import function_tool

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

@function_tool
async def add_task(user_id: str, title: str, description: str = "") -> str:
    """Create a new task for the user via MCP server."""
    async with Client(MCP_SERVER_URL) as client:
        result = await client.call_tool("add_task", {"user_id": user_id, "title": title, "description": description})
        return str(result.data) if hasattr(result, 'data') else str(result)
```

---

## Frontend ChatKit Structure

```
frontend/src/
├── app/
│   └── chat/
│       ├── page.tsx              # ChatKit chat page
│       └── layout.tsx            # Chat layout (responsive)
│
├── components/
│   └── chat/
│       ├── ChatContainer.tsx     # ChatKit wrapper with header
│       ├── FloatingChat.tsx      # Floating chat widget
│       └── ThemedChatKit.tsx     # Dark mode support
```

**Basic ChatKit Integration:**
```tsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export default function ChatPage() {
  const { user, token } = useAuthStore();

  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/${user?.id}/chat`,
      async getClientSecret(existing) {
        if (existing) return existing;
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        return (await res.json()).client_secret;
      },
    },
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

---

## Technology Stack Summary

| Component | Technology | Skill/Agent |
|-----------|------------|-------------|
| AI Framework | OpenAI Agents SDK + Gemini | `openai-agents-setup`, `ai-agent-builder` |
| MCP Server | FastMCP (Python) | `fastmcp-server-setup`, `mcp-server-builder` |
| Chat UI | OpenAI ChatKit | `openai-chatkit-setup`, `chatbot-ui-builder` |
| Chat API | FastAPI | `chat-api-integration` |
| Streaming | Server-Sent Events | `streaming-sse-setup` |
| Conversation UI | Sidebar + History | `conversation-management` |
| Database | Neon PostgreSQL + SQLModel | `database-designer` |
| Auth | Better Auth (existing) | `better-auth-integration` |

---

## Implementation Order

1. ✅ **Skills & Subagents Setup** - Create all skills and subagents
2. ⏳ **Database Models** - Add Conversation & Message tables
3. ⏳ **MCP Server** - Create FastMCP server with task tools
4. ⏳ **AI Agent** - Build OpenAI agent with MCP tool wrappers
5. ⏳ **Chat API** - Create /api/{user_id}/chat endpoint
6. ⏳ **ChatKit UI** - Build frontend chat interface with ChatKit
7. ⏳ **Integration** - Connect all components
8. ⏳ **Testing** - Test conversation flow end-to-end

---

## Environment Variables for Phase 3

```env
# Gemini Configuration (NEW)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
MCP_SERVER_URL=http://localhost:8001/mcp

# Frontend (NEW)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Existing from Phase 2
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
```

---

## Completion Summary

### Skills Created/Updated:
- ✅ `openai-agents-setup` - Updated with MCP integration pattern
- ✅ `fastmcp-server-setup` - Updated with latest FastMCP docs
- ✅ `chat-api-integration` - NEW skill with REFERENCE.md & examples.md
- ✅ `openai-chatkit-setup` - NEW skill with full documentation
- ✅ `streaming-sse-setup` - NEW skill for SSE streaming (added Dec 16)
- ✅ `conversation-management` - NEW skill for conversation history UI (added Dec 16)

### Subagents Created:
- ✅ `ai-agent-builder` - For OpenAI Agents SDK
- ✅ `mcp-server-builder` - For FastMCP servers
- ✅ `chatbot-ui-builder` - Updated for OpenAI ChatKit

### Scripts Created:
- ✅ `.claude/skills/openai-agents-setup/scripts/validate-setup.py`
- ✅ `.claude/skills/fastmcp-server-setup/scripts/test-mcp-server.py`

---

## Next Steps for Implementation

1. Use `mcp-server-builder` agent to create the FastMCP server
2. Use `ai-agent-builder` agent to create the OpenAI agent
3. Follow `chat-api-integration` skill to build the chat endpoint
4. Follow `streaming-sse-setup` skill for real-time streaming
5. Use `chatbot-ui-builder` agent to create the ChatKit frontend UI
6. Follow `conversation-management` skill for conversation sidebar
