import { z } from 'zod';

export const createWargaSchema = z.object({
  nomor: z.string().min(1),
  nik: z.string().length(16),
  nama: z.string().min(1),
  jenis_kelamin: z.enum(['L', 'P']),
  status_kehamilan: z.enum(['TIDAK_HAMIL', 'HAMIL', 'PASCA_PERSALINAN']).optional(),
  tanggal_lahir: z.string().date().transform(val => new Date(val).toISOString()),
  tempat_lahir: z.string().optional(),
  alamat: z.string().optional(),
  tempat_persalinan: z.string().optional(),
  penggunaan_kontrasepsi: z.string().optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  ibu_id: z.string().uuid().optional(),
  hpht: z.string().date().transform(val => new Date(val).toISOString()).optional(),
  htp: z.string().date().transform(val => new Date(val).toISOString()).optional(),
});

export const updateWargaSchema = createWargaSchema.partial();

export const bulkCreateWargaSchema = z.array(createWargaSchema);
