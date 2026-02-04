// Task state management with Zustand
import { create } from 'zustand';
import { taskApi } from '@/lib/api/tasks';
import { Task, TaskFilters } from '@/types';
import { WebSocketMessage, TaskEventType } from '@/lib/websocket/sync-client';
import { showTaskNotification } from '@/components/tasks/notification-toast';

// Debounce helper
let searchDebounceTimer: NodeJS.Timeout | null = null;

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  searchQuery: string;
  wsEnabled: boolean; // WebSocket sync enabled flag

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
  setWebSocketEnabled: (enabled: boolean) => void;
  addTask: (data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: Date | null;
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  }) => Promise<void>;
  toggleTask: (taskId: number) => Promise<void>;
  completeTaskByName: (taskName: string) => Promise<{ success: boolean; taskTitle?: string }>;
  updateTaskData: (taskId: number, title?: string, description?: string) => Promise<void>;
  removeTask: (taskId: number) => Promise<void>;
  clearError: () => void;
}

const defaultFilters: TaskFilters = {
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: defaultFilters,
  searchQuery: '',
  wsEnabled: false,

  fetchTasks: async (filters?: TaskFilters) => {
    set({ loading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await taskApi.getAll(mergedFilters);
      console.log('Fetched tasks:', response.data);
      set({ tasks: response.data || [], loading: false });
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      set({ error: error.message, loading: false, tasks: [] });
    }
  },

  setFilters: (newFilters: Partial<TaskFilters>) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });
    // Refetch with new filters
    get().fetchTasks(updatedFilters);
  },

  clearFilters: () => {
    set({ filters: defaultFilters, searchQuery: '' });
    get().fetchTasks(defaultFilters);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Debounce search API calls (300ms delay)
    searchDebounceTimer = setTimeout(() => {
      const currentFilters = get().filters;
      const updatedFilters = {
        ...currentFilters,
        search: query.trim() || undefined,
      };
      set({ filters: updatedFilters });
      get().fetchTasks(updatedFilters);
    }, 300);
  },
  
  addTask: async (data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: Date | null;
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  }) => {
    const { title, description, priority = 'medium', due_date, is_recurring = false, recurrence_pattern } = data;
    
    // Create optimistic task (temporary ID will be replaced with real ID from server)
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      user_id: '', // Will be set by server
      title,
      description: description || '',
      completed: false,
      priority,
      due_date: due_date ? due_date.toISOString() : undefined,
      category_ids: [],
      is_recurring,
      recurrence_pattern: recurrence_pattern || undefined,
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
      const newTask = await taskApi.create({
        title,
        description,
        priority,
        due_date: due_date ? due_date.toISOString() : undefined,
        is_recurring,
        recurrence_pattern: recurrence_pattern || undefined,
      });
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

  completeTaskByName: async (taskName: string) => {
    const tasks = get().tasks;
    // Find task by partial name match (case-insensitive)
    const task = tasks.find((t) =>
      !t.completed && t.title.toLowerCase().includes(taskName.toLowerCase())
    );

    if (!task) {
      return { success: false };
    }

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? { ...t, completed: true } : t
      ),
    }));

    try {
      await taskApi.update(task.id, { completed: true });
      return { success: true, taskTitle: task.title };
    } catch (error: any) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: false } : t
        ),
        error: error.message,
      }));
      return { success: false };
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

  /**
   * Handle WebSocket messages for real-time task updates
   *
   * @param message - WebSocket message containing task update
   */
  handleWebSocketMessage: (message: WebSocketMessage) => {
    if (message.type !== 'task_update' || !message.event || !message.task) {
      return;
    }

    const { event, task } = message;

    // Update local state based on event type
    set((state) => {
      let updatedTasks = [...state.tasks];

      switch (event) {
        case 'task.created':
          // Add new task if not already present
          if (!updatedTasks.some((t) => t.id === task.id)) {
            updatedTasks = [task, ...updatedTasks];
          }
          break;

        case 'task.updated':
        case 'task.completed':
          // Update existing task (prefer remote state)
          updatedTasks = updatedTasks.map((t) => (t.id === task.id ? task : t));
          break;

        case 'task.deleted':
          // Remove deleted task
          updatedTasks = updatedTasks.filter((t) => t.id !== task.id);
          break;

        default:
          console.warn('[TaskStore] Unknown event type:', event);
      }

      return { tasks: updatedTasks };
    });

    // Show notification toast (only if WebSocket sync is enabled)
    if (get().wsEnabled) {
      showTaskNotification(event, task);
    }
  },

  /**
   * Enable/disable WebSocket sync and notifications
   *
   * @param enabled - Whether WebSocket sync is enabled
   */
  setWebSocketEnabled: (enabled: boolean) => set({ wsEnabled: enabled }),
}));
