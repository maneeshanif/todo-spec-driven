// lib/api/stats.ts
import { apiClient } from './client';

export interface TasksByPriority {
  high: number;
  medium: number;
  low: number;
}

export interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  due_today: number;
  due_this_week: number;
  total_categories: number;
  tasks_by_priority: TasksByPriority;
}

export const statsApi = {
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/api/stats');
    // Backend returns data directly, not wrapped in { data: ... }
    return response.data;
  }
};
