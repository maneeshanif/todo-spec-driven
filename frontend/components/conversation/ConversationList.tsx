'use client';

/**
 * ConversationList component - displays a list of conversations grouped by date.
 *
 * Groups conversations into:
 * - Today
 * - Yesterday
 * - Previous 7 Days
 * - Older
 */

import { ConversationItem } from './ConversationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conversation } from '@/types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  currentId?: number | null;
  onSelect: (id: number) => void;
  onRename: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

// Date group labels in display order
const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const;
type DateGroup = (typeof DATE_GROUP_ORDER)[number];

/**
 * Groups conversations by date categories.
 * @param conversations - Array of conversations to group
 * @returns Object with date group keys and conversation arrays as values
 */
function groupByDate(conversations: Conversation[]): Record<DateGroup, Conversation[]> {
  const groups: Record<DateGroup, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    date.setHours(0, 0, 0, 0);

    let group: DateGroup;
    if (date >= today) {
      group = 'Today';
    } else if (date >= yesterday) {
      group = 'Yesterday';
    } else if (date >= lastWeek) {
      group = 'Previous 7 Days';
    } else {
      group = 'Older';
    }

    groups[group].push(conv);
  });

  return groups;
}

export function ConversationList({
  conversations,
  currentId,
  onSelect,
  onRename,
  onDelete,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  const groupedConversations = groupByDate(conversations);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-4">
        {DATE_GROUP_ORDER.map((groupName) => {
          const groupConversations = groupedConversations[groupName];

          // Skip empty groups
          if (groupConversations.length === 0) {
            return null;
          }

          return (
            <div key={groupName} className="space-y-1">
              {/* Date group header */}
              <h3 className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {groupName}
              </h3>

              {/* Conversations in this group */}
              {groupConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={currentId === conversation.id}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                  hideDate
                />
              ))}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
