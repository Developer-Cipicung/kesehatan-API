import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export const getMe = (req: Request, res: Response) => {
  // authMiddleware ensures req.user is set
  const user = req.user;

  return successResponse(res, 200, 'Operation successful.', { user });
};
