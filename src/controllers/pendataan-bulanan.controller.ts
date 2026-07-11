import { Request, Response } from 'express';
import { PendataanBulananService } from '../services/pendataan-bulanan.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { KategoriPendataan } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { getRequiredPosyanduId } from '../utils/posyandu';

const pendataanService = new PendataanBulananService();

const getPosyanduId = (req: Request): string => {
  if (req.method === 'GET' && req.query.posyanduId) {
    return req.query.posyanduId as string;
  }

  return getRequiredPosyanduId(req);
};

export const getPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const { bulan, tahun } = req.query;

  const result = await pendataanService.getStatus(
    posyanduId,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status pendataan berhasil diambil.', result);
});

export const getPendataanStatusAll = asyncHandler(async (req: Request, res: Response) => {
  // We can just use getStatus here since it's now global per month
  const posyanduId = getPosyanduId(req);
  const { bulan, tahun } = req.query;

  const result = await pendataanService.getStatus(
    posyanduId,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status pendataan berhasil diambil.', result);
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const { bulan, tahun } = req.query;

  const result = await pendataanService.getSummaryList(
    posyanduId,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Ringkasan pendataan berhasil diambil.', result);
});

export const getAdminStatusAll = asyncHandler(async (req: Request, res: Response) => {

  const { tahun } = req.query;

  const result = await pendataanService.getAdminAllStatus(
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status pendataan seluruh posyandu berhasil diambil.', result);
});

export const selesaikanPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getPosyanduId(req);
  const id = req.params.id as string;
  const userId = req.appUser!.id;
  const { tanggal_pelaksanaan } = req.body;
  if (!tanggal_pelaksanaan) {
    throw new AppError(400, 'Tanggal pelaksanaan wajib diisi.');
  }

  await pendataanService.selesaikanPendataan(
    id,
    posyanduId,
    userId,
    tanggal_pelaksanaan
  );

  return successResponse(res, 200, 'Pendataan berhasil diselesaikan.', {});
});
