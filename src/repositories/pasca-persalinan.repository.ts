import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllPascaPersalinanParams {
  page?: number;
  limit?: number;
  search?: string;
  posyanduId?: string;
}

export class PascaPersalinanRepository {
  async findAll(params: FindAllPascaPersalinanParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanPascaPersalinanWhereInput = {};

    if (params.posyanduId || params.search) {
      where.warga = {
        ...(params.posyanduId && { posyandu_id: params.posyanduId }),
        ...(params.search && { nama: { contains: params.search, mode: 'insensitive' } }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.pemeriksaanPascaPersalinan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal_kunjungan: 'desc' },
        include: { warga: true },
      }),
      prisma.pemeriksaanPascaPersalinan.count({ where }),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.pemeriksaanPascaPersalinan.findUnique({
      where: { id },
      include: { warga: true },
    });
  }

  async findByWargaId(wargaId: string) {
    return prisma.pemeriksaanPascaPersalinan.findMany({
      where: { warga_id: wargaId },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanPascaPersalinanUncheckedCreateInput) {
    return prisma.pemeriksaanPascaPersalinan.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanPascaPersalinanUncheckedUpdateInput) {
    return prisma.pemeriksaanPascaPersalinan.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.pemeriksaanPascaPersalinan.delete({ where: { id } });
  }
}
