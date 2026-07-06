import { Request, Response } from 'express';
import { WargaService } from '../services/warga.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { FindAllWargaParams } from '../repositories/warga.repository';
import { JenisKelamin } from '../../prisma/generated-schema';

const wargaService = new WargaService();

export const getWarga = asyncHandler(async (req: Request, res: Response) => {
  const params: FindAllWargaParams = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    jenisKelamin: req.query.jenis_kelamin as JenisKelamin,
    posyanduId: req.appUser!.posyandu_id,
  };

  const result = await wargaService.findAll(params);
  return successResponse(res, 200, 'Data warga berhasil diambil.', result);
});

export const getWargaById = asyncHandler(async (req: Request, res: Response) => {
  const data = await wargaService.findById(req.params.id as string, req.appUser!.posyandu_id);
  return successResponse(res, 200, 'Data warga berhasil diambil.', data);
});

export const createWarga = asyncHandler(async (req: Request, res: Response) => {
  const data = await wargaService.create(
    { ...req.body, posyandu_id: req.appUser!.posyandu_id },
    req.appUser!.id,
  );
  return successResponse(res, 201, 'Warga berhasil ditambahkan.', data);
});

export const updateWarga = asyncHandler(async (req: Request, res: Response) => {
  const data = await wargaService.update(
    req.params.id as string,
    req.body,
    req.appUser!.posyandu_id,
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Warga berhasil diubah.', data);
});

export const deleteWarga = asyncHandler(async (req: Request, res: Response) => {
  const data = await wargaService.delete(req.params.id as string, req.appUser!.posyandu_id, req.appUser!.id);
  return successResponse(res, 200, 'Warga berhasil dihapus.', data);
});
