import { Request, Response } from 'express';
import { PendataanBulananService } from '../services/pendataan-bulanan.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { KategoriPendataan } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const pendataanService = new PendataanBulananService();

const getPosyanduId = (req: Request): string => {
  return req.appUser!.posyandu_id;
};

export const getPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const { kategori, bulan, tahun } = req.query;

  const result = await pendataanService.getStatus(
    posyanduId,
    kategori as KategoriPendataan,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status pendataan berhasil diambil.', result);
});

export const getPendataanStatusAll = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const { bulan, tahun } = req.query;

  const result = await pendataanService.getAllStatus(
    posyanduId,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status seluruh kategori berhasil diambil.', result);
});

export const selesaikanPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const { kategori, bulan, tahun } = req.body;
  const userId = req.appUser!.id;

  await pendataanService.selesaikanPendataan(
    posyanduId,
    kategori as KategoriPendataan,
    parseInt(bulan as string),
    parseInt(tahun as string),
    userId,
  );

  return successResponse(res, 200, 'Pendataan berhasil diselesaikan.', {});
});
