"use client";

import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function CategoryBadge({ name, color = "#6366f1", className = "" }: CategoryBadgeProps) {
  return (
    <Badge
      className={`flex items-center gap-1 ${className}`}
      style={{
        backgroundColor: color,
        color: "white",
        borderColor: color
      }}
    >
      <Tag className="w-3 h-3" />
      <span className="text-xs font-medium">{name}</span>
    </Badge>
  );
}
