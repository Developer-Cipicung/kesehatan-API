import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const dashboardService = new DashboardService();

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  let posyanduId: string | undefined = req.appUser!.posyandu_id;
  
  if (req.query.posyanduId === 'all') {
    posyanduId = undefined;
  } else if (req.query.posyanduId) {
    posyanduId = req.query.posyanduId as string;
  }

  const result = await dashboardService.getSummary(posyanduId);

  return successResponse(res, 200, 'Ringkasan dashboard berhasil diambil.', result);
});
