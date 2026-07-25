import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ResponseUtil } from '../utils/response.util';

export class ValidationMiddleware {
  /**
   * Validate request using express-validator
   */
  public static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Run all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        next();
        return;
      }

      // Format errors
      const formattedErrors = errors.array().map((err) => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      }));

      ResponseUtil.validationError(res, formattedErrors);
    };
  }
}

export default ValidationMiddleware;
