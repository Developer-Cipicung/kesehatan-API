import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createBalitaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  bb: emptyAsNull(z.number().min(0).optional().nullable()),
  tb: emptyAsNull(z.number().min(0).optional().nullable()),
  lingkar_kepala: emptyAsNull(z.number().min(0).optional().nullable()),
  lingkar_lengan_atas: emptyAsNull(z.number().min(0).optional().nullable()),
  kondisi: emptyAsNull(z.string().optional().nullable()),
  asi_eksklusif: emptyAsNull(z.boolean().optional().nullable()),
  fasilitasi_bantuan_sosial: emptyAsNull(z.boolean().optional().nullable()),
  tanggal_kunjungan_berikut: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  nama_ayah: emptyAsNull(z.string().optional().nullable()),
  nama_ibu: emptyAsNull(z.string().optional().nullable()),
  catatan: emptyAsNull(z.string().optional().nullable()),
});

export const updateBalitaSchema = createBalitaSchema.partial();
