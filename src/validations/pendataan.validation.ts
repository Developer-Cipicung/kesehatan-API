import { z } from 'zod';

export const selesaikanPendataanSchema = z.object({
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().positive(),
});

export const getPendataanStatusSchema = z.object({
  bulan: z.string().regex(/^[1-9]|1[0-2]$/, 'Bulan harus berupa angka 1-12'),
  tahun: z.string().regex(/^\d{4}$/, 'Tahun harus berupa 4 digit angka'),
});

export const getAdminStatusSchema = z.object({
  tahun: z.string().regex(/^\d{4}$/, 'Tahun harus berupa 4 digit angka'),
});
