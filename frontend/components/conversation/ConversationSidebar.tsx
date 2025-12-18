'use client';

/**
 * ConversationSidebar component - main sidebar for chat conversations.
 *
 * Features:
 * - New chat button
 * - Conversation list with scroll
 * - Responsive design:
 *   - Mobile: Full-screen overlay when open, hidden by default
 *   - Desktop: Always visible, collapsible
 * - Loading state
 */

import { useEffect, useState } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { ConversationList } from './ConversationList';
import { ConversationListSkeleton } from './ConversationSkeleton';
import { NewChatButton } from './NewChatButton';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  className?: string;
}

export function ConversationSidebar({ className }: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    conversations,
    currentConversation,
    isLoading,
    isSidebarOpen,
    fetchConversations,
    selectConversation,
    createNewConversation,
    renameConversation,
    deleteConversation,
    setSidebarOpen,
  } = useConversationStore();

  const currentConversationId = currentConversation?.id ?? null;

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewChat = () => {
    createNewConversation();
  };

  const handleSelect = (id: number) => {
    selectConversation(id);
  };

  const handleRename = async (id: number, title: string) => {
    await renameConversation(id, title);
  };

  const handleDelete = async (id: number) => {
    await deleteConversation(id);
  };

  const handleCloseMobile = () => {
    setSidebarOpen(false);
  };

  // Desktop collapsed state (shown when collapsed on desktop)
  if (isCollapsed) {
    return (
      <div className="hidden md:flex p-2 border-r flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar - always visible, relative positioning */}
      <aside
        className={cn(
          'hidden md:flex w-64 border-r bg-background flex-col h-full',
          className
        )}
      >
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3 border-b">
          <NewChatButton onClick={handleNewChat} disabled={isLoading} />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <ConversationListSkeleton count={5} />
          ) : (
            <ConversationList
              conversations={conversations}
              currentId={currentConversationId}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </div>
      </aside>

      {/* Mobile sidebar - full-screen overlay, fixed positioning */}
      <aside
        className={cn(
          'fixed inset-0 z-40 bg-background flex flex-col h-full w-full transition-transform duration-300 ease-in-out md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between p-4 border-b h-14">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCloseMobile}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3 border-b">
          <NewChatButton onClick={handleNewChat} disabled={isLoading} />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <ConversationListSkeleton count={5} />
          ) : (
            <ConversationList
              conversations={conversations}
              currentId={currentConversationId}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </div>
      </aside>
    </>
  );
}
