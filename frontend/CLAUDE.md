# Frontend Guidelines - Todo AI Chatbot Phase 3

**Project**: Todo AI Chatbot Application - Frontend
**Phase**: Phase 3 - AI-Powered Todo Chatbot
**Technology**: Next.js 16+ + ChatKit + Zustand + Axios + SSE

---

## 🚨 ABSOLUTE REQUIREMENTS - READ FIRST

### ⛔ STOP! Before ANY Frontend Work

**You MUST complete these steps IN ORDER:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: READ ROOT CLAUDE.md                                            │
│  → ../CLAUDE.md contains project-wide rules                             │
│  → All rules from root apply here                                       │
│                                                                         │
│  STEP 2: INVOKE SKILL (MANDATORY)                                       │
│  → Skill(skill: "matching-skill-name")                                  │
│  → See Skill Matching Table below                                       │
│                                                                         │
│  STEP 3: FETCH CONTEXT7 DOCS (MANDATORY)                                │
│  → mcp__context7__resolve-library-id                                    │
│  → mcp__context7__get-library-docs                                      │
│                                                                         │
│  STEP 4: DELEGATE TO SUBAGENT (MANDATORY)                               │
│  → Task(subagent_type: "agent-name", prompt: "...")                     │
│  → NEVER write frontend code directly                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**VIOLATION OF THESE STEPS IS FORBIDDEN. NO EXCEPTIONS.**

---

## Coupling with Root CLAUDE.md

This file extends the root `../CLAUDE.md`. **ALWAYS read the root file first** for:
- Project overview and phase information
- Available agents and skills
- Spec-driven development workflow
- PHR and ADR requirements

**Parent Files (Read in Order):**
1. `../CLAUDE.md` - Root project rules
2. `../constitution-prompt-phase-3.md` - Phase 3 constitution
3. `../spec-prompt-phase-3.md` - Phase 3 specifications
4. `../plan-prompt-phase-3.md` - Phase 3 implementation plan

---

## 🎯 FRONTEND SKILL INVOCATION - MANDATORY

### Skill Matching Table - USE FOR EVERY FRONTEND TASK

| When User Asks About... | INVOKE SKILL | Then Use Agent |
|-------------------------|--------------|----------------|
| Next.js setup, project init, pages | `nextjs-setup` | `frontend-ui-builder` |
| Shadcn/ui components, button, card | `shadcn-ui-setup` | `frontend-ui-builder` |
| ChatKit setup, chat components | `openai-chatkit-setup` | `chatbot-ui-builder` |
| SSE streaming, real-time UI | `streaming-sse-setup` | `chatbot-ui-builder` |
| Conversation history, chat sidebar | `conversation-management` | `chatbot-ui-builder` |
| Authentication UI, login, signup | `better-auth-integration` | `frontend-ui-builder` |

### Frontend Skills Reference

| Skill Name | Path | Purpose |
|------------|------|---------|
| `nextjs-setup` | `../.claude/skills/nextjs-setup/SKILL.md` | Next.js project initialization |
| `shadcn-ui-setup` | `../.claude/skills/shadcn-ui-setup/SKILL.md` | Shadcn/ui component setup |
| `openai-chatkit-setup` | `../.claude/skills/openai-chatkit-setup/SKILL.md` | ChatKit React UI |
| `streaming-sse-setup` | `../.claude/skills/streaming-sse-setup/SKILL.md` | SSE streaming client |
| `conversation-management` | `../.claude/skills/conversation-management/SKILL.md` | Conversation history UI |
| `better-auth-integration` | `../.claude/skills/better-auth-integration/SKILL.md` | Better Auth frontend |

---

## 🤖 FRONTEND AGENT DELEGATION - MANDATORY

### ABSOLUTE RULE: NEVER WRITE FRONTEND CODE DIRECTLY

**All frontend code generation MUST be delegated to a specialized subagent:**

