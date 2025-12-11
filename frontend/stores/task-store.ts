// Task state management with Zustand
import { create } from 'zustand';
import { getTasks, createTask, updateTask, deleteTask, Task } from '@/lib/api/tasks';

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
      const response = await getTasks(completed);
      set({ tasks: response.tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  addTask: async (title: string, description?: string) => {
    // Create optimistic task (temporary ID will be replaced with real ID from server)
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      title,
      description: description || '',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '', // Will be set by server
    };

    // Optimistic update - add task immediately
    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
      loading: true,
      error: null,
    }));

    try {
      const newTask = await createTask({ title, description });
      // Replace optimistic task with real task from server
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === optimisticTask.id ? newTask : t)),
        loading: false,
      }));
    } catch (error: any) {
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
      await updateTask(taskId, { completed: !task.completed });
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
      const updatedTask = await updateTask(taskId, { title, description });
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
      await deleteTask(taskId);
    } catch (error: any) {
      // Revert on error
      set({ tasks: previousTasks, error: error.message });
      throw error;
    }
  },
  
  clearError: () => set({ error: null }),
}));
