/**
 * Task Sync Provider Component
 *
 * Integrates WebSocket connection with task store for real-time synchronization
 * Add this component to your layout or page to enable real-time task updates
 */

'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/use-websocket';
import { useTaskStore } from '@/stores/task-store';

interface TaskSyncProviderProps {
  userId: string | null;
  enabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Provider component for real-time task synchronization
 *
 * @param userId - Current user ID for WebSocket connection
 * @param enabled - Whether to enable sync (default: true)
 * @param children - Optional child components
 */
export function TaskSyncProvider({ userId, enabled = true, children }: TaskSyncProviderProps) {
  const { handleWebSocketMessage, setWebSocketEnabled } = useTaskStore();
  const { status, isConnected, addListener, removeListener } = useWebSocket(
    userId,
    enabled // auto-connect if enabled
  );

  // Update store with WebSocket status
  useEffect(() => {
    setWebSocketEnabled(isConnected);
  }, [isConnected, setWebSocketEnabled]);

  // Register message listener
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const messageListener = handleWebSocketMessage;
    addListener(messageListener);

    return () => {
      removeListener(messageListener);
    };
  }, [enabled, userId, handleWebSocketMessage, addListener, removeListener]);

  // Log connection status changes
  useEffect(() => {
    console.log('[TaskSync] Connection status:', status);
  }, [status]);

  return <>{children}</>;
}

/**
 * Example usage in app layout:
 *
 * ```tsx
 * // app/layout.tsx or app/tasks/layout.tsx
 * import { TaskSyncProvider } from '@/components/tasks/task-sync-provider';
 * import { useAuthStore } from '@/stores/auth-store';
 *
 * export default function Layout({ children }) {
 *   const { user } = useAuthStore();
 *
 *   return (
 *     <TaskSyncProvider userId={user?.id || null}>
 *       {children}
 *     </TaskSyncProvider>
 *   );
 * }
 * ```
 */