| Code Type | DELEGATE TO AGENT | subagent_type |
|-----------|-------------------|---------------|
| React components | Frontend UI Builder | `frontend-ui-builder` |
| Next.js pages, layouts | Frontend UI Builder | `frontend-ui-builder` |
| Zustand stores | Frontend UI Builder | `frontend-ui-builder` |
| Axios API modules | Frontend UI Builder | `frontend-ui-builder` |
| React hooks | Frontend UI Builder | `frontend-ui-builder` |
| ChatKit components | Chatbot UI Builder | `chatbot-ui-builder` |
| Chat interface, messages | Chatbot UI Builder | `chatbot-ui-builder` |
| Conversation sidebar | Chatbot UI Builder | `chatbot-ui-builder` |
| SSE client components | Chatbot UI Builder | `chatbot-ui-builder` |
| UI/UX wireframes, design | UI/UX Designer | `ui-ux-designer` |

### Agent Invocation Pattern

```
Task(
  subagent_type: "frontend-ui-builder",
  prompt: "Create a React component for...",
  description: "Create UI component"
)
```

---

## 🔍 CONTEXT7 MCP - MANDATORY DOCUMENTATION LOOKUP

### BEFORE Writing ANY Frontend Code

**You MUST fetch latest docs using Context7:**

```
# Phase 2 (Foundation)
1. mcp__context7__resolve-library-id(libraryName: "nextjs")
2. mcp__context7__resolve-library-id(libraryName: "zustand")
3. mcp__context7__resolve-library-id(libraryName: "axios")
4. mcp__context7__resolve-library-id(libraryName: "shadcn-ui")
5. mcp__context7__resolve-library-id(libraryName: "framer-motion")

# Phase 3 (AI Chatbot)
6. mcp__context7__resolve-library-id(libraryName: "openai-chatkit")
7. mcp__context7__resolve-library-id(libraryName: "eventsource")
```

**NEVER ASSUME API PATTERNS - ALWAYS VERIFY WITH CONTEXT7!**

---

## 📋 SPEC READING - MANDATORY

### Required Spec Reading Before Implementation

| Spec | Path | Purpose |
|------|------|--------|
| UI Components | `../specs/ui/components.md` | Component library |
| UI Pages | `../specs/ui/pages.md` | Page structure |
| Chat Components | `../specs/ui/chat-components.md` | Chat UI specs |
| Chatbot Feature | `../specs/features/chatbot.md` | AI chatbot requirements |

---

## 🔄 COMPLETE FRONTEND WORKFLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANDATORY FRONTEND WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. IDENTIFY TASK TYPE                                                  │
│     └─ Component? Page? Store? Hook? Chat UI?                           │
│                                                                         │
│  2. INVOKE SKILL                                                        │
│     └─ Skill(skill: "matching-skill-name")                              │
│     └─ Read examples and patterns from SKILL.md                         │
│                                                                         │
│  3. FETCH CONTEXT7 DOCS                                                 │
│     └─ Fetch docs for Next.js, Zustand, Shadcn, etc.                    │
│     └─ For chat: fetch ChatKit, SSE docs                                │
│                                                                         │
│  4. READ RELEVANT SPECS                                                 │
│     └─ UI spec, component spec, feature spec                            │
│                                                                         │
│  5. DELEGATE TO SUBAGENT                                                │
│     └─ Task(subagent_type: "frontend-ui-builder", prompt: "...")        │
│     └─ Or Task(subagent_type: "chatbot-ui-builder", prompt: "...")      │
│                                                                         │
│  6. VERIFY & TEST                                                       │
│     └─ Check TypeScript types, test component                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Example: User asks "Create a dashboard component"

```
1. IDENTIFY: React component
2. SKILLS:
   - Skill(skill: "nextjs-setup")
   - Skill(skill: "shadcn-ui-setup")
3. CONTEXT7: Fetch Next.js, Shadcn docs
4. SPECS: Read specs/ui/components.md
5. DELEGATE: Task(subagent_type: "frontend-ui-builder", prompt: "...")
```

