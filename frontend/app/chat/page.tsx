'use client';

/**
 * Chat page - main chat interface for the AI chatbot.
 *
 * Features:
 * - ChatContainer with messages and input
 * - Conversation history sidebar
 * - Loads most recent conversation on entry
 * - Real-time streaming (Phase 11)
 * - Responsive design (mobile sidebar toggle)
 */

import { useEffect, useState } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';
import { chatApi } from '@/lib/api/chat';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function ChatPage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    fetchConversations,
    selectConversation,
    createNewConversation,
    toggleSidebar,
    isSidebarOpen,
    _hasHydrated,
  } = useConversationStore();

  // Initialize on mount - load most recent conversation or create new
  useEffect(() => {
    async function initialize() {
      if (!_hasHydrated || isInitialized) return;

      try {
        // Fetch conversations first
        await fetchConversations();

        // Try to get the most recent conversation
        const recentConversation = await chatApi.getMostRecentConversation();

        if (recentConversation) {
          // Load the most recent conversation
          await selectConversation(recentConversation.id);
        } else {
          // No conversations, start fresh
          createNewConversation();
        }
      } catch (error) {
        console.error('[ChatPage] Failed to initialize:', error);
        // Start fresh on error
        createNewConversation();
      }

      setIsInitialized(true);
    }

    initialize();
  }, [
    _hasHydrated,
    isInitialized,
    fetchConversations,
    selectConversation,
    createNewConversation,
  ]);

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

      {/* Chat interface - full width on mobile with top padding for header */}
      <div className="flex-1 overflow-hidden pt-14 md:pt-0">
        <ChatContainer className="h-full" />
      </div>
    </div>
  );
}
