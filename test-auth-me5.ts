import { PrismaClient } from './prisma/generated-schema';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.posyandu.findUnique({
      where: { id: undefined },
      select: { id: true, nama: true, rw: true },
    });
    console.log("Success");
  } catch (err) {
    console.error("Prisma error:", err.message);
  }
}

main().finally(() => prisma.$disconnect());
