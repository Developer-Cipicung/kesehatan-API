import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getOptionalPosyanduId } from '../utils/posyandu';

const dashboardService = new DashboardService();

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await dashboardService.getSummary(getOptionalPosyanduId(req));

  return successResponse(res, 200, 'Ringkasan dashboard berhasil diambil.', result);
});
