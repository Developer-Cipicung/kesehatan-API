import { prisma } from '../lib/prisma';
import { PendataanBulananService } from './pendataan-bulanan.service';
import { buildKategoriWargaWhere } from '../repositories/warga.repository';
import { calculateAgeInMonths } from '../utils/age';

const pendataanService = new PendataanBulananService();

// In-Memory Cache untuk mengatasi bypass Cache CDN Vercel akibat header Authorization
const DASHBOARD_CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: any; expiry: number }>();
const pendingCache = new Map<string, Promise<any>>();

interface DashboardSummaryFilters {
  startDate?: string;
  endDate?: string;
}

export const clearDashboardCache = (posyanduId?: string) => {
  if (posyanduId) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${posyanduId}:`) || key.startsWith('GLOBAL:')) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

export class DashboardService {
  async getSummary(posyanduId?: string, filters: DashboardSummaryFilters = {}) {
    const nowCache = Date.now();
    const cacheKey = [
      posyanduId || 'GLOBAL',
      filters.startDate || 'CURRENT_MONTH',
      filters.endDate || 'CURRENT_MONTH',
    ].join(':');

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

    const summaryPromise = this.computeSummary(posyanduId, cacheKey, filters);
    pendingCache.set(cacheKey, summaryPromise);

    try {
      return await summaryPromise;
    } finally {
      pendingCache.delete(cacheKey);
    }
  }

  private getDateRange(now: Date, filters: DashboardSummaryFilters) {
    const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : fallbackStart;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : fallbackEnd;

    return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end
      ? { gte: fallbackStart, lte: fallbackEnd }
      : { gte: start, lte: end };
  }

  private async computeSummary(posyanduId: string | undefined, cacheKey: string, filters: DashboardSummaryFilters) {
    const now = new Date();
    const dateRange = this.getDateRange(now, filters);
    const currentMonthRange = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const pendataanStatusPromise = posyanduId
      ? pendataanService.getStatus(posyanduId, now.getMonth() + 1, now.getFullYear())
      : Promise.resolve({ status: 'draft' });

    // BATCH SEMUA -> Biarkan Prisma menangani antrean koneksi
    const [
      totalWarga, 
      totalBaduta, 
      totalBalita, 
      totalAnakSekolah, 
      totalLansia, 
      totalBumil,
      totalPasca,
      wargaBaruBulanIni,
      pemeriksaanBalitaBadutaForReport,
      totalPemeriksaanBumil,
      totalPemeriksaanPasca,
      totalPemeriksaanLansia,
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
      prisma.warga.count({ where: buildKategoriWargaWhere('baduta', posyanduId, now) }),
      prisma.warga.count({ where: buildKategoriWargaWhere('balita', posyanduId, now) }),
      prisma.warga.count({ where: buildKategoriWargaWhere('anak_sekolah', posyanduId, now) }),
      prisma.warga.count({ where: buildKategoriWargaWhere('lansia', posyanduId, now) }),
      prisma.warga.count({ where: buildKategoriWargaWhere('bumil', posyanduId, now) }),
      prisma.warga.count({ where: buildKategoriWargaWhere('pasca_persalinan', posyanduId, now) }),
      prisma.warga.count({
        where: { created_at: currentMonthRange, ...(posyanduId && { posyandu_id: posyanduId }) },
      }),
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: { tanggal_kunjungan: dateRange, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
        select: {
          tanggal_kunjungan: true,
          warga: { select: { tanggal_lahir: true } },
        },
      }),
      prisma.pemeriksaanBumil.count({
        where: { tanggal_kunjungan: dateRange, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
      }),
      prisma.pemeriksaanPascaPersalinan.count({
        where: { tanggal_kunjungan: dateRange, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
      }),
      prisma.pemeriksaanLansia.count({
        where: { tanggal_kunjungan: dateRange, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
      }),
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
    const totalPemeriksaanBalitaBaduta = pemeriksaanBalitaBadutaForReport.filter((p: any) => {
      if (!p.warga?.tanggal_lahir) return false;
      return calculateAgeInMonths(p.warga.tanggal_lahir, p.tanggal_kunjungan) < 60;
    }).length;
    
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
      total_bumil: totalBumil + totalPasca,
      total_lansia: totalLansia,
      warga_baru_bulan_ini: wargaBaruBulanIni,
      jumlah_pemeriksaan: totalPemeriksaanBalitaBaduta + totalPemeriksaanBumil + totalPemeriksaanPasca + totalPemeriksaanLansia,
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
