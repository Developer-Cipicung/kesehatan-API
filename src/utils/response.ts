import { Response } from 'express';

export const successResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T = {} as T,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: any[] = [],
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
