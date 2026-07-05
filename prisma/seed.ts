import { KategoriPendataan, StatusPendataan, PrismaClient, JenisKelamin, UserRole } from './generated-schema';
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
  process.env.SUPABASE_ANON_KEY || ''
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
  await prisma.warga.deleteMany();
  await prisma.user.deleteMany();
  await prisma.posyandu.deleteMany();
  
  logger.info('Cleaned up previous data');

  // 1. Create Posyandu
  const posyandu = await prisma.posyandu.create({
    data: {
      kode: 'POS-001',
      nama: 'Posyandu Cipicung',
      alamat: 'Jl. Cipicung No. 123, Bandung',
      kelurahan: 'Cipicung',
      kecamatan: 'Coblong',
      kabupaten: 'Bandung',
    },
  });
  logger.info(`Created Posyandu: ${posyandu.nama}`);

  logger.info(`Created Posyandu: ${posyandu.nama}`);

  // 1.5. Create User (Real Auth_ID from Supabase)
  const email = 'kader@cipicung.com';
  const password = 'kader123';
  let authId = '00000000-0000-0000-0000-000000000001';

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
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
      logger.warn('Failed to sign in or sign up mock user. Using dummy auth_id.');
    }
  }

  const adminUser = await prisma.user.create({
    data: {
      auth_id: authId,
      posyandu_id: posyandu.id,
      nama: 'Kader Cipicung',
      email: email,
      role: UserRole.kader,
    },
  });
  logger.info(`Created User: ${adminUser.nama} with auth_id: ${authId}`);

  // 2. Create Warga
  const wargaBalita = await prisma.warga.create({
    data: {
      posyandu_id: posyandu.id,
      nomor: '001',
      nik: '3201000000000001',
      nama: 'Anak Balita',
      jenis_kelamin: 'L',
      tanggal_lahir: new Date(new Date().setFullYear(new Date().getFullYear() - 2)), // 2 tahun
    },
  });

  const wargaBumil = await prisma.warga.create({
    data: {
      posyandu_id: posyandu.id,
      nomor: '002',
      nik: '3201000000000002',
      nama: 'Ibu Hamil & Pasca Persalinan',
      jenis_kelamin: 'P',
      tanggal_lahir: new Date('1995-05-15'), // 31 tahun
    },
  });

  const wargaLansia = await prisma.warga.create({
    data: {
      posyandu_id: posyandu.id,
      nomor: '003',
      nik: '3201000000000003',
      nama: 'Kakek Lansia',
      jenis_kelamin: 'L',
      tanggal_lahir: new Date('1960-01-01'), // 66 tahun
    },
  });
  logger.info('Created Warga dummies (Balita, Bumil/Pasca Persalinan, Lansia)');

  // 3. Create Pemeriksaan Balita
  await prisma.pemeriksaanBalitaBaduta.create({
    data: {
      warga_id: wargaBalita.id,
      bb: 12.5,
      tb: 85.0,
      lingkar_kepala: 48.0,
      lingkar_lengan_atas: 16.0,
      nama_ortu: 'Budi (Ayah)',
      tanggal_kunjungan: new Date(),
    },
  });

  // 4. Create Riwayat Imunisasi
  await prisma.riwayatImunisasi.create({
    data: {
      warga_id: wargaBalita.id,
      jenis_vaksin: 'Campak',
      tanggal_pemberian: new Date(),
    },
  });
  logger.info('Created Pemeriksaan Balita & Imunisasi');

  // 5. Create Pemeriksaan Bumil
  await prisma.pemeriksaanBumil.create({
    data: {
      warga_id: wargaBumil.id,
      bb: 65.0,
      tb: 160.0,
      lingkar_perut: 90.0,
      lingkar_lengan_atas: 25.0,
      usia_kehamilan_minggu: 24,
      hpht: new Date('2025-10-01'),
      htp: new Date('2026-07-08'),
      tekanan_darah_sistolik: 120,
      tekanan_darah_diastolik: 80,
      tinggi_fundus: 20.0,
      denyut_jantung_janin: 140,
      hemoglobin: 12.5,
      keluhan: 'Mual ringan',
      tanggal_kunjungan: new Date(),
    },
  });

  // 6. Create Pemeriksaan Pasca Persalinan
  await prisma.pemeriksaanPascaPersalinan.create({
    data: {
      warga_id: wargaBumil.id,
      tanggal_persalinan: new Date('2026-06-01'),
      bb: 62.0,
      tekanan_darah_sistolik: 110,
      tekanan_darah_diastolik: 70,
      suhu_tubuh: 36.5,
      kondisi_ibu: 'Sehat',
      keluhan: 'Nyeri jahitan ringan',
      tanggal_kunjungan: new Date(),
    },
  });
  logger.info('Created Pemeriksaan Bumil & Pasca Persalinan');

  // 7. Create Pemeriksaan Lansia
  await prisma.pemeriksaanLansia.create({
    data: {
      warga_id: wargaLansia.id,
      bb: 58.0,
      tb: 165.0,
      tekanan_darah_sistolik: 140,
      tekanan_darah_diastolik: 90,
      gula_darah_sewaktu: 110,
      keluhan: 'Pegal linu di lutut',
      tanggal_kunjungan: new Date(),
    },
  });
  logger.info('Created Pemeriksaan Lansia');

  logger.info('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
