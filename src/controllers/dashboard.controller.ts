import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const dashboardService = new DashboardService();

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = req.user?.user_metadata?.posyandu_id;
  if (!posyanduId) {
    throw new AppError(403, 'User tidak memiliki akses ke posyandu manapun.');
  }

  const result = await dashboardService.getSummary(posyanduId);

  return successResponse(res, 200, 'Ringkasan dashboard berhasil diambil.', result);
});
