import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllWargaParams {
  page?: number;
  limit?: number;
  search?: string;
  jenisKelamin?: 'L' | 'P';
  posyanduId?: string;
}

export class WargaRepository {
  async findAll(params: FindAllWargaParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.WargaWhereInput = {};

    if (params.search) {
      where.OR = [
        { nama: { contains: params.search, mode: 'insensitive' } },
        { nik: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.jenisKelamin) {
      where.jenis_kelamin = params.jenisKelamin;
    }

    if (params.posyanduId) {
      where.posyandu_id = params.posyanduId;
    }

    const [data, total] = await Promise.all([
      prisma.warga.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.warga.count({ where }),
    ]);

    return {
      data,
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, posyanduId: string) {
    return prisma.warga.findFirst({
      where: { id, posyandu_id: posyanduId },
    });
  }

  async findByNik(nik: string, posyanduId: string) {
    return prisma.warga.findFirst({
      where: { nik, posyandu_id: posyanduId },
    });
  }

  async create(data: Prisma.WargaUncheckedCreateInput) {
    return prisma.warga.create({
      data,
    });
  }

  async update(id: string, data: Prisma.WargaUncheckedUpdateInput, posyanduId: string) {
    return prisma.warga.updateMany({
      where: { id, posyandu_id: posyanduId },
      data,
    }).then(() => this.findById(id, posyanduId));
  }

  async delete(id: string, posyanduId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await prisma.warga.deleteMany({
        where: { id, posyandu_id: posyanduId },
      });
    }
    return record;
  }
}
