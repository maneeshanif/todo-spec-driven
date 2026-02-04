// Using the original task management components
"use client";

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/task-store';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarClock } from 'lucide-react';
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export default function TasksPage() {
  const { fetchTasks, setFilters, filters } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleQuickFilter = (filterType: 'today' | 'week' | 'all') => {
    const now = new Date();

    switch (filterType) {
      case 'today':
        setFilters({
          dueDateStart: startOfDay(now).toISOString(),
          dueDateEnd: endOfDay(now).toISOString(),
        });
        break;
      case 'week':
        setFilters({
          dueDateStart: startOfDay(now).toISOString(),
          dueDateEnd: addDays(now, 7).toISOString(),
        });
        break;
      case 'all':
        setFilters({
          dueDateStart: undefined,
          dueDateEnd: undefined,
        });
        break;
    }
  };

  const isFilterActive = (filterType: 'today' | 'week' | 'all') => {
    if (filterType === 'all') {
      return !filters.dueDateStart && !filters.dueDateEnd;
    }

    const now = new Date();
    const startStr = filters.dueDateStart;
    const endStr = filters.dueDateEnd;

    if (!startStr || !endStr) return false;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (filterType === 'today') {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      return (
        start.getTime() === todayStart.getTime() &&
        end.getTime() === todayEnd.getTime()
      );
    }

    if (filterType === 'week') {
      const weekStart = startOfDay(now);
      const weekEnd = addDays(now, 7);
      return (
        start.getTime() === weekStart.getTime() &&
        Math.abs(end.getTime() - weekEnd.getTime()) < 1000 * 60 * 60 * 24 // Within 1 day
      );
    }

    return false;
  };

  return (
    <>
      {/* Quick Filters - Render above the dashboard layout */}
      <div className="ml-[280px] px-8 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-muted-foreground">Quick filters:</span>

          <Badge
            variant={isFilterActive('all') ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => handleQuickFilter('all')}
          >
            All Tasks
          </Badge>

          <Badge
            variant={isFilterActive('today') ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
            onClick={() => handleQuickFilter('today')}
          >
            <CalendarClock className="h-3 w-3" />
            Due Today
          </Badge>

          <Badge
            variant={isFilterActive('week') ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
            onClick={() => handleQuickFilter('week')}
          >
            <Calendar className="h-3 w-3" />
            Due This Week
          </Badge>
        </div>
      </div>

      <DashboardLayout />
    </>
  );
}