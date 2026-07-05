import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      appUser?: import('../../prisma/generated-schema').User;
    }
  }
}
