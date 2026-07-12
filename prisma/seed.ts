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
    // try sign up using admin api to auto-confirm email
    const { data: signUpData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (signUpData?.user) {
      authId = signUpData.user.id;
    } else {
      logger.warn('Failed to sign in or sign up admin user. Error: ' + error?.message);
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

  // 3. Create Kader Users for each Posyandu
  const allPosyandus = await prisma.posyandu.findMany();
  for (const posyandu of allPosyandus) {
    const cleanName = posyandu.nama.replace(/posyandu\s+/i, '').toLowerCase().replace(/\s+/g, '-');
    const kaderUsername = `kader-${cleanName}`;
    const kaderEmail = `${kaderUsername}@cipicung.com`;
    const kaderPassword = 'kader123';
    let kaderAuthId = '';

    const { data: signInDataKader } = await supabase.auth.signInWithPassword({
      email: kaderEmail,
      password: kaderPassword,
    });

    if (signInDataKader?.user) {
      kaderAuthId = signInDataKader.user.id;
    } else {
      const { data: signUpDataKader, error: kaderError } = await supabase.auth.admin.createUser({
        email: kaderEmail,
        password: kaderPassword,
        email_confirm: true,
      });

      if (signUpDataKader?.user) {
        kaderAuthId = signUpDataKader.user.id;
      } else {
        logger.warn(`Failed to create kader user ${kaderUsername}. Error: ` + kaderError?.message);
        continue;
      }
    }

    const kaderUser = await prisma.user.create({
      data: {
        auth_id: kaderAuthId,
        posyandu_id: posyandu.id,
        nama: `Kader ${posyandu.nama}`,
        username: kaderUsername,
        role: UserRole.kader,
      },
    });
    logger.info(`Created Kader User: ${kaderUser.username} for ${posyandu.nama}`);
  }

  // Helper for realistic names
  const firstNamesM = ['Budi', 'Joko', 'Andi', 'Anton', 'Agus', 'Bambang', 'Iwan', 'Dedi', 'Hendra', 'Rizky', 'Fajar', 'Bayu', 'Surya', 'Eko', 'Rahmat', 'Pratama', 'Aditya', 'Yusuf', 'Ilham', 'Maulana', 'Dwi', 'Satria', 'Wahyu', 'Dimas', 'Gilang', 'Reza', 'Putra'];
  const firstNamesF = ['Siti', 'Ayu', 'Dewi', 'Sri', 'Putri', 'Rini', 'Nur', 'Lestari', 'Sari', 'Endang', 'Wati', 'Ani', 'Diana', 'Ratna', 'Fitri', 'Nisa', 'Aisyah', 'Indah', 'Maya', 'Citra', 'Intan', 'Novita', 'Mega', 'Dinda', 'Nadia'];
  const lastNames = ['Saputra', 'Wijaya', 'Pratama', 'Hidayat', 'Setiawan', 'Kurniawan', 'Siregar', 'Santoso', 'Wibowo', 'Susanto', 'Nugroho', 'Putra', 'Gunawan', 'Kusuma', 'Ramadhan', 'Fadilah', 'Pratiwi', 'Wardhani'];
  
  const kota = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Medan', 'Makassar', 'Yogyakarta', 'Malang', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'];
  const jalan = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Diponegoro', 'Jl. Ahmad Yani', 'Jl. Gatot Subroto', 'Jl. Pahlawan', 'Jl. Mawar', 'Jl. Melati', 'Jl. Anggrek'];

  function getRandomKota() {
    return kota[Math.floor(Math.random() * kota.length)];
  }

  function getRandomAlamat() {
    return `${jalan[Math.floor(Math.random() * jalan.length)]} No. ${Math.floor(Math.random() * 100) + 1}, RT ${Math.floor(Math.random() * 15) + 1}/RW ${Math.floor(Math.random() * 10) + 1}`;
  }
  
  function getRandomName(gender: 'L' | 'P') {
    const firsts = gender === 'L' ? firstNamesM : firstNamesF;
    const first = firsts[Math.floor(Math.random() * firsts.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  }

  function randomDec(min: number, max: number, decimals: number = 1) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // 4. Create 10 Warga records for each category with June & July 2026 checkups for EACH Posyandu
  const juneDate = new Date('2026-06-15T08:00:00Z');
  const julyDate = new Date('2026-07-10T08:00:00Z');
  
  let totalCreated = 0;

  for (const [pIdx, posyandu] of allPosyandus.entries()) {
    const posyanduPrefix = (pIdx + 1).toString().padStart(2, '0');
    
    // Create PendataanBulanan record for June 2026
    await prisma.pendataanBulanan.create({
      data: {
        posyandu_id: posyandu.id,
        bulan: 6,
        tahun: 2026,
        status: 'selesai',
        submitted_at: new Date('2026-06-30T10:00:00Z'),
      }
    });

    // Create PendataanBulanan record for July 2026 (draft)
    await prisma.pendataanBulanan.create({
      data: {
        posyandu_id: posyandu.id,
        bulan: 7,
        tahun: 2026,
        status: 'draft',
      }
    });

    // Balita
    const balitaPromises = [];
    for (let i = 1; i <= 10; i++) {
      balitaPromises.push(prisma.warga.create({
        data: {
          posyandu_id: posyandu.id,
          nomor: `BALITA-${posyanduPrefix}-${i.toString().padStart(3, '0')}`,
          nik: `320101${posyanduPrefix}00${i.toString().padStart(4, '0')}`,
          jenis_kelamin: i % 2 === 0 ? 'L' : 'P',
          nama: getRandomName(i % 2 === 0 ? 'L' : 'P'),
          nama_ayah: getRandomName('L'),
          nama_ibu: getRandomName('P'),
          status_kehamilan: 'TIDAK_HAMIL',
          tanggal_lahir: i <= 5 
            ? randomDate(new Date('2024-08-01'), new Date('2026-06-01')) // 0-23 months (Baduta)
            : randomDate(new Date('2021-08-01'), new Date('2024-07-31')), // 24-59 months (Balita)
          tempat_lahir: getRandomKota(),
          alamat: getRandomAlamat(),
          riwayat_imunisasi: {
            create: [
              { jenis_vaksin: 'BCG', tanggal_pemberian: randomDate(new Date('2024-08-01'), new Date('2025-01-01')) },
              { jenis_vaksin: 'Polio 1', tanggal_pemberian: randomDate(new Date('2024-08-01'), new Date('2025-01-01')) },
              { jenis_vaksin: 'DPT 1', tanggal_pemberian: randomDate(new Date('2025-02-01'), new Date('2025-06-01')) }
            ]
          },
          pemeriksaan_balita_baduta: {
            create: [
              {
                tanggal_kunjungan: juneDate,
                bb: randomDec(3.0, 20.0),
                tb: randomDec(50.0, 110.0),
                lingkar_kepala: randomDec(35.0, 52.0),
                lingkar_lengan_atas: randomDec(10.0, 18.0),
                kondisi: Math.random() > 0.1 ? 'Sehat' : 'Sakit',
                nama_ayah: getRandomName(),
                nama_ibu: getRandomName(),
                penggunaan_kontrasepsi: Math.random() > 0.5 ? 'IUD' : 'Pil',
                catatan: 'Perkembangan baik, asupan gizi cukup.',
                asi_eksklusif: Math.random() > 0.5,
                zscore_bb_u: randomDec(-2.0, 2.0),
                zscore_tb_u: randomDec(-2.0, 2.0),
                zscore_bb_tb: randomDec(-2.0, 2.0),
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-07-15T08:00:00Z'),
              },
              {
                tanggal_kunjungan: julyDate,
                bb: randomDec(3.0, 20.0),
                tb: randomDec(50.0, 110.0),
                lingkar_kepala: randomDec(35.0, 52.0),
                lingkar_lengan_atas: randomDec(10.0, 18.0),
                kondisi: Math.random() > 0.1 ? 'Sehat' : 'Sakit',
                nama_ayah: getRandomName(),
                nama_ibu: getRandomName(),
                penggunaan_kontrasepsi: Math.random() > 0.5 ? 'IUD' : 'Pil',
                catatan: 'Perkembangan normal, anak aktif.',
                asi_eksklusif: Math.random() > 0.5,
                zscore_bb_u: randomDec(-2.0, 2.0),
                zscore_tb_u: randomDec(-2.0, 2.0),
                zscore_bb_tb: randomDec(-2.0, 2.0),
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-08-10T08:00:00Z'),
              }
            ]
          }
        }
      }));
    }
    await Promise.all(balitaPromises);
    totalCreated += 10;

    // Bumil
    const bumilPromises = [];
    for (let i = 1; i <= 10; i++) {
      bumilPromises.push(prisma.warga.create({
        data: {
          posyandu_id: posyandu.id,
          nomor: `BUMIL-${posyanduPrefix}-${i.toString().padStart(3, '0')}`,
          nik: `320102${posyanduPrefix}00${i.toString().padStart(4, '0')}`,
          jenis_kelamin: 'P',
          nama: getRandomName('P'),
          status_kehamilan: 'HAMIL',
          tanggal_lahir: randomDate(new Date('1985-01-01'), new Date('2005-12-31')),
          tempat_lahir: getRandomKota(),
          alamat: getRandomAlamat(),
          nama_ayah: getRandomName('L'), // Suami/Ayah dari bayi
          nama_ibu: getRandomName('P'), // Ibu dari bumil
          tempat_persalinan: Math.random() > 0.5 ? 'Bidan' : 'Puskesmas',
          penggunaan_kontrasepsi: Math.random() > 0.5 ? 'IUD' : 'Pil',
          hpht: randomDate(new Date('2025-09-01'), new Date('2026-03-01')),
          htp: randomDate(new Date('2026-06-01'), new Date('2026-12-31')),
          pemeriksaan_bumil: {
            create: [
              {
                tanggal_kunjungan: juneDate,
                bb: randomDec(45.0, 90.0),
                tb: randomDec(145.0, 170.0),
                lingkar_perut: randomDec(80.0, 110.0),
                lingkar_lengan_atas: randomDec(20.0, 35.0),
                usia_kehamilan_minggu: randomInt(4, 38),
                tinggi_fundus: randomDec(15.0, 35.0),
                catatan: 'Kehamilan sehat, ibu tidak mengeluh mual berlebihan.',
                jumlah_anak: randomInt(1, 4),
                riwayat_penyakit: Math.random() > 0.8 ? 'Hipertensi' : 'Tidak ada',
                kadar_hemoglobin: randomDec(10.0, 14.0),
                berat_janin: randomDec(1.0, 3.5),
                terpapar_rokok: Math.random() > 0.7,
                kie: true,
                suplemen_tambah_darah: randomInt(10, 30),
                mms: randomInt(0, 5),
                fasilitasi_rujukan: false,
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-07-15T08:00:00Z'),
              },
              {
                tanggal_kunjungan: julyDate,
                bb: randomDec(45.0, 90.0),
                tb: randomDec(145.0, 170.0),
                lingkar_perut: randomDec(80.0, 110.0),
                lingkar_lengan_atas: randomDec(20.0, 35.0),
                usia_kehamilan_minggu: randomInt(8, 40),
                tinggi_fundus: randomDec(15.0, 35.0),
                catatan: 'Perkembangan janin baik, detak jantung normal.',
                jumlah_anak: randomInt(1, 4),
                riwayat_penyakit: Math.random() > 0.8 ? 'Diabetes Gestasional' : 'Tidak ada',
                kadar_hemoglobin: randomDec(10.0, 14.0),
                berat_janin: randomDec(1.0, 3.5),
                terpapar_rokok: Math.random() > 0.7,
                kie: true,
                suplemen_tambah_darah: randomInt(10, 30),
                mms: randomInt(0, 5),
                fasilitasi_rujukan: Math.random() > 0.9,
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-08-10T08:00:00Z'),
              }
            ]
          }
        }
      }));
    }
    await Promise.all(bumilPromises);
    totalCreated += 10;

    // Pasca Persalinan
    const pascaPromises = [];
    for (let i = 1; i <= 10; i++) {
      pascaPromises.push(prisma.warga.create({
        data: {
          posyandu_id: posyandu.id,
          nomor: `PASCA-${posyanduPrefix}-${i.toString().padStart(3, '0')}`,
          nik: `320103${posyanduPrefix}00${i.toString().padStart(4, '0')}`,
          jenis_kelamin: 'P',
          nama: getRandomName('P'),
          status_kehamilan: 'PASCA_PERSALINAN',
          tanggal_lahir: randomDate(new Date('1985-01-01'), new Date('2005-12-31')),
          tempat_lahir: getRandomKota(),
          alamat: getRandomAlamat(),
          nama_ayah: getRandomName('L'),
          nama_ibu: getRandomName('P'),
          tempat_persalinan: Math.random() > 0.5 ? 'Bidan' : 'Puskesmas',
          penggunaan_kontrasepsi: Math.random() > 0.5 ? 'IUD' : 'Pil',
          hpht: randomDate(new Date('2025-09-01'), new Date('2026-03-01')),
          htp: randomDate(new Date('2026-06-01'), new Date('2026-12-31')),
          pemeriksaan_pasca_persalinan: {
            create: [
              {
                tanggal_kunjungan: juneDate,
                tanggal_persalinan: randomDate(new Date('2026-05-01'), new Date('2026-06-14')),
                bb: randomDec(45.0, 85.0),
                tb: randomDec(145.0, 170.0),
                tekanan_darah_sistolik: randomInt(100, 140),
                tekanan_darah_diastolik: randomInt(60, 90),
                tinggi_badan_bayi: randomDec(45.0, 55.0),
                berat_badan_bayi: randomDec(2.5, 4.5),
                kondisi_ibu: 'Sehat, pemulihan lancar',
                catatan: 'Ibu disarankan untuk banyak konsumsi sayur hijau.',
                kie: true,
                fasilitasi_rujukan: false,
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-07-15T08:00:00Z'),
              },
              {
                tanggal_kunjungan: julyDate,
                tanggal_persalinan: randomDate(new Date('2026-05-01'), new Date('2026-06-14')),
                bb: randomDec(45.0, 85.0),
                tb: randomDec(145.0, 170.0),
                tekanan_darah_sistolik: randomInt(100, 140),
                tekanan_darah_diastolik: randomInt(60, 90),
                tinggi_badan_bayi: randomDec(45.0, 55.0),
                berat_badan_bayi: randomDec(2.5, 4.5),
                kondisi_ibu: 'Ibu sehat dan menyusui eksklusif',
                catatan: 'Asupan gizi ibu menyusui perlu dipertahankan.',
                kie: true,
                fasilitasi_rujukan: false,
                fasilitasi_bantuan_sosial: Math.random() > 0.8,
                tanggal_kunjungan_berikut: new Date('2026-08-10T08:00:00Z'),
              }
            ]
          }
        }
      }));
    }
    await Promise.all(pascaPromises);
    totalCreated += 10;

    // Lansia
    const lansiaPromises = [];
    for (let i = 1; i <= 10; i++) {
      lansiaPromises.push(prisma.warga.create({
        data: {
          posyandu_id: posyandu.id,
          nomor: `LANSIA-${posyanduPrefix}-${i.toString().padStart(3, '0')}`,
          nik: `320104${posyanduPrefix}00${i.toString().padStart(4, '0')}`,
          jenis_kelamin: i % 2 === 0 ? 'L' : 'P',
          nama: getRandomName(i % 2 === 0 ? 'L' : 'P'),
          status_kehamilan: 'TIDAK_HAMIL',
          tanggal_lahir: randomDate(new Date('1945-01-01'), new Date('1965-12-31')),
          tempat_lahir: getRandomKota(),
          alamat: getRandomAlamat(),
          nama_ayah: getRandomName('L'),
          nama_ibu: getRandomName('P'),
          pemeriksaan_lansia: {
            create: [
              {
                tanggal_kunjungan: juneDate,
                bb: randomDec(40.0, 80.0),
                tb: randomDec(140.0, 165.0),
                tekanan_darah_sistolik: randomInt(110, 180),
                tekanan_darah_diastolik: randomInt(70, 110),
                gula_darah_sewaktu: randomInt(80, 200),
                kolesterol: randomInt(150, 300),
                asam_urat: randomDec(3.0, 9.0),
                catatan: 'Tekanan darah cukup tinggi, perlu kurangi garam.',
              },
              {
                tanggal_kunjungan: julyDate,
                bb: randomDec(40.0, 80.0),
                tb: randomDec(140.0, 165.0),
                tekanan_darah_sistolik: randomInt(110, 180),
                tekanan_darah_diastolik: randomInt(70, 110),
                gula_darah_sewaktu: randomInt(80, 200),
                kolesterol: randomInt(150, 300),
                asam_urat: randomDec(3.0, 9.0),
                catatan: 'Gula darah normal, kolesterol perlu dipantau.',
              }
            ]
          }
        }
      }));
    }
    await Promise.all(lansiaPromises);
    totalCreated += 10;
    
    logger.info(`Inserted 40 records for ${posyandu.nama}`);
  }

  logger.info(`Seed completed successfully. Created ${totalCreated} dummy Warga records with June 2026 checkups.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
