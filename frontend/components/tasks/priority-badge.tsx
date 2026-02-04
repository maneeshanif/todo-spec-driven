'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUp, AlertCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Priority = 'low' | 'medium' | 'high';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showIcon?: boolean;
}

const priorityConfig = {
  high: {
    label: 'High',
    icon: ArrowUp,
    className: 'bg-red-500 text-white hover:bg-red-600',
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    className: 'bg-yellow-500 text-white hover:bg-yellow-600',
  },
  low: {
    label: 'Low',
    icon: Minus,
    className: 'bg-blue-500 text-white hover:bg-blue-600',
  },
};

export function PriorityBadge({ priority, className = '', showIcon = true }: PriorityBadgeProps) {
  const { icon: Icon, label, className: badgeClass } = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge className={cn('flex items-center gap-1', badgeClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}
