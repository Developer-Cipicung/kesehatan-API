import { prisma } from './src/lib/prisma';

async function fix() {
  const authUsers = await prisma.$queryRaw`SELECT id, email FROM auth.users`;
  console.log('Auth Users:', authUsers);
  
  const publicUsers = await prisma.user.findMany();
  console.log('Public Users:', publicUsers);

  for (const authUser of authUsers as any[]) {
    const email = authUser.email;
    const username = email.split('@')[0];
    
    const publicUser = publicUsers.find(u => u.username === username);
    if (publicUser && publicUser.auth_id !== authUser.id) {
      console.log(`Updating auth_id for ${username} from ${publicUser.auth_id} to ${authUser.id}`);
      await prisma.user.update({
        where: { id: publicUser.id },
        data: { auth_id: authUser.id }
      });
    }
  }
}

fix().catch(console.error).finally(() => process.exit(0));
