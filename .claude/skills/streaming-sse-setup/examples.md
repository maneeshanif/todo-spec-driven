# Streaming SSE Examples

Complete code examples for implementing SSE streaming in the Todo AI Chatbot.

---

## Complete FastAPI Streaming Endpoint

```python
# backend/src/routers/chat_streaming.py
"""
Streaming chat endpoint with full SSE support.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from src.database import get_session
from src.middleware.auth import verify_jwt
from src.models.conversation import Conversation
from src.models.message import Message
from src.schemas.chat import ChatRequest
from src.agents import run_todo_agent
from datetime import datetime
import json
import asyncio
import logging

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/stream")
async def chat_stream(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(verify_jwt),
):
    """
    Streaming chat endpoint using Server-Sent Events.

    Returns real-time text chunks as the AI generates the response.
    """
    # Security: Verify user
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get or create conversation
    conversation = await _get_or_create_conversation(
        session, user_id, request.message, request.conversation_id
    )

    # Load history
    history = await _load_conversation_history(session, conversation.id)

    # Store user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    session.add(user_msg)
    session.commit()

    async def event_generator():
        full_response = ""

        try:
            # Signal stream start
            yield _sse_event({"type": "start", "conversation_id": conversation.id})

            # Run agent and get response
            result = await run_todo_agent(
                user_message=request.message,
                user_id=user_id,
                conversation_history=history,
            )

            response_text = result["response"]
            full_response = response_text

            # Stream text in natural chunks
            chunk_size = 15
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield _sse_event({"type": "text", "content": chunk})
                await asyncio.sleep(0.03)  # Natural typing speed

            # Signal completion
            yield _sse_event({"type": "done"})

        except asyncio.CancelledError:
            logger.info("Client disconnected during streaming")
            return

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield _sse_event({
                "type": "error",
                "message": "Failed to process your request"
            })
            return

        finally:
            # Store assistant response if we have one
            if full_response:
                try:
                    assistant_msg = Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=full_response,
                    )
                    session.add(assistant_msg)
                    conversation.updated_at = datetime.utcnow()
                    session.add(conversation)
                    session.commit()
                except Exception as e:
                    logger.error(f"Failed to store response: {e}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


def _sse_event(data: dict) -> str:
    """Format data as SSE event."""
    return f"data: {json.dumps(data)}\n\n"


async def _get_or_create_conversation(
    session: Session,
    user_id: str,
    message: str,
    conversation_id: int | None,
) -> Conversation:
    """Get existing or create new conversation."""
    if conversation_id:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        ).first()
        if conversation:
            return conversation

    # Create new conversation
    title = message[:50] + "..." if len(message) > 50 else message
    conversation = Conversation(user_id=user_id, title=title)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


async def _load_conversation_history(
    session: Session,
    conversation_id: int,
) -> list[dict]:
    """Load conversation history from database."""
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
```

---

## Streaming with Tool Call Events

```python
# backend/src/routers/chat_streaming_tools.py
"""
Advanced streaming with tool call visibility.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from src.middleware.auth import verify_jwt
from src.agents.runner import run_todo_agent_with_events
from src.schemas.chat import ChatRequest
import json
import asyncio
import logging

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/stream-tools")
async def chat_stream_with_tools(
    user_id: str,
    request: ChatRequest,
    current_user: dict = Depends(verify_jwt),
):
    """
    Streaming endpoint that shows tool calls in real-time.
    """
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    async def event_generator():
        try:
            yield _sse({"type": "start"})

            async for event in run_todo_agent_with_events(
                user_message=request.message,
                user_id=user_id,
            ):
                yield _sse(event)

            yield _sse({"type": "done"})

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
```

