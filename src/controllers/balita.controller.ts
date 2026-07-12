import { Request, Response } from 'express';
import { BalitaService } from '../services/balita.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { getOptionalPosyanduId, getRequiredPosyanduId } from '../utils/posyandu';
import { calculateZScoreWHO, classifyZScore } from '../utils/zscore';

const balitaService = new BalitaService();

export const getBalita = asyncHandler(async (req: Request, res: Response) => {
  const result = await balitaService.findAll({
    bulan: req.query.bulan ? parseInt(req.query.bulan as string) : undefined,
    tahun: req.query.tahun ? parseInt(req.query.tahun as string) : undefined,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    posyanduId: getOptionalPosyanduId(req),
  });
  return successResponse(res, 200, 'Data pemeriksaan balita berhasil diambil.', result);
});

export const getBalitaById = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const data = await balitaService.findById(req.params.id as string, posyanduId);
  return successResponse(res, 200, 'Data pemeriksaan balita berhasil diambil.', data);
});

export const getBalitaHistory = asyncHandler(async (req: Request, res: Response) => {
  const posyanduId = getRequiredPosyanduId(req);
  const data = await balitaService.findHistory(
    req.params.wargaId as string,
    posyanduId,
  );
  return successResponse(res, 200, 'Riwayat pemeriksaan balita berhasil diambil.', data);
});

export const createBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.create(req.body, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 201, 'Pemeriksaan balita berhasil ditambahkan.', data);
});

export const updateBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.update(
    req.params.id as string,
    req.body,
    getRequiredPosyanduId(req),
    req.appUser!.id,
  );
  return successResponse(res, 200, 'Pemeriksaan balita berhasil diubah.', data);
});

export const deleteBalita = asyncHandler(async (req: Request, res: Response) => {
  const data = await balitaService.delete(req.params.id as string, getRequiredPosyanduId(req), req.appUser!.id);
  return successResponse(res, 200, 'Pemeriksaan balita berhasil dihapus.', data);
});

export const calculateBalitaZscore = asyncHandler(async (req: Request, res: Response) => {
  const { jenis_kelamin, tanggal_lahir, tanggal_kunjungan, bb, tb, lingkar_kepala } = req.body;
  if (!jenis_kelamin || !tanggal_lahir || !tanggal_kunjungan || bb == null || tb == null) {
     return res.status(400).json({ success: false, message: 'Parameter tidak lengkap' });
  }
  
  const zscore = await calculateZScoreWHO({
     jenis_kelamin, 
     tanggal_lahir: new Date(tanggal_lahir),
     tanggal_kunjungan: new Date(tanggal_kunjungan),
     bb: Number(bb),
     tb: Number(tb),
     lingkar_kepala: lingkar_kepala ? Number(lingkar_kepala) : undefined
  });
  
  const categories = classifyZScore(zscore.bb_u, zscore.tb_u, zscore.bb_tb);
  
  return successResponse(res, 200, 'Z-Score berhasil dikalkulasi', { ...zscore, categories });
});
