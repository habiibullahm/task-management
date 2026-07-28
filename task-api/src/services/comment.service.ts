import type { Comment } from '@prisma/client';
import commentRepository from '../repositories/comment.repository';
import taskService from './task.service';
import { AppError } from '../middleware/error.middleware';
import { CreateCommentDto, UpdateCommentDto } from '../types';

export class CommentService {
  async listByTask(userId: string, taskId: string): Promise<Comment[]> {
    // Ensures task exists and user can access it
    await taskService.getById(userId, taskId);
    return commentRepository.findByTaskId(taskId);
  }

  async create(userId: string, data: CreateCommentDto): Promise<Comment> {
    if (!data.content?.trim()) {
      throw new AppError(400, 'Content is required');
    }
    if (!data.taskId?.trim()) {
      throw new AppError(400, 'taskId is required');
    }

    await taskService.getById(userId, data.taskId);

    return commentRepository.create({
      content: data.content.trim(),
      task: { connect: { id: data.taskId } },
      user: { connect: { id: userId } },
    });
  }

  async update(userId: string, commentId: string, data: UpdateCommentDto): Promise<Comment> {
    if (!data.content?.trim()) {
      throw new AppError(400, 'Content is required');
    }

    const existing = await commentRepository.findById(commentId);
    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    await taskService.getById(userId, existing.taskId);

    if (existing.userId !== userId) {
      throw new AppError(403, 'Only the comment author can edit this comment');
    }

    return commentRepository.update(commentId, {
      content: data.content.trim(),
    });
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const existing = await commentRepository.findById(commentId);
    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    await taskService.getById(userId, existing.taskId);

    if (existing.userId !== userId) {
      throw new AppError(403, 'Only the comment author can delete this comment');
    }

    await commentRepository.delete(commentId);
  }
}

export default new CommentService();
