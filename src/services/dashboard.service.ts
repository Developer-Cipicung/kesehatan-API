import { prisma } from '../lib/prisma';
import { PendataanBulananService } from './pendataan-bulanan.service';
import { getBirthDateCutoffInMonths } from '../utils/age';

const pendataanService = new PendataanBulananService();

// In-Memory Cache untuk mengatasi bypass Cache CDN Vercel akibat header Authorization
const DASHBOARD_CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: any; expiry: number }>();
const pendingCache = new Map<string, Promise<any>>();

export const clearDashboardCache = (posyanduId?: string) => {
  if (posyanduId) {
    cache.delete(posyanduId);
  } else {
    cache.clear();
  }
};

export class DashboardService {
  async getSummary(posyanduId?: string) {
    const nowCache = Date.now();
    const cacheKey = posyanduId || 'GLOBAL';

    try {
      const cachedItem = cache.get(cacheKey);
      // Gunakan cache singkat agar dashboard ringan tanpa terlalu lama stale.
      if (cachedItem && nowCache < cachedItem.expiry) {
        return cachedItem.data;
      }

      const pendingItem = pendingCache.get(cacheKey);
      if (pendingItem) {
        return pendingItem;
      }
    } catch {
      // Cache hanya optimisasi; jika ada masalah, lanjut hitung normal.
    }

    const summaryPromise = this.computeSummary(posyanduId, cacheKey);
    pendingCache.set(cacheKey, summaryPromise);

    try {
      return await summaryPromise;
    } finally {
      pendingCache.delete(cacheKey);
    }
  }

