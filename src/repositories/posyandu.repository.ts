import { prisma } from '../lib/prisma';
import { Prisma } from '../../prisma/generated-schema';

export class PosyanduRepository {
  async findAll() {
    return prisma.posyandu.findMany({
      orderBy: { nama: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.posyandu.findUnique({ where: { id } });
  }

  async create(data: Prisma.PosyanduCreateInput) {
    return prisma.posyandu.create({ data });
  }

  async update(id: string, data: Prisma.PosyanduUpdateInput) {
    return prisma.posyandu.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.posyandu.delete({ where: { id } });
  }
}
