import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';
import { KategoriPendataan } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';

const pendataanRepo = new PendataanBulananRepository();

export class PendataanBulananService {
  async getStatus(posyanduId: string, kategori: KategoriPendataan, bulan: number, tahun: number) {
    const data = await pendataanRepo.findByKategoriPeriode(posyanduId, kategori, bulan, tahun);
    if (data) return data;

    // Create draft if not exists so we have an ID
    return pendataanRepo.upsert(posyanduId, kategori, bulan, tahun, {
      status: 'draft',
    });
  }

  async getAllStatus(posyanduId: string, bulan: number, tahun: number) {
    const allCategories: KategoriPendataan[] = [
      'balita',
      'imunisasi',
      'bumil',
      'pasca_persalinan',
      'lansia',
    ];

    // Ensure all have draft or existing records
    const promises = allCategories.map((kategori) =>
      this.getStatus(posyanduId, kategori, bulan, tahun),
    );
    
    const records = await Promise.all(promises);

    return records.map((record) => ({
      id: record.id,
      kategori: record.kategori,
      status: record.status,
    }));
  }

  async selesaikanPendataan(
    id: string,
    posyanduId: string,
    submittedBy: string,
  ) {
    const record = await pendataanRepo.findById(id, posyanduId);
    if (!record) {
      throw new AppError(404, 'Data pendataan bulanan tidak ditemukan.');
    }

    // Idempotency: if already submitted, just return
    if (record.status === 'selesai') {
      return record;
    }

    const updated = await pendataanRepo.update(id, {
      status: 'selesai',
      user: { connect: { id: submittedBy } },
      submitted_at: new Date(),
    });

    auditLogService.logAction(submittedBy, posyanduId, 'SUBMIT', 'PendataanBulanan', id, record, updated);
    return updated;
  }
}
