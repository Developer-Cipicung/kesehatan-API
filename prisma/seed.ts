import { PrismaClient, UserRole } from './generated-schema';
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

async function main() {
  logger.info('Starting seed...');

  // 0. Cleanup existing data
  await prisma.pemeriksaanBalitaBaduta.deleteMany();
  await prisma.riwayatImunisasi.deleteMany();
  await prisma.pemeriksaanBumil.deleteMany();
  await prisma.pemeriksaanPascaPersalinan.deleteMany();
  await prisma.pemeriksaanLansia.deleteMany();
  await prisma.pendataanBulanan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.warga.deleteMany();
  await prisma.user.deleteMany();
  await prisma.posyandu.deleteMany();
  
  logger.info('Cleaned up previous data');

  // 1. Create Posyandu
  const posyandus = [
    { nama: 'Posyandu Cempaka 1', rw: '01' },
    { nama: 'Posyandu Anggrek 1', rw: '02' },
    { nama: 'Posyandu Anggrek 2', rw: '02' },
    { nama: 'Posyandu Melati 1', rw: '03' },
    { nama: 'Posyandu Melati 2', rw: '03' },
    { nama: 'Posyandu Flamboyan 1', rw: '04' },
    { nama: 'Posyandu Flamboyan 2', rw: '04' },
    { nama: 'Posyandu Mawar 1', rw: '05' },
    { nama: 'Posyandu Mawar 2', rw: '05' },
    { nama: 'Posyandu Bougenvil', rw: '06' },
    { nama: 'Posyandu Cempaka 2', rw: '06' },
    { nama: 'Posyandu Aster', rw: '07' },
  ];

  await prisma.posyandu.createMany({ data: posyandus });
  logger.info(`Created 12 Posyandu`);

  const posyanduCempaka1 = await prisma.posyandu.findFirst({
    where: { nama: 'Posyandu Cempaka 1' }
  });

  // 2. Create Admin User
  const username = 'admin';
  const email = `${username}@cipicung.com`;
  const password = 'admin123';
  let authId = '00000000-0000-0000-0000-000000000000';

  const { data: signInData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.user) {
    authId = signInData.user.id;
  } else {
    const { data: signUpData } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpData?.user) {
      authId = signUpData.user.id;
    } else {
      logger.warn('Failed to sign in or sign up admin user. Using dummy auth_id.');
    }
  }

  const adminUser = await prisma.user.create({
    data: {
      auth_id: authId,
      posyandu_id: posyanduCempaka1?.id as string, // Default assign to Cempaka 1
      nama: 'Administrator',
      username: username,
      role: UserRole.admin,
    },
  });
  logger.info(`Created Admin User: ${adminUser.username} with auth_id: ${authId}`);

  logger.info('Seed completed successfully. (Warga & Pendataan skipped as requested)');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
