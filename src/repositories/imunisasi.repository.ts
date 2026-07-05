import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllImunisasiParams {
  page?: number;
  limit?: number;
}

export class ImunisasiRepository {
  async findAll(params: FindAllImunisasiParams = {}) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.riwayatImunisasi.findMany({
        skip,
        take: limit,
        orderBy: { tanggal_pemberian: 'desc' },
        include: { warga: true },
      }),
      prisma.riwayatImunisasi.count(),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.riwayatImunisasi.findUnique({ where: { id }, include: { warga: true } });
  }

  async findByWargaId(wargaId: string) {
    return prisma.riwayatImunisasi.findMany({
      where: { warga_id: wargaId },
      orderBy: { tanggal_pemberian: 'desc' },
    });
  }

  async create(data: Prisma.RiwayatImunisasiUncheckedCreateInput) {
    return prisma.riwayatImunisasi.create({ data });
  }

  async update(id: string, data: Prisma.RiwayatImunisasiUncheckedUpdateInput) {
    return prisma.riwayatImunisasi.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.riwayatImunisasi.delete({ where: { id } });
  }
}
