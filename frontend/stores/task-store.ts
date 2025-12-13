// Task state management with Zustand
import { create } from 'zustand';
import { taskApi } from '@/lib/api/tasks';
import { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: (completed?: boolean) => Promise<void>;
  addTask: (title: string, description?: string) => Promise<void>;
  toggleTask: (taskId: number) => Promise<void>;
  updateTaskData: (taskId: number, title?: string, description?: string) => Promise<void>;
  removeTask: (taskId: number) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  
  fetchTasks: async (completed?: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await taskApi.getAll({ completed });
      console.log('Fetched tasks:', response.data);
      set({ tasks: response.data || [], loading: false });
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      set({ error: error.message, loading: false, tasks: [] });
    }
  },
  
  addTask: async (title: string, description?: string) => {
    // Create optimistic task (temporary ID will be replaced with real ID from server)
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      user_id: '', // Will be set by server
      title,
      description: description || '',
      completed: false,
      priority: 'medium', // Default priority
      due_date: undefined, // No due date by default
      category_ids: [],
      is_recurring: false,
      recurrence_pattern: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update - add task immediately
    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
      loading: true,
      error: null,
    }));

    try {
      const newTask = await taskApi.create({ title, description });
      console.log('Task created:', newTask);
      // Replace optimistic task with real task from server
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === optimisticTask.id ? newTask : t)),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Failed to create task:', error);
      // Rollback optimistic update on failure
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== optimisticTask.id),
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  },
  
  toggleTask: async (taskId: number) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
    
    try {
      await taskApi.update(taskId, { completed: !task.completed });
    } catch (error: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: task.completed } : t
        ),
        error: error.message,
      }));
    }
  },
  
  updateTaskData: async (taskId: number, title?: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const updatedTask = await taskApi.update(taskId, { title, description });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  removeTask: async (taskId: number) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
    
    try {
      await taskApi.delete(taskId);
    } catch (error: any) {
      // Revert on error
      set({ tasks: previousTasks, error: error.message });
      throw error;
    }
  },
  
  clearError: () => set({ error: null }),
}));
