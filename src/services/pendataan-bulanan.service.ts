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

    return posyandus.map(posyandu => {
      const posyanduRecords = allRecords.filter(r => r.posyandu_id === posyandu.id);
      
      const statusPerMonth = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const record = posyanduRecords.find(r => r.bulan === month);
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
}
