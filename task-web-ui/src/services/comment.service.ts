import apiClient from './api';
import type { ApiResponse, Comment } from '@/types';

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface UpdateCommentData {
  content: string;
}

export const commentService = {
  // Get comments for a task
  async getTaskComments(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch comments');
  },

  // Create a new comment
  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>('/comments', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create comment');
  },

  // Update a comment
  async updateComment(id: string, data: UpdateCommentData): Promise<Comment> {
    const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update comment');
  },

  // Delete a comment
  async deleteComment(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/comments/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete comment');
    }
  },
};

