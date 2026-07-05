export const calculateAgeInMonths = (tanggalLahir: Date): number => {
  const today = new Date();
  let months = (today.getFullYear() - tanggalLahir.getFullYear()) * 12;
  months -= tanggalLahir.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
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
