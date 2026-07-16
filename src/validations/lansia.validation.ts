import { z } from 'zod';

export const createLansiaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().min(0),
  tb: z.number().min(0),
  tekanan_darah_sistolik: z.number().int().min(0),
  tekanan_darah_diastolik: z.number().int().min(0),
  gula_darah_sewaktu: z.number().min(0).optional(),
  kolesterol: z.number().int().min(0).optional(),
  asam_urat: z.number().min(0).optional(),
  catatan: z.string().optional(),
});

export const updateLansiaSchema = createLansiaSchema.partial();
