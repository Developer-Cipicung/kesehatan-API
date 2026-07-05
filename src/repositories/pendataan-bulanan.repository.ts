import { Prisma, KategoriPendataan } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';

export class PendataanBulananRepository {
  async findAllByPeriode(bulan: number, tahun: number) {
    return prisma.pendataanBulanan.findMany({
      where: {
        bulan,
        tahun,
      },
      include: { posyandu: true },
    });
  }

  async findByKategoriPeriode(
    posyanduId: string,
    kategori: KategoriPendataan,
    bulan: number,
    tahun: number,
  ) {
    return prisma.pendataanBulanan.findUnique({
      where: {
        posyandu_id_kategori_bulan_tahun: {
          posyandu_id: posyanduId,
          kategori,
          bulan,
          tahun,
        },
      },
    });
  }

  async upsert(
    posyanduId: string,
    kategori: KategoriPendataan,
    bulan: number,
    tahun: number,
    data: Omit<
      Prisma.PendataanBulananUncheckedCreateInput,
      'posyandu_id' | 'kategori' | 'bulan' | 'tahun'
    >,
  ) {
    return prisma.pendataanBulanan.upsert({
      where: {
        posyandu_id_kategori_bulan_tahun: {
          posyandu_id: posyanduId,
          kategori,
          bulan,
          tahun,
        },
      },
      update: data,
      create: {
        posyandu_id: posyanduId,
        kategori,
        bulan,
        tahun,
        ...data,
      },
    });
  }
}
