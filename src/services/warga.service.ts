import { WargaRepository, FindAllWargaParams } from '../repositories/warga.repository';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';

const wargaRepo = new WargaRepository();

export class WargaService {
  async findAll(params: FindAllWargaParams) {
    return wargaRepo.findAll(params);
  }

  async findById(id: string, posyanduId: string) {
    const warga = await wargaRepo.findById(id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga not found');
    return warga;
  }

  async create(data: Prisma.WargaUncheckedCreateInput, userId: string) {
    const existing = await wargaRepo.findByNik(data.nik, data.posyandu_id);
    if (existing) throw new AppError(409, 'NIK sudah terdaftar');

    const created = await wargaRepo.create(data);
    auditLogService.logAction(userId, data.posyandu_id, 'CREATE', 'Warga', created.id, null, created);
    return created;
  }

  async update(id: string, data: Prisma.WargaUncheckedUpdateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga not found');

    if (data.nik && data.nik !== warga.nik) {
      const existing = await wargaRepo.findByNik(data.nik as string, posyanduId);
      if (existing) throw new AppError(409, 'NIK sudah terdaftar');
    }

    const updated = await wargaRepo.update(id, data, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'Warga', id, warga, updated);
    return updated;
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga not found');

    const deleted = await wargaRepo.delete(id, posyanduId);
    auditLogService.logAction(userId, posyanduId, 'DELETE', 'Warga', id, warga, null);
    return deleted;
  }
}
