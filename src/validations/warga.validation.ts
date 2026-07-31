import { z } from 'zod';

export const createWargaSchema = z.object({
  nomor: z.string().min(1),
  nik: z.string().min(1).max(16).optional().nullable(),
  nama: z.string().min(1),
  jenis_kelamin: z.enum(['L', 'P']),
  status_kehamilan: z.enum(['TIDAK_HAMIL', 'HAMIL', 'PASCA_PERSALINAN']).optional(),
  tanggal_lahir: z.string().date().transform(val => new Date(val).toISOString()),
  tempat_lahir: z.string().optional(),
  alamat: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  tempat_persalinan: z.string().optional(),
  penggunaan_kontrasepsi: z.string().optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  jumlah_anak: z.union([z.string(), z.number()]).transform(v => typeof v === 'string' && v.trim() !== '' ? parseInt(v, 10) : v).optional(),
  ibu_id: z.string().uuid().optional().nullable(),
  hpht: z.string().date().transform(val => new Date(val).toISOString()).optional(),
  htp: z.string().date().transform(val => new Date(val).toISOString()).optional(),
});

export const updateWargaSchema = createWargaSchema.partial();

export const bulkCreateWargaSchema = z.array(createWargaSchema);
