import { datasets } from './dataset';
import { findLMS, computeZScore } from './calculator';
import { classifyZScore } from './classifier';

export interface ZScoreParams {
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: Date;
  tanggal_kunjungan: Date;
  bb?: number; // in kg
  tb?: number; // in cm
  lingkar_kepala?: number;
}

export interface ZScoreResult {
  bb_u: number | null;
  tb_u: number | null;
  bb_tb: number | null;
  kategori_bb_u: string | null;
  kategori_tb_u: string | null;
  kategori_bb_tb: string | null;
}

export { classifyZScore };

export async function calculateZScoreWHO(params: ZScoreParams): Promise<ZScoreResult> {
  try {
    const umurDays = Math.max(0, Math.floor((params.tanggal_kunjungan.getTime() - params.tanggal_lahir.getTime()) / (1000 * 60 * 60 * 24)));
    
    const isMale = params.jenis_kelamin === 'L';
    const isUnder2 = umurDays < 731; // Kurang dari 2 tahun (731 hari untuk akomodir tahun kabisat)
    
    // Pemilihan O(1) Cache berdasarkan parameter
    const wfaData = isMale ? datasets.wfaBoys : datasets.wfaGirls;
    const lhfaData = isMale ? datasets.lhfaBoys : datasets.lhfaGirls;
    const wflhData = isUnder2 ? (isMale ? datasets.wflBoys : datasets.wflGirls) : (isMale ? datasets.wfhBoys : datasets.wfhGirls);

    let bb_u = null;
    let tb_u = null;
    let bb_tb = null;

    if (params.bb !== undefined) {
      const lms = findLMS(false, umurDays, wfaData);
      if (lms) bb_u = computeZScore(params.bb, lms);
    }

    if (params.tb !== undefined) {
      const lms = findLMS(false, umurDays, lhfaData);
      if (lms) tb_u = computeZScore(params.tb, lms);
    }

    if (params.bb !== undefined && params.tb !== undefined) {
      // Jika baduta (isUnder2), kita ukur panjang/length (baring), jika anak > 2thn, kita ukur tinggi/height (berdiri).
      const lms = findLMS(true, params.tb, wflhData);
      if (lms) bb_tb = computeZScore(params.bb, lms);
    }

    const categories = classifyZScore(bb_u, tb_u, bb_tb);

    return { 
      bb_u, tb_u, bb_tb, 
      kategori_bb_u: categories.kategori_bb_u, 
      kategori_tb_u: categories.kategori_tb_u, 
      kategori_bb_tb: categories.kategori_bb_tb 
    };
  } catch (error) {
    console.error('Error calculating Z-Score (Optimized Module):', error);
    return {
      bb_u: null, tb_u: null, bb_tb: null,
      kategori_bb_u: null, kategori_tb_u: null, kategori_bb_tb: null
    };
  }
}
