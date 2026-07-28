import { Response, NextFunction } from 'express';
import {
  AddTeamMemberDto,
  AuthRequest,
  CreateTeamDto,
  UpdateTeamDto,
  UpdateTeamMemberDto,
} from '../types';
import teamService from '../services/team.service';
import { ResponseUtil } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

export class TeamController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const teams = await teamService.list(req.user.userId);
      ResponseUtil.success(res, 'Teams retrieved successfully', teams);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const team = await teamService.getById(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Team retrieved successfully', team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: CreateTeamDto = req.body;
      const team = await teamService.create(req.user.userId, data);
      ResponseUtil.created(res, 'Team created successfully', team);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: UpdateTeamDto = req.body;
      const team = await teamService.update(req.user.userId, req.params.id, data);
      ResponseUtil.success(res, 'Team updated successfully', team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await teamService.delete(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Team deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const members = await teamService.listMembers(req.user.userId, req.params.id);
      ResponseUtil.success(res, 'Team members retrieved successfully', members);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: AddTeamMemberDto = req.body;
      const member = await teamService.addMember(req.user.userId, req.params.id, data);
      ResponseUtil.created(res, 'Team member added successfully', member);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const data: UpdateTeamMemberDto = req.body;
      const member = await teamService.updateMemberRole(
        req.user.userId,
        req.params.id,
        req.params.memberId,
        data
      );
      ResponseUtil.success(res, 'Team member role updated successfully', member);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      await teamService.removeMember(req.user.userId, req.params.id, req.params.memberId);
      ResponseUtil.success(res, 'Team member removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new TeamController();
