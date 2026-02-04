'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DueDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
}

export function DueDatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select due date',
  id,
  'aria-label': ariaLabel = 'Select due date',
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (onChange) {
      onChange(date || null);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  const formattedDate = value ? format(value, 'MMM d, yyyy') : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-9',
            !value && 'text-muted-foreground',
            className
          )}
          aria-label={ariaLabel}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formattedDate || placeholder}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto"
              aria-label="Clear due date"
              title="Clear due date"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
}
