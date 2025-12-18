# API Documentation - Phase 3 AI Chatbot

This document describes the AI Chatbot API endpoints added in Phase 3.

## Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-api-domain.com/api`

## Authentication

All chat endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Chat Endpoints

### Send Message (Non-Streaming)

Send a message to the AI chatbot and receive a complete response.

**Endpoint**: `POST /chat`

**Request Body**:
```json
{
  "conversation_id": 123,  // Optional: existing conversation ID
  "message": "Add a task to buy groceries",  // Required: 1-4000 characters
  "verbose": false  // Optional: enable verbose lifecycle events
}
```

**Response** (200 OK):
```json
{
  "conversation_id": 123,
  "message_id": 456,
  "response": "I've added 'Buy groceries' to your task list.",
  "tool_calls": [
    {
      "id": "call_abc123",
      "tool": "add_task",
      "arguments": {
        "title": "Buy groceries"
      },
      "result": {
        "success": true,
        "task_id": 789
      }
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid message format or empty after sanitization
- `401 Unauthorized`: Missing or invalid JWT token
- `429 Too Many Requests`: Rate limit exceeded (30 messages/minute)
- `504 Gateway Timeout`: Agent processing timeout
- `500 Internal Server Error`: AI model or tool execution error

---

### Send Message (Streaming)

Send a message and stream the response via Server-Sent Events (SSE).

**Endpoint**: `POST /chat/stream`

**Request Body**:
```json
{
  "conversation_id": 123,  // Optional
  "message": "Show me my tasks",  // Required: 1-4000 characters
  "verbose": false  // Optional: enable detailed lifecycle events
}
```

**Response**: Server-Sent Events stream

**Event Types**:

1. **thinking** - Agent is processing
   ```
   event: thinking
   data: {"agent": "TodoBot", "message": "Thinking..."}
   ```

2. **token** - Text content chunk
   ```
   event: token
   data: {"content": "Here are your tasks:\n"}
   ```

3. **tool_call** - Tool invocation
   ```
   event: tool_call
   data: {"id": "call_123", "tool": "list_tasks", "arguments": {"status": "all"}}
   ```

4. **tool_result** - Tool execution result
   ```
   event: tool_result
   data: {"id": "call_123", "result": {"tasks": [...]}}
   ```

5. **done** - Stream completed
   ```
   event: done
   data: {"conversation_id": 123, "message_id": 456}
   ```

6. **error** - Error occurred
   ```
   event: error
   data: {"error": "An error occurred", "code": "TOOL_ERROR"}
   ```

**Verbose Events** (when `verbose: true`):
- `agent_start`: Agent initialized
- `agent_end`: Agent finished
- `llm_start`: LLM call starting
- `llm_end`: LLM response received
- `mcp_request`: MCP tool request sent
- `mcp_response`: MCP tool response received

---

## Conversation Management

### List Conversations

Get all conversations for the authenticated user.

**Endpoint**: `GET /chat/conversations`

**Query Parameters**:
- `limit` (optional): Number of conversations to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": 123,
      "user_id": 1,
      "title": "Task Management",
      "created_at": "2025-12-18T10:30:00Z",
      "updated_at": "2025-12-18T11:45:00Z",
      "message_count": 5
    }
  ],
  "total": 10
}
```

---

### Get Conversation

Get a specific conversation with its messages.

