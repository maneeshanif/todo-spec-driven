"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTaskStore } from "@/stores/task-store";
import { toast } from "sonner";

interface DeleteTaskDialogProps {
  taskId: number;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function DeleteTaskDialog({
  taskId,
  taskTitle,
  open,
  onClose,
}: DeleteTaskDialogProps) {
  const removeTask = useTaskStore((s) => s.removeTask);

  const handleDelete = async () => {
    try {
      await removeTask(taskId);
      toast.success("Task deleted successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete task");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-neutral-900 border-neutral-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
