import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllPascaPersalinanParams {
  bulan?: number;
  tahun?: number;
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

  async findById(id: string, posyanduId: string) {
    return prisma.pemeriksaanPascaPersalinan.findFirst({
      where: { id, warga: { posyandu_id: posyanduId } },
      include: { warga: true },
    });
  }

  async findByWargaId(wargaId: string, posyanduId: string) {
    return prisma.pemeriksaanPascaPersalinan.findMany({
      where: { warga_id: wargaId, warga: { posyandu_id: posyanduId } },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanPascaPersalinanUncheckedCreateInput) {
    return prisma.pemeriksaanPascaPersalinan.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanPascaPersalinanUncheckedUpdateInput, posyanduId: string) {
    return prisma.pemeriksaanPascaPersalinan.updateMany({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      data 
    }).then(() => this.findById(id, posyanduId));
  }

  async delete(id: string, posyanduId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await prisma.pemeriksaanPascaPersalinan.deleteMany({ 
        where: { id, warga: { posyandu_id: posyanduId } } 
      });
    }
    return record;
  }
}
