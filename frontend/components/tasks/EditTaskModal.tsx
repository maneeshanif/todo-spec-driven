"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskForm, { TaskFormValues } from './TaskForm';
import { useTaskStore } from '@/stores/task-store';
import { Task } from '@/types';
import { toast } from 'sonner';
import { taskApi } from '@/lib/api/tasks';

interface EditTaskModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export default function EditTaskModal({ task, open, onClose }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  const handleSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      await taskApi.update(task.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date ? data.due_date.toISOString() : undefined,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.recurrence_pattern || undefined,
      });
      await fetchTasks();
      toast.success("Task updated successfully");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <TaskForm
          defaultValues={{ 
            title: task.title, 
            description: task.description || undefined,
            priority: task.priority as "low" | "medium" | "high",
            due_date: task.due_date ? new Date(task.due_date) : null,
            is_recurring: task.is_recurring || false,
            recurrence_pattern: task.recurrence_pattern as "daily" | "weekly" | "monthly" | "yearly" | null,
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={loading}
          submitLabel="Update Task"
        />
      </DialogContent>
    </Dialog>
  );
}