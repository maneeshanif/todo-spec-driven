"use client";

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityBadge } from '@/components/task/PriorityBadge';
import { CategoryBadge } from '@/components/task/CategoryBadge';
import { DueDateBadge } from '@/components/task/DueDateBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Filter,
  Search,
  ArrowUpDown,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '@/stores/task-store';
import { Task } from '@/types';

// Define types
type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'all' | 'completed' | 'pending';

type SortField = 'created_at' | 'due_date' | 'priority' | 'title' | 'updated_at';

export function TaskList() {
  const { tasks, categories, fetchTasks, toggleTaskCompletion, deleteTask, setFilters, filters } = useTaskStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<TaskStatus>(filters.completed === true ? 'completed' : filters.completed === false ? 'pending' : 'all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>(filters.priority || 'all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>(filters.categoryId || 'all');
  const [sortBy, setSortBy] = useState<SortField>(filters.sortBy as SortField || 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder || 'desc');

  // Update filters when local state changes
  useEffect(() => {
    const newFilters: any = {
      search: searchTerm || undefined,
      sortBy: sortBy,
      sortOrder: sortOrder,
    };

    if (statusFilter !== 'all') {
      newFilters.completed = statusFilter === 'completed';
    } else {
      newFilters.completed = undefined;
    }

    if (priorityFilter !== 'all') {
      newFilters.priority = priorityFilter;
    } else {
      newFilters.priority = undefined;
    }

    if (categoryFilter !== 'all') {
      newFilters.categoryId = categoryFilter;
    } else {
      newFilters.categoryId = undefined;
    }

    setFilters(newFilters);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder, setFilters]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Apply client-side filtering for display
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm && 
        !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'pending' && task.completed) return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && (!task.category_ids || !task.category_ids.includes(categoryFilter as number))) {
      return false;
    }

    return true;
  });

  // Apply client-side sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a[sortBy]).getTime();
        bValue = new Date(b[sortBy]).getTime();
        break;
      case 'due_date':
        aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a[sortBy]];
        bValue = priorityOrder[b[sortBy]];
        break;
      case 'title':
        aValue = a[sortBy];
        bValue = b[sortBy];
        break;
      case 'updated_at':
        aValue = new Date(a[sortBy]).getTime();
        bValue = new Date(b[sortBy]).getTime();
        break;
      default:
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="pl-8 pr-4 py-2 border rounded-md w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex">
            <Clock className="h-3 w-3 mr-1" />
            {sortedTasks.length} tasks
          </Badge>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <div className="flex gap-2">
                {(['all', 'completed', 'pending'] as TaskStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <div className="flex gap-2">
                <Button
                  variant={priorityFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter('all')}
                >
                  All
                </Button>
                {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
                  <Button
                    key={priority}
                    variant={priorityFilter === priority ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriorityFilter(priority)}
                    className="capitalize"
                  >
                    {priority}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={categoryFilter === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Sort by:</span>
        <Button
          variant={sortBy === 'created_at' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleSort('created_at')}
          className="px-2"
        >
          <span>Date</span>
          {sortBy === 'created_at' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          )}
        </Button>
        <Button
          variant={sortBy === 'due_date' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleSort('due_date')}
          className="px-2"
        >
          <Calendar className="h-3 w-3 mr-1" />
          <span>Due</span>
          {sortBy === 'due_date' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          )}
        </Button>
        <Button
          variant={sortBy === 'priority' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleSort('priority')}
          className="px-2 capitalize"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span>Priority</span>
          {sortBy === 'priority' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          )}
        </Button>
        <Button
          variant={sortBy === 'title' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => handleSort('title')}
          className="px-2"
        >
          <span>Title</span>
          {sortBy === 'title' && (
            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          )}
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-muted" />
            <p>No tasks found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center gap-3 p-4 rounded-lg border bg-card transition-colors ${
                task.completed ? 'opacity-70' : 'hover:bg-muted/50'
              }`}
            >
              <Checkbox 
                checked={task.completed} 
                onCheckedChange={() => toggleTaskCompletion(task.id)}
                className="mt-0.5"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium truncate ${
                    task.completed ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {task.title}
                  </h3>
                  {task.priority && !task.completed && (
                    <PriorityBadge priority={task.priority} />
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {categories
                    .filter(cat => task.category_ids?.includes(cat.id))
                    .map((category) => (
                      <CategoryBadge 
                        key={category.id} 
                        name={category.name} 
                        color={category.color} 
                      />
                    ))}
                  {task.due_date && !task.completed && (
                    <DueDateBadge dueDate={task.due_date} completed={task.completed} />
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('Edit task', task.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}