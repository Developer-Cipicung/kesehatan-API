import { PosyanduRepository } from '../repositories/posyandu.repository';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const posyanduRepo = new PosyanduRepository();

export class PosyanduService {
  async findAll() {
    return posyanduRepo.findAll();
  }

  async findById(id: string) {
    const posyandu = await posyanduRepo.findById(id);
    if (!posyandu) throw new AppError(404, 'Posyandu not found');
    return posyandu;
  }

  async create(data: Prisma.PosyanduCreateInput) {
    return posyanduRepo.create(data);
  }

  async update(id: string, data: Prisma.PosyanduUpdateInput) {
    const posyandu = await posyanduRepo.findById(id);
    if (!posyandu) throw new AppError(404, 'Posyandu not found');
    return posyanduRepo.update(id, data);
  }

  async delete(id: string) {
    const posyandu = await posyanduRepo.findById(id);
    if (!posyandu) throw new AppError(404, 'Posyandu not found');
    return posyanduRepo.delete(id);
  }
}
