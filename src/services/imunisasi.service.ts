import { ImunisasiRepository, FindAllImunisasiParams } from '../repositories/imunisasi.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const imunisasiRepo = new ImunisasiRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class ImunisasiService {
  async findAll(params: FindAllImunisasiParams) {
    return imunisasiRepo.findAll(params);
  }

  async findById(id: string) {
    const data = await imunisasiRepo.findById(id);
    if (!data) throw new AppError(404, 'Data imunisasi tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string) {
    return imunisasiRepo.findByWargaId(wargaId);
  }

  async create(data: Prisma.RiwayatImunisasiUncheckedCreateInput) {
    const warga = await wargaRepo.findById(data.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const date = new Date(data.tanggal_pemberian);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'imunisasi',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    return imunisasiRepo.create(data);
  }

  async update(id: string, data: Prisma.RiwayatImunisasiUncheckedUpdateInput) {
    const record = await imunisasiRepo.findById(id);
    if (!record) throw new AppError(404, 'Data imunisasi tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
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

    return imunisasiRepo.update(id, data);
  }

  async delete(id: string) {
    const record = await imunisasiRepo.findById(id);
    if (!record) throw new AppError(404, 'Data imunisasi tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (warga) {
      const date = new Date(record.tanggal_pemberian);
      await lockService.ensureNotLocked(
        warga.posyandu_id,
        'imunisasi',
        date.getMonth() + 1,
        date.getFullYear(),
      );
    }

    return imunisasiRepo.delete(id);
  }
}
