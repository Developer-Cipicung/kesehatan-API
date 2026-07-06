import { Request, Response } from 'express';
import { BalitaService } from '../services/balita.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const balitaService = new BalitaService();

export const getBalita = asyncHandler(async (req: Request, res: Response) => {
  const result = await balitaService.findAll({
    bulan: req.query.bulan ? parseInt(req.query.bulan as string) : undefined,
    tahun: req.query.tahun ? parseInt(req.query.tahun as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: req.appUser!.posyandu_id,
  });
  return successResponse(res, 200, 'Data pemeriksaan balita berhasil diambil.', result);
});

export const getBalitaById = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.findById(req.params.id as string, req.appUser!.posyandu_id);
  return successResponse(res, 200, 'Data pemeriksaan balita berhasil diambil.', data);
});

export const getBalitaHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.findHistory(
    req.params.wargaId as string,
    req.appUser!.posyandu_id,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan balita berhasil diambil.', data);
});

export const createBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.create(req.body, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan balita berhasil ditambahkan.', data);
});

export const updateBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.update(
    req.params.id as string,
    req.body,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan balita berhasil diubah.', data);
});

export const deleteBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.delete(req.params.id as string, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 200, 'Pemeriksaan balita berhasil dihapus.', data);
});
