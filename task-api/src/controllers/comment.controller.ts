import { Response, NextFunction } from 'express';
import { AuthRequest, CreateCommentDto, UpdateCommentDto } from '../types';
import commentService from '../services/comment.service';
import { ResponseUtil } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

export class CommentController {
  async listByTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const comments = await commentService.listByTask(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Comments retrieved successfully', comments);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: CreateCommentDto = req.body;
      const comment = await commentService.create(req.user.userId, data);
      ResponseUtil.created(res, 'Comment created successfully', comment);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: UpdateCommentDto = req.body;
      const comment = await commentService.update(req.user.userId, req.params.id, data);
      ResponseUtil.success(res, 'Comment updated successfully', comment);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await commentService.delete(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
