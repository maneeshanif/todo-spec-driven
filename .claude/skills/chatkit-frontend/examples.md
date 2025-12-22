# ChatKit Frontend Examples

Complete code examples for implementing ChatKit in the Todo AI Chatbot.

---

## Example 1: Basic Chat Page

Minimal ChatKit integration:

```tsx
// frontend/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export default function ChatPage() {
  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
    },
  });

  return (
    <div className="h-screen w-full">
      <ChatKit control={control} className="h-full w-full" />
    </div>
  );
}
```

---

## Example 2: Full-Featured Chat Page

Complete implementation with auth, theme, and prompts:

```tsx
// frontend/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { control } = useChatKit({
    // API Configuration
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
    },

    // Theme
    theme: {
      colorScheme: isDark ? 'dark' : 'light',
      radius: 'round',
      color: {
        accent: {
          primary: isDark ? '#f1f5f9' : '#0f172a',
          level: 1,
        },
        grayscale: {
          hue: 220,
          tint: 6,
          shade: isDark ? -1 : -4,
        },
      },
    },

    // Start Screen
    startScreen: {
      greeting: user?.name
        ? `Hello, ${user.name}! How can I help you today?`
        : 'Hello! How can I help you today?',
      prompts: [
        'Show my tasks',
        'Add a task to buy groceries',
        'What tasks are due today?',
        'Complete my first task',
      ],
    },

    // Header
    header: {
      enabled: true,
      title: 'Task Assistant',
    },

    // Composer
    composer: {
      placeholder: 'Ask about your tasks...',
    },

    // Disable built-in history (using custom sidebar)
    history: {
      enabled: false,
    },

    // Error handling
    onError: ({ error }) => {
      console.error('ChatKit error:', error);
    },
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-full">
      <ChatKit control={control} className="h-full w-full max-w-4xl mx-auto" />
    </div>
  );
}
```

---

## Example 3: Chat Layout with Custom Sidebar

Layout that combines ChatKit with custom conversation sidebar:

```tsx
// frontend/app/chat/layout.tsx
'use client';

import { useState } from 'react';
import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle (Mobile) */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Conversation Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <ConversationSidebar />
      </div>

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

---

## Example 4: ChatKit Wrapper Component

Reusable wrapper with all configuration:

```tsx
// frontend/components/chat/ChatKitWrapper.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

interface ChatKitWrapperProps {
  className?: string;
  onMessageSent?: () => void;
}

export function ChatKitWrapper({ className, onMessageSent }: ChatKitWrapperProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
    },
    theme: {
      colorScheme: isDark ? 'dark' : 'light',
      radius: 'round',
      color: {
        accent: { primary: isDark ? '#f1f5f9' : '#0f172a', level: 1 },
        grayscale: { hue: 220, tint: 6, shade: isDark ? -1 : -4 },
      },
    },
    startScreen: {
      greeting: `Hello${user?.name ? `, ${user.name}` : ''}! How can I help?`,
      prompts: ['Show tasks', 'Add a task', 'Tasks due today'],
    },
    header: { enabled: false },
    history: { enabled: false },
    composer: { placeholder: 'Ask about your tasks...' },
    onMessage: () => {
      onMessageSent?.();
    },
    onError: ({ error }) => {
      console.error('ChatKit error:', error);
    },
  });

  if (!control) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <ChatKit control={control} className={className} />;
}
```

**Usage:**

```tsx
// frontend/app/chat/page.tsx
'use client';

import { ChatKitWrapper } from '@/components/chat/ChatKitWrapper';
import { useConversationStore } from '@/stores/conversation-store';

export default function ChatPage() {
  const { refreshConversations } = useConversationStore();

  return (
    <div className="h-screen">
      <ChatKitWrapper
        className="h-full w-full"
        onMessageSent={refreshConversations}
      />
    </div>
  );
}
```

---

## Example 5: Floating Chat Widget

Embeddable chat widget for any page:

```tsx
// frontend/components/chat/FloatingChatWidget.tsx
'use client';

import { useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: 'local-dev',
    },
    theme: {
      colorScheme: 'light',
      radius: 'round',
    },
    startScreen: {
      greeting: 'Need help with your tasks?',
      prompts: ['Show my tasks', 'Add a task'],
    },
    header: { enabled: true, title: 'Task Assistant' },
    history: { enabled: false },
  });

  return (
    <>
      {/* Toggle Button */}
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[380px] h-[600px] z-50 shadow-2xl rounded-lg overflow-hidden border bg-background"
          >
            <ChatKit control={control} className="h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## Example 6: ChatKit Configuration Utility

Centralized configuration:

```tsx
// frontend/lib/chatkit/config.ts
import type { UseChatKitOptions } from '@openai/chatkit-react';

interface ChatKitConfigOptions {
  userName?: string;
  isDarkMode?: boolean;
  onMessage?: () => void;
  onError?: (error: Error) => void;
}

export function createChatKitConfig(options: ChatKitConfigOptions): UseChatKitOptions {
  const { userName, isDarkMode = false, onMessage, onError } = options;

  return {
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
    },

    theme: {
      colorScheme: isDarkMode ? 'dark' : 'light',
      radius: 'round',
      color: {
        accent: {
          primary: isDarkMode ? '#f1f5f9' : '#0f172a',
          level: 1,
        },
        grayscale: {
          hue: 220,
          tint: 6,
          shade: isDarkMode ? -1 : -4,
        },
      },
    },

    startScreen: {
      greeting: userName
        ? `Hello, ${userName}! How can I help you today?`
        : 'Hello! How can I help you today?',
      prompts: [
        'Show my tasks',
        'Add a task to buy groceries',
        'What tasks are due today?',
        'Complete my first task',
      ],
    },

    header: {
      enabled: false, // Using custom header
    },

    composer: {
      placeholder: 'Ask about your tasks...',
    },

    history: {
      enabled: false, // Using custom sidebar
    },

    onMessage: onMessage ? () => onMessage() : undefined,

    onError: onError
      ? ({ error }) => onError(error)
      : ({ error }) => console.error('ChatKit error:', error),
  };
}
```

**Usage:**

```tsx
// frontend/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { createChatKitConfig } from '@/lib/chatkit/config';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();

  const config = createChatKitConfig({
    userName: user?.name,
    isDarkMode: theme === 'dark',
  });

  const { control } = useChatKit(config);

  return <ChatKit control={control} className="h-screen w-full" />;
}
```

---

## Example 7: Client Tool Handling

Handle client-side tools from AI:

```tsx
// frontend/app/chat/page.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ChatPage() {
  const { setTheme } = useTheme();
  const router = useRouter();

  const { control } = useChatKit({
    api: {
      url: `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: 'local-dev',
    },

    onClientTool: async (invocation) => {
      const { name, params } = invocation;
      console.log('Client tool:', name, params);

      switch (name) {
        case 'switch_theme':
          const theme = params.theme as 'light' | 'dark';
          setTheme(theme);
          toast.success(`Theme switched to ${theme} mode`);
          return { success: true };

        case 'navigate':
          const path = params.path as string;
          router.push(path);
          return { success: true };

        case 'show_notification':
          const message = params.message as string;
          toast.info(message);
          return { success: true };

        case 'copy_to_clipboard':
          const text = params.text as string;
          await navigator.clipboard.writeText(text);
          toast.success('Copied to clipboard');
          return { success: true };

        default:
          console.warn('Unknown client tool:', name);
          return { success: false };
      }
    },
  });

  return <ChatKit control={control} className="h-screen w-full" />;
}
```

---

## Example 8: Thread/Conversation Switching

Integrate with conversation store for thread management:

```tsx
// frontend/app/chat/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useConversationStore } from '@/stores/conversation-store';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get('thread');

  const {
    selectConversation,
    refreshConversations,
    currentConversation,
  } = useConversationStore();

  // Load thread from URL param
  useEffect(() => {
    if (threadId) {
      selectConversation(parseInt(threadId));
    }
  }, [threadId, selectConversation]);

  const { control } = useChatKit({
    api: {
      // Include thread ID in API URL for backend to load correct conversation
      url: currentConversation
        ? `${process.env.NEXT_PUBLIC_API_URL}/chatkit?thread=${currentConversation.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/chatkit`,
      domainKey: 'local-dev',
    },
    history: { enabled: false },
    onMessage: () => {
      refreshConversations();
    },
  });

  return <ChatKit control={control} className="h-screen w-full" />;
}
```

---

## Example 9: Custom Conversation Sidebar

Keep your existing sidebar with ChatKit:

```tsx
// frontend/components/conversation/ConversationSidebar.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversationStore } from '@/stores/conversation-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ConversationSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentThreadId = searchParams.get('thread');

  const {
    conversations,
    isLoading,
    fetchConversations,
    deleteConversation,
    createNewConversation,
  } = useConversationStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = () => {
    createNewConversation();
    router.push('/chat');
  };

  const handleSelectConversation = (id: number) => {
    router.push(`/chat?thread=${id}`);
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
      if (currentThreadId === String(id)) {
        router.push('/chat');
      }
    }
  };

  return (
    <div className="w-64 h-full border-r bg-muted/30 flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground p-8">
            No conversations yet
          </p>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`
                  group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                  hover:bg-muted transition-colors
                  ${currentThreadId === String(conv.id) ? 'bg-muted' : ''}
                `}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.title || 'New Chat'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
```

---

## Example 10: Environment Configuration

```env
# frontend/.env.local

# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# ChatKit Domain Key (Production only)
# Get from: https://platform.openai.com/settings/organization/security/domain-allowlist
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here

# Note: For local development, use 'local-dev' as domainKey
# Domain allowlist is only required for production deployment
```

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [REFERENCE.md](./REFERENCE.md) - API reference
- [chatkit-backend skill](../chatkit-backend/) - Backend integration
