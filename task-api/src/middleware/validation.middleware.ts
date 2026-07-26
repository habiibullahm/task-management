import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './error.middleware';

export class ValidationMiddleware {
  /**
   * Validate request using express-validator.
   * Failures are forwarded to ErrorMiddleware via AppError (422).
   */
  public static validate(validations: ValidationChain[]) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        next();
        return;
      }

      const formattedErrors = errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg as string,
      }));

      next(new AppError(422, 'Validation failed', true, formattedErrors));
    };
  }
}

export default ValidationMiddleware;
