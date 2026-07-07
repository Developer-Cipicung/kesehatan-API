import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';
import { prisma } from '../lib/prisma';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new AppError(401, 'Invalid login credentials');
  }

  return successResponse(res, 200, 'Login successful.', data);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const appUser = req.appUser!;
  const posyandu = await prisma.posyandu.findUnique({
    where: { id: appUser.posyandu_id },
    select: { id: true, nama: true, kelurahan: true, kecamatan: true },
  });
  return successResponse(res, 200, 'Operation successful.', {
    user: req.user,
    app_user: appUser,
    posyandu,
  });
});
