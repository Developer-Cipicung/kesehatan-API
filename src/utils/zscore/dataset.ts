import wfaBoysRaw from './who/wfa-boys-0-5.json';
import wfaGirlsRaw from './who/wfa-girls-0-5.json';
import lhfaBoysRaw from './who/lhfa-boys-0-5.json';
import lhfaGirlsRaw from './who/lhfa-girls-0-5.json';
import wfhBoysRaw from './who/wfh-boys.json';
import wfhGirlsRaw from './who/wfh-girls.json';
import wflBoysRaw from './who/wfl-boys.json';
import wflGirlsRaw from './who/wfl-girls.json';

export interface LMS {
  L: number;
  M: number;
  S: number;
}

export interface DatasetCache {
  map: Map<number, LMS>;
  minKey: number;
  maxKey: number;
}

/**
 * Membangun cache Map O(1) dari raw JSON array.
 * @param rawData Array of object dari file JSON WHO
 * @param isFloat Jika true, normalisasi ke 1 tempat desimal untuk menghindari floating point error
 */
function buildCache(rawData: any[], isFloat: boolean): DatasetCache {
  const map = new Map<number, LMS>();
  let minKey = Infinity;
  let maxKey = -Infinity;

  for (const row of rawData) {
    // Normalisasi: Float dibulatkan 1 desimal, Integer (hari) dibulatkan utuh
    const key = isFloat ? Math.round(row.age * 10) / 10 : Math.round(row.age);
    map.set(key, { L: row.L, M: row.M, S: row.S });
    
    if (key < minKey) minKey = key;
    if (key > maxKey) maxKey = key;
  }

  return { map, minKey, maxKey };
}

// Caching di memori (Singleton map instantiation)
export const datasets = {
  wfaBoys: buildCache(wfaBoysRaw, false),
  wfaGirls: buildCache(wfaGirlsRaw, false),
  lhfaBoys: buildCache(lhfaBoysRaw, false),
  lhfaGirls: buildCache(lhfaGirlsRaw, false),
  wfhBoys: buildCache(wfhBoysRaw, true),
  wfhGirls: buildCache(wfhGirlsRaw, true),
  wflBoys: buildCache(wflBoysRaw, true),
  wflGirls: buildCache(wflGirlsRaw, true),
};
