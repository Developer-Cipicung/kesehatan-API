import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';
import { KategoriPendataan } from '../../prisma/generated-schema';
import { AppError } from '../utils/AppError';

const pendataanRepo = new PendataanBulananRepository();

export class PendataanBulananService {
  async getStatus(posyanduId: string, kategori: KategoriPendataan, bulan: number, tahun: number) {
    const data = await pendataanRepo.findByKategoriPeriode(posyanduId, kategori, bulan, tahun);
    return data || {
      kategori,
      bulan,
      tahun,
      status: 'draft',
      submitted_at: null
    };
  }

  async getAllStatus(posyanduId: string, bulan: number, tahun: number) {
    const data = await pendataanRepo.findAllByPeriode(bulan, tahun);
    const posyanduData = data.filter(d => d.posyandu_id === posyanduId);
    
    const allCategories: KategoriPendataan[] = ['balita', 'imunisasi', 'bumil', 'pasca_persalinan', 'lansia'];
    
    return allCategories.map(kategori => {
      const record = posyanduData.find(d => d.kategori === kategori);
      return {
        kategori,
        status: record ? record.status : 'draft'
      };
    });
  }

  async selesaikanPendataan(posyanduId: string, kategori: KategoriPendataan, bulan: number, tahun: number, submittedBy: string) {
    const existing = await pendataanRepo.findByKategoriPeriode(posyanduId, kategori, bulan, tahun);
    
    if (existing && existing.status === 'selesai') {
      throw new AppError(409, 'Pendataan untuk kategori ini pada periode tersebut sudah diselesaikan.');
    }

    return pendataanRepo.upsert(posyanduId, kategori, bulan, tahun, {
      status: 'selesai',
      submitted_by: submittedBy,
      submitted_at: new Date()
    });
  }
}
