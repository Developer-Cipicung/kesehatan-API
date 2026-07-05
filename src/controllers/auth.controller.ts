import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new AppError(401, 'Invalid login credentials');
  }

  return successResponse(res, 200, 'Login successful.', data);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  return successResponse(res, 200, 'Operation successful.', { user });
});
