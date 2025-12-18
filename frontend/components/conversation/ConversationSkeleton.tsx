'use client';

/**
 * Skeleton loading states for conversation sidebar.
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for a single conversation item.
 */
export function ConversationItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
      {/* Icon skeleton */}
      <Skeleton className="h-4 w-4 rounded shrink-0" />

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-3/4" />
        {/* Date skeleton */}
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the conversation list - shows multiple conversation items.
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </div>
  );
}
