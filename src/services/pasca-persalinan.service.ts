import {
  PascaPersalinanRepository,
  FindAllPascaPersalinanParams,
} from '../repositories/pasca-persalinan.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';
import { prisma } from '../lib/prisma';
import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';

const pendataanRepo = new PendataanBulananRepository();

function calculatePascaPersalinanStatus(): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' {
  // Placeholder medical rule logic
  return 'Normal';
}

function mapWithStatus(record: any) {
  if (!record) return record;
  return {
    ...record,
    status_medis: calculatePascaPersalinanStatus(),
  };
}

const pascaPersalinanRepo = new PascaPersalinanRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class PascaPersalinanService {
  async findAll(params: FindAllPascaPersalinanParams) {
    const result = await pascaPersalinanRepo.findAll(params);
    return {
      ...result,
      data: result.data.map(mapWithStatus),
    };
  }

  async findById(id: string, posyanduId: string) {
    const data = await pascaPersalinanRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return mapWithStatus(data);
  }

  async findHistory(wargaId: string, posyanduId: string) {
    const history = await pascaPersalinanRepo.findByWargaId(wargaId, posyanduId);
    return history.map(mapWithStatus);
  }

  async create(data: Prisma.PemeriksaanPascaPersalinanUncheckedCreateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    if (warga.jenis_kelamin !== 'P') {
      throw new AppError(
        422,
        'Hanya warga perempuan yang dapat didata sebagai ibu pasca persalinan.',
      );
    }

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'pasca_persalinan',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    const created = await prisma.$transaction(async (tx) => {
      const pemeriksaan = await tx.pemeriksaanPascaPersalinan.create({ data });
      await tx.warga.updateMany({
        where: { id: data.warga_id, posyandu_id: posyanduId },
        data: { status_kehamilan: 'PASCA_PERSALINAN' },
      });
      return pemeriksaan;
    });
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanPascaPersalinan', created.id, null, created);
    return mapWithStatus(created);
  }

  async bulkCreate(dataList: any[], posyanduId: string, userId: string) {
    let successCount = 0;
    const errors: string[] = [];

    const niks = dataList.map(d => d.nik).filter(Boolean);
    const wargasList = await prisma.warga.findMany({
      where: {
        posyandu_id: posyanduId,
        nik: { in: niks },
        jenis_kelamin: 'P'
      }
    });
    
    const wargaMap = new Map(wargasList.map((w: any) => [w.nik, w]));

    for (const data of dataList) {
       try {
         const warga = wargaMap.get(data.nik);
         if (!warga) {
           errors.push(`NIK ${data.nik} tidak ditemukan atau bukan perempuan.`);
           continue;
         }

         const date = new Date(data.tanggal_kunjungan);
         const month = date.getMonth() + 1;
         const year = date.getFullYear();

         await prisma.$transaction(async (tx: any) => {
           const pemeriksaan = await tx.pemeriksaanPascaPersalinan.create({ 
             data: {
               warga_id: warga.id,
               tanggal_kunjungan: date.toISOString(),
               bb: data.bb || 0,
               tb: data.tb || 0,
             } 
           });
           auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanPascaPersalinan', pemeriksaan.id, null, pemeriksaan);
         });
         successCount++;
       } catch (err: any) {
         errors.push(`Gagal memproses NIK ${data.nik}: ${err.message}`);
       }
    }

    if (successCount === 0 && dataList.length > 0) {
      throw new AppError(400, 'Gagal mengimpor semua data: ' + errors.join(', '));
    }

    // Auto-verify all affected months
    const uniquePeriods = new Set(dataList.map(d => {
      const date = new Date(d.tanggal_kunjungan);
      return `${date.getMonth() + 1}-${date.getFullYear()}`;
    }));

    for (const period of uniquePeriods) {
      const [m, y] = period.split('-');
      await pendataanRepo.upsert(posyanduId, parseInt(m), parseInt(y), {
        status: 'selesai',
        submitted_at: new Date(),
        submitted_by: userId
      });
    }

    return { successCount, errors };
  }

  async update(
    id: string,
    data: Prisma.PemeriksaanPascaPersalinanUncheckedUpdateInput,
    posyanduId: string,
    userId: string,
  ) {
    const record = await pascaPersalinanRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    // removed lock check for update/delete

    if (data.tanggal_kunjungan) {
      const newDate = new Date(data.tanggal_kunjungan as Date | string);
      if (
        oldDate.getMonth() !== newDate.getMonth() ||
        oldDate.getFullYear() !== newDate.getFullYear()
      ) {
        // removed lock check for update/delete
      }
    }

    const updated = await pascaPersalinanRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'PemeriksaanPascaPersalinan', id, record, updated);
    return mapWithStatus(updated);
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await pascaPersalinanRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      // removed lock check for update/delete
    }

    const deleted = await pascaPersalinanRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'PemeriksaanPascaPersalinan', id, record, null);
    return mapWithStatus(deleted);
  }
}
