// Task types
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string; // ISO date string
  category_ids?: number[];
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO date string
  category_ids?: number[];
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO date string
  category_ids?: number[];
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface TaskFilters {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  categoryId?: number;
  categoryIds?: number[]; // For filtering by multiple tags/categories
  search?: string;
  dueDateStart?: string; // ISO date string
  dueDateEnd?: string; // ISO date string
  sortBy?: 'created_at' | 'due_date' | 'priority' | 'title' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Category types
export interface Category {
  id: number;
  user_id: string;
  name: string;
  color?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

// User types
export interface User {
  id: string;
  name?: string;
  email: string;
  created_at: string; // ISO date string
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}