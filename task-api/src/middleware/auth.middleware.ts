import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from './error.middleware';

export class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  public static authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(new AppError(401, 'No token provided'));
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const payload = JwtUtil.verifyAccessToken(token);
        req.user = payload;
        next();
      } catch {
        next(new AppError(401, 'Invalid or expired token'));
      }
    } catch {
      next(new AppError(500, 'Authentication error'));
    }
  }

  /**
   * Check if user has required role
   */
  public static authorize(...allowedRoles: string[]) {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(new AppError(401, 'User not authenticated'));
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        next(new AppError(403, 'Insufficient permissions'));
        return;
      }

      next();
    };
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  public static optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const payload = JwtUtil.verifyAccessToken(token);
          req.user = payload;
        } catch {
          // Token invalid but continue anyway
        }
      }

      next();
    } catch {
      next();
    }
  }
}

export default AuthMiddleware;
