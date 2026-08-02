import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getKasusRisti = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, posyanduId } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    // Default to 30 days ago if no startDate provided
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const posyanduFilter = posyanduId ? { posyandu_id: posyanduId as string } : {};

    // 1. Balita Risti (Z-score <= -2)
    const balitaRisti = await prisma.pemeriksaanBalitaBaduta.findMany({
      where: {
        tanggal_kunjungan: { gte: start, lte: end },
        OR: [
          { zscore_bb_u: { lte: -2 } },
          { zscore_tb_u: { lte: -2 } },
          { zscore_bb_tb: { lte: -2 } }
        ],
        warga: posyanduFilter
      },
      include: {
        warga: {
          select: { nama: true, posyandu: { select: { nama: true } } }
        }
      },
      orderBy: { tanggal_kunjungan: 'desc' }
    });

    // 2. Bumil Risti (LILA < 23.5 or Hb < 11)
    const bumilRisti = await prisma.pemeriksaanBumil.findMany({
      where: {
        tanggal_kunjungan: { gte: start, lte: end },
        OR: [
          { lingkar_lengan_atas: { lt: 23.5 } },
          { kadar_hemoglobin: { lt: 11 } }
        ],
        warga: posyanduFilter
      },
      include: {
        warga: {
          select: { nama: true, posyandu: { select: { nama: true } } }
        }
      },
      orderBy: { tanggal_kunjungan: 'desc' }
    });

    // 3. Lansia Risti (Tensi >= 140/90, GDS/Kolesterol > 200, Asam urat > 7)
    const lansiaRisti = await prisma.pemeriksaanLansia.findMany({
      where: {
        tanggal_kunjungan: { gte: start, lte: end },
        OR: [
          { tekanan_darah_sistolik: { gte: 140 } },
          { tekanan_darah_diastolik: { gte: 90 } },
          { gula_darah_sewaktu: { gt: 200 } },
          { kolesterol: { gt: 200 } },
          { asam_urat: { gt: 7 } }
        ],
        warga: posyanduFilter
      },
      include: {
        warga: {
          select: { nama: true, posyandu: { select: { nama: true } } }
        }
      },
      orderBy: { tanggal_kunjungan: 'desc' }
    });

    // Format & gabungkan data
    const ristiCases: any[] = [];

    balitaRisti.forEach(b => {
      let riskFactors = [];
      if (b.zscore_bb_u !== null && Number(b.zscore_bb_u) <= -2) riskFactors.push('BB/U Rendah');
      if (b.zscore_tb_u !== null && Number(b.zscore_tb_u) <= -2) riskFactors.push('TB/U Rendah (Stunting)');
      if (b.zscore_bb_tb !== null && Number(b.zscore_bb_tb) <= -2) riskFactors.push('BB/TB Rendah (Gizi Kurang)');
      
      ristiCases.push({
        id: b.id,
        warga_id: b.warga_id,
        kategori: 'Balita',
        nama: b.warga.nama,
        posyandu: b.warga.posyandu?.nama || '-',
        tanggal_periksa: b.tanggal_kunjungan,
        risiko: riskFactors.join(', ')
      });
    });

    bumilRisti.forEach(b => {
      let riskFactors = [];
      if (b.lingkar_lengan_atas !== null && Number(b.lingkar_lengan_atas) < 23.5) riskFactors.push('KEK (LILA < 23.5)');
      if (b.kadar_hemoglobin !== null && Number(b.kadar_hemoglobin) < 11) riskFactors.push('Anemia (Hb < 11)');

      ristiCases.push({
        id: b.id,
        warga_id: b.warga_id,
        kategori: 'Ibu Hamil',
        nama: b.warga.nama,
        posyandu: b.warga.posyandu?.nama || '-',
        tanggal_periksa: b.tanggal_kunjungan,
        risiko: riskFactors.join(', ')
      });
    });

    lansiaRisti.forEach(l => {
      let riskFactors = [];
      if ((l.tekanan_darah_sistolik && l.tekanan_darah_sistolik >= 140) || 
          (l.tekanan_darah_diastolik && l.tekanan_darah_diastolik >= 90)) {
        riskFactors.push(`Hipertensi (${l.tekanan_darah_sistolik}/${l.tekanan_darah_diastolik})`);
      }
      if (l.gula_darah_sewaktu && l.gula_darah_sewaktu > 200) riskFactors.push('Gula Darah Tinggi');
      if (l.kolesterol && l.kolesterol > 200) riskFactors.push('Kolesterol Tinggi');
      if (l.asam_urat && Number(l.asam_urat) > 7) riskFactors.push('Asam Urat Tinggi');

      ristiCases.push({
        id: l.id,
        warga_id: l.warga_id,
        kategori: 'Lansia',
        nama: l.warga.nama,
        posyandu: l.warga.posyandu?.nama || '-',
        tanggal_periksa: l.tanggal_kunjungan,
        risiko: riskFactors.join(', ')
      });
    });

    // Urutkan dari yang terbaru
    ristiCases.sort((a, b) => new Date(b.tanggal_periksa).getTime() - new Date(a.tanggal_periksa).getTime());

    res.status(200).json({
      status: 'success',
      data: ristiCases
    });
  } catch (error) {
    console.error('Error fetching Kasus Risti:', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
};

export const getIndikatorMedis = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, posyanduId } = req.query;
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const posyanduFilter = (posyanduId && posyanduId !== 'ALL') ? { posyandu_id: posyanduId as string } : undefined;
    const [bumilLatest, balitaLatest, lansiaLatest] = await Promise.all([
      prisma.pemeriksaanBumil.findMany({
        where: { 
          tanggal_kunjungan: { gte: start, lte: end },
          ...(posyanduFilter ? { warga: posyanduFilter } : {})
        },
        orderBy: { created_at: 'desc' },
        distinct: ['warga_id'],
        select: { kadar_hemoglobin: true, lingkar_lengan_atas: true }
      }),
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: { 
          tanggal_kunjungan: { gte: start, lte: end },
          ...(posyanduFilter ? { warga: posyanduFilter } : {})
        },
        orderBy: { created_at: 'desc' },
        distinct: ['warga_id'],
        select: { zscore_bb_tb: true, zscore_tb_u: true }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: { 
          tanggal_kunjungan: { gte: start, lte: end },
          ...(posyanduFilter ? { warga: posyanduFilter } : {})
        },
        orderBy: { created_at: 'desc' },
        distinct: ['warga_id'],
        select: { tekanan_darah_sistolik: true, tekanan_darah_diastolik: true }
      })
    ]);
    const indikator_kesehatan = {
      bumil_hb: {
        normal: bumilLatest.filter((p: any) => p.kadar_hemoglobin !== null && Number(p.kadar_hemoglobin) >= 11).length,
        anemia_ringan: bumilLatest.filter((p: any) => p.kadar_hemoglobin !== null && Number(p.kadar_hemoglobin) >= 8 && Number(p.kadar_hemoglobin) < 11).length,
        anemia_berat: bumilLatest.filter((p: any) => p.kadar_hemoglobin !== null && Number(p.kadar_hemoglobin) < 8).length,
      },
      bumil_lila: {
        normal: bumilLatest.filter((p: any) => p.lingkar_lengan_atas !== null && Number(p.lingkar_lengan_atas) >= 23.5).length,
        kek: bumilLatest.filter((p: any) => p.lingkar_lengan_atas !== null && Number(p.lingkar_lengan_atas) < 23.5).length,
      },
      balita_gizi: {
        normal: balitaLatest.filter((p: any) => p.zscore_bb_tb !== null && Number(p.zscore_bb_tb) >= -2 && Number(p.zscore_bb_tb) <= 2).length,
        kurang: balitaLatest.filter((p: any) => p.zscore_bb_tb !== null && (Number(p.zscore_bb_tb) >= -3 && Number(p.zscore_bb_tb) < -2)).length,
        buruk: balitaLatest.filter((p: any) => p.zscore_bb_tb !== null && Number(p.zscore_bb_tb) < -3).length,
        berlebih: balitaLatest.filter((p: any) => p.zscore_bb_tb !== null && Number(p.zscore_bb_tb) > 2).length,
      },
      balita_stunting: {
        normal: balitaLatest.filter((p: any) => p.zscore_tb_u !== null && Number(p.zscore_tb_u) >= -2).length,
        pendek: balitaLatest.filter((p: any) => p.zscore_tb_u !== null && Number(p.zscore_tb_u) >= -3 && Number(p.zscore_tb_u) < -2).length,
        sangat_pendek: balitaLatest.filter((p: any) => p.zscore_tb_u !== null && Number(p.zscore_tb_u) < -3).length,
      },
      lansia_tensi: {
        normal: lansiaLatest.filter((p: any) => p.tekanan_darah_sistolik !== null && p.tekanan_darah_sistolik <= 130).length,
        waspada: lansiaLatest.filter((p: any) => p.tekanan_darah_sistolik !== null && p.tekanan_darah_sistolik > 130 && p.tekanan_darah_sistolik <= 139).length,
        tinggi: lansiaLatest.filter((p: any) => p.tekanan_darah_sistolik !== null && p.tekanan_darah_sistolik >= 140).length,
      }
    };
    res.status(200).json({ status: 'success', data: indikator_kesehatan });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data indikator' });
  }
};
