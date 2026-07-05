import { z } from 'zod';

export const createImunisasiSchema = z.object({
  warga_id: z.string().uuid(),
  jenis_vaksin: z.string().min(1),
  tanggal_pemberian: z.string().date().transform(val => new Date(val).toISOString()),
});

export const updateImunisasiSchema = createImunisasiSchema.partial();
