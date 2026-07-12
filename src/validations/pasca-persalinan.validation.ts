import { z } from 'zod';

export const createPascaPersalinanSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  tanggal_persalinan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().min(0),
  tb: z.number().min(0).optional(),
  kondisi_ibu: z.string().optional(),
  tinggi_badan_bayi: z.number().min(0).optional(),
  berat_badan_bayi: z.number().min(0).optional(),
  tekanan_darah_sistolik: z.number().min(0).optional(),
  tekanan_darah_diastolik: z.number().min(0).optional(),
  kie: z.boolean().optional(),
  fasilitasi_rujukan: z.boolean().optional(),
  fasilitasi_bantuan_sosial: z.boolean().optional(),
  tanggal_kunjungan_berikut: z.string().date().transform(val => new Date(val).toISOString()).optional(),
  catatan: z.string().optional(),
});

export const updatePascaPersalinanSchema = createPascaPersalinanSchema.partial();
