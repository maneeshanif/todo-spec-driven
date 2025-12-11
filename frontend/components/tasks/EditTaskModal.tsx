"use client";

import { useState } from "react";
import { toast } from "sonner";
import TaskForm, { TaskFormValues } from "@/components/tasks/TaskForm";
import { useTaskStore } from "@/stores/task-store";
import { Task } from "@/lib/api/tasks";

interface EditTaskModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export default function EditTaskModal({ task, open, onClose }: EditTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTaskData = useTaskStore((s) => s.updateTaskData);

  async function handleSubmit(data: TaskFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      await updateTaskData(task.id, data.title, data.description || undefined);
      toast.success("Task updated successfully!");
      onClose();
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to update task";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edit Task</h2>
          {error && (
            <div className="mb-3 text-sm text-red-400">{error}</div>
          )}
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitLabel={isLoading ? "Saving..." : "Save Changes"}
            defaultValues={{
              title: task.title,
              description: task.description || '',
            }}
          />
        </div>
      </div>
    </div>
  );
}
