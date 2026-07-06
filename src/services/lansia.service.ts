import { LansiaRepository, FindAllLansiaParams } from '../repositories/lansia.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { calculateAgeInYears } from '../utils/age';
import { auditLogService } from './audit-log.service';

function calculateLansiaStatus(tekananDarahSistolik: number): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' {
  // Placeholder medical rule logic
  if (tekananDarahSistolik > 160) return 'Dirujuk';
  if (tekananDarahSistolik > 140) return 'Perlu Perhatian';
  return 'Normal';
}

function mapWithStatus(record: any) {
  if (!record) return record;
  return {
    ...record,
    status_medis: calculateLansiaStatus(Number(record.tekanan_darah_sistolik)),
  };
}

const lansiaRepo = new LansiaRepository();
const wargaRepo = new WargaRepository();
const lockService = new LockValidationService();

export class LansiaService {
  async findAll(params: FindAllLansiaParams) {
    const result = await lansiaRepo.findAll(params);
    return {
      ...result,
      data: result.data.map(mapWithStatus),
    };
  }

  async findById(id: string, posyanduId: string) {
    const data = await lansiaRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return mapWithStatus(data);
  }

  async findHistory(wargaId: string, posyanduId: string) {
    const history = await lansiaRepo.findByWargaId(wargaId, posyanduId);
    return history.map(mapWithStatus);
  }

  async create(data: Prisma.PemeriksaanLansiaUncheckedCreateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

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

    const created = await lansiaRepo.create(data);
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanLansia', created.id, null, created);
    return mapWithStatus(created);
  }

  async update(id: string, data: Prisma.PemeriksaanLansiaUncheckedUpdateInput, posyanduId: string, userId: string) {
    const record = await lansiaRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
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

    const updated = await lansiaRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'PemeriksaanLansia', id, record, updated);
    return mapWithStatus(updated);
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await lansiaRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      await lockService.ensureNotLocked(
        warga.posyandu_id,
        'lansia',
        date.getMonth() + 1,
        date.getFullYear(),
      );
    }

    const deleted = await lansiaRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'PemeriksaanLansia', id, record, null);
    return mapWithStatus(deleted);
  }
}
