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

function calculatePascaPersalinanStatus(suhuTubuh: number): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' {
  // Placeholder medical rule logic
  if (suhuTubuh > 39) return 'Dirujuk';
  if (suhuTubuh > 38) return 'Perlu Perhatian';
  return 'Normal';
}

function mapWithStatus(record: any) {
  if (!record) return record;
  return {
    ...record,
    status_medis: calculatePascaPersalinanStatus(Number(record.suhu_tubuh)),
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
