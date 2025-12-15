import apiClient from './client';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

// Task API functions
export const taskApi = {
  // Get all tasks with filters
  getAll: async (filters?: TaskFilters): Promise<{ data: Task[]; total: number }> => {
    const response = await apiClient.get('/api/tasks', {
      params: {
        completed: filters?.completed,
        priority: filters?.priority,
        category_id: filters?.categoryId,
        search: filters?.search,
        due_date_start: filters?.dueDateStart,
        due_date_end: filters?.dueDateEnd,
        sort_by: filters?.sortBy,
        sort_order: filters?.sortOrder,
        page: filters?.page,
        page_size: filters?.pageSize,
      }
    });
    // Backend returns { tasks: [], total, page, page_size }
    // Map to frontend expected format { data: [], total }
    const backendResponse = response.data;
    console.log('[taskApi] Backend response:', backendResponse);
    return {
      data: backendResponse.tasks || [],
      total: backendResponse.total || 0
    };
  },

  // Get a single task
  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get(`/api/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  create: async (taskData: CreateTaskInput): Promise<Task> => {
    const response = await apiClient.post('/api/tasks', taskData);
    return response.data;
  },

  // Update a task
  update: async (id: number, taskData: UpdateTaskInput): Promise<Task> => {
    const response = await apiClient.patch(`/api/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete a task
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/tasks/${id}`);
  },

  // Toggle task completion status
  toggleCompletion: async (id: number): Promise<Task> => {
    const response = await apiClient.patch(`/api/tasks/${id}`, {
      completed: true // or false depending on current state
    });
    return response.data;
  }
};

// Category API functions
export const categoryApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },

  // Get a single category
  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get(`/api/categories/${id}`);
    return response.data;
  },

  // Create a new category
  create: async (categoryData: CreateCategoryInput): Promise<Category> => {
    const response = await apiClient.post('/api/categories', categoryData);
    return response.data;
  },

  // Update a category
  update: async (id: number, categoryData: UpdateCategoryInput): Promise<Category> => {
    const response = await apiClient.put(`/api/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete a category
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/categories/${id}`);
  },

  // Create default categories
  createDefaults: async (): Promise<Category[]> => {
    const response = await apiClient.get('/api/categories/defaults');
    return response.data;
  }
};