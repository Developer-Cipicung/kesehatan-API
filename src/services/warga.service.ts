import { WargaRepository, FindAllWargaParams } from '../repositories/warga.repository';
import { Prisma } from '../../prisma/generated-schema';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { auditLogService } from './audit-log.service';
import { clearDashboardCache } from './dashboard.service';
import { calculateZScoreWHO } from '../utils/zscore';

const wargaRepo = new WargaRepository();

export class WargaService {
  async findAll(params: FindAllWargaParams) {
    return wargaRepo.findAll(params);
  }

  async findById(id: string, posyanduId: string) {
    const warga = await wargaRepo.findById(id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga not found');
    return warga;
  }

  async findByNikAndTanggalLahir(nik: string, tanggalLahir: string) {
    const warga = await wargaRepo.findByNikAndTanggalLahir(nik, new Date(tanggalLahir));
    if (!warga) throw new AppError(404, 'Data warga tidak ditemukan. Pastikan NIK dan Tanggal Lahir sesuai.');
    
    // Return sanitized data for public view
    return {
      id: warga.id,
      nik: warga.nik,
      nama: warga.nama,
      jenis_kelamin: warga.jenis_kelamin,
      tanggal_lahir: warga.tanggal_lahir,
      tempat_lahir: warga.tempat_lahir,
      alamat: warga.alamat,
      nomor: warga.nomor,
      status_kehamilan: warga.status_kehamilan,
      posyandu: {
        nama: warga.posyandu.nama,
        rw: warga.posyandu.rw,
      },
      pemeriksaan_balita_baduta: warga.pemeriksaan_balita_baduta,
      pemeriksaan_bumil: warga.pemeriksaan_bumil,
      pemeriksaan_pasca_persalinan: warga.pemeriksaan_pasca_persalinan,
      pemeriksaan_lansia: warga.pemeriksaan_lansia,
      riwayat_imunisasi: warga.riwayat_imunisasi,
    };
  }

  async create(data: Prisma.WargaUncheckedCreateInput, userId: string) {
    if (data.nik === '-') data.nik = null;
    
    if (data.nik) {
      const existing = await wargaRepo.findByNik(data.nik, data.posyandu_id);
      if (existing) throw new AppError(409, 'NIK sudah terdaftar');
    }

    const created = await wargaRepo.create(data);
    auditLogService.logAction(userId, data.posyandu_id, 'CREATE', 'Warga', created.id, null, created);
    
    // Invalidate dashboard cache
    clearDashboardCache(data.posyandu_id);
    
    return created;
  }

  async bulkCreate(dataList: Prisma.WargaUncheckedCreateInput[], posyanduId: string, userId: string) {
    // Filter out potential duplicates already in the payload itself (by NIK)
    const uniqueDataMap = new Map<string, Prisma.WargaUncheckedCreateInput>();
    for (const item of dataList) {
      if (item.nik === '-') item.nik = null;
      
      const key = item.nik || `null-${Math.random()}`; // Allow multiple nulls
      if (!uniqueDataMap.has(key)) {
        uniqueDataMap.set(key, { ...item, posyandu_id: posyanduId });
      }
    }
    const uniqueDataList = Array.from(uniqueDataMap.values());

    // Auto-link mothers (ibu_id) if nama_ibu matches an existing mother's name
    const namaIbuList = [...new Set(uniqueDataList.map(item => item.nama_ibu).filter(Boolean))] as string[];
    if (namaIbuList.length > 0) {
      const existingMothers = await wargaRepo.findAll({
        posyanduId,
        jenisKelamin: 'P',
        limit: 10000 // Get as many as possible to match
      });
      
      const motherMap = new Map<string, string>();
      // Note: Since name is not unique, this will pick the first match.
      // But we refine it by ensuring it matches the exact name and posyandu
      for (const mother of existingMothers.data) {
        const normalizedName = mother.nama.trim().toLowerCase();
        if (!motherMap.has(normalizedName)) {
          motherMap.set(normalizedName, mother.id);
        }
      }

      for (const item of uniqueDataList) {
        if (item.nama_ibu) {
          const normalizedInput = item.nama_ibu.trim().toLowerCase();
          if (motherMap.has(normalizedInput)) {
            item.ibu_id = motherMap.get(normalizedInput);
          }
        }
      }
    }

    // In PostgreSQL / Prisma, createMany with skipDuplicates will ignore rows that violate unique constraints
    const result = await wargaRepo.createMany(uniqueDataList);
    
    auditLogService.logAction(userId, posyanduId, 'CREATE', 'Warga', 'bulk', null, { count: result.count });
    
    // Invalidate dashboard cache
    clearDashboardCache(posyanduId);
    
    return {
      count: result.count,
      message: `${result.count} data warga berhasil diimpor.`
    };
  }

  async update(id: string, data: Prisma.WargaUncheckedUpdateInput, posyanduId: string, userId: string) {
    const warga = await wargaRepo.findById(id, posyanduId);
    if (!warga) throw new AppError(404, 'Warga not found');

    if (data.nik === '-') data.nik = null;

    if (data.nik && data.nik !== warga.nik) {
      const existing = await wargaRepo.findByNik(data.nik as string, posyanduId);
      if (existing) throw new AppError(409, 'NIK sudah terdaftar');
    }

    const updated = await wargaRepo.update(id, data, posyanduId);
    
    // Recalculate ZScores if birth date or gender changed
    if (
      (data.tanggal_lahir !== undefined && data.tanggal_lahir !== warga.tanggal_lahir) ||
      (data.jenis_kelamin !== undefined && data.jenis_kelamin !== warga.jenis_kelamin)
    ) {
      const pemeriksaans = await prisma.pemeriksaanBalitaBaduta.findMany({
        where: { warga_id: id }
      });
      
      if (pemeriksaans.length > 0 && updated) {
        for (const record of pemeriksaans) {
          if (record.bb === null && record.tb === null && record.lingkar_kepala === null) continue;
          
          const zscore = await calculateZScoreWHO({
            jenis_kelamin: updated.jenis_kelamin as 'L' | 'P',
            tanggal_lahir: updated.tanggal_lahir,
            tanggal_kunjungan: record.tanggal_kunjungan,
            bb: record.bb !== null ? Number(record.bb) : undefined,
            tb: record.tb !== null ? Number(record.tb) : undefined,
            lingkar_kepala: record.lingkar_kepala !== null ? Number(record.lingkar_kepala) : undefined,
          });
          
          await prisma.pemeriksaanBalitaBaduta.update({
            where: { id: record.id },
            data: {
              zscore_bb_u: zscore.bb_u,
              zscore_tb_u: zscore.tb_u,
              zscore_bb_tb: zscore.bb_tb,
            }
          });
        }
      }
    }

    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'Warga', id, warga, updated);
    clearDashboardCache(posyanduId);
    return updated;
  }

