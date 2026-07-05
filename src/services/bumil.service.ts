import { BumilRepository, FindAllBumilParams } from '../repositories/bumil.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const bumilRepo = new BumilRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class BumilService {
  async findAll(params: FindAllBumilParams) {
    return bumilRepo.findAll(params);
  }

  async findById(id: string) {
    const data = await bumilRepo.findById(id);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string) {
    return bumilRepo.findByWargaId(wargaId);
  }

  async create(data: Prisma.PemeriksaanBumilUncheckedCreateInput) {
    const warga = await wargaRepo.findById(data.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'bumil', date.getMonth() + 1, date.getFullYear());

    return bumilRepo.create(data);
  }

  async update(id: string, data: Prisma.PemeriksaanBumilUncheckedUpdateInput) {
    const record = await bumilRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'bumil', oldDate.getMonth() + 1, oldDate.getFullYear());

    if (data.tanggal_kunjungan) {
      const newDate = new Date(data.tanggal_kunjungan as Date | string);
      if (oldDate.getMonth() !== newDate.getMonth() || oldDate.getFullYear() !== newDate.getFullYear()) {
        await lockService.ensureNotLocked(warga.posyandu_id, 'bumil', newDate.getMonth() + 1, newDate.getFullYear());
      }
    }

    return bumilRepo.update(id, data);
  }

  async delete(id: string) {
    const record = await bumilRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(warga.posyandu_id, 'bumil', date.getMonth() + 1, date.getFullYear());
    }

    return bumilRepo.delete(id);
  }
}
