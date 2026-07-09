import { z } from 'zod';

export const createPascaPersalinanSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  tanggal_persalinan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().min(0),
  tekanan_darah_sistolik: z.number().int().min(0),
  tekanan_darah_diastolik: z.number().int().min(0),
  suhu_tubuh: z.number().min(0),
  kondisi_ibu: z.string().optional(),
  catatan: z.string().optional(),
});

export const updatePascaPersalinanSchema = createPascaPersalinanSchema.partial();
