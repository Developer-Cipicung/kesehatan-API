import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createBumilSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_kunjungan: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  bb: emptyAsNull(z.number().min(0).optional().nullable()),
  tb: emptyAsNull(z.number().min(0).optional().nullable()),
  lingkar_perut: emptyAsNull(z.number().min(0).optional().nullable()),
  lingkar_lengan_atas: emptyAsNull(z.number().min(0).optional().nullable()),
  tinggi_fundus: emptyAsNull(z.number().min(0).optional().nullable()),
  usia_kehamilan_minggu: emptyAsNull(z.number().int().min(0).optional().nullable()),
  riwayat_penyakit: emptyAsNull(z.string().optional().nullable()),
  kadar_hemoglobin: emptyAsNull(z.number().min(0).optional().nullable()),
  berat_janin: emptyAsNull(z.number().min(0).optional().nullable()),
  terpapar_rokok: emptyAsNull(z.boolean().optional().nullable()),
  kie: emptyAsNull(z.boolean().optional().nullable()),
  suplemen_tambah_darah: emptyAsNull(z.number().int().min(0).optional().nullable()),
  mms: emptyAsNull(z.number().int().min(0).optional().nullable()),
  fasilitasi_rujukan: emptyAsNull(z.boolean().optional().nullable()),
  fasilitasi_bantuan_sosial: emptyAsNull(z.boolean().optional().nullable()),
  tanggal_kunjungan_berikut: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  catatan: emptyAsNull(z.string().optional().nullable()),
});

export const updateBumilSchema = createBumilSchema.partial();
