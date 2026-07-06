import { ImunisasiRepository, FindAllImunisasiParams } from '../repositories/imunisasi.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';

const imunisasiRepo = new ImunisasiRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class ImunisasiService {
  async findAll(params: FindAllImunisasiParams) {
    return imunisasiRepo.findAll(params);
  }

  async findById(id: string, posyanduId: string) {
    const data = await imunisasiRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data imunisasi tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string, posyanduId: string) {
    const history = await imunisasiRepo.findByWargaId(wargaId, posyanduId);
    return history;
  }

  async create(data: Prisma.RiwayatImunisasiUncheckedCreateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const date = new Date(data.tanggal_pemberian);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'imunisasi',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    const created = await imunisasiRepo.create(data);
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'RiwayatImunisasi', created.id, null, created);
    return created;
  }

  async update(id: string, data: Prisma.RiwayatImunisasiUncheckedUpdateInput, posyanduId: string, userId: string) {
    const record = await imunisasiRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data imunisasi tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_pemberian);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'imunisasi',
      oldDate.getMonth() + 1,
      oldDate.getFullYear(),
    );

    if (data.tanggal_pemberian) {
      const newDate = new Date(data.tanggal_pemberian as Date | string);
      if (
        oldDate.getMonth() !== newDate.getMonth() ||
        oldDate.getFullYear() !== newDate.getFullYear()
      ) {
        await lockService.ensureNotLocked(
          warga.posyandu_id,
          'imunisasi',
          newDate.getMonth() + 1,
          newDate.getFullYear(),
        );
      }
    }

    const updated = await imunisasiRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'RiwayatImunisasi', id, record, updated);
    return updated;
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await imunisasiRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data imunisasi tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_pemberian);
      await lockService.ensureNotLocked(
        warga.posyandu_id,
        'imunisasi',
        date.getMonth() + 1,
        date.getFullYear(),
      );
    }

    const deleted = await imunisasiRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'RiwayatImunisasi', id, record, null);
    return deleted;
  }
}
