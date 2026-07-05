import { z } from 'zod';

export const createLansiaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().positive(),
  tb: z.number().positive(),
  tekanan_darah_sistolik: z.number().int().positive(),
  tekanan_darah_diastolik: z.number().int().positive(),
  gula_darah_sewaktu: z.number().int().positive(),
  keluhan: z.string().optional(),
});

export const updateLansiaSchema = createLansiaSchema.partial();
