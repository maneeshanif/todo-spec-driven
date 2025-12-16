# OpenAI ChatKit Examples

Complete code examples for implementing ChatKit in the Todo AI Chatbot.

**Official Documentation**: [openai.github.io/chatkit-js](https://openai.github.io/chatkit-js/)

---

## Complete Chat Page Implementation

```tsx
// frontend/src/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { control } = useChatKit({
    api: {
      // For self-hosted backend
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/${user?.id}/chat`,

      // Token refresh handler
      async getClientSecret(existingSecret) {
        if (existingSecret) return existingSecret;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chatkit/session`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: user?.id }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get session token');
        }

        const data = await response.json();
        return data.client_secret;
      },
    },
  });

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <main className="h-screen bg-background">
      <div className="h-full max-w-4xl mx-auto">
        <ChatKit
          control={control}
          className="h-full w-full"
        />
      </div>
    </main>
  );
}
```

---

## ChatKit with Custom Header

```tsx
// frontend/src/components/chat/ChatContainer.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { MessageSquare, Settings, X } from 'lucide-react';

interface ChatContainerProps {
  onClose?: () => void;
}

export function ChatContainer({ onClose }: ChatContainerProps) {
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

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border shadow-lg">
      {/* Custom Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Todo Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ChatKit */}
      <div className="flex-1 overflow-hidden">
        <ChatKit
          control={control}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
```

---

## Floating Chat Widget

```tsx
// frontend/src/components/chat/FloatingChat.tsx
'use client';

import { useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, token, isAuthenticated } = useAuthStore();

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

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] z-50 shadow-2xl rounded-lg overflow-hidden border bg-background">
          <ChatKit
            control={control}
            className="h-full w-full"
          />
        </div>
      )}
    </>
  );
}
```

---

## Backend Session Endpoint (FastAPI)

```python
# backend/src/routers/chatkit.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.middleware.auth import verify_jwt
from src.config import settings
import httpx
import logging

router = APIRouter(prefix="/api/chatkit", tags=["chatkit"])
logger = logging.getLogger(__name__)


class SessionRequest(BaseModel):
    user_id: str | None = None


class SessionResponse(BaseModel):
    client_secret: str


@router.post("/session", response_model=SessionResponse)
async def create_chatkit_session(
    request: SessionRequest,
    current_user: dict = Depends(verify_jwt),
):
    """
    Generate a ChatKit client session token.

    This endpoint creates a session token that allows the frontend
    ChatKit component to communicate with your chat backend.
    """
    user_id = request.user_id or current_user["id"]

    # Verify user owns this request
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # For OpenAI-hosted ChatKit, use the OpenAI SDK
        # from openai import OpenAI
        # client = OpenAI(api_key=settings.OPENAI_API_KEY)
        # session = client.chatkit.sessions.create(
        #     deployment_id=settings.CHATKIT_DEPLOYMENT_ID,
        #     user_id=user_id,
        # )
        # return SessionResponse(client_secret=session.client_secret)

        # For self-hosted, generate a simple session token
        import secrets
        import jwt
        from datetime import datetime, timedelta

        session_token = jwt.encode(
            {
                "user_id": user_id,
                "exp": datetime.utcnow() + timedelta(hours=1),
                "jti": secrets.token_urlsafe(16),
            },
            settings.BETTER_AUTH_SECRET,
            algorithm="HS256"
        )

        return SessionResponse(client_secret=session_token)

    except Exception as e:
        logger.error(f"Failed to create ChatKit session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")
```

---

## Self-Hosted Message Handler

```python
# backend/src/routers/chatkit_message.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.middleware.auth import verify_jwt
from src.agents import run_todo_agent
import json
import logging

router = APIRouter(prefix="/api/{user_id}/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    message: str
    conversation_id: int | None = None


@router.post("/")
async def handle_chat_message(
    user_id: str,
    request: Request,
    current_user: dict = Depends(verify_jwt),
):
    """
    Handle chat messages for ChatKit self-hosted integration.
    Streams the response using Server-Sent Events (SSE).
    """
    # Verify user
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Parse request body
    body = await request.json()
    message = body.get("message", "")
    conversation_id = body.get("conversation_id")

    async def generate():
        try:
            # Run the agent
            result = await run_todo_agent(
                user_message=message,
                user_id=user_id,
                conversation_history=[],  # Load from DB in real implementation
            )

            response_text = result["response"]

            # Stream the response in chunks for better UX
            chunk_size = 50  # characters per chunk
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

            # Signal completion
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Chat error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to process message'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

---

## Dark Mode Support

```tsx
// frontend/src/components/chat/ThemedChatKit.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/authStore';

export function ThemedChatKit() {
  const { theme } = useTheme();
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

  const isDark = theme === 'dark';

  return (
    <ChatKit
      control={control}
      className={`
        h-full w-full
        ${isDark ? `
          [--chatkit-bg:hsl(var(--background))]
          [--chatkit-text:hsl(var(--foreground))]
          [--chatkit-primary:hsl(var(--primary))]
          [--chatkit-border:hsl(var(--border))]
          [--chatkit-input-bg:hsl(var(--muted))]
          [--chatkit-message-user:hsl(var(--primary))]
          [--chatkit-message-assistant:hsl(var(--muted))]
        ` : `
          [--chatkit-bg:hsl(var(--background))]
          [--chatkit-text:hsl(var(--foreground))]
          [--chatkit-primary:hsl(var(--primary))]
        `}
      `}
    />
  );
}
```

---

## Mobile Responsive Layout

```tsx
// frontend/src/app/chat/layout.tsx
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full">
      {/* Mobile: Full screen */}
      {/* Desktop: Centered with max width */}
      <div className="h-full w-full md:max-w-3xl md:mx-auto md:py-4">
        <div className="h-full md:rounded-lg md:border md:shadow-lg overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

## Registering Routers in main.py

```python
# backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import tasks, chat, chatkit

app = FastAPI(title="Todo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(chat.router)
app.include_router(chatkit.router)
```

---

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
OPENAI_API_KEY=sk-...  # If using OpenAI-hosted ChatKit
CHATKIT_DEPLOYMENT_ID=...  # If using OpenAI-hosted ChatKit
BETTER_AUTH_SECRET=your-auth-secret
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [REFERENCE.md](./REFERENCE.md) - API reference
- [chat-api-integration](../chat-api-integration/) - Backend chat endpoint
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
