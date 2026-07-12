
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

export async function calculateZScoreWHO(params: ZScoreParams): Promise<ZScoreResult> {
  try {
    const pediGrowth = await import('@pedi-growth/core');
    const calculateAll = pediGrowth.calculateAll;

    const assessment = await calculateAll({
      sex: params.jenis_kelamin === 'L' ? 'male' : 'female',
      dateOfBirth: params.tanggal_lahir,
      dateOfMeasurement: params.tanggal_kunjungan,
      weight: params.bb,
      lengthHeight: params.tb,
      headCircumference: params.lingkar_kepala,
    });

    let bb_u = null;
    let tb_u = null;
    let bb_tb = null;

    let kategori_bb_u = null;
    let kategori_tb_u = null;
    let kategori_bb_tb = null;

    if (assessment.results) {
      const wfa = assessment.results.find((r: any) => r.indicator === 'weight-for-age');
      const lfa = assessment.results.find((r: any) => r.indicator === 'length-height-for-age');
      const wfl = assessment.results.find((r: any) => r.indicator === 'weight-for-length' || r.indicator === 'weight-for-height');

      if (wfa) {
        bb_u = Number(wfa.zScore.toFixed(2));
        const severity = assessment.classifications?.find((c: any) => c.indicator === 'weight-for-age')?.severity;
        if (severity === 'adequate') kategori_bb_u = 'Normal';
        else if (severity === 'low') kategori_bb_u = 'Kurang';
        else if (severity === 'very-low') kategori_bb_u = 'Sangat Kurang';
        else if (severity === 'high' || severity === 'very-high') kategori_bb_u = 'Risiko Berat Badan Lebih';
      }
      
      if (lfa) {
        tb_u = Number(lfa.zScore.toFixed(2));
        const severity = assessment.classifications?.find((c: any) => c.indicator === 'length-height-for-age')?.severity;
        if (severity === 'adequate') kategori_tb_u = 'Normal';
        else if (severity === 'low') kategori_tb_u = 'Pendek (Stunted)';
        else if (severity === 'very-low') kategori_tb_u = 'Sangat Pendek (Severely Stunted)';
        else if (severity === 'high' || severity === 'very-high') kategori_tb_u = 'Tinggi';
      }

      if (wfl) {
        bb_tb = Number(wfl.zScore.toFixed(2));
        const severity = assessment.classifications?.find((c: any) => c.indicator === wfl.indicator)?.severity;
        if (severity === 'adequate') kategori_bb_tb = 'Gizi Baik';
        else if (severity === 'low') kategori_bb_tb = 'Gizi Kurang';
        else if (severity === 'very-low') kategori_bb_tb = 'Gizi Buruk';
        else if (severity === 'risk') kategori_bb_tb = 'Risiko Gizi Lebih';
        else if (severity === 'high') kategori_bb_tb = 'Gizi Lebih (Overweight)';
        else if (severity === 'very-high') kategori_bb_tb = 'Obesitas';
      }
    }

    return { bb_u, tb_u, bb_tb, kategori_bb_u, kategori_tb_u, kategori_bb_tb };
  } catch (error) {
    console.error('Error calculating Z-Score:', error);
    return {
      bb_u: null, tb_u: null, bb_tb: null,
      kategori_bb_u: null, kategori_tb_u: null, kategori_bb_tb: null
    };
  }
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
