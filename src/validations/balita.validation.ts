import { z } from 'zod';

export const createBalitaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date(),
  bb: z.number().positive(),
  tb: z.number().positive(),
  lingkar_kepala: z.number().positive(),
  lingkar_lengan_atas: z.number().positive(),
  nama_ortu: z.string().min(1),
});

export const updateBalitaSchema = createBalitaSchema.partial();
