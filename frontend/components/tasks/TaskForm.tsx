// Task Form Component (used for both create and edit)
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.date().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
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
    control,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultValues || { 
      title: "", 
      description: "",
      priority: "medium",
      due_date: null,
      is_recurring: false,
      recurrence_pattern: null,
    },
  });

  const isRecurring = watch("is_recurring");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
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

      {/* Description */}
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

      {/* Priority */}
      <div>
        <label
          htmlFor="priority"
          className="block text-xs tracking-wider uppercase mb-2"
          style={{ color: colors.textMuted }}
        >
          Priority
        </label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
              <SelectTrigger 
                className="w-full px-4 py-3"
                style={{
                  backgroundColor: colors.bgAlt,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Low</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>High</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.priority && (
          <p className="text-sm mt-1" style={{ color: "#dc2626" }}>
            {errors.priority.message}
          </p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label
          htmlFor="due_date"
          className="block text-xs tracking-wider uppercase mb-2"
          style={{ color: colors.textMuted }}
        >
          Due Date
        </label>
        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border flex items-center gap-2 justify-start text-left transition-all duration-200 hover:opacity-80"
                  style={{
                    backgroundColor: colors.bgAlt,
                    borderColor: colors.border,
                    color: field.value ? colors.text : colors.textMuted,
                  }}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={field.onChange}
                  disabled={isLoading}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.due_date && (
          <p className="text-sm mt-1" style={{ color: "#dc2626" }}>
            {errors.due_date.message}
          </p>
        )}
      </div>

      {/* Recurring Task */}
      <div className="flex items-start gap-3">
        <Controller
          name="is_recurring"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
              className="mt-1"
            />
          )}
        />
        <div>
          <label
            className="text-sm font-medium cursor-pointer"
            style={{ color: colors.text }}
          >
            Recurring Task
          </label>
          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            Set this task to repeat automatically
          </p>
        </div>
      </div>

      {/* Recurrence Pattern (conditional) */}
      {isRecurring && (
        <div>
          <label
            htmlFor="recurrence_pattern"
            className="block text-xs tracking-wider uppercase mb-2"
            style={{ color: colors.textMuted }}
          >
            Recurrence Pattern
          </label>
          <Controller
            name="recurrence_pattern"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange} 
                value={field.value || undefined} 
                disabled={isLoading}
              >
                <SelectTrigger 
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: colors.bgAlt,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.recurrence_pattern && (
            <p className="text-sm mt-1" style={{ color: "#dc2626" }}>
              {errors.recurrence_pattern.message}
            </p>
          )}
        </div>
      )}

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