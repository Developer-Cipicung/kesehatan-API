import { PrismaClient } from './generated-schema';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting seed...');

  // Create Posyandu
  const posyandu = await prisma.posyandu.create({
    data: {
      nama: 'Posyandu Cipicung',
      alamat: 'Jl. Cipicung No. 123, Bandung',
    },
  });
  
  logger.info(`Created Posyandu: ${posyandu.nama}`);

  // Create Warga
  const warga1 = await prisma.warga.create({
    data: {
      posyandu_id: posyandu.id,
      nomor: '001',
      nik: '3201000000000001',
      nama: 'Budi Santoso',
      jenis_kelamin: 'L',
      tanggal_lahir: new Date('1990-01-01'),
    },
  });

  const warga2 = await prisma.warga.create({
    data: {
      posyandu_id: posyandu.id,
      nomor: '002',
      nik: '3201000000000002',
      nama: 'Siti Aminah',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('1992-05-15'),
    },
  });

  logger.info(`Created Warga: ${warga1.nama}, ${warga2.nama}`);
  
  logger.info('Seed completed successfully.');
}

main()
  .catch((e) => {
    logger.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
