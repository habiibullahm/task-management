import { create } from 'zustand';
import { taskService, type CreateTaskData, type UpdateTaskData, type TaskFilters } from '@/services/task.service';
import { handleApiError } from '@/services/api';
import type { Task, TaskStatus } from '@/types';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  
  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  clearError: () => void;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchTasks: async (filters?: TaskFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { tasks } = await taskService.getTasks(filters || get().filters);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: handleApiError(error, 'Failed to fetch tasks'), isLoading: false });
    }
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.getTask(id);
      set({ currentTask: task, isLoading: false });
    } catch (error) {
      set({ error: handleApiError(error, 'Failed to fetch task'), isLoading: false });
    }
  },

  createTask: async (data: CreateTaskData) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.createTask(data);
      set((state) => {
        // Realtime may have already inserted this task before the HTTP response returns.
        if (state.tasks.some((t) => t.id === task.id)) {
          return {
            tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
            isLoading: false,
          };
        }
        return { tasks: [...state.tasks, task], isLoading: false };
      });
      return task;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create task');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await taskService.updateTask(id, data);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }));
      return updatedTask;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update task');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete task');
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status } : task
      ),
    }));

    try {
      const updatedTask = await taskService.updateTaskStatus(id, status);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
      }));
    } catch (error) {
      // Revert on error
      const errorMessage = handleApiError(error, 'Failed to update task status');
      set({ tasks: previousTasks, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setFilters: (filters: TaskFilters) => {
    set({ filters });
    get().fetchTasks(filters);
  },

  clearError: () => set({ error: null }),
  
  setCurrentTask: (task: Task | null) => set({ currentTask: task }),
}));

