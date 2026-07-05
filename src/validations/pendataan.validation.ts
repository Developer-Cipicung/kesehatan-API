import { z } from 'zod';

export const selesaikanPendataanSchema = z.object({
  kategori: z.enum(['balita', 'imunisasi', 'bumil', 'pasca_persalinan', 'lansia']),
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().positive(),
});

export const getPendataanStatusSchema = z.object({
  kategori: z.enum(['balita', 'imunisasi', 'bumil', 'pasca_persalinan', 'lansia']).optional(),
  bulan: z.string().regex(/^(1[0-2]|[1-9])$/, 'Invalid bulan'),
  tahun: z.string().regex(/^\d{4}$/, 'Invalid tahun'),
});
