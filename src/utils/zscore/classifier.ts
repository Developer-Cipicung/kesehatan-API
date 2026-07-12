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
