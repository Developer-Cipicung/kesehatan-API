import { BalitaRepository, FindAllBalitaParams } from '../repositories/balita.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { calculateAgeInMonths } from '../utils/age';
import { auditLogService } from './audit-log.service';
import { prisma } from '../lib/prisma';
import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';

import { calculateZScoreWHO, classifyZScore } from '../utils/zscore';

function calculateBalitaStatus(bb: number | null): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' | null {
  // Placeholder medical rule logic
  if (bb === null) return null;
  if (bb < 5) return 'Dirujuk';
  if (bb < 10) return 'Perlu Perhatian';
  return 'Normal';
}

function mapWithStatus(record: any) {
  if (!record) return record;
  const categories = classifyZScore(
    record.zscore_bb_u ? Number(record.zscore_bb_u) : null,
    record.zscore_tb_u ? Number(record.zscore_tb_u) : null,
    record.zscore_bb_tb ? Number(record.zscore_bb_tb) : null
  );

  return {
    ...record,
    status_medis: calculateBalitaStatus(record.bb !== null ? Number(record.bb) : null),
    status_gizi: categories
  };
}

const balitaRepo = new BalitaRepository();
const pendataanRepo = new PendataanBulananRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class BalitaService {
  async findAll(params: FindAllBalitaParams) {
    const result = await balitaRepo.findAll(params);
    return {
      ...result,
      data: result.data.map(mapWithStatus),
    };
  }

  async findById(id: string, posyanduId?: string) {
    const data = await balitaRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return mapWithStatus(data);
  }

  async findHistory(wargaId: string, posyanduId?: string) {
    const history = await balitaRepo.findByWargaId(wargaId, posyanduId);
    return history.map(mapWithStatus);
  }

  async create(data: Prisma.PemeriksaanBalitaBadutaUncheckedCreateInput, posyanduId?: string, userId?: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    if (warga.tanggal_lahir && calculateAgeInMonths(warga.tanggal_lahir) >= 60) {
      throw new AppError(422, 'Warga tidak valid untuk kategori balita (umur sudah 5 tahun atau lebih).');
    }

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'balita',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    const zscore = await calculateZScoreWHO({
      jenis_kelamin: warga.jenis_kelamin as 'L' | 'P',
      tanggal_lahir: warga.tanggal_lahir,
      tanggal_kunjungan: date,
      bb: data.bb !== null && data.bb !== undefined ? Number(data.bb) : undefined,
      tb: data.tb !== null && data.tb !== undefined ? Number(data.tb) : undefined,
      lingkar_kepala: data.lingkar_kepala !== null && data.lingkar_kepala !== undefined ? Number(data.lingkar_kepala) : undefined,
    });

    data.zscore_bb_u = zscore.bb_u;
    data.zscore_tb_u = zscore.tb_u;
    data.zscore_bb_tb = zscore.bb_tb;

    const created = await balitaRepo.create(data);
    if (userId) auditLogService.logAction(userId, warga.posyandu_id, 'CREATE', 'PemeriksaanBalita', created.id, null, created);
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
      }
    });
    
    const wargaMap = new Map(wargasList.map((w: any) => [w.nik, w]));
    const validRecords: any[] = [];

    for (const data of dataList) {
       try {
         const warga = wargaMap.get(data.nik);
         if (!warga) {
           errors.push(`NIK ${data.nik} tidak ditemukan.`);
           continue;
         }

         const date = new Date(data.tanggal_kunjungan);
         
         validRecords.push({
           warga_id: warga.id,
           tanggal_kunjungan: date.toISOString(),
           bb: data.bb || data.bb === 0 ? (data.bb === 0 || data.bb === '-' ? null : data.bb) : null,
           tb: data.tb || data.tb === 0 ? (data.tb === 0 || data.tb === '-' ? null : data.tb) : null,
           lingkar_kepala: data.lingkar_kepala || data.lingkar_kepala === 0 ? (data.lingkar_kepala === 0 || data.lingkar_kepala === '-' ? null : data.lingkar_kepala) : null,
         });
         
         successCount++;
       } catch (err: any) {
         errors.push(`Gagal memproses NIK ${data.nik}: ${err.message}`);
       }
    }

    if (validRecords.length > 0) {
      const result = await prisma.pemeriksaanBalitaBaduta.createMany({
        data: validRecords,
        skipDuplicates: true
      });
      auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanBalita', 'bulk', null, { count: result.count });
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
    data: Prisma.PemeriksaanBalitaBadutaUncheckedUpdateInput,
    posyanduId?: string,
    userId?: string,
  ) {
    const record = await balitaRepo.findById(id, posyanduId);
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

    const zscore = await calculateZScoreWHO({
      jenis_kelamin: warga.jenis_kelamin as 'L' | 'P',
      tanggal_lahir: warga.tanggal_lahir,
      tanggal_kunjungan: data.tanggal_kunjungan ? new Date(data.tanggal_kunjungan as Date | string) : oldDate,
      bb: data.bb !== undefined ? (data.bb === null ? undefined : Number(data.bb)) : (record.bb !== null ? Number(record.bb) : undefined),
      tb: data.tb !== undefined ? (data.tb === null ? undefined : Number(data.tb)) : (record.tb !== null ? Number(record.tb) : undefined),
      lingkar_kepala: data.lingkar_kepala !== undefined ? (data.lingkar_kepala === null ? undefined : Number(data.lingkar_kepala)) : (record.lingkar_kepala !== null ? Number(record.lingkar_kepala) : undefined),
    });

    data.zscore_bb_u = zscore.bb_u;
    data.zscore_tb_u = zscore.tb_u;
    data.zscore_bb_tb = zscore.bb_tb;

    const updated = await balitaRepo.update(id, data, posyanduId);
    if (userId) auditLogService.logAction(userId, record.warga.posyandu_id, 'UPDATE', 'PemeriksaanBalitaBaduta', id, record, updated);
    return mapWithStatus(updated);
  }

  async delete(id: string, posyanduId?: string, userId?: string) {
    const record = await balitaRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      // removed lock check for update/delete
    }

    const deleted = await balitaRepo.delete(id, posyanduId);
    if (userId) auditLogService.logAction(userId, record.warga.posyandu_id, 'DELETE', 'PemeriksaanBalitaBaduta', id, record, null);
    return mapWithStatus(deleted);
  }
}
