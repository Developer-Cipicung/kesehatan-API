import { DatasetCache, LMS } from './dataset';

/**
 * Mencari nilai L, M, S dalam O(1) memori cache (Map).
 * @param isFloat Apakah key dalam bentuk desimal (panjang/tinggi) atau integer (hari)
 * @param value Input umur atau tinggi badan
 * @param dataset Referensi dataset cache
 */
export function findLMS(isFloat: boolean, value: number, dataset: DatasetCache): LMS | null {
  if (!dataset || dataset.map.size === 0) return null;

  // 1. Normalisasi: hilangkan resiko mismatch floating point
  let normalizedKey = isFloat ? Math.round(value * 10) / 10 : Math.round(value);

  // 2. Clamp: cegah undefined pada nilai ekstreme (e.g. tinggi bayi < 45cm)
  if (normalizedKey < dataset.minKey) normalizedKey = dataset.minKey;
  if (normalizedKey > dataset.maxKey) normalizedKey = dataset.maxKey;

  // 3. O(1) Lookup
  return dataset.map.get(normalizedKey) || null;
}

/**
 * Box-Cox Power Exponential formula untuk mendapat nilai Z-Score
 */
export function computeZScore(measurement: number, lms: LMS): number | null {
  const { L, M, S } = lms;
  if (measurement <= 0 || M <= 0 || S <= 0) return null;
  
  let z: number;
  // Menghindari pembagian limit limit mendekati 0 untuk eksponen Box-Cox
  if (Math.abs(L) < 1e-10) {
    z = Math.log(measurement / M) / S;
  } else {
    z = (Math.pow(measurement / M, L) - 1) / (L * S);
  }

  // WHO Extrapolation untuk nilai ekstrem (|Z| > 3)
  if (Math.abs(z) > 3) {
    const sdValue = (k: number) => 
      Math.abs(L) < 1e-10 ? M * Math.exp(S * k) : M * Math.pow(1 + L * S * k, 1 / L);
    
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

  // Rounding ke 2 tempat desimal
  return Math.round(z * 100) / 100 || 0;
}
