import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
    errors: [],
  });
};

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // Handle other known domain errors here (e.g. 400, 401, 403, 409)
  // For now, default to 500
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    errors: [],
  });
};
