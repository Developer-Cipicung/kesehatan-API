import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllBumilParams {
  bulan?: number;
  tahun?: number;
  page?: number;
  limit?: number;
  search?: string;
  posyanduId?: string;
}

export class BumilRepository {
  async findAll(params: FindAllBumilParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanBumilWhereInput = {};

    if (params.bulan && params.tahun) {
      const startDate = new Date(params.tahun, params.bulan - 1, 1);
      const endDate = new Date(params.tahun, params.bulan, 1);

      where.tanggal_kunjungan = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (params.posyanduId || params.search) {
      where.warga = {
        ...(params.posyanduId && { posyandu_id: params.posyanduId }),
        ...(params.search && { nama: { contains: params.search, mode: 'insensitive' } }),
      };
    }

    const [data, total] = await Promise.all([
      prisma.pemeriksaanBumil.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal_kunjungan: 'desc' },
        include: { warga: true },
      }),
      prisma.pemeriksaanBumil.count({ where }),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.pemeriksaanBumil.findUnique({ where: { id }, include: { warga: true } });
  }

  async findByWargaId(wargaId: string) {
    return prisma.pemeriksaanBumil.findMany({
      where: { warga_id: wargaId },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanBumilUncheckedCreateInput) {
    return prisma.pemeriksaanBumil.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanBumilUncheckedUpdateInput) {
    return prisma.pemeriksaanBumil.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.pemeriksaanBumil.delete({ where: { id } });
  }
}
