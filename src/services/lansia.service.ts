import { LansiaRepository, FindAllLansiaParams } from '../repositories/lansia.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { calculateAgeInYears } from '../utils/age';

const lansiaRepo = new LansiaRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class LansiaService {
  async findAll(params: FindAllLansiaParams) {
    return lansiaRepo.findAll(params);
  }

  async findById(id: string, posyanduId: string) {
    const data = await lansiaRepo.findById(id);
    if (!data || data.warga.posyandu_id !== posyanduId)
      throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return data;
  }

  async findHistory(wargaId: string, posyanduId: string) {
    return lansiaRepo.findByWargaId(wargaId);
    // We rely on controller ensuring posyandu_id via Warga or we just filter here
    const history = await lansiaRepo.findByWargaId(wargaId);
    return history;
  }

  async create(data: Prisma.PemeriksaanLansiaUncheckedCreateInput, posyanduId: string) {
    const warga = await wargaRepo.findById(data.warga_id);
    if (!warga || warga.posyandu_id !== posyanduId)
      throw new AppError(404, 'Warga tidak ditemukan');

    if (calculateAgeInYears(warga.tanggal_lahir) < 60) {
      throw new AppError(422, 'Warga tidak valid untuk kategori lansia (umur < 60 tahun).');
    }

    const date = new Date(data.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'lansia',
      date.getMonth() + 1,
      date.getFullYear(),
    );

    return lansiaRepo.create(data);
  }

  async update(id: string, data: Prisma.PemeriksaanLansiaUncheckedUpdateInput, posyanduId: string) {
    const record = await lansiaRepo.findById(id);
    if (!record || record.warga.posyandu_id !== posyanduId)
      throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    const oldDate = new Date(record.tanggal_kunjungan);
    await lockService.ensureNotLocked(
      warga.posyandu_id,
      'lansia',
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
          'lansia',
          newDate.getMonth() + 1,
          newDate.getFullYear(),
        );
      }
    }

    return lansiaRepo.update(id, data);
  }

  async delete(id: string, posyanduId: string) {
    const record = await lansiaRepo.findById(id);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(
        warga.posyandu_id,
        'lansia',
        date.getMonth() + 1,
        date.getFullYear(),
      );
    }

    return lansiaRepo.delete(id);
  }
}
