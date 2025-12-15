"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskForm, { TaskFormValues } from './TaskForm';
import { useTaskStore } from '@/stores/task-store';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const addTask = useTaskStore((s) => s.addTask);

  const handleSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      await addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.recurrence_pattern,
      });
      toast.success("Task created successfully");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={loading}
          submitLabel="Create Task"
        />
      </DialogContent>
    </Dialog>
  );
}