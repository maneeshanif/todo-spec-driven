"use client";

import { useState } from 'react';
import { Task } from '@/lib/api/tasks';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/task-store';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import EditTaskModal from './EditTaskModal';
import DeleteTaskDialog from './DeleteTaskDialog';

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
      <Card className={`bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 transition-all ${
        task.completed ? 'opacity-60' : ''
      }`}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="pt-1">
              <Checkbox
                checked={task.completed}
                onCheckedChange={handleToggle}
                className="border-neutral-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
            </div>
            <div className="flex-1">
              <motion.div
                animate={{ opacity: task.completed ? 0.6 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <CardTitle className={`text-white text-lg transition-all ${
                  task.completed ? 'line-through text-neutral-500' : ''
                }`}>
                  {task.title}
                </CardTitle>
                {task.description && (
                  <CardDescription className="mt-2 text-neutral-400">
                    {task.description}
                  </CardDescription>
                )}
                <p className="text-xs text-neutral-600 mt-2">
                  Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditModalOpen(true)}
                className="hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4 text-neutral-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="hover:bg-neutral-800 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4 text-neutral-400" />
              </Button>
              {task.completed && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-green-500 text-sm font-medium"
                >
                  ✓ Completed
                </motion.span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

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
