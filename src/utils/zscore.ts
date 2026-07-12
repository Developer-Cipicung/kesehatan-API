import wfaBoys from './who/wfa-boys-0-5.json';
import wfaGirls from './who/wfa-girls-0-5.json';
import lhfaBoys from './who/lhfa-boys-0-5.json';
import lhfaGirls from './who/lhfa-girls-0-5.json';
import wflBoys from './who/wfl-boys.json';
import wflGirls from './who/wfl-girls.json';
import wfhBoys from './who/wfh-boys.json';
import wfhGirls from './who/wfh-girls.json';

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

interface LMS {
  L: number;
  M: number;
  S: number;
}

function computeZScore(measurement: number, lms: LMS): number | null {
  const { L, M, S } = lms;
  if (measurement <= 0 || M <= 0 || S <= 0) return null;
  
  let z: number;
  if (Math.abs(L) < 1e-10) {
    z = Math.log(measurement / M) / S;
  } else {
    z = (Math.pow(measurement / M, L) - 1) / (L * S);
  }

  // WHO extrapolation for |Z| > 3
  if (Math.abs(z) > 3) {
    const sdValue = (k: number) => Math.abs(L) < 1e-10 ? M * Math.exp(S * k) : M * Math.pow(1 + L * S * k, 1 / L);
    const sd3pos = sdValue(3);
    const sd2pos = sdValue(2);
    const sd3neg = sdValue(-3);
    const sd2neg = sdValue(-2);
    const sd23pos = sd3pos - sd2pos;
    const sd23neg = sd2neg - sd3neg;
    
    if (z > 3) {
      z = 3 + (measurement - sd3pos) / sd23pos;
    } else {
      z = -3 + (measurement - sd3neg) / sd23neg;
    }
  }

  return Math.round(z * 100) / 100 || 0;
}

function findLMS(key: 'age' | 'length' | 'height', value: number, dataset: any[]): LMS | null {
  if (!dataset || dataset.length === 0) return null;
  
  if (key === 'age') {
    if (value < 0) value = 0;
    if (value > 1856) value = 1856;
  } else {
    const minVal = dataset[0].age;
    const maxVal = dataset[dataset.length - 1].age;
    if (value < minVal) value = minVal;
    if (value > maxVal) value = maxVal;
  }

  let closest = dataset[0];
  let minDiff = Infinity;
  for (const row of dataset) {
    const diff = Math.abs(row.age - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = row;
    }
    if (diff > minDiff) break;
  }
  
  return { L: closest.L, M: closest.M, S: closest.S };
}

export function classifyZScore(bb_u: number | null, tb_u: number | null, bb_tb: number | null) {
  let kategori_bb_u = null;
  let kategori_tb_u = null;
  let kategori_bb_tb = null;

  if (bb_u !== null) {
    if (bb_u < -3) kategori_bb_u = 'Sangat Kurang';
    else if (bb_u < -2) kategori_bb_u = 'Kurang';
    else if (bb_u <= 1) kategori_bb_u = 'Normal';
    else kategori_bb_u = 'Risiko Berat Badan Lebih';
  }

  if (tb_u !== null) {
    if (tb_u < -3) kategori_tb_u = 'Sangat Pendek (Severely Stunted)';
    else if (tb_u < -2) kategori_tb_u = 'Pendek (Stunted)';
    else if (tb_u <= 3) kategori_tb_u = 'Normal';
    else kategori_tb_u = 'Tinggi';
  }

  if (bb_tb !== null) {
    if (bb_tb < -3) kategori_bb_tb = 'Gizi Buruk';
    else if (bb_tb < -2) kategori_bb_tb = 'Gizi Kurang';
    else if (bb_tb <= 1) kategori_bb_tb = 'Gizi Baik';
    else if (bb_tb <= 2) kategori_bb_tb = 'Risiko Gizi Lebih';
    else if (bb_tb <= 3) kategori_bb_tb = 'Gizi Lebih (Overweight)';
    else kategori_bb_tb = 'Obesitas';
  }

  return { kategori_bb_u, kategori_tb_u, kategori_bb_tb };
}

export async function calculateZScoreWHO(params: ZScoreParams): Promise<ZScoreResult> {
  try {
    const umurDays = Math.max(0, Math.floor((params.tanggal_kunjungan.getTime() - params.tanggal_lahir.getTime()) / (1000 * 60 * 60 * 24)));
    
    const isMale = params.jenis_kelamin === 'L';
    const wfaData = isMale ? wfaBoys : wfaGirls;
    const lhfaData = isMale ? lhfaBoys : lhfaGirls;
    
    const isUnder2 = umurDays < 731;
    const wflhData = isUnder2 ? (isMale ? wflBoys : wflGirls) : (isMale ? wfhBoys : wfhGirls);

    let bb_u = null;
    let tb_u = null;
    let bb_tb = null;

    if (params.bb !== undefined) {
      const lms = findLMS('age', umurDays, wfaData);
      if (lms) bb_u = computeZScore(params.bb, lms);
    }

    if (params.tb !== undefined) {
      const lms = findLMS('age', umurDays, lhfaData);
      if (lms) tb_u = computeZScore(params.tb, lms);
    }

    if (params.bb !== undefined && params.tb !== undefined) {
      const lms = findLMS(isUnder2 ? 'length' : 'height', params.tb, wflhData);
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
    console.error('Error calculating Z-Score:', error);
    return {
      bb_u: null, tb_u: null, bb_tb: null,
      kategori_bb_u: null, kategori_tb_u: null, kategori_bb_tb: null
    };
  }
}
