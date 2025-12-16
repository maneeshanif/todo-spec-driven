# Chat API Integration Reference

Detailed API reference for the chat endpoint and conversation management.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## API Endpoints

### POST /api/{user_id}/chat

Send a message and receive an AI response.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "string (required)",
  "conversation_id": "integer (optional)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "response": "string",
    "conversation_id": "integer",
    "message_id": "integer"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "data": {
    "error": "string",
    "conversation_id": "integer (if available)"
  }
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (user_id mismatch) |
| 404 | Conversation not found |
| 500 | Internal server error |

---

## Database Models

### Conversation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| user_id | VARCHAR | INDEX, NOT NULL | Owner's user ID |
| title | VARCHAR(200) | NULLABLE | Conversation title |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Message

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| conversation_id | INTEGER | FOREIGN KEY, INDEX | Parent conversation |
| role | VARCHAR(20) | NOT NULL | "user" or "assistant" |
| content | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

---

## Pydantic Schemas

### ChatRequest

```python
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: int | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Add a task to buy groceries",
                "conversation_id": None
            }
        }
```

### ChatResponse

```python
class ChatResponse(BaseModel):
    success: bool
    data: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "response": "I've added 'buy groceries' to your tasks!",
                    "conversation_id": 123,
                    "message_id": 456
                }
            }
        }
```

### MessageResponse

```python
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
```

### ConversationResponse

```python
class ConversationResponse(BaseModel):
    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime
    message_count: int
```

---

## Request Flow

```
1. Client sends POST /api/{user_id}/chat
   └── { message: "...", conversation_id: null }

2. Server validates JWT token
   └── Extract user_id from token

3. Server enforces user isolation
   └── Compare token.user_id == path.user_id

4. Get or create conversation
   ├── If conversation_id provided → Load from DB
   └── If null → Create new conversation

5. Load conversation history
   └── SELECT messages WHERE conversation_id ORDER BY created_at

6. Store user message in DB
   └── INSERT INTO messages (conversation_id, role, content)

7. Run agent with history
   └── await run_todo_agent(message, user_id, history)

8. Store agent response in DB
   └── INSERT INTO messages (conversation_id, role, content)

9. Return response
   └── { success: true, data: { response, conversation_id, message_id } }
```

---

## Agent Integration

### Running the Agent

```python
from src.agents import run_todo_agent

result = await run_todo_agent(
    user_message=request.message,
    user_id=user_id,
    conversation_history=history,  # List of {"role": str, "content": str}
    max_turns=10,
)

# result = {
#   "response": str,      # Agent's final output
#   "new_items": list,    # Conversation items generated
# }
```

### Conversation History Format

```python
history = [
    {"role": "user", "content": "Add a task to buy milk"},
    {"role": "assistant", "content": "Done! I've added 'buy milk' to your tasks."},
    {"role": "user", "content": "What tasks do I have?"},
]
```

---

## Error Handling

### Standard Error Response

```python
def create_error_response(
    error_code: str,
    message: str,
    conversation_id: int | None = None
) -> ChatResponse:
    return ChatResponse(
        success=False,
        data={
            "error": message,
            "error_code": error_code,
            "conversation_id": conversation_id,
        }
    )
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | No authorization token provided |
| `AUTH_INVALID` | Invalid or expired token |
| `ACCESS_DENIED` | User ID mismatch |
| `CONVERSATION_NOT_FOUND` | Conversation doesn't exist or not owned |
| `MESSAGE_EMPTY` | Empty message content |
| `AGENT_ERROR` | Agent execution failed |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Security Requirements

### User Isolation (CRITICAL)

```python
# ALWAYS verify user owns the conversation
if current_user["id"] != user_id:
    raise HTTPException(status_code=403, detail="Access denied")

# ALWAYS filter by user_id in queries
conversation = session.exec(
    select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id  # <-- CRITICAL
    )
).first()
```

### JWT Validation

```python
async def verify_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        return {"id": payload.get("sub")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## Performance Considerations

1. **Index user_id** - All conversation queries filter by user_id
2. **Index conversation_id** - Message queries filter by conversation_id
3. **Limit history** - Consider limiting conversation history to last N messages
4. **Async operations** - Agent runs async, don't block the event loop
5. **Connection pooling** - Use SQLModel connection pool for database

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [examples.md](./examples.md) - Complete code examples
- [openai-agents-setup](../openai-agents-setup/) - Agent configuration
- [fastmcp-server-setup](../fastmcp-server-setup/) - MCP server setup
