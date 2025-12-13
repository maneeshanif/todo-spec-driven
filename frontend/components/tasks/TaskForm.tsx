// Task Form Component (used for both create and edit)
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
};

const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultValues || { title: "", description: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-xs tracking-wider uppercase mb-2"
          style={{ color: colors.textMuted }}
        >
          Title *
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="Enter task title"
          autoFocus
          disabled={isLoading}
          className="w-full px-4 py-3 border transition-all duration-200 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: colors.bgAlt,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: "serif",
          }}
        />
        {errors.title && (
          <p className="text-sm mt-1" style={{ color: "#dc2626" }}>{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-xs tracking-wider uppercase mb-2"
          style={{ color: colors.textMuted }}
        >
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Enter task description (optional)"
          rows={4}
          disabled={isLoading}
          className="w-full px-4 py-3 border transition-all duration-200 focus:outline-none focus:ring-1 resize-none"
          style={{
            backgroundColor: colors.bgAlt,
            borderColor: colors.border,
            color: colors.text,
          }}
        />
        {errors.description && (
          <p className="text-sm mt-1" style={{ color: "#dc2626" }}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 text-xs tracking-[0.2em] uppercase border transition-all duration-300 hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: colors.border, color: colors.text, backgroundColor: "transparent" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}