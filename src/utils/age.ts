export type KategoriUsiaAnak = 'BADUTA' | 'BALITA' | 'LAINNYA';

export const calculateAgeInMonths = (tanggalLahir: Date, referenceDate = new Date()): number => {
  let months = (referenceDate.getFullYear() - tanggalLahir.getFullYear()) * 12;
  months += referenceDate.getMonth() - tanggalLahir.getMonth();

  if (referenceDate.getDate() < tanggalLahir.getDate()) {
    months--;
  }

  return Math.max(0, months);
};

export const getBirthDateCutoffInMonths = (months: number, referenceDate = new Date()): Date => {
  const cutoff = new Date(referenceDate);
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff;
};

export const getKategoriUsiaAnak = (tanggalLahir: Date, referenceDate = new Date()): KategoriUsiaAnak => {
  const ageMonths = calculateAgeInMonths(tanggalLahir, referenceDate);

  if (ageMonths < 24) return 'BADUTA';
  if (ageMonths < 60) return 'BALITA';
  return 'LAINNYA';
};

export const calculateAgeInYears = (tanggalLahir: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - tanggalLahir.getFullYear();
  const m = today.getMonth() - tanggalLahir.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < tanggalLahir.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
};
