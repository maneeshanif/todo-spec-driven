"use client";

import { useState } from 'react';
import { Task } from '@/lib/api/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/task-store';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import EditTaskModal from './EditTaskModal';
import DeleteTaskDialog from './DeleteTaskDialog';

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
};

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  const handleToggle = async () => {
    try {
      await toggleTask(task.id);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update task");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`border p-5 transition-all duration-300 hover:shadow-md ${task.completed ? 'opacity-60' : ''}`}
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggle}
              className="border-[#a08339] data-[state=checked]:bg-[#16a34a] data-[state=checked]:border-[#16a34a]"
            />
          </div>
          <div className="flex-1">
            <motion.div
              animate={{ opacity: task.completed ? 0.6 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <h3
                className={`text-lg font-light transition-all ${task.completed ? 'line-through' : ''}`}
                style={{ color: task.completed ? colors.textMuted : colors.text, fontFamily: "serif" }}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                  {task.description}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: colors.textMuted, fontStyle: "italic" }}>
                Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </p>
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditModalOpen(true)}
              className="hover:bg-[#f0ebe3]"
            >
              <Pencil className="h-4 w-4" style={{ color: colors.textMuted }} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="hover:bg-[#fef2f2]"
            >
              <Trash2 className="h-4 w-4" style={{ color: colors.textMuted }} />
            </Button>
            {task.completed && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm tracking-wider"
                style={{ color: "#16a34a" }}
              >
                ✓ Done
              </motion.span>
            )}
          </div>
        </div>
      </div>

      <EditTaskModal
        task={task}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />

      <DeleteTaskDialog
        taskId={task.id}
        taskTitle={task.title}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </motion.div>
  );
}