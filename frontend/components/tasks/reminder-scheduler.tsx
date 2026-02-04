'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReminderPreset = 'none' | '1h' | '1d' | '1w' | 'custom';

interface ReminderSchedulerProps {
  dueDate?: Date | null;
  value?: Date | null;
  onChange?: (reminderDate: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

const presetConfig = {
  none: { label: 'No reminder', value: 0 },
  '1h': { label: '1 hour before', value: 60 * 60 * 1000 },
  '1d': { label: '1 day before', value: 24 * 60 * 60 * 1000 },
  '1w': { label: '1 week before', value: 7 * 24 * 60 * 60 * 1000 },
};

export function ReminderScheduler({
  dueDate,
  value,
  onChange,
  disabled = false,
  className = '',
}: ReminderSchedulerProps) {
  const [preset, setPreset] = useState<ReminderPreset>('none');
  const [customTime, setCustomTime] = useState<string>('');

  useEffect(() => {
    if (!value || !dueDate) {
      setPreset('none');
      setCustomTime('');
      return;
    }

    const diff = dueDate.getTime() - value.getTime();

    // Check against presets
    const match = Object.entries(presetConfig).find(([_, config]) => config.value === diff);
    if (match) {
      setPreset(match[0] as ReminderPreset);
      setCustomTime('');
    } else {
      setPreset('custom');
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      setCustomTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [value, dueDate]);

  const handlePresetChange = (newPreset: ReminderPreset) => {
    setPreset(newPreset);

    if (newPreset === 'none') {
      if (onChange) onChange(null);
    } else if (newPreset === 'custom') {
      // Don't calculate yet, wait for user input
    } else if (dueDate && onChange) {
      const offset = presetConfig[newPreset].value;
      const reminderDate = new Date(dueDate.getTime() - offset);
      onChange(reminderDate);
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTime(e.target.value);

    if (!dueDate) return;

    // Parse time format HH:mm
    const match = e.target.value.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const [, hours, minutes] = match;
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const offset = totalMinutes * 60 * 1000;

      const reminderDate = new Date(dueDate.getTime() - offset);
      onChange?.(reminderDate);
    }
  };

  const formatReminderDate = () => {
    if (!value) return '';

    const now = new Date();
    const isPast = value < now;

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };

    if (value.getDate() === new Date().getDate()) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      return `Today at ${value.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    }

    return value.toLocaleDateString('en-US', options);
  };

  const isCustomValid = /^(\d{1,2}):(\d{2})$/.test(customTime) && parseInt(customTime.split(':')[0]) < 24 && parseInt(customTime.split(':')[1]) < 60;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Reminder</label>
        <Select
          value={preset}
          onValueChange={(val) => handlePresetChange(val as ReminderPreset)}
          disabled={disabled || !dueDate}
        >
          <SelectTrigger aria-label="Select reminder preset">
            <SelectValue placeholder="Select reminder" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(presetConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom time input */}
      {preset === 'custom' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Time before due date</label>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              value={customTime}
              onChange={handleCustomTimeChange}
              placeholder="HH:mm"
              maxLength={5}
              disabled={disabled || !dueDate}
              className={cn('w-32', !isCustomValid && 'border-destructive')}
              aria-label="Custom reminder time in hours and minutes"
            />
            <span className="text-sm text-muted-foreground">before due date</span>
          </div>

          {/* Help text */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Enter time in format HH:mm (e.g., 02:30 for 2 hours 30 minutes)</p>
          </div>
        </div>
      )}

      {/* Show scheduled reminder */}
      {value && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-md border border-primary/20">
          <Clock className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Reminder scheduled</p>
            <p className="text-sm text-muted-foreground">{formatReminderDate()}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePresetChange('none')}
            disabled={disabled}
            aria-label="Remove reminder"
          >
            Clear
          </Button>
        </div>
      )}

      {!dueDate && (
        <p className="text-sm text-muted-foreground">
          Select a due date first to set a reminder.
        </p>
      )}
    </div>
  );
}
