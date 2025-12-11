"use client";

import { Task } from '@/lib/api/tasks';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence } from 'framer-motion';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export default function TaskList({ tasks, loading }: TaskListProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full bg-neutral-800/50" />
        ))}
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </AnimatePresence>
    </div>
  );
}
