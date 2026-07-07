import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export interface FindAllWargaParams {
  page?: number;
  limit?: number;
  search?: string;
  jenisKelamin?: 'L' | 'P';
  posyanduId?: string;
  kategori?: string;
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

    if (params.kategori) {
      const now = new Date();
      if (params.kategori === 'baduta') {
        // Under 2 years old
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        where.tanggal_lahir = { gt: twoYearsAgo };
      } else if (params.kategori === 'balita') {
        // 2–5 years old (not baduta)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(now.getFullYear() - 5);
        where.tanggal_lahir = { lte: twoYearsAgo, gt: fiveYearsAgo };
      } else if (params.kategori === 'anak_sekolah') {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(now.getFullYear() - 5);
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(now.getFullYear() - 18);
        where.tanggal_lahir = { lte: fiveYearsAgo, gt: eighteenYearsAgo };
      } else if (params.kategori === 'lansia') {
        const sixtyYearsAgo = new Date();
        sixtyYearsAgo.setFullYear(now.getFullYear() - 60);
        where.tanggal_lahir = { lte: sixtyYearsAgo };
      } else if (params.kategori === 'bumil') {
        where.jenis_kelamin = 'P';
        where.status_kehamilan = 'HAMIL';
        // Optional age filter just to be safe
        const fifteenYearsAgo = new Date();
        fifteenYearsAgo.setFullYear(now.getFullYear() - 15);
        const fiftyYearsAgo = new Date();
        fiftyYearsAgo.setFullYear(now.getFullYear() - 50);
        where.tanggal_lahir = { lte: fifteenYearsAgo, gt: fiftyYearsAgo };
      } else if (params.kategori === 'pasca_persalinan') {
        where.jenis_kelamin = 'P';
        where.status_kehamilan = 'PASCA_PERSALINAN';
        const fifteenYearsAgo = new Date();
        fifteenYearsAgo.setFullYear(now.getFullYear() - 15);
        const fiftyYearsAgo = new Date();
        fiftyYearsAgo.setFullYear(now.getFullYear() - 50);
        where.tanggal_lahir = { lte: fifteenYearsAgo, gt: fiftyYearsAgo };
      }
    }

    const [data, total] = await Promise.all([
      prisma.warga.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          pemeriksaan_balita_baduta: { orderBy: { created_at: 'desc' }, take: 1 },
          pemeriksaan_bumil: { orderBy: { created_at: 'desc' }, take: 1 },
          pemeriksaan_pasca_persalinan: { orderBy: { created_at: 'desc' }, take: 1 },
          pemeriksaan_lansia: { orderBy: { created_at: 'desc' }, take: 1 },
        }
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
