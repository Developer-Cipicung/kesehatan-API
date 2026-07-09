import { supabase } from './src/lib/supabase';
import { PrismaClient } from './prisma/generated-schema';
const prisma = new PrismaClient();

async function main() {
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: 'admin@cipicung.com',
    password: 'admin'
  });
  
  if (error) {
    console.error("Login failed admin/admin:", error);
  } else {
    console.log("Logged in with admin/admin!");
    return;
  }

  const { data: signInData2, error: error2 } = await supabase.auth.signInWithPassword({
    email: 'admin@cipicung.com',
    password: 'admin'
  });
  
  // try different passwords
}

main().finally(() => prisma.$disconnect());
