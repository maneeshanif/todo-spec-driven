'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, AlertCircle, Minus } from 'lucide-react';

export type Priority = 'low' | 'medium' | 'high';

interface PrioritySelectorProps {
  value?: Priority;
  onChange?: (priority: Priority) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

const priorityConfig = {
  high: {
    label: 'High',
    icon: ArrowUp,
    color: 'text-red-500',
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    color: 'text-yellow-500',
  },
  low: {
    label: 'Low',
    icon: Minus,
    color: 'text-blue-500',
  },
};

export function PrioritySelector({
  value,
  onChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel = 'Select priority',
}: PrioritySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(priorityConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
