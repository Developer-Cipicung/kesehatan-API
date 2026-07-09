import { PrismaClient } from './prisma/generated-schema'
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}
main().finally(() => prisma.$disconnect());
