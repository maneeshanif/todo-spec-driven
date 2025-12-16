# Quickstart: AI-Powered Todo Chatbot

**Feature**: 002-ai-chatbot
**Date**: 2025-12-17

---

## Prerequisites

- Phase 2 completed and working
- Python 3.13+ with UV
- Node.js 20+
- Neon PostgreSQL database
- Gemini API key

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
uv add openai-agents fastmcp litellm sse-starlette
```

### 2. Configure Environment

Add to `backend/.env`:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# MCP Server
MCP_SERVER_URL=http://localhost:8001/mcp
MCP_SERVER_PORT=8001
```

### 3. Run Database Migration

```bash
cd backend
uv run alembic revision --autogenerate -m "Add conversations and messages tables"
uv run alembic upgrade head
```

### 4. Start MCP Server (Terminal 1)

```bash
cd backend
uv run python -m src.mcp_server.server
# Runs on port 8001
```

### 5. Start FastAPI Server (Terminal 2)

```bash
cd backend
uv run uvicorn src.main:app --reload --port 8000
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install eventsource-parser
# Verify ChatKit package name from OpenAI docs
npm install @openai/chatkit-react
```

### 2. Configure Environment (Production Only)

For production deployment, add to `frontend/.env.local`:

```env
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key
```

Note: Local development works without domain key.

### 3. Start Development Server

```bash
cd frontend
npm run dev
# Runs on port 3000
```

---

## Quick Test

### 1. Test MCP Server

```bash
curl http://localhost:8001/mcp/tools
# Should return list of 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
```

### 2. Test Chat Endpoint

```bash
# Login first to get JWT token
TOKEN="your_jwt_token"

# Send chat message
curl -X POST http://localhost:8000/api/your_user_id/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'
```

### 3. Test Frontend

1. Navigate to http://localhost:3000/chat
2. Login if not authenticated
3. Type "Add a task to buy groceries"
4. Verify task is created and response appears

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Next.js   │────▶│   FastAPI   │
│  (ChatKit)  │     │  (port 3000)│     │ (port 8000) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
                  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                  │   Agent     │────▶│ MCP Server  │────▶│  PostgreSQL │
                  │  (Gemini)   │     │ (port 8001) │     │   (Neon)    │
                  └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `src/agents/config.py` | Gemini model configuration |
| `src/agents/todo_agent.py` | Agent with system prompt |
| `src/agents/tools.py` | @function_tool wrappers |
| `src/mcp_server/server.py` | FastMCP server |
| `src/routers/api/routes/chat.py` | Chat endpoints |
| `src/models/conversation.py` | Conversation model |
| `src/models/message.py` | Message model (JSONB) |

### Frontend

| File | Purpose |
|------|---------|
| `app/chat/page.tsx` | Chat page (loads recent conv) |
| `components/chat/ChatInterface.tsx` | ChatKit integration |
| `components/conversation/ConversationItem.tsx` | Kebab menu |
| `stores/conversation-store.ts` | Zustand store |
| `lib/sse/client.ts` | SSE streaming client |

---

## Common Issues

### MCP Server Connection Failed

```
Error: Connection refused to localhost:8001
```

**Solution**: Ensure MCP server is running in separate terminal.

### Gemini API Error

```
Error: API key not valid
```

**Solution**: Check GEMINI_API_KEY in .env file.

### SSE Not Streaming

**Solution**: Ensure browser supports EventSource. Test in Chrome/Firefox.

### Conversation Not Loading

**Solution**: Check JWT token is valid and user_id matches.

---

## Next Steps

1. Implement all MCP tools (`src/mcp_server/tools/`)
2. Create agent with system prompt
3. Build chat API endpoints
4. Implement ChatKit frontend
5. Add conversation sidebar with kebab menu
6. Test full flow

---

**Reference**: See `plan.md` for detailed implementation phases.
