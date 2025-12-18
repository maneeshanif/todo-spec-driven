# Chat API Documentation

**Phase**: Phase 3 - AI-Powered Todo Chatbot
**Base URL**: `/api/chat`
**Authentication**: Required (JWT Bearer Token)

---

## Overview

The Chat API provides endpoints for interacting with the AI-powered todo assistant. Users can send messages, receive AI responses (with optional streaming), and manage their conversation history.

### Key Features

- **Non-streaming chat**: Send a message and receive the complete response
- **Streaming chat**: Send a message and receive response chunks via Server-Sent Events (SSE)
- **Conversation management**: List, retrieve, rename, and delete conversations
- **Tool execution**: AI can execute task management tools (add, list, complete, delete, update tasks)

---

## Authentication

All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

**Token Requirements:**
- Valid signature verified against `BETTER_AUTH_SECRET`
- Not expired
- Contains `sub` claim with user ID

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Invalid token"
}
```

---

## Endpoints

### 1. Send Message (Non-Streaming)

Send a message to the AI assistant and receive the complete response.

**Endpoint:** `POST /api/chat`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | application/json |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| conversation_id | integer | No | - | Existing conversation ID to continue |
| message | string | Yes | 1-4000 chars | The user's message |

**Request Example:**
```json
{
  "conversation_id": 123,
  "message": "Add a task to buy groceries tomorrow"
}
```

**Response Schema (200 OK):**

| Field | Type | Description |
|-------|------|-------------|
| conversation_id | integer | The conversation ID (new or existing) |
| message_id | integer | ID of the assistant's response message |
| response | string | The AI assistant's text response |
| tool_calls | array | List of tools executed (optional) |

**Response Example:**
```json
{
  "conversation_id": 123,
  "message_id": 456,
  "response": "I've added 'Buy groceries tomorrow' to your task list. Is there anything else you'd like me to help you with?",
  "tool_calls": [
    {
      "id": "call_abc123",
      "tool": "add_task",
      "arguments": {
        "title": "Buy groceries tomorrow",
        "description": ""
      },
      "result": {
        "task_id": 789,
        "status": "created",
        "title": "Buy groceries tomorrow"
      }
    }
  ]
}
```

**Error Codes:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 422 | Validation Error | Invalid request body |
| 500 | Internal Server Error | Processing error |

**Error Response Example (500):**
```json
{
  "detail": "An error occurred processing your message. Please try again."
}
```

---

### 2. Send Message (SSE Streaming)

Send a message and receive the response via Server-Sent Events for real-time streaming.

**Endpoint:** `POST /api/chat/stream`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | application/json |
| Accept | string | Recommended | text/event-stream |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| conversation_id | integer | No | - | Existing conversation ID to continue |
| message | string | Yes | 1-4000 chars | The user's message |

**Request Example:**
```json
{
  "message": "What tasks do I have?"
}
```

**Response:** `text/event-stream`

The response is a stream of Server-Sent Events. Each event has a type and JSON data payload.

#### SSE Event Types

##### `token` - Text Content Chunks

Emitted for each text chunk of the AI's response.

```
event: token
data: {"content": "Here are "}

event: token
data: {"content": "your current "}

event: token
data: {"content": "tasks:"}
```

**Data Schema:**
| Field | Type | Description |
|-------|------|-------------|
| content | string | Text content chunk |

##### `tool_call` - Tool Invocation

Emitted when the AI calls a tool (MCP function).

```
event: tool_call
data: {"tool": "list_tasks", "args": {"status": "all"}, "call_id": "call_xyz789"}
```

**Data Schema:**
| Field | Type | Description |
|-------|------|-------------|
| tool | string | Name of the tool being called |
| args | object | Arguments passed to the tool |
| call_id | string | Unique identifier for this call |

##### `tool_result` - Tool Execution Result

Emitted when a tool finishes executing.

```
event: tool_result
data: {"call_id": "call_xyz789", "output": [{"id": 1, "title": "Buy groceries", "completed": false}]}
```

**Data Schema:**
| Field | Type | Description |
|-------|------|-------------|
| call_id | string | ID of the tool call this result is for |
| output | any | Result from the tool execution |

##### `done` - Completion Event

Emitted when the stream completes successfully.

```
event: done
data: {"conversation_id": 123, "message_id": 457}
```

**Data Schema:**
| Field | Type | Description |
|-------|------|-------------|
| conversation_id | integer | The conversation ID |
| message_id | integer | ID of the assistant's complete message |

##### `error` - Error Event

Emitted when an error occurs during streaming.

```
event: error
data: {"message": "An error occurred processing your message.", "code": "stream_error"}
```

**Data Schema:**
| Field | Type | Description |
|-------|------|-------------|
| message | string | Human-readable error message |
| code | string | Error code for programmatic handling |

**Complete Stream Example:**
```
event: tool_call
data: {"tool": "list_tasks", "args": {"status": "pending"}, "call_id": "call_001"}