  private async computeSummary(posyanduId: string | undefined, cacheKey: string) {
    const now = new Date();

    const twoYearsAgo = getBirthDateCutoffInMonths(24, now);
    const fiveYearsAgo = getBirthDateCutoffInMonths(60, now);
    
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(now.getFullYear() - 7);
    
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(now.getFullYear() - 18);

    const sixtyYearsAgo = new Date();
    sixtyYearsAgo.setFullYear(now.getFullYear() - 60);

    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(now.getMonth() - 9);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const pendataanStatusPromise = posyanduId
      ? pendataanService.getStatus(posyanduId, now.getMonth() + 1, now.getFullYear())
      : Promise.resolve({ status: 'draft' });

    // BATCH SEMUA (14 concurrent queries) -> Biarkan Prisma menangani antrean koneksi
    const [
      totalWarga, 
      totalBaduta, 
      totalBalita, 
      totalAnakSekolah, 
      totalLansia, 
      totalBumil,
      totalPasca,
      recentPemeriksaanBalita,
      recentPemeriksaanBumil,
      recentPemeriksaanLansia,
      chartBumil,
      chartPasca,
      chartLansia,
      chartAnak,
    ] = await Promise.all([
      // Aggregate across all posyandus if posyanduId is undefined
      prisma.warga.count(posyanduId ? { where: { posyandu_id: posyanduId } } : undefined),
      // Baduta: > 2 years ago
      prisma.warga.count({ where: { 
        OR: [
          { tanggal_lahir: { gt: twoYearsAgo } },
          { tanggal_lahir: null, kategori_terdaftar: 'baduta' }
        ],
        ...(posyanduId && { posyandu_id: posyanduId })
      } }),
      // Balita: > 5 years ago, <= 2 years ago
      prisma.warga.count({ where: { 
        OR: [
          { tanggal_lahir: { lte: twoYearsAgo, gt: fiveYearsAgo } },
          { tanggal_lahir: null, kategori_terdaftar: 'balita' }
        ],
        ...(posyanduId && { posyandu_id: posyanduId })
      } }),
      // Anak Sekolah: > 18 years ago, <= 7 years ago
      prisma.warga.count({ where: { 
        OR: [
          { tanggal_lahir: { lte: sevenYearsAgo, gt: eighteenYearsAgo } },
          { tanggal_lahir: null, kategori_terdaftar: 'anak_sekolah' }
        ],
        ...(posyanduId && { posyandu_id: posyanduId })
      } }),
      // Lansia
      prisma.warga.count({ where: { 
        OR: [
          { tanggal_lahir: { lte: sixtyYearsAgo }, status_kehamilan: 'TIDAK_HAMIL' },
          { tanggal_lahir: null, kategori_terdaftar: 'lansia', status_kehamilan: 'TIDAK_HAMIL' }
        ],
        ...(posyanduId && { posyandu_id: posyanduId })
      } }),
      
      // Bumil
      prisma.warga.count({ where: { status_kehamilan: 'HAMIL', jenis_kelamin: 'P', ...(posyanduId && { posyandu_id: posyanduId }) } }),
      // Pasca Persalinan
      prisma.warga.count({ where: { status_kehamilan: 'PASCA_PERSALINAN', jenis_kelamin: 'P', ...(posyanduId && { posyandu_id: posyanduId }) } }),
      // Recent activities
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          created_at: true,
          warga: { select: { nama: true } },
        }
      }),
      prisma.pemeriksaanBumil.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          created_at: true,
          warga: { select: { nama: true } },
        }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          created_at: true,
          tekanan_darah_sistolik: true,
          tekanan_darah_diastolik: true,
          warga: { select: { nama: true } },
        }
      }),
      
      // Chart data
      prisma.pemeriksaanBumil.findMany({
        where: { tanggal_kunjungan: { gte: sixMonthsAgo }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
        select: { tanggal_kunjungan: true }
      }),
      prisma.pemeriksaanPascaPersalinan.findMany({
        where: { tanggal_kunjungan: { gte: sixMonthsAgo }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
        select: { tanggal_kunjungan: true }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: { tanggal_kunjungan: { gte: sixMonthsAgo }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
        select: { tanggal_kunjungan: true }
      }),
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: { tanggal_kunjungan: { gte: sixMonthsAgo }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
        select: { tanggal_kunjungan: true }
      })
    ]);

    const pendataanStatus = await pendataanStatusPromise;
    
    // Process recent activities
    const allActivities = [
      ...recentPemeriksaanBalita.map((p: any) => ({
        id: `balita-${p.id}`,
        name: p.warga.nama,
        category: 'Balita/Baduta',
        date: p.created_at.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        status: 'Normal', // simple mock status for now
        timestamp: p.created_at.getTime()
      })),
      ...recentPemeriksaanBumil.map((p: any) => ({
        id: `bumil-${p.id}`,
        name: p.warga.nama,
        category: 'Ibu Hamil',
        date: p.created_at.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        status: 'Normal',
        timestamp: p.created_at.getTime()
      })),
      ...recentPemeriksaanLansia.map((p: any) => ({
        id: `lansia-${p.id}`,
        name: p.warga.nama,
        category: 'Lansia',
        date: p.created_at.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        status: (p.tekanan_darah_sistolik > 140 || p.tekanan_darah_diastolik > 90) ? 'Perlu Perhatian' : 'Normal',
        timestamp: p.created_at.getTime()
      }))
    ];
    
    allActivities.sort((a, b) => b.timestamp - a.timestamp);
    const aktivitas_terkini = allActivities.slice(0, 5);
    
    const alerts = allActivities.filter(a => a.status === 'Perlu Perhatian').slice(0, 5);
    
    // Process chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    // Initialize chartData array for the last 6 months
    const chartData: { name: string; ibu: number; lansia: number; anak: number }[] = [];
    const monthIndexMap: Record<string, number> = {};
    
    for(let i=5; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthIndexMap[key] = chartData.length;
      chartData.push({
        name: monthNames[d.getMonth()],
        ibu: 0,
        lansia: 0,
        anak: 0,
      });
    }

    const processChartRecords = (records: any[], type: 'ibu' | 'lansia' | 'anak') => {
      records.forEach(r => {
        const d = new Date(r.tanggal_kunjungan);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const index = monthIndexMap[key];
        if (index !== undefined) {
          chartData[index][type]++;
        }
      });
    };

    processChartRecords(chartBumil, 'ibu');
    processChartRecords(chartPasca, 'ibu');
    processChartRecords(chartLansia, 'lansia');
    processChartRecords(chartAnak, 'anak');

    // Indikator Kesehatan Data (Latest record per patient)
    const [bumilLatest, balitaLatest, lansiaLatest] = await Promise.all([
      prisma.pemeriksaanBumil.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        distinct: ['warga_id'],
        select: { kadar_hemoglobin: true, lingkar_lengan_atas: true }
      }),
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        distinct: ['warga_id'],
        select: { zscore_bb_tb: true, zscore_tb_u: true }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
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

    const result = {
      total_warga: totalWarga,
      total_balita: totalBaduta + totalBalita, // aggregated for backwards compatibility if needed
      total_bumil: totalBumil,
      total_lansia: totalLansia,
      pendataan_status: pendataanStatus.status,
      kategori_breakdown: {
        ibu_hamil: totalBumil,
        pasca_persalinan: totalPasca,
        lansia: totalLansia,
        baduta: totalBaduta,
        balita: totalBalita,
        anak_sekolah: totalAnakSekolah
      },
      kunjungan_6_bulan: chartData,
      indikator_kesehatan: indikator_kesehatan,
      aktivitas_terkini: aktivitas_terkini,
      alerts: alerts
    };

    try {
      // Simpan ke memory cache singkat; response tetap sama.
      cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + DASHBOARD_CACHE_TTL_MS
      });
    } catch {
      // Cache hanya optimisasi; response tetap dikembalikan walau cache gagal.
    }

    return result;
  }
}
