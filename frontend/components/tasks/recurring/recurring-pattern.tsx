'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat, X, Calendar, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurringPatternProps {
  value?: RecurrencePattern;
  onChange?: (pattern: RecurrencePattern) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

const patternConfig = {
  none: {
    label: 'Does not repeat',
    icon: X,
    description: 'One-time task',
  },
  daily: {
    label: 'Daily',
    icon: CalendarClock,
    description: 'Repeats every day',
  },
  weekly: {
    label: 'Weekly',
    icon: Calendar,
    description: 'Repeats every week',
  },
  monthly: {
    label: 'Monthly',
    icon: Calendar,
    description: 'Repeats every month',
  },
  yearly: {
    label: 'Yearly',
    icon: Repeat,
    description: 'Repeats every year',
  },
};

export function RecurringPattern({
  value = 'none',
  onChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel = 'Select recurring pattern',
}: RecurringPatternProps) {
  const config = patternConfig[value] || patternConfig.none;
  const Icon = config.icon;

  return (
    <div className={cn('space-y-2', className)}>
      <Select
        value={value}
        onValueChange={(val) => onChange?.(val as RecurrencePattern)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-label={ariaLabel}>
          <SelectValue placeholder="Select recurrence" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(patternConfig).map(([key, config]) => {
            const ItemIcon = config.icon;
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Current selection indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">
        <Icon className="h-4 w-4" />
        <span>{config.description}</span>
      </div>
    </div>
  );
}
