---
name: streaming-sse-setup
description: Implement Server-Sent Events (SSE) streaming for real-time AI chat responses. Build streaming endpoints in FastAPI and handle streaming in ChatKit frontend. Use when implementing real-time chat streaming for Phase 3.
allowed-tools: Bash, Write, Read, Edit, Glob
---

# Streaming SSE Setup

Quick reference for implementing Server-Sent Events (SSE) streaming for real-time AI chat responses in the Todo AI Chatbot Phase 3.

---

## Overview

SSE (Server-Sent Events) enables real-time, one-way streaming from server to client. This is essential for:
- **Natural chat experience** - Text appears as it's generated
- **Reduced perceived latency** - Users see responses immediately
- **ChatKit compatibility** - OpenAI ChatKit expects SSE format

**ChatKit Reference**:
- [OpenAI ChatKit Docs](https://platform.openai.com/docs/guides/chatkit)
- [Domain Allowlist](https://platform.openai.com/settings/organization/security/domain-allowlist) - Required for production

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend                          │
│                   (ChatKit + SSE Handler)                   │
└────────────────────────────┬────────────────────────────────┘
                             │ EventSource / fetch
                             │ Content-Type: text/event-stream
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
├─────────────────────────────────────────────────────────────┤
│  POST /api/{user_id}/chat                                   │
│  ├─ Validate request                                        │
│  ├─ Run AI agent (async generator)                          │
│  └─ Stream response chunks via SSE                          │
│                                                              │
│  Response: StreamingResponse(media_type="text/event-stream")│
└─────────────────────────────────────────────────────────────┘
```

---

## SSE Event Format

### Standard SSE Format

```
data: {"type": "text", "content": "Hello"}\n\n
data: {"type": "text", "content": " world"}\n\n
data: {"type": "done"}\n\n
```

**Rules:**
- Each event starts with `data: `
- Events end with `\n\n` (double newline)
- JSON payloads for structured data
- `[DONE]` or `{"type": "done"}` signals completion

### Event Types for Chat

| Event Type | Purpose | Example |
|------------|---------|---------|
| `text` | Text chunk | `{"type": "text", "content": "Hello"}` |
| `tool_call` | Agent calling a tool | `{"type": "tool_call", "name": "add_task"}` |
| `tool_result` | Tool execution result | `{"type": "tool_result", "data": {...}}` |
| `error` | Error occurred | `{"type": "error", "message": "..."}` |
| `done` | Stream complete | `{"type": "done"}` |

---

## FastAPI Implementation

### Basic Streaming Endpoint

```python
# backend/src/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from src.database import get_session
from src.middleware.auth import verify_jwt
from src.schemas.chat import ChatRequest
from src.agents import run_todo_agent_streaming
import json
import asyncio

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """
    Streaming chat endpoint using Server-Sent Events.
    """
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    async def event_generator():
        try:
            # Stream agent response
            async for chunk in run_todo_agent_streaming(
                user_message=request.message,
                user_id=user_id,
            ):
                # Format as SSE event
                event_data = json.dumps(chunk)
                yield f"data: {event_data}\n\n"

            # Signal completion
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            error_event = json.dumps({
                "type": "error",
                "message": "An error occurred processing your request"
            })
            yield f"data: {error_event}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

### Streaming Agent Runner

```python
# backend/src/agents/runner.py
from typing import AsyncGenerator
from agents import Runner
from .todo_agent import todo_agent
from .hooks import TodoRunHooks
import logging

logger = logging.getLogger(__name__)


async def run_todo_agent_streaming(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Execute agent and yield response chunks for streaming.
    """
    enhanced_message = f"[User ID: {user_id}]\n{user_message}"

    input_messages = []
    if conversation_history:
        input_messages.extend([
            {"role": msg["role"], "content": msg["content"]}
            for msg in conversation_history
        ])
    input_messages.append({"role": "user", "content": enhanced_message})

    input_data = input_messages if conversation_history else enhanced_message

    try:
        # Signal start
        yield {"type": "start", "agent": "TodoAssistant"}

        # Run agent
        result = await Runner.run(
            todo_agent,
            input=input_data,
            hooks=TodoRunHooks(),
            max_turns=10,
        )

        response_text = result.final_output

        # Stream text in chunks for natural feel
        chunk_size = 20  # characters per chunk
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield {"type": "text", "content": chunk}
            # Small delay for natural streaming effect
            await asyncio.sleep(0.02)

    except Exception as e:
        logger.error(f"Streaming agent error: {e}")
        yield {"type": "error", "message": str(e)}
```

### Streaming with Tool Calls

```python
# backend/src/agents/runner.py
async def run_todo_agent_streaming_with_tools(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream agent response including tool call events.
    """
    from agents import Runner, RunConfig

    enhanced_message = f"[User ID: {user_id}]\n{user_message}"

    # Build input
    input_data = []
    if conversation_history:
        input_data.extend(conversation_history)
    input_data.append({"role": "user", "content": enhanced_message})

    try:
        yield {"type": "start"}

        # Use streaming run
        async with Runner.run_streamed(
            todo_agent,
            input=input_data,
        ) as stream:
            async for event in stream:
                if event.type == "raw_model_stream_event":
                    # Text delta from model
                    if hasattr(event.data, "delta") and event.data.delta:
                        yield {"type": "text", "content": event.data.delta}

                elif event.type == "tool_call_start":
                    yield {
                        "type": "tool_call",
                        "name": event.tool.name,
                        "status": "started"
                    }

                elif event.type == "tool_call_end":
                    yield {
                        "type": "tool_result",
                        "name": event.tool.name,
                        "result": str(event.result)[:200]  # Truncate
                    }

        yield {"type": "done"}

    except Exception as e:
        yield {"type": "error", "message": str(e)}
```

---

## Frontend SSE Handling

### Using fetch with ReadableStream

```typescript
// frontend/src/lib/streaming.ts
export async function streamChat(
  userId: string,
  message: string,
  token: string,
  onChunk: (chunk: StreamChunk) => void,
  onDone: () => void,
  onError: (error: Error) => void,
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/${userId}/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete event in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            if (chunk.type === 'done') {
              onDone();
              return;
            }
            onChunk(chunk);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Types
export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'start';
  content?: string;
  name?: string;
  result?: string;
  message?: string;
}
```

### React Hook for Streaming

```typescript
// frontend/src/hooks/useStreamingChat.ts
import { useState, useCallback, useRef } from 'react';
import { streamChat, StreamChunk } from '@/lib/streaming';
import { useAuthStore } from '@/stores/authStore';

export function useStreamingChat() {
  const { user, token } = useAuthStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !token) return;

    setIsStreaming(true);
    setStreamedText('');
    setToolCalls([]);

    try {
      await streamChat(
        user.id,
        message,
        token,
        (chunk: StreamChunk) => {
          if (chunk.type === 'text' && chunk.content) {
            setStreamedText(prev => prev + chunk.content);
          } else if (chunk.type === 'tool_call' && chunk.name) {
            setToolCalls(prev => [...prev, chunk.name!]);
          }
        },
        () => setIsStreaming(false),
        (error) => {
          console.error('Stream error:', error);
          setIsStreaming(false);
        }
      );
    } catch (error) {
      setIsStreaming(false);
    }
  }, [user, token]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    cancel,
    isStreaming,
    streamedText,
    toolCalls,
  };
}
```

---

## ChatKit SSE Integration

ChatKit handles SSE automatically when you configure the API URL:

```tsx
// ChatKit expects SSE responses from your endpoint
const { control } = useChatKit({
  api: {
    url: `${process.env.NEXT_PUBLIC_API_URL}/api/${user?.id}/chat/stream`,
  },
});
```

### Expected SSE Response Format for ChatKit

```python
# Your endpoint should return events like:
yield f"data: {json.dumps({'type': 'text', 'content': 'Hello'})}\n\n"
yield f"data: {json.dumps({'type': 'text', 'content': ' there!'})}\n\n"
yield "data: [DONE]\n\n"
```

---

## Error Handling

### Graceful Error Streaming

```python
async def event_generator():
    try:
        async for chunk in run_agent_streaming(...):
            yield f"data: {json.dumps(chunk)}\n\n"
    except asyncio.CancelledError:
        # Client disconnected
        pass
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': 'Processing failed'})}\n\n"
    finally:
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
```

### Client-Side Error Recovery

```typescript
const sendMessage = async (message: string) => {
  try {
    await streamChat(userId, message, token, onChunk, onDone, onError);
  } catch (error) {
    // Fallback to non-streaming
    const response = await fetch(`/api/${userId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    setStreamedText(data.response);
  }
};
```

---

## Performance Tips

1. **Chunk Size** - Balance between smoothness (small chunks) and efficiency (large chunks)
2. **Disable Buffering** - Use `X-Accel-Buffering: no` header for nginx
3. **Connection Keep-Alive** - Maintain connection for multiple events
4. **Timeout Handling** - Implement heartbeat for long-running streams

```python
async def event_generator_with_heartbeat():
    last_event = asyncio.get_event_loop().time()

    async for chunk in run_agent_streaming(...):
        yield f"data: {json.dumps(chunk)}\n\n"
        last_event = asyncio.get_event_loop().time()

        # Send heartbeat if no events for 15 seconds
        if asyncio.get_event_loop().time() - last_event > 15:
            yield ": heartbeat\n\n"  # SSE comment (ignored by client)
```

---

## Verification Checklist

- [ ] FastAPI endpoint returns `StreamingResponse`
- [ ] Media type is `text/event-stream`
- [ ] Events follow SSE format (`data: ...\n\n`)
- [ ] Stream ends with done event
- [ ] Error events have proper format
- [ ] Frontend handles all event types
- [ ] ChatKit receives and displays streamed text
- [ ] No buffering issues (check nginx config)

---

## Environment Variables

```env
# No additional env vars needed for streaming
# Uses existing configuration from Phase 2/3
```

---

## See Also

- [chat-api-integration](../chat-api-integration/) - Chat endpoint setup
- [openai-chatkit-setup](../openai-chatkit-setup/) - ChatKit frontend
- [openai-agents-setup](../openai-agents-setup/) - Agent configuration
