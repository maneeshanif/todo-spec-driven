# Conversation Management Examples

Complete code examples for implementing conversation history management in the Todo AI Chatbot.

---

## Complete Chat Page with Sidebar

```tsx
// frontend/src/app/chat/page.tsx
'use client';

import { useEffect } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/authStore';
import { useConversationStore } from '@/stores/conversationStore';
import { EmptyChat } from '@/components/chat/EmptyChat';

export default function ChatPage() {
  const { user, token } = useAuthStore();
  const {
    currentConversation,
    messages,
    createConversation,
    selectConversation,
    addMessage,
    fetchConversations,
  } = useConversationStore();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/${user?.id}/chat/stream`,
      async getClientSecret(existing) {
        if (existing) return existing;
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        return (await res.json()).client_secret;
      },
    },
    // Pass conversation_id with each message
    requestBody: currentConversation ? {
      conversation_id: currentConversation.id,
    } : undefined,
    // When a new conversation is created from first message
    onConversationStart: async () => {
      if (!currentConversation) {
        const conv = await createConversation();
        return { conversation_id: conv.id };
      }
      return { conversation_id: currentConversation.id };
    },
  });

  // Show empty state when no conversation selected
  if (!currentConversation && messages.length === 0) {
    return <EmptyChat onStartChat={() => createConversation()} />;
  }

  return (
    <div className="h-full w-full">
      <ChatKit
        control={control}
        className="h-full w-full"
      />
    </div>
  );
}
```

---

## Empty Chat State

```tsx
// frontend/src/components/chat/EmptyChat.tsx
'use client';

import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Sparkles } from 'lucide-react';

interface EmptyChatProps {
  onStartChat: () => void;
}

