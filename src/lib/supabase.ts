import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase configuration is missing in environment variables.');
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
