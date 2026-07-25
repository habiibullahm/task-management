import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseUtil {
  /**
   * Send success response
   */
  public static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  public static error(
    res: Response,
    message: string,
    errors?: any,
    statusCode: number = 400
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  public static created<T>(res: Response, message: string, data?: T): Response {
    return this.success(res, message, data, 201);
  }

  /**
   * Send no content response
   */
  public static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send unauthorized response
   */
  public static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, null, 401);
  }

  /**
   * Send forbidden response
   */
  public static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, null, 403);
  }

  /**
   * Send not found response
   */
  public static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, null, 404);
  }

  /**
   * Send validation error response
   */
  public static validationError(res: Response, errors: any): Response {
    return this.error(res, 'Validation failed', errors, 422);
  }

  /**
   * Send internal server error response
   */
  public static serverError(
    res: Response,
    message: string = 'Internal server error',
    error?: any
  ): Response {
    return this.error(res, message, error, 500);
  }
}

export default ResponseUtil;
