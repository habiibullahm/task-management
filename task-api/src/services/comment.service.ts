import type { Comment } from '@prisma/client';
import commentRepository from '../repositories/comment.repository';
import taskService from './task.service';
import { AppError } from '../middleware/error.middleware';
import { CreateCommentDto, UpdateCommentDto } from '../types';
import { emitTaskRealtime } from '../realtime/socket';

export class CommentService {
  async listByTask(userId: string, taskId: string): Promise<Comment[]> {
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

    const task = await taskService.getById(userId, data.taskId);

    const comment = await commentRepository.create({
      content: data.content.trim(),
      task: { connect: { id: data.taskId } },
      user: { connect: { id: userId } },
    });

    void emitTaskRealtime({
      type: 'comment:created',
      message: `New comment on: ${task.title}`,
      actorUserId: userId,
      taskId: task.id,
      createdById: task.createdById,
      assignedToId: task.assignedToId,
      teamId: task.teamId,
      data: comment,
    });

    return comment;
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
