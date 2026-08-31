import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { AppError } from '../utils/AppError';
import { prisma } from '../lib/prisma';
import { getOptionalPosyanduId } from '../utils/posyandu';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const appUser = await prisma.user.findUnique({
    where: { username },
    select: { auth_id: true },
  });
  let email = username;

  if (appUser) {
    const { data: authData, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(appUser.auth_id);
    if (authLookupError || !authData.user?.email) {
      throw new AppError(401, 'Invalid login credentials');
    }
    email = authData.user.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new AppError(401, 'Invalid login credentials');
  }

  return successResponse(res, 200, 'Login successful.', data);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const appUser = req.appUser!;
  const posyanduId = getOptionalPosyanduId(req);
  const posyandu = posyanduId ? await prisma.posyandu.findUnique({
    where: { id: posyanduId },
    select: { id: true, nama: true, rw: true },
  }) : null;
  return successResponse(res, 200, 'Operation successful.', {
    user: req.user,
    app_user: appUser,
    posyandu,
  });
});