```python
# backend/src/agents/runner.py (addition)
from typing import AsyncGenerator


async def run_todo_agent_with_events(
    user_message: str,
    user_id: str,
    conversation_history: list[dict] | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Run agent and yield events for streaming with tool visibility.
    """
    from agents import Runner
    from .todo_agent import todo_agent

    enhanced_message = f"[User ID: {user_id}]\n{user_message}"

    input_data = []
    if conversation_history:
        input_data.extend(conversation_history)
    input_data.append({"role": "user", "content": enhanced_message})

    # Thinking indicator
    yield {"type": "thinking", "message": "Processing your request..."}

    try:
        result = await Runner.run(
            todo_agent,
            input=input_data,
            max_turns=10,
        )

        # Check if tools were called
        for item in result.new_items:
            if hasattr(item, 'tool_calls') and item.tool_calls:
                for tool_call in item.tool_calls:
                    yield {
                        "type": "tool_call",
                        "name": tool_call.name,
                        "arguments": str(tool_call.arguments)[:100]
                    }

        # Stream the response
        response = result.final_output
        chunk_size = 20

        for i in range(0, len(response), chunk_size):
            yield {"type": "text", "content": response[i:i + chunk_size]}
            await asyncio.sleep(0.025)

    except Exception as e:
        yield {"type": "error", "message": f"Agent error: {str(e)}"}
```

---

## Frontend Streaming Component

```tsx
// frontend/src/components/chat/StreamingMessage.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StreamingMessageProps {
  userId: string;
  message: string;
  token: string;
  onComplete: (response: string, conversationId: number) => void;
}

interface StreamEvent {
  type: 'start' | 'text' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'thinking';
  content?: string;
  name?: string;
  message?: string;
  conversation_id?: number;
}

export function StreamingMessage({
  userId,
  message,
  token,
  onComplete,
}: StreamingMessageProps) {
  const [text, setText] = useState('');
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function startStream() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/${userId}/chat/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              onComplete(fullText, conversationIdRef.current || 0);
              return;
            }

            try {
              const event: StreamEvent = JSON.parse(data);

              switch (event.type) {
                case 'start':
                  if (event.conversation_id) {
                    conversationIdRef.current = event.conversation_id;
                  }
                  break;

                case 'text':
                  if (event.content) {
                    fullText += event.content;
                    setText(fullText);
                  }
                  break;

                case 'tool_call':
                  if (event.name) {
                    setToolCalls(prev => [...prev, event.name!]);
                  }
                  break;

                case 'error':
                  setError(event.message || 'An error occurred');
                  setIsStreaming(false);
                  break;

                case 'done':
                  setIsStreaming(false);
                  onComplete(fullText, conversationIdRef.current || 0);
                  break;
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }

        setIsStreaming(false);
        onComplete(fullText, conversationIdRef.current || 0);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          setIsStreaming(false);
        }
      }
    }

    startStream();

    return () => controller.abort();
  }, [userId, message, token, onComplete]);

  return (
    <div className="space-y-2">
      {/* Tool calls indicator */}
      {toolCalls.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {toolCalls.map((tool, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-muted rounded-full"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Message text */}
      <div className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        error && "text-destructive"
      )}>
        {error || text}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-foreground animate-pulse" />
        )}
      </div>
    </div>
  );
}
```

---

## Custom Chat Hook with Streaming

```typescript
// frontend/src/hooks/useChat.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface UseChatOptions {
  conversationId?: number;
  onConversationCreated?: (id: number) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(options.conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !token || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
            conversation_id: conversationId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) throw new Error('Request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const data = event.slice(6);

          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'start' && parsed.conversation_id) {
              setConversationId(parsed.conversation_id);
              options.onConversationCreated?.(parsed.conversation_id);
            }

            if (parsed.type === 'text' && parsed.content) {
              fullResponse += parsed.content;
              setMessages(prev => prev.map(msg =>
                msg.id === assistantId
                  ? { ...msg, content: fullResponse }
                  : msg
              ));
            }

            if (parsed.type === 'done' || parsed.type === 'error') {
              break;
            }
          } catch {}
        }
      }

      // Mark as complete
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: 'Failed to get response', isStreaming: false }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [user, token, isLoading, conversationId, options]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => prev.map(msg =>
      msg.isStreaming ? { ...msg, isStreaming: false } : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    stopGeneration,
    clearMessages,
  };
}
```

---

## See Also

- [SKILL.md](./SKILL.md) - Main streaming guide
- [chat-api-integration](../chat-api-integration/) - Chat endpoint setup
- [openai-chatkit-setup](../openai-chatkit-setup/) - ChatKit frontend
