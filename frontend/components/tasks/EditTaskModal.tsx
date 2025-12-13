"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskForm, { TaskFormValues } from './TaskForm';
import { useTaskStore } from '@/stores/task-store';
import { Task } from '@/lib/api/tasks';
import { toast } from 'sonner';

interface EditTaskModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export default function EditTaskModal({ task, open, onClose }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const updateTaskData = useTaskStore((s) => s.updateTaskData);

  const handleSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      await updateTaskData(task.id, data.title, data.description);
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
          defaultValues={{ title: task.title, description: task.description || undefined }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={loading}
          submitLabel="Update Task"
        />
      </DialogContent>
    </Dialog>
  );
}