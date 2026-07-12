import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';
import { getBirthDateCutoffInMonths } from '../utils/age';

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
        const twoYearsAgo = getBirthDateCutoffInMonths(24, now);
        where.tanggal_lahir = { gt: twoYearsAgo };
      } else if (params.kategori === 'balita') {
        // 2–5 years old (not baduta)
        const twoYearsAgo = getBirthDateCutoffInMonths(24, now);
        const fiveYearsAgo = getBirthDateCutoffInMonths(60, now);
        where.tanggal_lahir = { lte: twoYearsAgo, gt: fiveYearsAgo };
      } else if (params.kategori === 'anak_sekolah') {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(now.getFullYear() - 5);
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(now.getFullYear() - 18);
        where.tanggal_lahir = { lte: fiveYearsAgo, gt: eighteenYearsAgo };
      } else if (params.kategori === 'lansia') {
        // Lansia (now used as fallback for all adults), exclude balita/baduta and pregnant/pasca women
        const fiveYearsAgo = getBirthDateCutoffInMonths(60, now);
        where.tanggal_lahir = { lte: fiveYearsAgo };
        where.status_kehamilan = 'TIDAK_HAMIL';
      } else if (params.kategori === 'bumil') {
        where.jenis_kelamin = 'P';
        where.status_kehamilan = 'HAMIL';
      } else if (params.kategori === 'pasca_persalinan') {
        where.jenis_kelamin = 'P';
        where.status_kehamilan = 'PASCA_PERSALINAN';
      }
    }

    // Build dynamic include object based on kategori
    const include: Prisma.WargaInclude = {};
    if (params.kategori === 'baduta' || params.kategori === 'balita') {
      include.pemeriksaan_balita_baduta = { orderBy: { created_at: 'desc' }, take: 1 };
    } else if (params.kategori === 'bumil') {
      include.pemeriksaan_bumil = { orderBy: { created_at: 'desc' }, take: 1 };
    } else if (params.kategori === 'pasca_persalinan') {
      include.pemeriksaan_pasca_persalinan = { orderBy: { created_at: 'desc' }, take: 1 };
    } else if (params.kategori === 'lansia') {
      include.pemeriksaan_lansia = { orderBy: { created_at: 'desc' }, take: 1 };
    } else if (!params.kategori) {
      // If no category specified, include all just in case, but this should be rare for limit=10000
      include.pemeriksaan_balita_baduta = { orderBy: { created_at: 'desc' }, take: 1 };
      include.pemeriksaan_bumil = { orderBy: { created_at: 'desc' }, take: 1 };
      include.pemeriksaan_pasca_persalinan = { orderBy: { created_at: 'desc' }, take: 1 };
      include.pemeriksaan_lansia = { orderBy: { created_at: 'desc' }, take: 1 };
    }
    
    // Always include ibu if it's a child
    if (params.kategori === 'baduta' || params.kategori === 'balita' || !params.kategori) {
      include.ibu = true;
    }

    const [data, total] = await Promise.all([
      prisma.warga.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: Object.keys(include).length > 0 ? include : undefined,
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
      include: {
        pemeriksaan_balita_baduta: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_bumil: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_pasca_persalinan: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_lansia: { orderBy: { created_at: 'desc' }, take: 1 },
        ibu: true,
      }
    });
  }

  async findByNik(nik: string, posyanduId: string) {
    return prisma.warga.findFirst({
      where: { nik, posyandu_id: posyanduId },
    });
  }

  async findByNikAndTanggalLahir(nik: string, tanggalLahir: Date) {
    return prisma.warga.findFirst({
      where: { nik, tanggal_lahir: tanggalLahir },
      include: {
        posyandu: true,
        pemeriksaan_balita_baduta: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_bumil: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_pasca_persalinan: { orderBy: { created_at: 'desc' }, take: 1 },
        pemeriksaan_lansia: { orderBy: { created_at: 'desc' }, take: 1 },
      }
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