event: tool_result
data: {"call_id": "call_001", "output": [{"id": 1, "title": "Buy groceries", "completed": false}]}

event: token
data: {"content": "You have "}

event: token
data: {"content": "1 pending task:\n\n"}

event: token
data: {"content": "1. Buy groceries"}

event: done
data: {"conversation_id": 123, "message_id": 458}
```

---

### 3. List Conversations

Get all conversations for the authenticated user with pagination.

**Endpoint:** `GET /api/chat/conversations`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| page | integer | 1 | >= 1 | Page number |
| page_size | integer | 20 | 1-100 | Items per page |

**Request Example:**
```
GET /api/chat/conversations?page=1&page_size=10
```

**Response Schema (200 OK):**

| Field | Type | Description |
|-------|------|-------------|
| conversations | array | List of conversation objects |
| total | integer | Total number of conversations |
| page | integer | Current page number |
| page_size | integer | Items per page |

**Conversation Object Schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique conversation ID |
| user_id | string | Owner's user ID |
| title | string | Conversation title (nullable) |
| created_at | string | ISO 8601 creation timestamp |
| updated_at | string | ISO 8601 last update timestamp |
| message_count | integer | Number of messages in conversation |

**Response Example:**
```json
{
  "conversations": [
    {
      "id": 123,
      "user_id": "user_abc123",
      "title": "Add a task to buy groceries",
      "created_at": "2025-12-17T10:30:00.000Z",
      "updated_at": "2025-12-17T11:45:00.000Z",
      "message_count": 4,
      "messages": null
    },
    {
      "id": 122,
      "user_id": "user_abc123",
      "title": "Task management help",
      "created_at": "2025-12-16T09:00:00.000Z",
      "updated_at": "2025-12-16T09:30:00.000Z",
      "message_count": 6,
      "messages": null
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10
}
```

**Notes:**
- Conversations are sorted by `updated_at` descending (most recent first)
- The `messages` field is `null` in list responses (use single conversation endpoint for messages)

---

### 4. Get Conversation

Retrieve a specific conversation with all its messages.

**Endpoint:** `GET /api/chat/conversations/{conversation_id}`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | integer | Yes | The conversation ID |

**Request Example:**
```
GET /api/chat/conversations/123
```

**Response Schema (200 OK):**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique conversation ID |
| user_id | string | Owner's user ID |
| title | string | Conversation title (nullable) |
| created_at | string | ISO 8601 creation timestamp |
| updated_at | string | ISO 8601 last update timestamp |
| message_count | integer | Number of messages |
| messages | array | List of message objects |

**Message Object Schema:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique message ID |
| conversation_id | integer | Parent conversation ID |
| role | string | "user" or "assistant" |
| content | string | Message text content |
| tool_calls | object | Tool calls made (nullable) |
| created_at | string | ISO 8601 timestamp |

**Response Example:**
```json
{
  "id": 123,
  "user_id": "user_abc123",
  "title": "Add a task to buy groceries",
  "created_at": "2025-12-17T10:30:00.000Z",
  "updated_at": "2025-12-17T11:45:00.000Z",
  "message_count": 4,
  "messages": [
    {
      "id": 456,
      "conversation_id": 123,
      "role": "user",
      "content": "Add a task to buy groceries tomorrow",
      "tool_calls": null,
      "created_at": "2025-12-17T10:30:00.000Z"
    },
    {
      "id": 457,
      "conversation_id": 123,
      "role": "assistant",
      "content": "I've added 'Buy groceries tomorrow' to your task list.",
      "tool_calls": {
        "calls": [
          {
            "id": "call_abc123",
            "tool": "add_task",
            "arguments": {
              "title": "Buy groceries tomorrow"
            },
            "result": {
              "task_id": 789,
              "status": "created"
            }
          }
        ]
      },
      "created_at": "2025-12-17T10:30:05.000Z"
    }
  ]
}
```

**Error Codes:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 404 | Not Found | Conversation not found or not owned by user |

**Error Response Example (404):**
```json
{
  "detail": "Conversation 999 not found"
}
```

---

### 5. Rename Conversation

Update a conversation's title.

**Endpoint:** `PUT /api/chat/conversations/{conversation_id}`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |
| Content-Type | string | Yes | application/json |

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | integer | Yes | The conversation ID |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| title | string | Yes | 1-255 chars | New title for the conversation |

**Request Example:**
```json
{
  "title": "Grocery Shopping Tasks"
}
```

**Response Schema (200 OK):**

Returns the updated conversation object (same schema as Get Conversation, without messages).

**Response Example:**
```json
{
  "id": 123,
  "user_id": "user_abc123",
  "title": "Grocery Shopping Tasks",
  "created_at": "2025-12-17T10:30:00.000Z",
  "updated_at": "2025-12-17T12:00:00.000Z",
  "message_count": 4,
  "messages": null
}
```

**Error Codes:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 404 | Not Found | Conversation not found or not owned by user |
| 422 | Validation Error | Invalid title (empty or too long) |

---

### 6. Delete Conversation

Delete a conversation and all its messages.

**Endpoint:** `DELETE /api/chat/conversations/{conversation_id}`

**Headers:**
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| Authorization | string | Yes | Bearer token |

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | integer | Yes | The conversation ID |

**Request Example:**
```
DELETE /api/chat/conversations/123
```

**Response:** `204 No Content`

No response body on success.

**Error Codes:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | Unauthorized | Invalid or expired token |
| 404 | Not Found | Conversation not found or not owned by user |

**Error Response Example (404):**
```json
{
  "detail": "Conversation 123 not found"
}
```

---

## Data Models

### ChatRequest

```typescript
interface ChatRequest {
  conversation_id?: number;  // Optional: continue existing conversation
  message: string;           // Required: 1-4000 characters
}
```

### ChatResponse

```typescript
interface ChatResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls?: ToolCall[];
}
```

### ToolCall

```typescript
interface ToolCall {
  id: string;
  tool: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
}
```

### ConversationResponse

```typescript
interface ConversationResponse {
  id: number;
  user_id: string;
  title: string | null;
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
  message_count: number;
  messages?: MessageResponse[];
}
```

### ConversationListResponse

```typescript
interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
  page: number;
  page_size: number;
}
```

### MessageResponse

```typescript
interface MessageResponse {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  tool_calls?: {
    calls: ToolCall[];
  };
  created_at: string;       // ISO 8601
}
```

---

## Available AI Tools

The AI assistant can execute the following tools to manage tasks:

| Tool | Description | Arguments |
|------|-------------|-----------|
| `add_task` | Create a new task | `title` (string), `description` (string, optional) |
| `list_tasks` | List user's tasks | `status` ("all", "pending", "completed") |
| `complete_task` | Mark a task as complete | `task_id` (integer) |
| `delete_task` | Delete a task | `task_id` (integer) |
| `update_task` | Update task details | `task_id` (integer), `title` (string, optional), `description` (string, optional) |

---

## Frontend Integration

### Non-Streaming Example (JavaScript/Axios)

```javascript
import axios from 'axios';