### Example: User asks "Build chat interface with streaming"

```
1. IDENTIFY: Chat UI + SSE streaming
2. SKILLS:
   - Skill(skill: "openai-chatkit-setup")
   - Skill(skill: "streaming-sse-setup")
   - Skill(skill: "conversation-management")
3. CONTEXT7: Fetch ChatKit, SSE docs
4. SPECS: Read specs/ui/chat-components.md
5. DELEGATE: Task(subagent_type: "chatbot-ui-builder", prompt: "...")
```

---

## Technology Stack

### Phase 2 (Foundation)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0+ | React framework |
| React | 19.0+ | UI library |
| TypeScript | 5.0+ | Type safety |
| Tailwind CSS | 4.0 | Styling |
| Shadcn/ui | Latest | Component library |
| Zustand | 5.0+ | State management (MANDATORY) |
| Axios | 1.7+ | HTTP client (MANDATORY) |
| Framer Motion | 12.0+ | Animations |
| React Hook Form | 7.0+ | Form handling |
| Zod | 3.0+ | Validation |

### Phase 3 (AI Chatbot)

| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI ChatKit | Latest | Chat UI components (verify from https://platform.openai.com/docs/guides/chatkit) |
| eventsource-parser | Latest | SSE parsing |

**ChatKit Setup Notes:**
- Official docs: https://platform.openai.com/docs/guides/chatkit
- Domain allowlist (production): https://platform.openai.com/settings/organization/security/domain-allowlist
- Environment variable: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`
- Note: localhost works without domain allowlist configuration

---

## Project Structure (Phase 3)

```
frontend/
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx           # Login page
│   │   └── signup/page.tsx          # Signup page
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Dashboard layout with sidebar
│   │   ├── dashboard/page.tsx       # Dashboard home
│   │   ├── tasks/                   # Task views (Phase 2)
│   │   │   ├── page.tsx
│   │   │   ├── today/page.tsx
│   │   │   └── upcoming/page.tsx
│   │   ├── categories/page.tsx      # Categories (Phase 2)
│   │   ├── analytics/page.tsx       # Analytics (Phase 2)
│   │   └── settings/page.tsx        # Settings
│   │
│   ├── chat/                        # Chat page (Phase 3)
│   │   ├── layout.tsx               # Chat layout with sidebar
│   │   └── page.tsx                 # Chat interface
│   │
│   └── api/
│       └── auth/                    # Auth API routes
│
├── components/
│   ├── ui/                          # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── aceternity/                  # Aceternity UI effects (Phase 2)
│   │   ├── background-beams.tsx
│   │   └── text-generate-effect.tsx
│   │
│   ├── auth/                        # Auth components (Phase 2)
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   │
│   ├── tasks/                       # Task components (Phase 2)
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   └── ...
│   │
│   ├── dashboard/                   # Dashboard components (Phase 2)
│   │   ├── Sidebar.tsx
│   │   └── StatsCards.tsx
│   │
│   ├── chat/                        # Chat components (Phase 3)
│   │   ├── ChatContainer.tsx        # Main chat wrapper
│   │   ├── ChatInterface.tsx        # ChatKit integration
│   │   ├── MessageList.tsx          # Message display
│   │   ├── MessageItem.tsx          # Single message
│   │   ├── MessageInput.tsx         # User input
│   │   ├── StreamingMessage.tsx     # SSE message display
│   │   └── ToolCallIndicator.tsx    # Tool execution indicator
│   │
│   └── conversation/                # Conversation components (Phase 3)
│       ├── ConversationSidebar.tsx  # Sidebar with history
│       ├── ConversationList.tsx     # List of conversations
│       ├── ConversationItem.tsx     # Single conversation
│       └── NewChatButton.tsx        # Start new chat
│
├── stores/                          # Zustand stores (MANDATORY)
│   ├── auth-store.ts                # Auth state (Phase 2)
│   ├── task-store.ts                # Task state (Phase 2)
│   ├── ui-store.ts                  # UI state (Phase 2)
│   └── conversation-store.ts        # Conversation state (Phase 3)
│
├── lib/
│   ├── api/                         # Axios API modules
│   │   ├── client.ts                # Axios instance with interceptors
│   │   ├── auth.ts                  # Auth API calls
│   │   ├── tasks.ts                 # Task API calls
│   │   └── chat.ts                  # Chat API calls (Phase 3)
│   │
│   ├── sse/                         # SSE utilities (Phase 3)
│   │   └── client.ts                # SSE client for streaming
│   │
│   ├── auth.ts                      # Better Auth config
│   ├── utils.ts                     # Utility functions
│   └── types.ts                     # TypeScript types
│
├── hooks/
│   ├── use-auth.ts                  # Auth hook
│   ├── use-tasks.ts                 # Tasks hook
│   └── use-chat.ts                  # Chat hook (Phase 3)
│
├── types/
│   ├── task.ts                      # Task types (Phase 2)
│   ├── auth.ts                      # Auth types (Phase 2)
│   └── chat.ts                      # Chat types (Phase 3)
│
├── package.json
├── tailwind.config.ts
├── next.config.js
├── components.json                  # Shadcn config
└── tsconfig.json
```

---

## Phase 3 Code Patterns

### Conversation Store (Zustand)

```typescript
// stores/conversation-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatApi } from '@/lib/api/chat';
import { streamChat } from '@/lib/sse/client';

interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

interface ConversationActions {
  fetchConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  createConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  appendStreamToken: (token: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearError: () => void;
}

export const useConversationStore = create<ConversationState & ConversationActions>()(
  persist(
    (set, get) => ({
      // State
      conversations: [],
      currentConversation: null,
      messages: [],
      streamingContent: '',
      isLoading: false,
      isStreaming: false,
      error: null,

      // Actions
      fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const conversations = await chatApi.getConversations();
          set({ conversations, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load conversations', isLoading: false });
        }
      },

      selectConversation: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const { conversation, messages } = await chatApi.getConversation(id);
          set({
            currentConversation: conversation,
            messages,
            isLoading: false
          });
        } catch (error) {
          set({ error: 'Failed to load conversation', isLoading: false });
        }
      },

      createConversation: () => {
        set({
          currentConversation: null,
          messages: [],
          streamingContent: ''
        });
      },

      sendMessage: async (content: string) => {
        const { currentConversation } = get();

        // Add user message optimistically
        const userMessage: Message = {
          id: Date.now(),
          role: 'user',
          content,
          created_at: new Date().toISOString()
        };
        set(state => ({
          messages: [...state.messages, userMessage],
          streamingContent: '',
          isStreaming: true,
          error: null
        }));

        try {
          await streamChat(
            currentConversation?.id ?? null,
            content,
            // On token
            (token) => {
              set(state => ({
                streamingContent: state.streamingContent + token
              }));
            },
            // On tool call
            (toolCall) => {
              // Could show tool execution indicator
              console.log('Tool called:', toolCall);
            },
            // On done
            (data) => {
              const { streamingContent } = get();
              const assistantMessage: Message = {
                id: data.message_id,
                role: 'assistant',
                content: streamingContent,
                created_at: new Date().toISOString()
              };
              set(state => ({
                currentConversation: state.currentConversation ?? {
                  id: data.conversation_id,
                  title: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                messages: [...state.messages, assistantMessage],
                streamingContent: '',
                isStreaming: false
              }));
              // Refresh conversations list
              get().fetchConversations();
            },
            // On error
            (error) => {
              set({
                error: error.message,
                isStreaming: false
              });
            }
          );
        } catch (error) {
          set({
            error: 'Failed to send message',
            isStreaming: false
          });
        }
      },

      deleteConversation: async (id: number) => {
        try {
          await chatApi.deleteConversation(id);
          set(state => ({
            conversations: state.conversations.filter(c => c.id !== id),
            currentConversation: state.currentConversation?.id === id
              ? null
              : state.currentConversation,
            messages: state.currentConversation?.id === id
              ? []
              : state.messages
          }));
        } catch (error) {
          set({ error: 'Failed to delete conversation' });
        }
      },

      appendStreamToken: (token: string) => {
        set(state => ({
          streamingContent: state.streamingContent + token
        }));
      },

      setStreaming: (streaming: boolean) => {
        set({ isStreaming: streaming });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({
        // Only persist conversation list, not messages
        conversations: state.conversations
      })
    }
  )
);
```

### Chat API Module (Axios)

```typescript
// lib/api/chat.ts
import { apiClient } from './client';
import { useAuthStore } from '@/stores/auth-store';

interface ChatResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls?: ToolCall[];
}

interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: string;
  created_at: string;
}

export const chatApi = {
  // Send message (non-streaming)
  sendMessage: async (
    conversationId: number | null,
    message: string
  ): Promise<ChatResponse> => {
    const userId = useAuthStore.getState().user?.id;
    const response = await apiClient.post(`/api/${userId}/chat`, {
      conversation_id: conversationId,
      message
    });
    return response.data.data;
  },

  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const userId = useAuthStore.getState().user?.id;
    const response = await apiClient.get(`/api/${userId}/conversations`);
    return response.data.data;
  },

  // Get single conversation with messages
  getConversation: async (id: number): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> => {
    const userId = useAuthStore.getState().user?.id;
    const response = await apiClient.get(`/api/${userId}/conversations/${id}`);
    return response.data.data;
  },

  // Delete conversation
  deleteConversation: async (id: number): Promise<void> => {
    const userId = useAuthStore.getState().user?.id;
    await apiClient.delete(`/api/${userId}/conversations/${id}`);
  }
};
```

### SSE Client

```typescript
// lib/sse/client.ts
import { useAuthStore } from '@/stores/auth-store';

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface DoneData {
  conversation_id: number;
  message_id: number;
}

