import { z } from 'zod';

export const createBalitaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: z.string().date().transform(val => new Date(val).toISOString()),
  bb: z.number().min(0),
  tb: z.number().min(0),
  lingkar_kepala: z.number().min(0),
  lingkar_lengan_atas: z.number().min(0),
  kondisi: z.string().optional(),
  asi_eksklusif: z.boolean().optional(),
  fasilitasi_bantuan_sosial: z.boolean().optional(),
  tanggal_kunjungan_berikut: z.string().date().transform(val => new Date(val).toISOString()).optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  penggunaan_kontrasepsi: z.string().optional(),
  catatan: z.string().optional(),
});

export const updateBalitaSchema = createBalitaSchema.partial();
