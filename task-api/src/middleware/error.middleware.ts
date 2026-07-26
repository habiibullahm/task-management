import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import env from '../config/env';
import type { ApiErrorResponse, ValidationErrorItem } from '../utils/response.util';

/**
 * Operational application error. Controllers/services should throw this
 * (or call next(err)) so ErrorMiddleware.handle produces a consistent response.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public errors?: ValidationErrorItem[]
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

interface NormalizedError {
  statusCode: number;
  body: ApiErrorResponse;
}

export class ErrorMiddleware {
  /**
   * Global error handler — single exit point for all failed responses.
   * Contract: { success: false, message, errors?, stack? } with HTTP status as statusCode.
   */
  public static handle(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    const { statusCode, body } = ErrorMiddleware.normalize(err);
    res.status(statusCode).json(body);
  }

  private static normalize(err: Error): NormalizedError {
    const includeStack = env.isDevelopment();

    if (err instanceof AppError) {
      return {
        statusCode: err.statusCode,
        body: ErrorMiddleware.buildBody(err.message, err.errors, includeStack ? err.stack : undefined),
      };
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return ErrorMiddleware.normalizePrismaError(err, includeStack);
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: 400,
        body: ErrorMiddleware.buildBody(
          'Invalid data provided',
          undefined,
          includeStack ? err.stack : undefined
        ),
      };
    }

    if (
      err instanceof TokenExpiredError ||
      err instanceof JsonWebTokenError ||
      err instanceof NotBeforeError
    ) {
      const message = err instanceof TokenExpiredError ? 'Token expired' : 'Invalid token';
      return {
        statusCode: 401,
        body: ErrorMiddleware.buildBody(message, undefined, includeStack ? err.stack : undefined),
      };
    }

    console.error('Unhandled error:', err);
    return {
      statusCode: 500,
      body: ErrorMiddleware.buildBody(
        includeStack && err.message ? err.message : 'Internal server error',
        undefined,
        includeStack ? err.stack : undefined
      ),
    };
  }

  private static normalizePrismaError(
    err: Prisma.PrismaClientKnownRequestError,
    includeStack: boolean
  ): NormalizedError {
    const stack = includeStack ? err.stack : undefined;

    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target;
        const fields = Array.isArray(target)
          ? target.map(String)
          : target
            ? [String(target)]
            : [];
        const errors: ValidationErrorItem[] | undefined = fields.length
          ? fields.map((field) => ({ field, message: 'A record with this value already exists' }))
          : undefined;
        return {
          statusCode: 409,
          body: ErrorMiddleware.buildBody(
            'A record with this value already exists',
            errors,
            stack
          ),
        };
      }

      case 'P2025':
        return {
          statusCode: 404,
          body: ErrorMiddleware.buildBody('Record not found', undefined, stack),
        };

      case 'P2003':
        return {
          statusCode: 400,
          body: ErrorMiddleware.buildBody('Invalid reference to related record', undefined, stack),
        };

      default:
        return {
          statusCode: 400,
          body: ErrorMiddleware.buildBody('Database error', undefined, stack),
        };
    }
  }

  private static buildBody(
    message: string,
    errors?: ValidationErrorItem[],
    stack?: string
  ): ApiErrorResponse {
    return {
      success: false,
      message,
      ...(errors?.length ? { errors } : {}),
      ...(stack ? { stack } : {}),
    };
  }

  /**
   * Handle unmatched routes
   */
  public static notFound(req: Request, res: Response): void {
    const body: ApiErrorResponse = {
      success: false,
      message: `Route ${req.originalUrl} not found`,
    };
    res.status(404).json(body);
  }
}

export default ErrorMiddleware;
