import { z } from 'zod';

export const createBumilSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().min(0),
  tb: z.number().min(0),
  lingkar_perut: z.number().min(0),
  lingkar_lengan_atas: z.number().min(0),
  usia_kehamilan_minggu: z.number().int().min(0),
  hpht: z.string().date().transform(val => new Date(val).toISOString()),
  htp: z.string().date().transform(val => new Date(val).toISOString()),
  catatan: z.string().optional(),
});

export const updateBumilSchema = createBumilSchema.partial();
