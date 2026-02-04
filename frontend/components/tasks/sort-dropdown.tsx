'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskFilters } from '@/types';

type SortField = NonNullable<TaskFilters['sortBy']>;
type SortOrder = NonNullable<TaskFilters['sortOrder']>;

interface SortDropdownProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  className?: string;
}

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'created_at', label: 'Created date' },
  { field: 'due_date', label: 'Due date' },
  { field: 'priority', label: 'Priority' },
  { field: 'title', label: 'Name' },
  { field: 'updated_at', label: 'Updated date' },
];

const priorityOrder = { high: 3, medium: 2, low: 1 };

export function SortDropdown({ filters, className = '' }: SortDropdownProps) {
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'desc';

  const handleSortFieldChange = (field: SortField) => {
    filters.sortBy = field;
    filters.sortOrder = sortOrder;
  };

  const handleSortOrderToggle = () => {
    filters.sortBy = sortBy;
    filters.sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  };

  const getSortLabel = () => {
    const option = sortOptions.find((opt) => opt.field === sortBy);
    return option?.label || 'Created date';
  };

  return (
    <div className={cn('flex gap-2 items-center', className)}>
      {/* Sort field selector */}
      <Select value={sortBy} onValueChange={(val) => handleSortFieldChange(val as SortField)}>
        <SelectTrigger className="w-48" aria-label="Sort by">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.field} value={option.field}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort order toggle */}
      <button
        type="button"
        onClick={handleSortOrderToggle}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md border bg-background hover:bg-accent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label={`Sort order: ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
        title={`Currently ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