**Endpoint**: `GET /chat/conversations/{id}`

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": 1,
  "title": "Task Management",
  "created_at": "2025-12-18T10:30:00Z",
  "updated_at": "2025-12-18T11:45:00Z",
  "messages": [
    {
      "id": 456,
      "conversation_id": 123,
      "role": "user",
      "content": "Add a task to buy groceries",
      "created_at": "2025-12-18T10:30:00Z",
      "tool_calls": null
    },
    {
      "id": 457,
      "conversation_id": 123,
      "role": "assistant",
      "content": "I've added 'Buy groceries' to your task list.",
      "created_at": "2025-12-18T10:30:05Z",
      "tool_calls": {
        "calls": [
          {
            "id": "call_abc123",
            "tool": "add_task",
            "arguments": {"title": "Buy groceries"},
            "result": {"success": true, "task_id": 789}
          }
        ]
      }
    }
  ]
}
```

---

### Rename Conversation

Update a conversation's title.

**Endpoint**: `PUT /chat/conversations/{id}`

**Request Body**:
```json
{
  "title": "Grocery Shopping Tasks"
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": 1,
  "title": "Grocery Shopping Tasks",
  "created_at": "2025-12-18T10:30:00Z",
  "updated_at": "2025-12-18T12:00:00Z"
}
```

---

### Delete Conversation

Delete a conversation and all its messages.

**Endpoint**: `DELETE /chat/conversations/{id}`

**Response** (204 No Content)

---

## Rate Limiting

All chat endpoints are rate-limited to prevent abuse:

- **Auth endpoints**: 5 requests per minute
- **Chat endpoints**: 30 messages per minute per user
- **General endpoints**: 100 requests per minute

When rate limit is exceeded, you'll receive:

```json
{
  "detail": "Rate limit exceeded. Maximum 30 messages per minute allowed.",
  "retry_after": 45
}
```

## Input Validation & Security

### Message Length
- Minimum: 1 character
- Maximum: 4000 characters
- Messages are trimmed and sanitized

### Prompt Injection Prevention
The API automatically sanitizes user input to prevent prompt injection attacks. Suspicious patterns are flagged but allowed through (the AI agent is trained to handle them appropriately).

### HTTPS Required
All API requests must use HTTPS in production.

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "User-friendly error message",
  "error_code": "ERROR_CODE"  // Optional
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMIT` | Rate limit exceeded |
| `AUTH_ERROR` | Authentication failed |
| `TIMEOUT` | Agent processing timeout |
| `TOOL_ERROR` | Tool execution failed |
| `MODEL_UNAVAILABLE` | AI model unavailable |
| `CONNECTION_ERROR` | Network connection error |

## Examples

### Example: Create Task via Chat

```bash
curl -X POST https://api.example.com/api/chat \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a task to call mom tomorrow"
  }'
```

### Example: Stream Chat Response

```javascript
const eventSource = new EventSource(
  'https://api.example.com/api/chat/stream',
  {
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      message: 'Show me all my pending tasks'
    })
  }
);

eventSource.addEventListener('token', (event) => {
  const data = JSON.parse(event.data);
  console.log('Token:', data.content);
});

eventSource.addEventListener('done', (event) => {
  const data = JSON.parse(event.data);
  console.log('Done:', data.conversation_id);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Error:', event.data);
  eventSource.close();
});
```

### Example: List Conversations

```bash
curl -X GET 'https://api.example.com/api/chat/conversations?limit=10' \
  -H "Authorization: Bearer your-jwt-token"
```

## MCP Tools

The AI agent has access to the following MCP tools:

| Tool | Description |
|------|-------------|
| `add_task` | Create a new task |
| `list_tasks` | List user's tasks (all, pending, or completed) |
| `complete_task` | Mark a task as complete |
| `delete_task` | Delete a task |
| `update_task` | Update a task's title or description |

The agent automatically chooses the appropriate tool based on user intent.

## WebSocket Alternative

Currently, the chat API uses Server-Sent Events (SSE) for streaming. WebSocket support may be added in a future version.

## Changelog

### Phase 3 (December 2025)
- Added AI chatbot endpoints (`/chat`, `/chat/stream`)
- Added conversation management endpoints
- Implemented rate limiting (30 msg/min)
- Added input sanitization
- Added SSE streaming with lifecycle events
- Added MCP tool integration

## Support

For API issues or questions, please contact [support@example.com](mailto:support@example.com).
