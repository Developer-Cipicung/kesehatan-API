import { z } from 'zod';

export const createBumilSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().positive(),
  tb: z.number().positive(),
  lingkar_perut: z.number().positive(),
  lingkar_lengan_atas: z.number().positive(),
  usia_kehamilan_minggu: z.number().int().min(0),
  hpht: z.string().date().transform(val => new Date(val).toISOString()),
  htp: z.string().date().transform(val => new Date(val).toISOString()),
  tekanan_darah_sistolik: z.number().int().positive(),
  tekanan_darah_diastolik: z.number().int().positive(),
  tinggi_fundus: z.number().positive(),
  denyut_jantung_janin: z.number().int().positive(),
  hemoglobin: z.number().positive(),
  keluhan: z.string().optional(),
});

export const updateBumilSchema = createBumilSchema.partial();
