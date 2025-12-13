"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const config = {
    high: {
      variant: "destructive" as const,
      icon: ArrowUp,
      label: "High",
      className: "bg-red-500 text-white hover:bg-red-600"
    },
    medium: {
      variant: "default" as const,
      icon: AlertCircle,
      label: "Medium",
      className: "bg-yellow-500 text-white hover:bg-yellow-600"
    },
    low: {
      variant: "secondary" as const,
      icon: Minus,
      label: "Low",
      className: "bg-blue-500 text-white hover:bg-blue-600"
    }
  };

  const { icon: Icon, label, className: badgeClass } = config[priority] || config.medium;

  return (
    <Badge className={`flex items-center gap-1 ${badgeClass} ${className}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}
