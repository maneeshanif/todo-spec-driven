"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  Plus, 
  Clock, 
  Tag,
  Recurring,
  AlertTriangle
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Define types
type Priority = 'low' | 'medium' | 'high';
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

interface Category {
  id: number;
  name: string;
  color: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: Date;
  categoryId?: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

interface TaskFormProps {
  initialData?: TaskFormData;
  categories: Category[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Work', color: 'blue' },
  { id: 2, name: 'Personal', color: 'green' },
  { id: 3, name: 'Shopping', color: 'purple' },
  { id: 4, name: 'Health', color: 'red' },
  { id: 5, name: 'Finance', color: 'yellow' },
];

export function TaskForm({ initialData, categories = DEFAULT_CATEGORIES, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate,
    categoryId: initialData?.categoryId,
    isRecurring: initialData?.isRecurring || false,
    recurrencePattern: initialData?.recurrencePattern || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        dueDate: initialData.dueDate,
        categoryId: initialData.categoryId,
        isRecurring: initialData.isRecurring || false,
        recurrencePattern: initialData.recurrencePattern || null,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="What needs to be done?"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add details..."
          rows={3}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Priority and Category - Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value: Priority) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Low</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Medium</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>High</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.categoryId?.toString() || undefined} 
            onValueChange={(value) => handleChange('categoryId', Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full bg-${category.color}-500`} 
                      style={{ backgroundColor: `var(--${category.color})` }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? format(formData.dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.dueDate}
              onSelect={(date) => handleChange('dueDate', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Recurring Task */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) => handleChange('isRecurring', checked as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="isRecurring"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Recurring Task
          </label>
          <p className="text-xs text-muted-foreground">
            Set this task to repeat
          </p>
        </div>
      </div>

      {/* Recurrence Pattern (only visible when recurring is checked) */}
      {formData.isRecurring && (
        <div>
          <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
          <Select 
            value={formData.recurrencePattern || undefined} 
            onValueChange={(value: RecurrencePattern) => handleChange('recurrencePattern', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}