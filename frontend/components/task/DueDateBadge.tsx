"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";

interface DueDateBadgeProps {
  dueDate: string | Date;
  completed?: boolean;
  className?: string;
}

export function DueDateBadge({ dueDate, completed = false, className = "" }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const now = new Date();
  const isOverdue = isPast(date) && !completed;
  const isDueToday = isToday(date);
  const isDueTomorrow = isTomorrow(date);
  const daysUntilDue = differenceInDays(date, now);

  let badgeClass = "bg-gray-500 text-white";
  let icon = Calendar;
  let label = format(date, "MMM d, yyyy");

  if (completed) {
    badgeClass = "bg-gray-400 text-white opacity-60";
    label = format(date, "MMM d");
  } else if (isOverdue) {
    badgeClass = "bg-red-600 text-white animate-pulse";
    icon = Clock;
    label = `Overdue ${Math.abs(daysUntilDue)}d`;
  } else if (isDueToday) {
    badgeClass = "bg-orange-500 text-white";
    icon = Clock;
    label = "Due Today";
  } else if (isDueTomorrow) {
    badgeClass = "bg-amber-500 text-white";
    label = "Due Tomorrow";
  } else if (daysUntilDue <= 7) {
    badgeClass = "bg-yellow-500 text-white";
    label = `Due in ${daysUntilDue}d`;
  } else {
    label = format(date, "MMM d");
  }

  const Icon = icon;

  return (
    <Badge className={`flex items-center gap-1 ${badgeClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}
