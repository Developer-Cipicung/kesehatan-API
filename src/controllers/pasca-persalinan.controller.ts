import { Request, Response } from 'express';
import { PascaPersalinanService } from '../services/pasca-persalinan.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const pascaPersalinanService = new PascaPersalinanService();

export const getPascaPersalinan = asyncHandler(async (req: Request, res: Response) => {
  const result = await pascaPersalinanService.findAll({
    bulan: req.query.bulan ? parseInt(req.query.bulan as string) : undefined,
    tahun: req.query.tahun ? parseInt(req.query.tahun as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: (req.query.posyanduId as string) || req.appUser!.posyandu_id,
  });
  return successResponse(res, 200, 'Data pemeriksaan pasca persalinan berhasil diambil.', result);
});

export const getPascaPersalinanById = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await pascaPersalinanService.findById(
    req.params.id as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Data pemeriksaan pasca persalinan berhasil diambil.', data);
});

export const getPascaPersalinanHistory = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = (req.query.posyanduId as string) || req.appUser!.posyandu_id;
  const data = await pascaPersalinanService.findHistory(
    req.params.wargaId as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan pasca persalinan berhasil diambil.', data);
});

export const createPascaPersalinan = asyncHandler(async (req: Request, res: Response) => {
  const data = await pascaPersalinanService.create(req.body, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan pasca persalinan berhasil ditambahkan.', data);
});

export const updatePascaPersalinan = asyncHandler(async (req: Request, res: Response) => {
  const data = await pascaPersalinanService.update(
    req.params.id as string,
    req.body,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan pasca persalinan berhasil diubah.', data);
});

export const deletePascaPersalinan = asyncHandler(async (req: Request, res: Response) => {
  const data = await pascaPersalinanService.delete(
    req.params.id as string,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan pasca persalinan berhasil dihapus.', data);
});
