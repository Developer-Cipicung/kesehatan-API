import { PascaPersalinanRepository, FindAllPascaPersalinanParams } from '../repositories/pasca-persalinan.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const pascaPersalinanRepo = new PascaPersalinanRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class PascaPersalinanService {
  async findAll(params: FindAllPascaPersalinanParams) {
    return pascaPersalinanRepo.findAll(params);
  }

  async findById(id: string) {
    const data = await pascaPersalinanRepo.findById(id);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string) {
    return pascaPersalinanRepo.findByWargaId(wargaId);
  }

  async create(data: Prisma.PemeriksaanPascaPersalinanUncheckedCreateInput) {
    const warga = await wargaRepo.findById(data.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    if (warga.jenis_kelamin !== 'P') {
      throw new AppError(422, 'Hanya warga perempuan yang dapat didata sebagai ibu pasca persalinan.');
    }

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'pasca_persalinan', date.getMonth() + 1, date.getFullYear());

    return pascaPersalinanRepo.create(data);
  }

  async update(id: string, data: Prisma.PemeriksaanPascaPersalinanUncheckedUpdateInput) {
    const record = await pascaPersalinanRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    await lockService.ensureNotLocked(warga.posyandu_id, 'pasca_persalinan', oldDate.getMonth() + 1, oldDate.getFullYear());

    if (data.tanggal_kunjungan) {
      const newDate = new Date(data.tanggal_kunjungan as Date | string);
      if (oldDate.getMonth() !== newDate.getMonth() || oldDate.getFullYear() !== newDate.getFullYear()) {
        await lockService.ensureNotLocked(warga.posyandu_id, 'pasca_persalinan', newDate.getMonth() + 1, newDate.getFullYear());
      }
    }

    return pascaPersalinanRepo.update(id, data);
  }

  async delete(id: string) {
    const record = await pascaPersalinanRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(warga.posyandu_id, 'pasca_persalinan', date.getMonth() + 1, date.getFullYear());
    }

    return pascaPersalinanRepo.delete(id);
  }
}
