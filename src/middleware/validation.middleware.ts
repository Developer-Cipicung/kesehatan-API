import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      Object.defineProperty(req, 'body', { value: validated, writable: true });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError || error.name === 'ZodError') {
        return errorResponse(res, 422, 'Validation failed.', error.issues || error.errors);
      }
      return errorResponse(res, 500, 'Internal server error during validation.', error.message ? { msg: error.message } : error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      Object.defineProperty(req, 'query', { value: validated, writable: true });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError || error.name === 'ZodError') {
        return errorResponse(res, 422, 'Query validation failed.', error.issues || error.errors);
      }
      return errorResponse(res, 500, 'Internal server error during validation.', error.message ? { msg: error.message } : error);
    }
  };
};
