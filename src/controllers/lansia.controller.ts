import { Request, Response } from 'express';
import { LansiaService } from '../services/lansia.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const lansiaService = new LansiaService();

export const getLansia = asyncHandler(async (req: Request, res: Response) => {
  const result = await lansiaService.findAll({
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: (req.query.posyanduId as string) || req.appUser!.posyandu_id,
  });
  return successResponse(res, 200, 'Data pemeriksaan lansia berhasil diambil.', result);
});

export const getLansiaById = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await lansiaService.findById(req.params.id as string, posyanduId);
  return successResponse(res, 200, 'Data pemeriksaan lansia berhasil diambil.', data);
});

export const getLansiaHistory = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await lansiaService.findHistory(
    req.params.wargaId as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan lansia berhasil diambil.', data);
});

export const createLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.create(req.body, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan lansia berhasil ditambahkan.', data);
});

export const updateLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.update(
    req.params.id as string,
    req.body,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan lansia berhasil diubah.', data);
});

export const deleteLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.delete(req.params.id as string, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 200, 'Pemeriksaan lansia berhasil dihapus.', data);
});
