import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllBalitaParams {
  bulan?: number;
  tahun?: number;
  page?: number;
  limit?: number;
  search?: string;
  posyanduId?: string;
}

export class BalitaRepository {
  async findAll(params: FindAllBalitaParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PemeriksaanBalitaBadutaWhereInput = {};

    if (params.bulan && params.tahun) {
      // Assuming we filter by month and year of tanggal_kunjungan
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
      prisma.pemeriksaanBalitaBaduta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal_kunjungan: 'desc' },
        include: { warga: true },
      }),
      prisma.pemeriksaanBalitaBaduta.count({ where }),
    ]);

    return {
      data,
      metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, posyanduId: string) {
    return prisma.pemeriksaanBalitaBaduta.findFirst({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      include: { warga: true } 
    });
  }

  async findByWargaId(wargaId: string, posyanduId: string) {
    return prisma.pemeriksaanBalitaBaduta.findMany({
      where: { warga_id: wargaId, warga: { posyandu_id: posyanduId } },
      orderBy: { tanggal_kunjungan: 'desc' },
    });
  }

  async create(data: Prisma.PemeriksaanBalitaBadutaUncheckedCreateInput) {
    return prisma.pemeriksaanBalitaBaduta.create({ data });
  }

  async update(id: string, data: Prisma.PemeriksaanBalitaBadutaUncheckedUpdateInput, posyanduId: string) {
    return prisma.pemeriksaanBalitaBaduta.updateMany({ 
      where: { id, warga: { posyandu_id: posyanduId } }, 
      data 
    }).then(() => this.findById(id, posyanduId));
  }

  async delete(id: string, posyanduId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await prisma.pemeriksaanBalitaBaduta.deleteMany({ 
        where: { id, warga: { posyandu_id: posyanduId } } 
      });
    }
    return record;
  }
}
