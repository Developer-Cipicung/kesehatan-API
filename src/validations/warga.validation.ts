import { z } from 'zod';

const emptyAsNull = (schema: z.ZodTypeAny) => z.preprocess((val) => val === 0 || val === '0' || val === '-' || val === '' ? null : val, schema);

export const createWargaSchema = z.object({
  nomor: emptyAsNull(z.string().optional().nullable()),
  nik: emptyAsNull(z.string().max(16).optional().nullable()),
  nama: z.string().min(1).toUpperCase(),
  jenis_kelamin: emptyAsNull(z.enum(['L', 'P']).optional().nullable()),
  status_kehamilan: emptyAsNull(z.enum(['TIDAK_HAMIL', 'HAMIL', 'PASCA_PERSALINAN']).optional().nullable()),
  tanggal_lahir: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  tempat_lahir: emptyAsNull(z.string().optional().nullable()),
  alamat: emptyAsNull(z.string().optional().nullable()),
  rt: emptyAsNull(z.string().optional().nullable()),
  rw: emptyAsNull(z.string().optional().nullable()),
  tempat_persalinan: emptyAsNull(z.string().optional().nullable()),
  penggunaan_kontrasepsi: emptyAsNull(z.string().optional().nullable()),
  nama_ayah: emptyAsNull(z.string().toUpperCase().optional().nullable()),
  nama_ibu: emptyAsNull(z.string().toUpperCase().optional().nullable()),
  memiliki_bpjs: z.boolean().optional().default(false),
  jumlah_anak: emptyAsNull(z.union([z.string(), z.number()]).transform(v => typeof v === 'string' && v.trim() !== '' ? parseInt(v, 10) : v).pipe(z.number().min(0, 'Jumlah anak tidak boleh negatif')).optional().nullable()),
  ibu_id: emptyAsNull(z.string().uuid().optional().nullable()),
  hpht: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  htp: emptyAsNull(z.string().date().transform(val => new Date(val).toISOString()).optional().nullable()),
  kategori_terdaftar: emptyAsNull(z.string().optional().nullable()),
});

export const updateWargaSchema = createWargaSchema.partial();

export const bulkCreateWargaSchema = z.array(createWargaSchema);
