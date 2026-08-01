import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createPascaPersalinanSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  tanggal_persalinan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  bb: emptyAsNull(z.number().min(0).optional().nullable()),
  tb: emptyAsNull(z.number().min(0).optional().nullable()),
  kondisi_ibu: emptyAsNull(z.string().optional().nullable()),
  tinggi_badan_bayi: emptyAsNull(z.number().min(0).optional().nullable()),
  berat_badan_bayi: emptyAsNull(z.number().min(0).optional().nullable()),
  tekanan_darah_sistolik: emptyAsNull(z.number().min(0).optional().nullable()),
  tekanan_darah_diastolik: emptyAsNull(z.number().min(0).optional().nullable()),
  kie: emptyAsNull(z.boolean().optional().nullable()),
  fasilitasi_rujukan: emptyAsNull(z.boolean().optional().nullable()),
  fasilitasi_bantuan_sosial: emptyAsNull(z.boolean().optional().nullable()),
  tanggal_kunjungan_berikut: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  catatan: emptyAsNull(z.string().optional().nullable()),
});

export const updatePascaPersalinanSchema = createPascaPersalinanSchema.partial();
