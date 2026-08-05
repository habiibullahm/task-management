import apiClient from './api';
import type { ApiResponse, Task, TaskStatus, Priority } from '@/types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assignedToId?: string;
  teamId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
  assignedToId?: string | null;
  teamId?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  teamId?: string;
  search?: string;
  sort?: 'dueDate' | 'updatedAt';
  page?: number;
  limit?: number;
}

export const taskService = {
  // Get all tasks with optional filters
  async getTasks(filters?: TaskFilters): Promise<{ tasks: Task[]; meta?: any }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks?${params.toString()}`);
    if (response.data.success && response.data.data) {
      return {
        tasks: response.data.data,
        meta: response.data.meta,
      };
    }
    throw new Error(response.data.message || 'Failed to fetch tasks');
  },

  // Get a single task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch task');
  },

  // Create a new task
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create task');
  },

  // Update a task
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update task');
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete task');
    }
  },

  // Update task status
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status });
  },

  // Assign task to user
  async assignTask(id: string, userId: string): Promise<Task> {
    return this.updateTask(id, { assignedToId: userId });
  },
};