export async function streamChat(
  conversationId: number | null,
  message: string,
  onToken: (token: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
  onDone: (data: DoneData) => void,
  onError: (error: Error) => void
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  const token = useAuthStore.getState().token;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/${userId}/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to start chat stream');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          switch (eventType) {
            case 'token':
              onToken(data.content);
              break;
            case 'tool_call':
              onToolCall(data);
              break;
            case 'tool_result':
              // Could update the tool call with result
              break;
            case 'done':
              onDone(data);
              break;
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Stream error'));
  } finally {
    reader.releaseLock();
  }
}
```

### Chat Interface Component

```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StreamingMessage } from './StreamingMessage';
import { Loader2 } from 'lucide-react';

export function ChatInterface() {
  const {
    messages,
    streamingContent,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearError
  } = useConversationStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <MessageList messages={messages} />

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <StreamingMessage content={streamingContent} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            {error}
            <button
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
        />
      </div>
    </div>
  );
}
```

### Message Input Component

```typescript
// components/chat/MessageInput.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !content.trim()}
        size="icon"
        className="h-[60px] w-[60px]"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
```

### Conversation Sidebar Component

```typescript
// components/conversation/ConversationSidebar.tsx
'use client';

import { useEffect } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { ConversationList } from './ConversationList';
import { NewChatButton } from './NewChatButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export function ConversationSidebar() {
  const {
    conversations,
    currentConversation,
    isLoading,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation
  } = useConversationStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <NewChatButton onClick={createConversation} />
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            currentId={currentConversation?.id}
            onSelect={selectConversation}
            onDelete={deleteConversation}
          />
        )}
      </ScrollArea>
    </div>
  );
}
```

### Chat Page

```typescript
// app/chat/page.tsx
'use client';

