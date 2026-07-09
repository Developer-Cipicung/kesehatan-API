import { Request, Response } from 'express';
import { ImunisasiService } from '../services/imunisasi.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getRequiredPosyanduId } from '../utils/posyandu';

const imunisasiService = new ImunisasiService();

export const getImunisasi = asyncHandler(async (req: Request, res: Response) => {
  const result = await imunisasiService.findAll({
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    posyanduId: getRequiredPosyanduId(req),
    wargaId: req.query.wargaId as string | undefined,
  });
  return successResponse(res, 200, 'Data riwayat imunisasi berhasil diambil.', result);
});

export const getImunisasiById = asyncHandler(async (req: Request, res: Response) => {
  const data = await imunisasiService.findById(req.params.id as string, getRequiredPosyanduId(req));
  return successResponse(res, 200, 'Data imunisasi berhasil diambil.', data);
});

export const getImunisasiHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await imunisasiService.findHistory(
    req.params.wargaId as string,
    getRequiredPosyanduId(req),
  );
  return successResponse(res, 200, 'Riwayat imunisasi berhasil diambil.', data);
});

export const createImunisasi = asyncHandler(async (req: Request, res: Response) => {
  const data = await imunisasiService.create(req.body, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 201, 'Riwayat imunisasi berhasil ditambahkan.', data);
});

export const updateImunisasi = asyncHandler(async (req: Request, res: Response) => {
  const data = await imunisasiService.update(
    req.params.id as string,
    req.body,
    getRequiredPosyanduId(req),
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Riwayat imunisasi berhasil diubah.', data);
});

export const deleteImunisasi = asyncHandler(async (req: Request, res: Response) => {
  const data = await imunisasiService.delete(req.params.id as string, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 200, 'Riwayat imunisasi berhasil dihapus.', data);
});
