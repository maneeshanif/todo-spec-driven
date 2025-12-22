# ChatKit Backend Reference

Complete SSE format and API reference for ChatKit backend integration.

---

## SSE Event Types

### Event Format

All events follow the Server-Sent Events specification:

```
event: <event-type>
data: <json-payload>\n\n
```

Or simplified (ChatKit default):

```
data: <json-payload>\n\n
```

---

## Event Type Reference

### Text Event

Stream text content to the frontend:

```python
# Python
yield f"data: {json.dumps({'type': 'text', 'content': 'Hello world'})}\n\n"
```

```json
// JSON payload
{"type": "text", "content": "Hello world"}
```

### Tool Call Event

Notify frontend that a tool is being called:

```python
yield f"data: {json.dumps({
    'type': 'tool_call',
    'id': 'call_123',
    'name': 'add_task',
    'args': {'title': 'Buy groceries', 'priority': 'high'}
})}\n\n"
```

```json
{
  "type": "tool_call",
  "id": "call_123",
  "name": "add_task",
  "args": {"title": "Buy groceries", "priority": "high"}
}
```

### Tool Result Event

Send tool execution result:

```python
yield f"data: {json.dumps({
    'type': 'tool_result',
    'id': 'call_123',
    'name': 'add_task',
    'result': {'success': True, 'task_id': 456}
})}\n\n"
```

```json
{
  "type": "tool_result",
  "id": "call_123",
  "name": "add_task",
  "result": {"success": true, "task_id": 456}
}
```

### Thinking Event (Optional)

Show "thinking" indicator:

```python
yield f"data: {json.dumps({
    'type': 'thinking',
    'content': 'Analyzing your request...'
})}\n\n"
```

```json
{"type": "thinking", "content": "Analyzing your request..."}
```

### Error Event

Send error to frontend:

```python
yield f"data: {json.dumps({
    'type': 'error',
    'message': 'Failed to process request'
})}\n\n"
```

```json
{"type": "error", "message": "Failed to process request"}
```

### Done Event

Signal stream completion:

```python
# Option 1: [DONE] marker
yield "data: [DONE]\n\n"

# Option 2: JSON done event
yield f"data: {json.dumps({'type': 'done'})}\n\n"
```

---

## Request Format

### ChatKit Request

```json
POST /chatkit
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Show my tasks",
  "thread_id": 123  // Optional: existing conversation
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's message |
| `thread_id` | number | No | Conversation ID for context |

---

## Response Headers

```python
return StreamingResponse(
    generate(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # Disable nginx buffering
        "Access-Control-Allow-Origin": "*",
    },
)
```

---

## Full Event Sequence

Typical event flow for a request:

```
data: {"type": "thinking", "content": "Processing..."}\n\n
data: {"type": "tool_call", "name": "list_tasks", "args": {}}\n\n
data: {"type": "tool_result", "name": "list_tasks", "result": {"tasks": [...]}}\n\n
data: {"type": "text", "content": "You have "}\n\n
data: {"type": "text", "content": "3 tasks:"}\n\n
data: {"type": "text", "content": "\n1. Buy groceries"}\n\n
data: {"type": "text", "content": "\n2. Call doctor"}\n\n
data: {"type": "text", "content": "\n3. Submit report"}\n\n
data: [DONE]\n\n
```

---

## Widget Events (Advanced)

ChatKit supports rich widgets in responses:

### List Widget

```python
yield f"data: {json.dumps({
    'type': 'widget',
    'widget': {
        'type': 'list',
        'title': 'Your Tasks',
        'items': [
            {'title': 'Buy groceries', 'subtitle': 'Due today'},
            {'title': 'Call doctor', 'subtitle': 'Completed'},
        ]
    }
})}\n\n"
```

### Card Widget

```python
yield f"data: {json.dumps({
    'type': 'widget',
    'widget': {
        'type': 'card',
        'title': 'Task Created',
        'description': 'Your task has been added successfully.',
        'icon': 'check',
        'actions': [
            {'label': 'View Task', 'action': 'view_task', 'data': {'id': 123}}
        ]
    }
})}\n\n"
```

---

## Error Handling

### Graceful Error Streaming

```python
async def generate():
    try:
        async for event in run_agent_streaming(...):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    except asyncio.CancelledError:
        # Client disconnected
        pass

    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({
            'type': 'error',
            'message': 'An error occurred processing your request'
        })}\n\n"
        yield "data: [DONE]\n\n"
```

### HTTP Error Responses

For non-streaming errors:

```python
from fastapi import HTTPException

@router.post("/chatkit")
async def chatkit_endpoint(...):
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

---

## Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### Messages Table

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT,  -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

---

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

---

## Performance Considerations

### Chunk Size

Balance between smooth streaming and efficiency:

```python
# Smaller chunks = smoother display
chunk_size = 10  # characters

# Larger chunks = fewer events
chunk_size = 50  # characters

# Recommended for natural feel
chunk_size = 20  # characters
```

### Streaming Delay

Add small delay for natural feel:

```python
import asyncio

for i in range(0, len(text), chunk_size):
    chunk = text[i:i + chunk_size]
    yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
    await asyncio.sleep(0.02)  # 20ms delay
```

### Connection Keep-Alive

For long-running streams, send heartbeat:

```python
async def generate():
    last_event = time.time()

    async for event in stream:
        yield f"data: {json.dumps(event)}\n\n"
        last_event = time.time()

        # Heartbeat every 15 seconds
        if time.time() - last_event > 15:
            yield ": heartbeat\n\n"  # SSE comment
            last_event = time.time()
```

---

## Testing Tools

### curl

```bash
curl -N -X POST http://localhost:8000/chatkit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "Hello"}'
```

### httpie

```bash
http --stream POST localhost:8000/chatkit \
  message="Hello" \
  Authorization:"Bearer TOKEN"
```

### Python Client

```python
import httpx

async def stream_chat(message: str):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/chatkit",
            json={"message": message},
            headers={"Authorization": "Bearer TOKEN"},
            timeout=60.0,
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data != "[DONE]":
                        event = json.loads(data)
                        print(event)
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [examples.md](./examples.md) - Full code examples
- [chatkit-frontend skill](../chatkit-frontend/) - Frontend integration