const chatApi = axios.create({
  baseURL: '/api/chat',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token
chatApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Send message
async function sendMessage(message, conversationId = null) {
  const response = await chatApi.post('/', {
    message,
    conversation_id: conversationId
  });
  return response.data;
}
```

### Streaming Example (JavaScript/EventSource)

```javascript
async function sendMessageStream(message, conversationId, onToken, onToolCall, onDone) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const eventType = line.slice(7);
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        switch (eventType) {
          case 'token':
            onToken(data.content);
            break;
          case 'tool_call':
            onToolCall(data);
            break;
          case 'done':
            onDone(data);
            break;
          case 'error':
            throw new Error(data.message);
        }
      }
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message describing the issue"
}
```

### Validation Error Response (422)

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "message"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    }
  ]
}
```

### Common Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| Missing auth token | 401 | `{"detail": "Not authenticated"}` |
| Invalid token | 401 | `{"detail": "Invalid token"}` |
| Expired token | 401 | `{"detail": "Token expired"}` |
| Conversation not found | 404 | `{"detail": "Conversation {id} not found"}` |
| Empty message | 422 | Validation error |
| Message too long | 422 | Validation error |
| Server error | 500 | `{"detail": "An error occurred processing your message. Please try again."}` |

---

## Security Considerations

1. **User Isolation**: Users can only access their own conversations
2. **JWT Validation**: All requests require valid, non-expired JWT tokens
3. **Input Validation**: Messages are validated for length (1-4000 chars)
4. **Tool Security**: AI tools only operate on the authenticated user's tasks
5. **Error Messages**: Generic error messages to prevent information leakage

---

## Rate Limits

Currently no rate limits are enforced. Consider implementing rate limiting for production:

- Chat endpoints: 60 requests/minute per user
- Conversation list: 30 requests/minute per user
- Streaming connections: 5 concurrent per user
