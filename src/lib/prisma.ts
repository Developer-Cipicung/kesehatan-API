import { PrismaClient } from '../../prisma/generated-schema';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
});

globalForPrisma.prisma = prisma;
