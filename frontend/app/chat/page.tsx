'use client';

/**
 * Chat page - AI chatbot interface using OpenAI ChatKit.
 *
 * Features:
 * - ChatKit component for chat UI
 * - Custom ConversationSidebar for conversation history
 * - Theme integration (dark mode support)
 * - Personalized greeting with user name
 * - Quick prompts for common tasks
 * - Responsive design (mobile sidebar toggle)
 */

import { useEffect, useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useConversationStore } from '@/stores/conversation-store';
import { useAuthStore } from '@/stores/authStore';
import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Conversation } from '@/types/chat';

/**
 * ChatKit wrapper component that reinitializes when conversation changes.
 * This is needed because useChatKit hook captures config at mount time.
 */
function ChatKitWrapper({
  conversationId,
  userName,
  onResponseEnd,
}: {
  conversationId: number | null;
  userName: string | undefined;
  onResponseEnd: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // ChatKit configuration - reinitializes when this component remounts
  const { control } = useChatKit({
    // API Configuration - point to local proxy that forwards to backend
    api: {
      url: conversationId
        ? `/api/chatkit?conversation_id=${conversationId}`
        : '/api/chatkit',
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || 'local-dev',
      // Custom fetch to inject auth token from localStorage
      fetch: async (input, init) => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('bearer_token')
          : null;

        console.log('[ChatKit] Making request to:', input);
        console.log('[ChatKit] Token exists:', !!token);
        console.log('[ChatKit] Conversation ID:', conversationId);

        return fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
      },
    },

    // Theme Configuration
    theme: {
      colorScheme: mounted && isDark ? 'dark' : 'light',
      radius: 'round',
      color: {
        accent: {
          primary: mounted && isDark ? '#f1f5f9' : '#0f172a',
          level: 1,
        },
        grayscale: {
          hue: 220,
          tint: 6,
          shade: mounted && isDark ? -1 : -4,
        },
      },
    },

    // Start Screen - personalized greeting and quick prompts
    startScreen: {
      greeting: userName
        ? `Hello, ${userName}! How can I help you manage your tasks today?`
        : 'Hello! How can I help you manage your tasks today?',
      prompts: [
        { label: 'Show my tasks', prompt: 'Show my tasks' },
        { label: 'Add a grocery task', prompt: 'Add a task to buy groceries' },
        { label: 'Tasks due today', prompt: 'What tasks are due today?' },
        { label: 'Complete a task', prompt: 'Mark my first task as complete' },
      ],
    },

    // Header Configuration - disabled (using custom layout header)
    header: {
      enabled: false,
    },

    // Composer Configuration
    composer: {
      placeholder: 'Ask me to add, list, complete, or update your tasks...',
    },

    // History - disabled (using custom ConversationSidebar)
    history: {
      enabled: false,
    },

    // Event Handlers
    onResponseEnd: () => {
      onResponseEnd();
    },

    onError: ({ error }) => {
      console.error('[ChatKit] Error:', error);
    },
  });

  // Show loading while control is initializing
  if (!control) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Connecting to chat...</p>
      </div>
    );
  }

  return (
    <ChatKit
      control={control}
      className="h-full w-full"
    />
  );
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [chatKitReady, setChatKitReady] = useState(false);

  const { user } = useAuthStore();
  const {
    fetchConversations,
    refreshConversationsSilently,
    toggleSidebar,
    isSidebarOpen,
    currentConversation,
    _hasHydrated,
  } = useConversationStore();

  // Handle hydration for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if ChatKit script is loaded
  useEffect(() => {
    const checkChatKit = () => {
      if (typeof window !== 'undefined' && customElements.get('openai-chatkit')) {
        console.log('[ChatKit] Web component is registered');
        setChatKitReady(true);
      } else {
        console.log('[ChatKit] Waiting for web component to register...');
        setTimeout(checkChatKit, 100);
      }
    };
    checkChatKit();
  }, []);

  // Initialize conversations on mount
  useEffect(() => {
    if (_hasHydrated) {
      fetchConversations();
    }
  }, [_hasHydrated, fetchConversations]);

  // Debug: Log conversation state
  useEffect(() => {
    console.log('[ChatKit] Current conversation:', currentConversation);
    console.log('[ChatKit] ChatKit ready:', chatKitReady);
    console.log('[ChatKit] Mounted:', mounted);
  }, [currentConversation, chatKitReady, mounted]);

  // Show loading while ChatKit is initializing
  if (!mounted || !chatKitReady) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {!mounted ? 'Loading...' : 'Initializing ChatKit...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Mobile header with hamburger menu - visible only on small screens */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center h-14 px-4 border-b bg-background md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle conversation sidebar"
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-sm">Todo Assistant</h1>
      </div>

      {/* Conversation sidebar - responsive behavior */}
      <ConversationSidebar />

      {/* Mobile overlay backdrop when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* ChatKit interface - full width with padding for mobile header */}
      {/* Key forces complete remount when conversation changes, including useChatKit hook */}
      <div className="flex-1 overflow-hidden pt-14 md:pt-0">
        <ChatKitWrapper
          key={`chatkit-wrapper-${currentConversation?.id ?? 'new'}`}
          conversationId={currentConversation?.id ?? null}
          userName={user?.name}
          onResponseEnd={refreshConversationsSilently}
        />
      </div>
    </div>
  );
}
