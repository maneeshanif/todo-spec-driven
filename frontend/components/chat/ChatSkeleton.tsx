'use client';

/**
 * Skeleton loading states for chat interface.
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for a single message (user or assistant).
 */
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar skeleton */}
      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0" />

      <div className={`flex-1 max-w-[80%] space-y-2 ${isUser ? 'items-end' : ''}`}>
        {/* Message content skeleton */}
        <Skeleton className={`h-16 sm:h-20 rounded-lg ${isUser ? 'w-2/3 ml-auto' : 'w-full'}`} />
      </div>
    </div>
  );
}

/**
 * Skeleton for the chat messages area - shows a conversation pattern.
 */
export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* User message */}
      <MessageSkeleton isUser />

      {/* Assistant message with longer content */}
      <div className="flex gap-2 sm:gap-3">
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0" />
        <div className="flex-1 max-w-[80%] space-y-2">
          <Skeleton className="h-24 sm:h-28 rounded-lg w-full" />
        </div>
      </div>

      {/* Another user message */}
      <MessageSkeleton isUser />

      {/* Assistant response */}
      <div className="flex gap-2 sm:gap-3">
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0" />
        <div className="flex-1 max-w-[80%] space-y-2">
          <Skeleton className="h-16 sm:h-20 rounded-lg w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for empty/new chat state.
 */
export function NewChatSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      {/* Bot icon placeholder */}
      <Skeleton className="h-16 w-16 rounded-full" />

      {/* Welcome text placeholders */}
      <div className="space-y-2 text-center w-full max-w-md">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Suggestion chips skeleton */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full chat container skeleton with messages and input area.
 */
export function ChatContainerSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessagesSkeleton />
      </div>

      {/* Input area skeleton */}
      <div className="border-t bg-background p-2 sm:p-4">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 sm:h-12 rounded-md" />
          <Skeleton className="h-10 sm:h-12 w-10 sm:w-12 rounded-md" />
        </div>
        <Skeleton className="h-3 w-48 mx-auto mt-2 hidden sm:block" />
      </div>
    </div>
  );
}
