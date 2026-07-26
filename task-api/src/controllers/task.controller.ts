import { Response, NextFunction } from 'express';
import { AuthRequest, CreateTaskDto, UpdateTaskDto } from '../types';
import taskService from '../services/task.service';
import { ResponseUtil } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

export class TaskController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const result = await taskService.list(req.user.userId, {
        status: req.query.status ? String(req.query.status) : undefined,
        priority: req.query.priority ? String(req.query.priority) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        page: Number.isFinite(page) ? page : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      ResponseUtil.success(res, 'Tasks retrieved successfully', result.tasks, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const task = await taskService.getById(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Task retrieved successfully', task);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: CreateTaskDto & { status?: string } = req.body;
      const task = await taskService.create(req.user.userId, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });

      ResponseUtil.created(res, 'Task created successfully', task);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: UpdateTaskDto = req.body;
      const task = await taskService.update(req.user.userId, req.params.id, {
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : undefined) : undefined,
      });

      ResponseUtil.success(res, 'Task updated successfully', task);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await taskService.delete(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
