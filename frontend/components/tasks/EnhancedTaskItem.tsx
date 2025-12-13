"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Calendar, Tag, AlertCircle, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  category?: { id: number; name: string; color: string };
  created_at: string;
}

interface EnhancedTaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const priorityConfig = {
  high: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "High",
  },
  medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Medium",
  },
  low: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Low",
  },
};

export default function EnhancedTaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
}: EnhancedTaskItemProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  const priority = task.priority || "low";
  const priorityStyle = priorityConfig[priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-200",
        task.completed
          ? "bg-neutral-800/30 border-neutral-700/50"
          : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:shadow-lg"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-1 flex-shrink-0 transition-transform hover:scale-110"
        >
          {task.completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-neutral-500 hover:text-blue-500" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3
                className={cn(
                  "text-lg font-medium mb-1",
                  task.completed
                    ? "text-neutral-500 line-through"
                    : "text-white"
                )}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-neutral-400 mb-3">
                  {task.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Priority Badge */}
                {task.priority && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border",
                      priorityStyle.bg,
                      priorityStyle.border,
                      priorityStyle.color
                    )}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {priorityStyle.label}
                  </span>
                )}

                {/* Category */}
                {task.category && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-neutral-700"
                    style={{
                      backgroundColor: `${task.category.color}20`,
                      color: task.category.color,
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    {task.category.name}
                  </span>
                )}

                {/* Due Date */}
                {task.due_date && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border",
                      isOverdue
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.due_date), "MMM d, yyyy")}
                    {isOverdue && " (Overdue)"}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-neutral-400 hover:text-blue-400" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Indicator Bar */}
      {!task.completed && task.priority && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            task.priority === "high" && "bg-red-500",
            task.priority === "medium" && "bg-yellow-500",
            task.priority === "low" && "bg-green-500"
          )}
        />
      )}
    </motion.div>
  );
}
