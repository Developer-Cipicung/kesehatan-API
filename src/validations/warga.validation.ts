import { z } from 'zod';

export const createWargaSchema = z.object({
  nomor: z.string().min(1),
  nik: z.string().length(16),
  nama: z.string().min(1),
  jenis_kelamin: z.enum(['L', 'P']),
  tanggal_lahir: z.string().date().transform(val => new Date(val).toISOString()),
});

export const updateWargaSchema = createWargaSchema.partial();
