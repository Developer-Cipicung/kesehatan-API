import { BalitaRepository, FindAllBalitaParams } from '../repositories/balita.repository';
import { WargaRepository } from '../repositories/warga.repository';
import { LockValidationService } from './lock-validation.service';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { calculateAgeInMonths } from '../utils/age';
import { auditLogService } from './audit-log.service';

import { calculateZScoreWHO, classifyZScore } from '../utils/zscore';

function calculateBalitaStatus(bb: number): 'Normal' | 'Perlu Perhatian' | 'Dirujuk' {
  // Placeholder medical rule logic
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
    status_medis: calculateBalitaStatus(Number(record.bb)),
    status_gizi: categories
  };
}

const balitaRepo = new BalitaRepository();
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

  async findById(id: string, posyanduId: string) {
    const data = await balitaRepo.findById(id, posyanduId);
    if (!data) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');
    return mapWithStatus(data);
  }

  async findHistory(wargaId: string, posyanduId: string) {
    const history = await balitaRepo.findByWargaId(wargaId, posyanduId);
    return history.map(mapWithStatus);
  }

  async create(data: Prisma.PemeriksaanBalitaBadutaUncheckedCreateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(data.warga_id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga tidak ditemukan');

    if (calculateAgeInMonths(warga.tanggal_lahir) >= 60) {
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
      bb: Number(data.bb),
      tb: Number(data.tb),
      lingkar_kepala: data.lingkar_kepala ? Number(data.lingkar_kepala) : undefined,
    });

    data.zscore_bb_u = zscore.bb_u;
    data.zscore_tb_u = zscore.tb_u;
    data.zscore_bb_tb = zscore.bb_tb;

    const created = await balitaRepo.create(data);
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'PemeriksaanBalitaBaduta', created.id, null, created);
    return mapWithStatus(created);
  }

  async update(
    id: string,
    data: Prisma.PemeriksaanBalitaBadutaUncheckedUpdateInput,
    posyanduId: string,
    userId: string,
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
      bb: data.bb ? Number(data.bb) : Number(record.bb),
      tb: data.tb ? Number(data.tb) : Number(record.tb),
      lingkar_kepala: data.lingkar_kepala ? Number(data.lingkar_kepala) : (record.lingkar_kepala ? Number(record.lingkar_kepala) : undefined),
    });

    data.zscore_bb_u = zscore.bb_u;
    data.zscore_tb_u = zscore.tb_u;
    data.zscore_bb_tb = zscore.bb_tb;

    const updated = await balitaRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'PemeriksaanBalitaBaduta', id, record, updated);
    return mapWithStatus(updated);
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await balitaRepo.findById(id, posyanduId);
    if (!record) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');

    const warga = await wargaRepo.findById(record.warga_id, posyanduId);
    if (warga) {
      const date = new Date(record.tanggal_kunjungan);
      // removed lock check for update/delete
    }

    const deleted = await balitaRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'PemeriksaanBalitaBaduta', id, record, null);
    return mapWithStatus(deleted);
  }
}
