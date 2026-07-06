import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllLansiaParams {
  page?: number;
  limit?: number;
  search?: string;
  posyanduId?: string;
}

export class LansiaRepository {
  async findAll(params: FindAllLansiaParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanLansiaWhereInput = {};

    if (params.posyanduId || params.search) {
      where.warga = {
        ...(params.posyanduId && { posyandu_id: params.posyanduId }),
        ...(params.search && { nama: { contains: params.search, mode: 'insensitive' } }),
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

  async findById(id: string, posyanduId: string) {
    return prisma.pemeriksaanLansia.findFirst({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      include: { warga: true } 
    });
  }

  async findByWargaId(wargaId: string, posyanduId: string) {
    return prisma.pemeriksaanLansia.findMany({
      where: { warga_id: wargaId, warga: { posyandu_id: posyanduId } },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanLansiaUncheckedCreateInput) {
    return prisma.pemeriksaanLansia.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanLansiaUncheckedUpdateInput, posyanduId: string) {
    return prisma.pemeriksaanLansia.updateMany({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      data 
    }).then(() => this.findById(id, posyanduId));
  }

  async delete(id: string, posyanduId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await prisma.pemeriksaanLansia.deleteMany({ 
        where: { id, warga: { posyandu_id: posyanduId } } 
      });
    }
    return record;
  }
}
