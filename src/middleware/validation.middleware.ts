import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(res, 422, 'Validation failed.', error.issues);
      }
      return errorResponse(res, 500, 'Internal server error during validation.');
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(res, 422, 'Query validation failed.', error.issues);
      }
      return errorResponse(res, 500, 'Internal server error during validation.');
    }
  };
};
