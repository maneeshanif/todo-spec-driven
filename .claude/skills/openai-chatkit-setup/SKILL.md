---
name: openai-chatkit-setup
description: Set up OpenAI ChatKit for frontend chat interface. Build production-ready chat UI with streaming, widgets, and file handling. Use when implementing the chat UI for Phase 3.
allowed-tools: Bash, Write, Read, Edit, Glob
---

# OpenAI ChatKit Setup

Quick reference for setting up OpenAI ChatKit for the Todo AI Chatbot Phase 3.

**Official Documentation**:
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
- [GitHub Repository](https://github.com/openai/chatkit-js)
- [Starter App](https://github.com/openai/openai-chatkit-starter-app)

---

## Overview

ChatKit is a batteries-included framework for building high-quality, AI-powered chat experiences. Key features:

- **Customizable UI** - Integrates seamlessly with your app
- **Streaming responses** - Natural, real-time conversations
- **Tool integration** - Display agent actions and reasoning
- **Interactive widgets** - Rich content in chat messages
- **File handling** - Upload and attachment support
- **Thread management** - Organize conversations

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  ChatKit        │     │  useChatKit Hook            │   │
│  │  Component      │◄───▶│  - control                  │   │
│  │  <ChatKit />    │     │  - getClientSecret          │   │
│  └─────────────────┘     └──────────────┬──────────────┘   │
│                                         │                   │
│                          ┌──────────────▼──────────────┐   │
│                          │  Session Token Endpoint     │   │
│                          │  /api/chatkit/session       │   │
│                          └──────────────┬──────────────┘   │
└─────────────────────────────────────────┼───────────────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │  FastAPI Backend              │
                          │  - Generate client tokens     │
                          │  - Handle chat messages       │
                          │  - Run AI agent               │
                          └───────────────────────────────┘
```

---

## Installation

### React (Recommended)

```bash
cd frontend
npm install @openai/chatkit-react
```

### Vanilla JavaScript (CDN)

```html
<script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" async></script>
```

---

## Quick Start

### 1. Create Chat Page

```tsx
// frontend/src/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/authStore';

export default function ChatPage() {
  const { user, token } = useAuthStore();

  const { control } = useChatKit({
    api: {
      async getClientSecret(existingSecret) {
        // Fetch session token from your backend
        const response = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user?.id }),
        });
        const data = await response.json();
        return data.client_secret;
      },
    },
  });

  return (
    <div className="h-screen w-full">
      <ChatKit
        control={control}
        className="h-full w-full max-w-4xl mx-auto"
      />
    </div>
  );
}
```

### 2. Create Session Endpoint (Backend)

```python
# backend/src/routers/chatkit.py
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from src.middleware.auth import verify_jwt
from src.config import settings

router = APIRouter(prefix="/api/chatkit", tags=["chatkit"])

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


@router.post("/session")
async def create_chatkit_session(
    current_user: dict = Depends(verify_jwt),
):
    """
    Generate a ChatKit client session token.
    This token allows the frontend to communicate with ChatKit.
    """
    try:
        session = openai_client.chatkit.sessions.create(
            # Configure your ChatKit deployment settings
            deployment_id=settings.CHATKIT_DEPLOYMENT_ID,
            user_id=current_user["id"],
        )
        return {"client_secret": session.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create session")
```

---

## Self-Hosted Backend Integration

For using ChatKit with your own backend (not OpenAI-hosted), use the ChatKit Python SDK:

### Backend Setup

```python
# backend/src/chatkit_handler.py
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from src.agents import run_todo_agent
import json

router = APIRouter(prefix="/api/chatkit", tags=["chatkit"])


@router.post("/message")
async def handle_chatkit_message(request: Request):
    """
    Handle messages from ChatKit frontend.
    Runs the agent and streams the response back.
    """
    data = await request.json()
    user_id = data.get("user_id")
    message = data.get("message")
    conversation_id = data.get("conversation_id")

    async def generate():
        result = await run_todo_agent(
            user_message=message,
            user_id=user_id,
            conversation_history=[],  # Load from DB
        )

        # Stream response in ChatKit format
        yield json.dumps({
            "type": "message",
            "content": result["response"],
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### Frontend Configuration for Self-Hosted

```tsx
const { control } = useChatKit({
  api: {
    url: 'http://localhost:8000/api/chatkit/message',
    // No domainKey needed for self-hosted
  },
});
```

---

## Styling & Customization

### Basic Styling

```tsx
<ChatKit
  control={control}
  className="h-[600px] w-[400px] rounded-lg border shadow-lg"
/>
```

### Custom Theme with Tailwind

```tsx
<ChatKit
  control={control}
  className="
    h-full w-full
    [--chatkit-bg:theme(colors.background)]
    [--chatkit-text:theme(colors.foreground)]
    [--chatkit-primary:theme(colors.primary.DEFAULT)]
    [--chatkit-border:theme(colors.border)]
  "
/>
```

### Dark Mode Support

```tsx
<ChatKit
  control={control}
  className={`
    h-full w-full
    ${isDarkMode ? 'dark' : ''}
  `}
/>
```

---

## Widget Integration

ChatKit supports rich widgets in messages:

### Text Widget

```json
{
  "type": "text",
  "content": "Here are your tasks for today:"
}
```

### List Widget

```json
{
  "type": "list",
  "items": [
    { "title": "Buy groceries", "subtitle": "Pending" },
    { "title": "Call doctor", "subtitle": "Completed" }
  ]
}
```

### Card Widget

```json
{
  "type": "card",
  "title": "Task Created",
  "description": "Your task 'Buy groceries' has been added.",
  "icon": "check"
}
```

---

## Project Structure

```
frontend/src/
├── app/
│   └── chat/
│       └── page.tsx              # ChatKit page
│
├── components/
│   └── chat/
│       └── ChatContainer.tsx     # ChatKit wrapper (optional)
│
└── lib/
    └── chatkit.ts                # ChatKit utilities
```

---

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
OPENAI_API_KEY=sk-...
CHATKIT_DEPLOYMENT_ID=your-deployment-id  # If using OpenAI-hosted
```

---

## Verification Checklist

- [ ] `@openai/chatkit-react` package installed
- [ ] ChatKit component renders correctly
- [ ] `useChatKit` hook configured with API
- [ ] Session token endpoint working (if using OpenAI-hosted)
- [ ] Self-hosted message endpoint working (if self-hosted)
- [ ] Styling matches app theme
- [ ] Dark mode works correctly
- [ ] Mobile responsive

---

## See Also

- [REFERENCE.md](./REFERENCE.md) - Detailed API reference
- [examples.md](./examples.md) - Complete code examples
- [ChatKit.js Docs](https://openai.github.io/chatkit-js/)
- [GitHub Repository](https://github.com/openai/chatkit-js)
- [Starter App](https://github.com/openai/openai-chatkit-starter-app)
