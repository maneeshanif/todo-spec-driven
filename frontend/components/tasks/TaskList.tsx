"use client";

import { Task } from '@/types';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import { AnimatePresence } from 'framer-motion';

// Luxury color palette
const colors = {
  border: "#e5dfd5",
};

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
          <div
            key={i}
            className="h-24 w-full animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        ))}
      </div>
    );
  }

  // Empty state - handle undefined or empty tasks
  if (!tasks || tasks.length === 0) {
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