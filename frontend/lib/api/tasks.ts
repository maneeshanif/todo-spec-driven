// Task API functions
import apiClient from './client';

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  completed?: boolean;
}

/**
 * Get all tasks with optional filtering and pagination
 */
export async function getTasks(
  completed?: boolean,
  page: number = 1,
  pageSize: number = 50
): Promise<TaskListResponse> {
  try {
    const params: any = { page, page_size: pageSize };
    if (completed !== undefined) {
      params.completed = completed;
    }
    
    const response = await apiClient.get<TaskListResponse>('/api/tasks', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch tasks');
  }
}

/**
 * Get a specific task by ID
 */
export async function getTask(taskId: number): Promise<Task> {
  try {
    const response = await apiClient.get<Task>(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch task');
  }
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  try {
    const response = await apiClient.post<Task>('/api/tasks', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to create task');
  }
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: number, data: UpdateTaskData): Promise<Task> {
  try {
    const response = await apiClient.patch<Task>(`/api/tasks/${taskId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to update task');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<void> {
  try {
    await apiClient.delete(`/api/tasks/${taskId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to delete task');
  }
}
