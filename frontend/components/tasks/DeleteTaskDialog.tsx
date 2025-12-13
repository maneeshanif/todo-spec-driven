"use client";

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTaskStore } from '@/stores/task-store';
import { toast } from 'sonner';

// Luxury color palette
const colors = {
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
  red: "#8b2635",
};

interface DeleteTaskDialogProps {
  taskId: number;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function DeleteTaskDialog({ taskId, taskTitle, open, onClose }: DeleteTaskDialogProps) {
  const removeTask = useTaskStore((s) => s.removeTask);

  const handleDelete = async () => {
    try {
      await removeTask(taskId);
      toast.success("Task deleted successfully");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete task");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-light" style={{ fontFamily: "serif", color: colors.text }}>
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: colors.textMuted }}>
            This will permanently delete the task "<strong style={{ color: colors.text }}>{taskTitle}</strong>". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs tracking-[0.2em] uppercase border transition-all duration-300 hover:opacity-80"
            style={{ borderColor: colors.border, color: colors.text, backgroundColor: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: colors.red, color: colors.textLight }}
          >
            Delete
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}