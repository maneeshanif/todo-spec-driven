// Using the original task management components
"use client";

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/task-store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function TasksPage() {
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <DashboardLayout />
  );
}