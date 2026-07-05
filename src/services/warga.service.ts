import { WargaRepository, FindAllWargaParams } from '../repositories/warga.repository';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const wargaRepo = new WargaRepository();

export class WargaService {
  async findAll(params: FindAllWargaParams) {
    return wargaRepo.findAll(params);
  }

  async findById(id: string, posyanduId: string) {
    const warga = await wargaRepo.findById(id);
    if (!warga || warga.posyandu_id !== posyanduId) throw new AppError(404, 'Warga not found');
    return warga;
  }

  async create(data: Prisma.WargaUncheckedCreateInput) {
    const existing = await wargaRepo.findByNik(data.nik);
    if (existing) throw new AppError(409, 'NIK sudah terdaftar');

    return wargaRepo.create(data);
  }

  async update(id: string, data: Prisma.WargaUncheckedUpdateInput, posyanduId: string) {
    const warga = await wargaRepo.findById(id);
    if (!warga || warga.posyandu_id !== posyanduId) throw new AppError(404, 'Warga not found');

    if (data.nik && data.nik !== warga.nik) {
      const existing = await wargaRepo.findByNik(data.nik as string);
      if (existing) throw new AppError(409, 'NIK sudah terdaftar');
    }

    return wargaRepo.update(id, data);
  }

  async delete(id: string, posyanduId: string) {
    const warga = await wargaRepo.findById(id);
    if (!warga || warga.posyandu_id !== posyanduId) throw new AppError(404, 'Warga not found');

    return wargaRepo.delete(id);
  }
}
