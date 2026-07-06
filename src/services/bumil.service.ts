import { BumilRepository, FindAllBumilParams } from '../repositories/bumil.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';

function calculateBumilStatus(tekananDarahSistolik: number): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' {
  // Placeholder medical rule logic
  if (tekananDarahSistolik > 160) return 'Dirujuk';
  if (tekananDarahSistolik > 140) return 'Perlu Perhatian';
  return 'Normal';
}

function mapWithStatus(record: any) {
  if (!record) return record;
  return {
    ...record,
    status_medis: calculateBumilStatus(Number(record.tekanan_darah_sistolik)),
  };
}

const bumilRepo = new BumilRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class BumilService {
  async findAll(params: FindAllBumilParams) {
    const result = await bumilRepo.findAll(params);
    return {
      ...result,
      data: result.data.map(mapWithStatus),
    };
  }

  async findById(id: string, posyanduId: string) {
    const data = await bumilRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return mapWithStatus(data);
  }

  async findHistory(wargaId: string, posyanduId: string) {
    const history = await bumilRepo.findByWargaId(wargaId, posyanduId);
    return history.map(mapWithStatus);
  }

  async create(data: Prisma.PemeriksaanBumilUncheckedCreateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    if (warga.jenis_kelamin !== 'P') {
      throw new AppError(422, 'Hanya warga perempuan yang dapat didata sebagai ibu hamil.');
    }

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'bumil',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    const created = await bumilRepo.create(data);
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanBumil', created.id, null, created);
    return mapWithStatus(created);
  }

  async update(id: string, data: Prisma.PemeriksaanBumilUncheckedUpdateInput, posyanduId: string, userId: string) {
    const record = await bumilRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'bumil',
      oldDate.getMonth() + 1,
      oldDate.getFullYear(),
    );

    if (data.tanggal_kunjungan) {
      const newDate = new Date(data.tanggal_kunjungan as Date | string);
      if (
        oldDate.getMonth() !== newDate.getMonth() ||
        oldDate.getFullYear() !== newDate.getFullYear()
      ) {
        await lockService.ensureNotLocked(
          warga.posyandu_id,
          'bumil',
          newDate.getMonth() + 1,
          newDate.getFullYear(),
        );
      }
    }

    const updated = await bumilRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'PemeriksaanBumil', id, record, updated);
    return mapWithStatus(updated);
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await bumilRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(
        warga.posyandu_id,
        'bumil',
        date.getMonth() + 1,
        date.getFullYear(),
      );
    }

    const deleted = await bumilRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'PemeriksaanBumil', id, record, null);
    return mapWithStatus(deleted);
  }
}
