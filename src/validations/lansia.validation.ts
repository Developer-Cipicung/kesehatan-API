import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createLansiaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  bb: emptyAsNull(z.number().min(0).optional().nullable()),
  tb: emptyAsNull(z.number().min(0).optional().nullable()),
  tekanan_darah_sistolik: emptyAsNull(z.number().int().min(0).optional().nullable()),
  tekanan_darah_diastolik: emptyAsNull(z.number().int().min(0).optional().nullable()),
  gula_darah_sewaktu: emptyAsNull(z.number().min(0).optional().nullable()),
  kolesterol: emptyAsNull(z.number().int().min(0).optional().nullable()),
  asam_urat: emptyAsNull(z.number().min(0).optional().nullable()),
  catatan: emptyAsNull(z.string().optional().nullable()),
});

export const updateLansiaSchema = createLansiaSchema.partial();
