import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllLansiaParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class LansiaRepository {
  async findAll(params: FindAllLansiaParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanLansiaWhereInput = {};

    if (params.search) {
      where.warga = {
        nama: { contains: params.search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      prisma.pemeriksaanLansia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal_kunjungan: 'desc' },
        include: { warga: true },
      }),
      prisma.pemeriksaanLansia.count({ where }),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return prisma.pemeriksaanLansia.findUnique({ where: { id }, include: { warga: true } });
  }

  async findByWargaId(wargaId: string) {
    return prisma.pemeriksaanLansia.findMany({
      where: { warga_id: wargaId },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanLansiaUncheckedCreateInput) {
    return prisma.pemeriksaanLansia.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanLansiaUncheckedUpdateInput) {
    return prisma.pemeriksaanLansia.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.pemeriksaanLansia.delete({ where: { id } });
  }
}
