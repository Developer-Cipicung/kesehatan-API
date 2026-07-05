import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  return errorResponse(res, 404, 'Endpoint not found.');
};

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof ZodError) {
    return errorResponse(res, 422, 'Validation failed.', err.issues);
  }

  // Handle other known domain errors here (e.g. 400, 401, 403, 409)
  // For now, default to 500
  return errorResponse(res, 500, 'Internal server error.');
};
