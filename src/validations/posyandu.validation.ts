import { z } from 'zod';

export const createPosyanduSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  alamat: z.string().min(1),
  kelurahan: z.string().min(1),
  kecamatan: z.string().min(1),
  kabupaten: z.string().min(1),
});

export const updatePosyanduSchema = createPosyanduSchema.partial();