export function EmptyChat({ onStartChat }: EmptyChatProps) {
  const suggestions = [
    "What tasks do I have for today?",
    "Add a task to buy groceries",
    "Show me my completed tasks",
    "Help me organize my tasks",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">How can I help you today?</h2>
          <p className="text-muted-foreground">
            Start a conversation to manage your tasks with AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((suggestion, i) => (
            <Button
              key={i}
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4"
              onClick={() => {
                onStartChat();
                // Could also trigger sending this message
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        <Button onClick={onStartChat} className="gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Start New Chat
        </Button>
      </div>
    </div>
  );
}
```

---

## Mobile-Responsive Sidebar

```tsx
// frontend/src/components/chat/MobileConversationSidebar.tsx
'use client';

import { useState } from 'react';
import { ConversationSidebar } from './ConversationSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function MobileConversationSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <ConversationSidebar onSelect={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
```

```tsx
// frontend/src/app/chat/layout.tsx (updated for mobile)
'use client';

import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { MobileConversationSidebar } from '@/components/chat/MobileConversationSidebar';
import { useAuthStore } from '@/stores/authStore';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ConversationSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden h-12 border-b flex items-center px-4">
          <MobileConversationSidebar />
          <span className="ml-2 font-semibold">Todo Chat</span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

## Conversation Search

```tsx
// frontend/src/components/chat/ConversationSearch.tsx
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';

export function ConversationSearch() {
  const [query, setQuery] = useState('');
  const { conversations, selectConversation } = useConversationStore();

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;

    const q = query.toLowerCase();
    return conversations.filter(conv =>
      conv.title?.toLowerCase().includes(q) ||
      conv.preview?.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  return (
    <div className="p-3 border-b">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="pl-8 pr-8"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-2.5"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {query && (
        <div className="mt-2 text-xs text-muted-foreground">
          {filteredConversations.length} result(s)
        </div>
      )}
    </div>
  );
}
```

---

## Auto-Generate Conversation Title

```python
# backend/src/services/conversation_service.py
"""
Service for conversation management including auto-title generation.
"""
from sqlmodel import Session, select
from src.models.conversation import Conversation
from src.models.message import Message
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConversationService:
    def __init__(self, session: Session):
        self.session = session

    async def auto_generate_title(
        self,
        conversation_id: int,
        user_message: str,
    ) -> str:
        """
        Generate a title for a conversation based on the first message.
        Uses simple heuristics; could be enhanced with AI summarization.
        """
        conversation = self.session.exec(
            select(Conversation).where(Conversation.id == conversation_id)
        ).first()

        if not conversation:
            return ""

        # Only auto-title if it's the first message and no custom title
        if conversation.title and not conversation.title.startswith("New"):
            return conversation.title

        # Simple title generation: first few words of the message
        words = user_message.split()[:6]
        title = " ".join(words)
        if len(user_message.split()) > 6:
            title += "..."

        # Clean up
        title = title.strip()[:50]

        # Update conversation
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        self.session.add(conversation)
        self.session.commit()

        return title

    async def get_conversation_stats(self, user_id: str) -> dict:
        """Get conversation statistics for a user."""
        conversations = self.session.exec(
            select(Conversation).where(Conversation.user_id == user_id)
        ).all()

        total_messages = 0
        for conv in conversations:
            total_messages += len(conv.messages) if conv.messages else 0

        return {
            "total_conversations": len(conversations),
            "total_messages": total_messages,
        }
```

---

## Conversation Export

```typescript
// frontend/src/lib/exportConversation.ts
export function exportConversation(
  conversation: { title: string | null; messages: Array<{ role: string; content: string; created_at: string }> },
  format: 'txt' | 'json' | 'md' = 'md'
): string {
  const title = conversation.title || 'Chat Export';

  if (format === 'json') {
    return JSON.stringify(conversation, null, 2);
  }

  if (format === 'txt') {
    let output = `${title}\n${'='.repeat(title.length)}\n\n`;
    for (const msg of conversation.messages) {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      output += `[${role}] ${msg.content}\n\n`;
    }
    return output;
  }

  // Markdown format
  let output = `# ${title}\n\n`;
  for (const msg of conversation.messages) {
    const role = msg.role === 'user' ? '**You**' : '**Assistant**';
    output += `${role}\n\n${msg.content}\n\n---\n\n`;
  }
  return output;
}

export function downloadConversation(
  conversation: { title: string | null; messages: Array<{ role: string; content: string; created_at: string }> },
  format: 'txt' | 'json' | 'md' = 'md'
) {
  const content = exportConversation(conversation, format);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversation.title || 'chat'}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
```

```tsx
// Usage in dropdown menu
<DropdownMenuItem onClick={() => downloadConversation(conversation, 'md')}>
  <Download className="h-4 w-4 mr-2" />
  Export as Markdown
</DropdownMenuItem>
```

---

## Keyboard Shortcuts

```tsx
// frontend/src/hooks/useConversationShortcuts.ts
'use client';

import { useEffect } from 'react';
import { useConversationStore } from '@/stores/conversationStore';

export function useConversationShortcuts() {
  const {
    conversations,
    currentConversation,
    selectConversation,
    createConversation,
    clearCurrentConversation,
  } = useConversationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        clearCurrentConversation();
        createConversation();
      }

      // Cmd/Ctrl + Up/Down: Navigate conversations
      if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const currentIndex = currentConversation
          ? conversations.findIndex(c => c.id === currentConversation.id)
          : -1;

        let newIndex: number;
        if (e.key === 'ArrowUp') {
          newIndex = currentIndex <= 0 ? conversations.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= conversations.length - 1 ? 0 : currentIndex + 1;
        }

        if (conversations[newIndex]) {
          selectConversation(conversations[newIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations, currentConversation, selectConversation, createConversation, clearCurrentConversation]);
}
```

---

## Complete API Client

```typescript
// frontend/src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## See Also

- [SKILL.md](./SKILL.md) - Main conversation management guide
- [streaming-sse-setup](../streaming-sse-setup/) - Real-time streaming
- [openai-chatkit-setup](../openai-chatkit-setup/) - ChatKit UI
