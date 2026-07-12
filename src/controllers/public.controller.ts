import { Request, Response } from 'express';
import { WargaService } from '../services/warga.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const wargaService = new WargaService();

const cekKartuSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 karakter'),
  tanggal_lahir: z.string().date('Format tanggal lahir harus YYYY-MM-DD'),
});

export const cekKartu = asyncHandler(async (req: Request, res: Response) => {
  const result = cekKartuSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, result.error.issues[0].message);
  }

  const { nik, tanggal_lahir } = result.data;
  const data = await wargaService.findByNikAndTanggalLahir(nik, tanggal_lahir);
  
  return successResponse(res, 200, 'Data kartu berhasil diambil.', data);
});
