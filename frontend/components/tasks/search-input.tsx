'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  debounceMs?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  debounceMs = 300,
  disabled = false,
  placeholder = 'Search tasks...',
  className = '',
  id,
  'aria-label': ariaLabel = 'Search tasks',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue || '');
  const [debouncedValue, setDebouncedValue] = useState(controlledValue || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
      setDebouncedValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounce effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(localValue);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, debounceMs]);

  // Notify parent of debounced value
  useEffect(() => {
    if (onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    setLocalValue('');
    setDebouncedValue('');
  };

  const hasValue = localValue.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type="text"
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label={ariaLabel}
        />
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Character count (optional, for accessibility) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {hasValue ? `Searching for: ${localValue}` : 'Search field is empty'}
      </div>
    </div>
  );
}
