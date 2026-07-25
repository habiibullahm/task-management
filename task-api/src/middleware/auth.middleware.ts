import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { JwtUtil } from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';

export class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  public static authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ResponseUtil.unauthorized(res, 'No token provided');
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const payload = JwtUtil.verifyAccessToken(token);
        req.user = payload;
        next();
      } catch (error) {
        ResponseUtil.unauthorized(res, 'Invalid or expired token');
        return;
      }
    } catch (error) {
      ResponseUtil.serverError(res, 'Authentication error');
      return;
    }
  }

  /**
   * Check if user has required role
   */
  public static authorize(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, 'User not authenticated');
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        ResponseUtil.forbidden(res, 'Insufficient permissions');
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
        } catch (error) {
          // Token invalid but continue anyway
        }
      }

      next();
    } catch (error) {
      next();
    }
  }
}

export default AuthMiddleware;
