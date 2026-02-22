import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

// Prisma error types
interface PrismaError extends Error {
  code?: string;
  meta?: any;
  clientVersion?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorMiddleware {
  /**
   * Global error handler
   */
  public static handle(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(env.isDevelopment() && { stack: err.stack }),
      });
      return;
    }

    // Prisma errors - check by constructor name
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
      ErrorMiddleware.handlePrismaError(err as PrismaError, res);
      return;
    }

    // Prisma validation errors
    if (err.constructor.name === 'PrismaClientValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        ...(env.isDevelopment() && { error: err.message }),
      });
      return;
    }

    // Default error
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: env.isDevelopment() ? err.message : 'Internal server error',
      ...(env.isDevelopment() && { stack: err.stack }),
    });
  }

  /**
   * Handle Prisma-specific errors
   */
  private static handlePrismaError(err: PrismaError, res: Response): void {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        res.status(409).json({
          success: false,
          message: 'A record with this value already exists',
          field: err.meta?.target,
        });
        break;

      case 'P2025':
        // Record not found
        res.status(404).json({
          success: false,
          message: 'Record not found',
        });
        break;

      case 'P2003':
        // Foreign key constraint violation
        res.status(400).json({
          success: false,
          message: 'Invalid reference to related record',
        });
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Database error',
          ...(env.isDevelopment() && { code: err.code, meta: err.meta }),
        });
    }
  }

  /**
   * Handle 404 errors
   */
  public static notFound(req: Request, res: Response): void {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  }
}

export default ErrorMiddleware;
