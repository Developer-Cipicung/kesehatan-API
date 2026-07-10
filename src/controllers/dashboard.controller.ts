import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getOptionalPosyanduId } from '../utils/posyandu';

const dashboardService = new DashboardService();

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await dashboardService.getSummary(getOptionalPosyanduId(req));

  // Set Vercel Edge Caching (Cache for 5 mins, stale-while-revalidate for 10 mins)
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  return successResponse(res, 200, 'Ringkasan dashboard berhasil diambil.', result);
});
