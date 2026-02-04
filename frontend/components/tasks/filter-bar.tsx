'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskFilters } from '@/types';

export type Priority = 'low' | 'medium' | 'high';

interface FilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters?: () => void;
  className?: string;
  availableTags?: { id: number; name: string }[];
}

export function FilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
  availableTags = [],
}: FilterBarProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  const hasActiveFilters = () => {
    return (
      filters.completed !== undefined ||
      filters.priority !== undefined ||
      filters.categoryId !== undefined ||
      filters.search !== undefined ||
      filters.dueDateStart !== undefined ||
      filters.dueDateEnd !== undefined
    );
  };

  const updateFilter = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateFilter('dueDateStart', date ? date.toISOString() : undefined);
    setDateOpen(false);
  };

  const handleTagToggle = (tagId: number) => {
    const currentTags = filters.categoryIds || [];
    const isSelected = currentTags.includes(tagId);

    if (isSelected) {
      updateFilter('categoryIds', currentTags.filter((id) => id !== tagId));
    } else {
      updateFilter('categoryIds', [...currentTags, tagId]);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Any date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const selectedTags = availableTags.filter((tag) =>
    (filters.categoryIds || []).includes(tag.id)
  );

  return (
    <div className={cn('flex flex-wrap gap-3 items-center', className)}>
      {/* Status filter */}
      <Select
        value={filters.completed === undefined ? 'all' : filters.completed.toString()}
        onValueChange={(val) =>
          updateFilter('completed', val === 'all' ? undefined : val === 'true')
        }
      >
        <SelectTrigger className="w-36" aria-label="Filter by status">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tasks</SelectItem>
          <SelectItem value="false">Active</SelectItem>
          <SelectItem value="true">Completed</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filters.priority || 'all'}
        onValueChange={(val) =>
          updateFilter('priority', val === 'all' ? undefined : (val as Priority))
        }
      >
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <Popover open={tagOpen} onOpenChange={setTagOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-36 justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Filter by tags</p>
              <div className="space-y-1">
                {availableTags.map((tag) => {
                  const isSelected = (filters.categoryIds || []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      )}
                      aria-pressed={isSelected}
                    >
                      <span>{tag.name}</span>
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Due date filter */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-48 justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDate(filters.dueDateStart)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={
              filters.dueDateStart ? new Date(filters.dueDateStart) : undefined
            }
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters button */}
      {hasActiveFilters() && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