import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useAuthStore } from '@/stores/auth-store';
import { redirect } from 'next/navigation';

export default function ChatPage() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      {/* Conversation Sidebar */}
      <ConversationSidebar />

      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
```

---

## Frontend-Specific Guidelines

### State Management (MANDATORY)

- **MANDATORY**: Use Zustand for all state management
- **FORBIDDEN**: React Context API for state management
- Store files: `stores/*.ts`
- Persist conversation list using Zustand persist middleware

### HTTP Requests (MANDATORY)

- **MANDATORY**: Use Axios for all HTTP requests
- **FORBIDDEN**: Native fetch API for API calls (except SSE)
- Configure interceptors for auth tokens
- Handle errors with Axios interceptors

### SSE Streaming

- Use native fetch for SSE (Axios doesn't support streaming)
- Parse SSE events manually
- Handle connection drops gracefully
- Update Zustand store with streamed tokens

### UI Components

- Use Shadcn/ui for base components
- Use Framer Motion for animations
- Follow Tailwind CSS conventions
- Support dark mode

### Forms

- Use React Hook Form for form handling
- Validate with Zod schemas
- Display errors inline

### Routing

- Use Next.js 16+ App Router
- Protected routes via middleware or layout checks
- Dynamic imports for code splitting

### Performance

- Server Components by default
- Client Components only when needed (useState, useEffect, etc.)
- Lazy load components with React.lazy()

---

## Chat Types

```typescript
// types/chat.ts

export interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface ChatRequest {
  conversation_id?: number;
  message: string;
}

export interface ChatResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls?: ToolCall[];
}

export interface SSETokenEvent {
  type: 'token';
  content: string;
}

export interface SSEToolCallEvent {
  type: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  type: 'tool_result';
  result: Record<string, unknown>;
}

export interface SSEDoneEvent {
  type: 'done';
  conversation_id: number;
  message_id: number;
}

export type SSEEvent =
  | SSETokenEvent
  | SSEToolCallEvent
  | SSEToolResultEvent
  | SSEDoneEvent;
```

---

## Environment Variables (Phase 3)

```env
# Existing Phase 2 variables
NEXT_PUBLIC_API_URL=http://localhost:8000

# Phase 3 - ChatKit (for production deployment)
# Get domain key from: https://platform.openai.com/settings/organization/security/domain-allowlist
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
```

**ChatKit Domain Allowlist (Production)**:
1. Deploy frontend to get URL (e.g., `https://your-app.vercel.app`)
2. Add domain at: https://platform.openai.com/settings/organization/security/domain-allowlist
3. Copy domain key to `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`
4. Note: localhost works without configuration

---

## Quick Commands

```bash
# Development
cd frontend

# Install Phase 3 dependencies
# Note: Verify ChatKit package name from https://platform.openai.com/docs/guides/chatkit
npm install eventsource-parser
# npm install <chatkit-package>  # After verifying package name

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Quality Checklist

Before considering Phase 3 frontend work complete:

- [ ] Chat page created at `/chat`
- [ ] Conversation store with Zustand
- [ ] SSE client for streaming responses
- [ ] Message list with proper styling
- [ ] Message input with send functionality
- [ ] Streaming message display
- [ ] Conversation sidebar with history
- [ ] New chat button
- [ ] Delete conversation functionality
- [ ] Loading states implemented
- [ ] Error handling with user feedback
- [ ] Responsive design (mobile support)
- [ ] Dark mode support
- [ ] Protected route (requires auth)
- [ ] Keyboard shortcuts (Enter to send)

---

## See Also

- [Root CLAUDE.md](../CLAUDE.md)
- [Phase 3 Constitution](../constitution-prompt-phase-3.md)
- [Phase 3 Specification](../spec-prompt-phase-3.md)
- [Phase 3 Plan](../plan-prompt-phase-3.md)
