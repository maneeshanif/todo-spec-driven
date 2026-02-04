/**
 * Real-time notification toast component
 *
 * Displays toast notifications for task updates
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { TaskEventType } from '@/lib/websocket/sync-client';

/**
 * Toast notification configuration
 */
const TOAST_DURATION = 3000; // 3 seconds

/**
 * Get toast message based on event type
 */
function getToastMessage(event: TaskEventType, task: Task): string {
  switch (event) {
    case 'task.created':
      return `Task created: ${task.title}`;
    case 'task.updated':
      return `Task updated: ${task.title}`;
    case 'task.deleted':
      return `Task deleted: ${task.title}`;
    case 'task.completed':
      return `Task completed: ${task.title}`;
    default:
      return `Task changed: ${task.title}`;
  }
}

/**
 * Get toast variant based on event type
 */
function getToastVariant(event: TaskEventType): 'default' | 'success' | 'error' | 'warning' {
  switch (event) {
    case 'task.created':
      return 'success';
    case 'task.completed':
      return 'success';
    case 'task.deleted':
      return 'warning';
    case 'task.updated':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Show task update notification
 *
 * @param event - Task event type
 * @param task - Task data
 * @param onNavigate - Optional callback to navigate to task
 */
export function showTaskNotification(
  event: TaskEventType,
  task: Task,
  onNavigate?: (taskId: number) => void
): void {
  const message = getToastMessage(event, task);

  // Show toast with click handler
  toast(message, {
    duration: TOAST_DURATION,
    action: onNavigate
      ? {
          label: 'View',
          onClick: () => onNavigate(task.id),
        }
      : undefined,
  });
}

/**
 * Hook to show task notifications
 *
 * @returns Function to show notifications
 */
export function useTaskNotifications() {
  const router = useRouter();

  const showNotification = (event: TaskEventType, task: Task) => {
    showTaskNotification(event, task, (taskId) => {
      // Navigate to tasks page (can be customized)
      router.push('/tasks');
    });
  };

  return { showNotification };
}

/**
 * Task notification component (optional wrapper)
 *
 * Can be used to provide toast context at app level
 */
export function TaskNotificationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
