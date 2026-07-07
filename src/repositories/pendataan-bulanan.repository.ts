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

  async findById(id: string, posyanduId: string) {
    return prisma.pendataanBulanan.findFirst({
      where: { id, posyandu_id: posyanduId },
    });
  }

  async update(id: string, data: Prisma.PendataanBulananUpdateInput) {
    return prisma.pendataanBulanan.update({
      where: { id },
      data,
    });
  }

  async findByPeriode(
    posyanduId: string,
    bulan: number,
    tahun: number,
  ) {
    return prisma.pendataanBulanan.findUnique({
      where: {
        posyandu_id_bulan_tahun: {
          posyandu_id: posyanduId,
          bulan,
          tahun,
        },
      },
    });
  }

  async upsert(
    posyanduId: string,
    bulan: number,
    tahun: number,
    data: Omit<
      Prisma.PendataanBulananUncheckedCreateInput,
      'posyandu_id' | 'bulan' | 'tahun'
    >,
  ) {
    return prisma.pendataanBulanan.upsert({
      where: {
        posyandu_id_bulan_tahun: {
          posyandu_id: posyanduId,
          bulan,
          tahun,
        },
      },
      update: data,
      create: {
        posyandu_id: posyanduId,
        bulan,
        tahun,
        ...data,
      },
    });
  }
}
