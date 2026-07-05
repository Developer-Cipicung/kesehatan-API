import { BalitaRepository, FindAllBalitaParams } from '../repositories/balita.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const balitaRepo = new BalitaRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class BalitaService {
  async findAll(params: FindAllBalitaParams) {
    return balitaRepo.findAll(params);
  }

  async findById(id: string) {
    const data = await balitaRepo.findById(id);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string) {
    return balitaRepo.findByWargaId(wargaId);
  }

  async create(data: Prisma.PemeriksaanBalitaBadutaUncheckedCreateInput) {
    const warga = await wargaRepo.findById(data.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'balita', date.getMonth() + 1, date.getFullYear());

    return balitaRepo.create(data);
  }

  async update(id: string, data: Prisma.PemeriksaanBalitaBadutaUncheckedUpdateInput) {
    const record = await balitaRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'balita', oldDate.getMonth() + 1, oldDate.getFullYear());

    if (data.tanggal_kunjungan) {
      const newDate = new Date(data.tanggal_kunjungan as Date | string);
      if (oldDate.getMonth() !== newDate.getMonth() || oldDate.getFullYear() !== newDate.getFullYear()) {
        await lockService.ensureNotLocked(warga.posyandu_id, 'balita', newDate.getMonth() + 1, newDate.getFullYear());
      }
    }

    return balitaRepo.update(id, data);
  }

  async delete(id: string) {
    const record = await balitaRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(warga.posyandu_id, 'balita', date.getMonth() + 1, date.getFullYear());
    }

    return balitaRepo.delete(id);
  }
}