  async delete(id: string, posyanduId: string, userId: string) {
    const record = await this.findById(id, posyanduId);
    if (record) {
      await wargaRepo.delete(id, posyanduId);
      auditLogService.logAction(userId, posyanduId, 'DELETE', 'Warga', id, record, null);
      clearDashboardCache(posyanduId);
    }
    return record;
  }

  async tandaiBersalin(
    ibuId: string,
    posyanduId: string,
    userId: string,
    data: {
      tanggal_persalinan: string;
      tempat_persalinan: string;
      nama_bayi: string;
      jenis_kelamin_bayi: 'L' | 'P';
      nama_ayah: string;
    }
  ) {
    const ibu = await this.findById(ibuId, posyanduId);
    if (!ibu) throw new AppError(404, 'Data ibu tidak ditemukan');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Ibu
      const updatedIbu = await tx.warga.update({
        where: { id: ibuId },
        data: {
          status_kehamilan: 'PASCA_PERSALINAN',
          tempat_persalinan: data.tempat_persalinan,
        },
      });

      // 2. Create Pemeriksaan Pasca Persalinan for Ibu
      // Fetch latest bumil checkup for BB
      const lastBumil = await tx.pemeriksaanBumil.findFirst({
        where: { warga_id: ibuId },
        orderBy: { tanggal_kunjungan: 'desc' },
      });
      await tx.pemeriksaanPascaPersalinan.create({
        data: {
          warga_id: ibuId,
          tanggal_kunjungan: new Date(),
          tanggal_persalinan: new Date(data.tanggal_persalinan),
          bb: lastBumil?.bb || 0,
          catatan: 'Data otomatis dari perubahan status Ibu Hamil ke Pasca Persalinan',
        },
      });

      // 3. Create Bayi Warga Record
      const bayi = await tx.warga.create({
        data: {
          posyandu_id: posyanduId,
          nama: data.nama_bayi,
          jenis_kelamin: data.jenis_kelamin_bayi,
          tanggal_lahir: new Date(data.tanggal_persalinan),
          tempat_lahir: data.tempat_persalinan,
          nomor: ibu.nomor, // Inherit from mom
          alamat: ibu.alamat,
          rt: ibu.rt,
          rw: ibu.rw,
          ibu_id: ibuId,
          nama_ibu: ibu.nama,
          nama_ayah: data.nama_ayah,
        },
      });

      return { ibu: updatedIbu, bayi };
    });

    auditLogService.logAction(userId, posyanduId, 'UPDATE', 'Warga', ibuId, null, { action: 'Tandai Bersalin', data: result });
    clearDashboardCache(posyanduId);

    return result;
  }
}
