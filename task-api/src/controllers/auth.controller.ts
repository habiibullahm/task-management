import { Response, NextFunction } from 'express';
import { AuthRequest, RegisterDto, LoginDto, RefreshTokenDto } from '../types';
import authService from '../services/auth.service';
import { ResponseUtil } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterDto = req.body;
      const result = await authService.register(data);

      ResponseUtil.created(res, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDto = req.body;
      const result = await authService.login(data);

      ResponseUtil.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;
      const tokens = await authService.refreshToken(refreshToken);

      ResponseUtil.success(res, 'Token refreshed successfully', tokens);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized');
      }

      const user = await authService.getProfile(req.user.userId);
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      ResponseUtil.success(res, 'Profile retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   * POST /api/v1/auth/logout
   */
  async logout(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token. This endpoint can be used for logging purposes
      // or for token blacklisting if implemented.

      ResponseUtil.success(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
