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
  jumlah_anak: z.number().int().min(0).optional(),
  riwayat_penyakit: z.string().optional(),
  kadar_hemoglobin: z.number().min(0).optional(),
  berat_janin: z.number().min(0).optional(),
  terpapar_rokok: z.boolean().optional(),
  kie: z.boolean().optional(),
  suplemen_tambah_darah: z.boolean().optional(),
  tanggal_kunjungan_berikut: z.string().date().transform(val => new Date(val).toISOString()).optional(),
  catatan: z.string().optional(),
});

export const updateBumilSchema = createBumilSchema.partial();
