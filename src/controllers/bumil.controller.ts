import { Request, Response } from 'express';
import { BumilService } from '../services/bumil.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const bumilService = new BumilService();

export const getBumil = asyncHandler(async (req: Request, res: Response) => {
  const result = await bumilService.findAll({
    bulan: req.query.bulan ? parseInt(req.query.bulan as string) : undefined,
    tahun: req.query.tahun ? parseInt(req.query.tahun as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: (req.query.posyanduId as string) || req.appUser!.posyandu_id,
  });
  return successResponse(res, 200, 'Data pemeriksaan bumil berhasil diambil.', result);
});

export const getBumilById = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await bumilService.findById(req.params.id as string, posyanduId);
  return successResponse(res, 200, 'Data pemeriksaan bumil berhasil diambil.', data);
});

export const getBumilHistory = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await bumilService.findHistory(
    req.params.wargaId as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan bumil berhasil diambil.', data);
});

export const createBumil = asyncHandler(async (req: Request, res: Response) => {
  const data = await bumilService.create(req.body, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan bumil berhasil ditambahkan.', data);
});

export const updateBumil = asyncHandler(async (req: Request, res: Response) => {
  const data = await bumilService.update(
    req.params.id as string,
    req.body,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan bumil berhasil diubah.', data);
});

export const deleteBumil = asyncHandler(async (req: Request, res: Response) => {
  const data = await bumilService.delete(req.params.id as string, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 200, 'Pemeriksaan bumil berhasil dihapus.', data);
});
