import { z } from 'zod';

export const createPosyanduSchema = z.object({
  nama: z.string().min(1).toUpperCase(),
  rw: z.string().min(1).toUpperCase(),
});

export const updatePosyanduSchema = createPosyanduSchema.partial();
