import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';

const pendataanRepo = new PendataanBulananRepository();

export class PendataanBulananService {
  async getStatus(posyanduId: string, bulan: number, tahun: number) {
    const data = await pendataanRepo.findByPeriode(posyanduId, bulan, tahun);
    if (data) return data;

    // Create draft if not exists so we have an ID
    return pendataanRepo.upsert(posyanduId, bulan, tahun, {
      status: 'draft',
    });
  }

  async getAdminAllStatus(tahun: number) {
    const { prisma } = await import('../lib/prisma');
    
    // Fetch all posyandu
    const posyandus = await prisma.posyandu.findMany({
      orderBy: { nama: 'asc' }
    });

    // We can fetch all records for the given year and map them
    const allRecords = await prisma.pendataanBulanan.findMany({
      where: {
        tahun
      }
    });

    return posyandus.map((posyandu: any) => {
      const posyanduRecords = allRecords.filter((r: any) => r.posyandu_id === posyandu.id);
      
      const statusPerMonth = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const record = posyanduRecords.find((r: any) => r.bulan === month);
        return {
          bulan: month,
          status: record ? record.status : 'draft'
        };
      });

      return {
        id: posyandu.id,
        nama: posyandu.nama,
        status: statusPerMonth
      };
    });
  }

  async selesaikanPendataan(
    id: string,
    posyanduId: string,
    submittedBy: string,
    tanggalPelaksanaan: string
  ) {
    const record = await pendataanRepo.findById(id, posyanduId);
    if (!record) {
      throw new AppError(404, 'Data pendataan bulanan tidak ditemukan.');
    }

    // Idempotency: if already submitted, just return
    if (record.status === 'selesai') {
      return record;
    }

    // Update examination dates based on kategori
    const startDate = new Date(record.tahun, record.bulan - 1, 1);
    const endDate = new Date(record.tahun, record.bulan, 0, 23, 59, 59, 999);
    const newDate = new Date(tanggalPelaksanaan);
    
    // We import prisma here dynamically to avoid circular dependencies if any, or just at the top
    const { prisma } = await import('../lib/prisma');

    const baseWhere = {
      warga: { posyandu_id: posyanduId },
      tanggal_kunjungan: { gte: startDate, lte: endDate },
    };

    // Update all tables for the month
    await Promise.all([
      prisma.pemeriksaanBalitaBaduta.updateMany({
        where: baseWhere,
        data: { tanggal_kunjungan: newDate },
      }),
      prisma.pemeriksaanBumil.updateMany({
        where: baseWhere,
        data: { tanggal_kunjungan: newDate },
      }),
      prisma.pemeriksaanPascaPersalinan.updateMany({
        where: baseWhere,
        data: { tanggal_kunjungan: newDate },
      }),
      prisma.pemeriksaanLansia.updateMany({
        where: baseWhere,
        data: { tanggal_kunjungan: newDate },
      }),
      prisma.riwayatImunisasi.updateMany({
        where: {
          warga: { posyandu_id: posyanduId },
          tanggal_pemberian: { gte: startDate, lte: endDate },
        },
        data: { tanggal_pemberian: newDate },
      })
    ]);

    const updated = await pendataanRepo.update(id, {
      status: 'selesai',
      user: { connect: { id: submittedBy } },
      submitted_at: new Date(),
    });

    auditLogService.logAction(submittedBy, posyanduId, 'SUBMIT', 'PendataanBulanan', id, record, updated);
    return updated;
  }

  async getSummaryList(posyanduId: string, bulan: number, tahun: number) {
    const { prisma } = await import('../lib/prisma');
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const baseWhere = {
      warga: { posyandu_id: posyanduId },
      tanggal_kunjungan: { gte: startDate, lte: endDate },
    };

    const [balita, bumil, pasca, lansia, wargaBaru] = await Promise.all([
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: baseWhere,
        include: { warga: { select: { nama: true, nik: true, tanggal_lahir: true } } },
        orderBy: { tanggal_kunjungan: 'desc' }
      }),
      prisma.pemeriksaanBumil.findMany({
        where: baseWhere,
        include: { warga: { select: { nama: true, nik: true, tanggal_lahir: true } } },
        orderBy: { tanggal_kunjungan: 'desc' }
      }),
      prisma.pemeriksaanPascaPersalinan.findMany({
        where: baseWhere,
        include: { warga: { select: { nama: true, nik: true, tanggal_lahir: true } } },
        orderBy: { tanggal_kunjungan: 'desc' }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: baseWhere,
        include: { warga: { select: { nama: true, nik: true, tanggal_lahir: true } } },
        orderBy: { tanggal_kunjungan: 'desc' }
      }),
      prisma.warga.findMany({
        where: {
          posyandu_id: posyanduId,
          created_at: { gte: startDate, lte: endDate }
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return {
      balita: balita.map((b: any) => ({ 
        id: b.id, nama: b.warga.nama, tanggal: b.tanggal_kunjungan, 
        bb: b.bb, tb: b.tb, tanggal_lahir: b.warga.tanggal_lahir
      })),
      bumil: bumil.map((b: any) => ({ 
        id: b.id, nama: b.warga.nama, tanggal: b.tanggal_kunjungan, 
        bb: b.bb, usia_kehamilan_minggu: b.usia_kehamilan_minggu, lingkar_lengan_atas: b.lingkar_lengan_atas 
      })),
      pasca_persalinan: pasca.map((b: any) => ({ 
        id: b.id, nama: b.warga.nama, tanggal: b.tanggal_kunjungan, 
        td_sistolik: b.tekanan_darah_sistolik, td_diastolik: b.tekanan_darah_diastolik 
      })),
      lansia: lansia.map((b: any) => ({ 
        id: b.id, nama: b.warga.nama, tanggal: b.tanggal_kunjungan, 
        bb: b.bb, td_sistolik: b.tekanan_darah_sistolik, td_diastolik: b.tekanan_darah_diastolik, gula_darah_sewaktu: b.gula_darah_sewaktu 
      })),
      warga_baru: wargaBaru.map((w: any) => ({
        id: w.id,
        nama: w.nama,
        nik: w.nik,
        jenis_kelamin: w.jenis_kelamin,
        tanggal_daftar: w.created_at
      }))
    };
  }
}
