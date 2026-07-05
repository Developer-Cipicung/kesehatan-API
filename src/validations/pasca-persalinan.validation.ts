import { z } from 'zod';

export const createPascaPersalinanSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  tanggal_persalinan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().positive(),
  tekanan_darah_sistolik: z.number().int().positive(),
  tekanan_darah_diastolik: z.number().int().positive(),
  suhu_tubuh: z.number().positive(),
  kondisi_ibu: z.string().optional(),
  keluhan: z.string().optional(),
});

export const updatePascaPersalinanSchema = createPascaPersalinanSchema.partial();
