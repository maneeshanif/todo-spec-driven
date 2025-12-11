"use client";

import { useState } from "react";
import { toast } from "sonner";
import TaskForm, { TaskFormValues } from "@/components/tasks/TaskForm";
import AddTaskButton from "@/components/tasks/AddTaskButton";
import { useTaskStore } from "@/stores/task-store";

interface CreateTaskModalProps {}

export default function CreateTaskModal(_: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTask = useTaskStore((s) => s.addTask);

  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    setError(null);
  };

  async function handleSubmit(data: TaskFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      await addTask(data.title, data.description || undefined);
      toast.success("Task created successfully!");
      closeModal();
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to create task";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <AddTaskButton onClick={openModal} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden
          />

          <div className="relative z-10 w-full max-w-lg mx-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Create Task</h2>
              {error && (
                <div className="mb-3 text-sm text-red-400">{error}</div>
              )}
              <TaskForm
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel={isLoading ? "Saving..." : "Create"}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
