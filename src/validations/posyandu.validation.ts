import { z } from 'zod';

export const createPosyanduSchema = z.object({
  nama: z.string().min(1),
  rw: z.string().min(1),
});

export const updatePosyanduSchema = createPosyanduSchema.partial();
