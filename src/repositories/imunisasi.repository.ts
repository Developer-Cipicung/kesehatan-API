import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllImunisasiParams {
  page?: number;
  limit?: number;
  posyanduId?: string;
}

export class ImunisasiRepository {
  async findAll(params: FindAllImunisasiParams = {}) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RiwayatImunisasiWhereInput = {};
    if (params.posyanduId) {
      where.warga = { posyandu_id: params.posyanduId };
    }

    const [data, total] = await Promise.all([
      prisma.riwayatImunisasi.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal_pemberian: 'desc' },
        include: { warga: true },
      }),
      prisma.riwayatImunisasi.count({ where }),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, posyanduId: string) {
    return prisma.riwayatImunisasi.findFirst({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      include: { warga: true } 
    });
  }

  async findByWargaId(wargaId: string, posyanduId: string) {
    return prisma.riwayatImunisasi.findMany({
      where: { warga_id: wargaId, warga: { posyandu_id: posyanduId } },
      orderBy: { tanggal_pemberian: 'desc' },
    });
  }

  async create(data: Prisma.RiwayatImunisasiUncheckedCreateInput) {
    return prisma.riwayatImunisasi.create({ data });
  }

  async update(id: string, data: Prisma.RiwayatImunisasiUncheckedUpdateInput, posyanduId: string) {
    return prisma.riwayatImunisasi.updateMany({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      data 
    }).then(() => this.findById(id, posyanduId));
  }

  async delete(id: string, posyanduId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await prisma.riwayatImunisasi.deleteMany({ 
        where: { id, warga: { posyandu_id: posyanduId } } 
      });
    }
    return record;
  }
}
