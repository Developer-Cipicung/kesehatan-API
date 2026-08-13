import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createBalitaSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  bb: z.coerce.number({ message: 'BB wajib diisi' }).min(0.1, 'BB wajib diisi'),
  tb: z.coerce.number({ message: 'TB wajib diisi' }).min(0.1, 'TB wajib diisi'),
  lingkar_kepala: emptyAsNull(z.number().min(0).optional().nullable()),
  lingkar_lengan_atas: emptyAsNull(z.number().min(0).optional().nullable()),
  kondisi: emptyAsNull(z.string().toUpperCase().optional().nullable()),
  asi_eksklusif: emptyAsNull(z.boolean().optional().nullable()),
  fasilitasi_bantuan_sosial: emptyAsNull(z.boolean().optional().nullable()),
  tanggal_kunjungan_berikut: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  nama_ayah: emptyAsNull(z.string().toUpperCase().optional().nullable()),
  nama_ibu: emptyAsNull(z.string().toUpperCase().optional().nullable()),
  catatan: emptyAsNull(z.string().toUpperCase().optional().nullable()),
});

export const updateBalitaSchema = createBalitaSchema.partial();
