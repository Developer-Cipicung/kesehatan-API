import { PendataanBulananRepository } from '../repositories/pendataan-bulanan.repository';
import { AppError } from '../utils/AppError';
import { KategoriPendataan } from '../../prisma/generated-schema';

const pendataanRepo = new PendataanBulananRepository();

export class LockValidationService {
  async ensureNotLocked(posyanduId: string, kategori: KategoriPendataan, bulan: number, tahun: number) {
    const pendataan = await pendataanRepo.findByKategoriPeriode(posyanduId, kategori, bulan, tahun);
    
    if (pendataan && pendataan.status === 'selesai') {
      throw new AppError(
        409, 
        'Pendataan untuk kategori ini pada periode tersebut telah diselesaikan dan tidak dapat diubah.'
      );
    }
  }
}
