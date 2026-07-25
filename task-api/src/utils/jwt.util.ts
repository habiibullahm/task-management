import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtUtil {
  /**
   * Generate access token
   */
  public static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.get('JWT_SECRET'), {
      expiresIn: env.get('JWT_EXPIRES_IN'),
    });
  }

  /**
   * Generate refresh token
   */
  public static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.get('JWT_REFRESH_SECRET'), {
      expiresIn: env.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  /**
   * Verify access token
   */
  public static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.get('JWT_SECRET')) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  public static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.get('JWT_REFRESH_SECRET')) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification
   */
  public static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}

export default JwtUtil;
