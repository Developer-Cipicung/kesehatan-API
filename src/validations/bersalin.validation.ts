import { z } from 'zod';

export const tandaiBersalinSchema = z.object({
  tanggal_persalinan: z.string().min(1, 'Tanggal persalinan wajib diisi'),
  tempat_persalinan: z.string().min(1, 'Tempat persalinan wajib diisi'),
  nama_bayi: z.string().min(1, 'Nama bayi wajib diisi'),
  jenis_kelamin_bayi: z.enum(['L', 'P'], {
    message: 'Jenis kelamin bayi wajib diisi dengan L atau P',
  }),
  nama_ayah: z.string().min(1, 'Nama ayah wajib diisi'),
});
