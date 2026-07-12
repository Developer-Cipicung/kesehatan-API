import { Request, Response } from 'express';
import { LansiaService } from '../services/lansia.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getOptionalPosyanduId, getRequiredPosyanduId } from '../utils/posyandu';

const lansiaService = new LansiaService();

export const getLansia = asyncHandler(async (req: Request, res: Response) => {
  const result = await lansiaService.findAll({
    bulan: req.query.bulan ? parseInt(req.query.bulan as string) : undefined,
    tahun: req.query.tahun ? parseInt(req.query.tahun as string) : undefined,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: getOptionalPosyanduId(req),
  });
  return successResponse(res, 200, 'Data pemeriksaan lansia berhasil diambil.', result);
});

export const getLansiaById = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const data = await lansiaService.findById(req.params.id as string, posyanduId);
  return successResponse(res, 200, 'Data pemeriksaan lansia berhasil diambil.', data);
});

export const getLansiaHistory = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const data = await lansiaService.findHistory(
    req.params.wargaId as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan lansia berhasil diambil.', data);
});

export const createLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.create(req.body, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan lansia berhasil ditambahkan.', data);
});

export const updateLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.update(
    req.params.id as string,
    req.body,
    getRequiredPosyanduId(req),
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan lansia berhasil diubah.', data);
});

export const deleteLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = await lansiaService.delete(req.params.id as string, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 200, 'Pemeriksaan lansia berhasil dihapus.', data);
});
