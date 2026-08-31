import { Request, Response } from 'express';
import { PendataanBulananService } from '../services/pendataan-bulanan.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { KategoriPendataan } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { getOptionalPosyanduId, getRequiredPosyanduId } from '../utils/posyandu';

const pendataanService = new PendataanBulananService();

export const getPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getOptionalPosyanduId(req);
  if (!posyanduId) {
    return successResponse(res, 200, 'Status pendataan berhasil diambil.', { status: 'draft' });
  }
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
  const posyanduId = getRequiredPosyanduId(req);
  const { bulan, tahun } = req.query;

  const result = await pendataanService.getStatus(
    posyanduId,
    parseInt(bulan as string),
    parseInt(tahun as string),
  );

  return successResponse(res, 200, 'Status pendataan berhasil diambil.', result);
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
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
  const posyanduId = getRequiredPosyanduId(req);
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

export const batalkanVerifikasi = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const id = req.params.id as string;
  const userId = req.appUser!.id;

  await pendataanService.batalkanVerifikasi(id, posyanduId, userId);

  return successResponse(res, 200, 'Status pendataan berhasil dibatalkan menjadi draft.', {});
});

export const batalkanPendataan = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const id = req.params.id as string;
  const userId = req.appUser!.id;

  await pendataanService.batalkanPendataan(id, posyanduId, userId);

  return successResponse(res, 200, 'Verifikasi pendataan berhasil dibatalkan.', {});
});
