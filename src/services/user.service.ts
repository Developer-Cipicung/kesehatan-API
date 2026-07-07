import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { Prisma } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

export class UserService {
  async findAll() {
    return prisma.user.findMany({
      include: {
        posyandu: true,
      },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posyandu: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User tidak ditemukan.');
    }

    return user;
  }

  async create(payload: any) {
    const { password, ...data } = payload;
    
    // Check if email already exists in DB
    const existing = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(400, 'User dengan email tersebut sudah ada.');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: password || 'cicipung2026',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new AppError(500, `Gagal membuat auth user: ${authError?.message}`);
    }

    data.auth_id = authData.user.id;

    if (data.role === 'admin' && (!data.posyandu_id || data.posyandu_id === '')) {
      const firstPosyandu = await prisma.posyandu.findFirst();
      if (firstPosyandu) {
        data.posyandu_id = firstPosyandu.id;
      } else {
        throw new AppError(400, 'Tolong buat minimal 1 Posyandu terlebih dahulu.');
      }
    }

    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    await this.findById(id);

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();
