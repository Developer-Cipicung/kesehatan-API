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
    
    // Check if username already exists in DB
    const existing = await prisma.user.findFirst({
      where: { username: data.username },
    });

    if (existing) {
      throw new AppError(400, 'User dengan username tersebut sudah ada.');
    }

    const email = `${data.username}@cipicung.com`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'cicipung2026',
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('rate limit')) {
        throw new AppError(429, 'Batas pembuatan akun telah tercapai (Limit dari Supabase). Silakan coba lagi nanti.');
      }
      throw new AppError(500, `Gagal membuat auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new AppError(500, `Gagal membuat auth user: Data user tidak ditemukan.`);
    }

    data.auth_id = authData.user.id;

    if (data.role === 'admin') {
      data.posyandu_id = null;
    } else if (!data.posyandu_id || data.posyandu_id === '') {
      // Just a failsafe, usually caught by Zod
      throw new AppError(400, 'Posyandu wajib dipilih.');
    }

    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);

    if (data.role === 'admin') {
      data.posyandu_id = null;
    } else if (data.posyandu_id === '') {
      delete data.posyandu_id;
    }

    if (data.username) {
      const user = await this.findById(id);
      if (user.username !== data.username) {
        const existing = await prisma.user.findFirst({
          where: { username: data.username, id: { not: id } },
        });
        if (existing) {
          throw new AppError(400, 'Username sudah terpakai.');
        }
        
        const { error: err } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
          email: `${data.username}@cipicung.com`
        });
        if (err) {
          throw new AppError(500, `Gagal update username di otentikasi. Pastikan SUPABASE_SERVICE_ROLE_KEY valid. Detail: ${err.message}`);
        }
      }
    }

    if (data.password) {
      const user = await this.findById(id);
      const { error: err } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
        password: data.password
      });
      if (err) {
        throw new AppError(500, `Gagal update password. Pastikan SUPABASE_SERVICE_ROLE_KEY di .env valid (saat ini salah). Detail: ${err.message}`);
      }
    }
    delete data.password;

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
