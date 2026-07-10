import { prisma } from '../lib/prisma';
import { PendataanBulananService } from './pendataan-bulanan.service';

const pendataanService = new PendataanBulananService();

export class DashboardService {
  async getSummary(posyanduId?: string) {
    const now = new Date();

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    
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

    // BATCH 1: Demographics (5 concurrent connections)
    const [
      totalWarga, 
      totalBaduta, 
      totalBalita, 
      totalAnakSekolah, 
      totalLansia, 
    ] = await Promise.all([
      // Aggregate across all posyandus if posyanduId is undefined
      prisma.warga.count(posyanduId ? { where: { posyandu_id: posyanduId } } : undefined),
      // Baduta: > 2 years ago
      prisma.warga.count({ where: { tanggal_lahir: { gt: twoYearsAgo }, ...(posyanduId && { posyandu_id: posyanduId }) } }),
      // Balita: > 5 years ago, <= 2 years ago
      prisma.warga.count({ where: { tanggal_lahir: { gt: fiveYearsAgo, lte: twoYearsAgo }, ...(posyanduId && { posyandu_id: posyanduId }) } }),
      // Anak Sekolah: > 18 years ago, <= 7 years ago
      prisma.warga.count({ where: { tanggal_lahir: { gt: eighteenYearsAgo, lte: sevenYearsAgo }, ...(posyanduId && { posyandu_id: posyanduId }) } }),
      // Lansia
      prisma.warga.count({ where: { tanggal_lahir: { lte: sixtyYearsAgo }, ...(posyanduId && { posyandu_id: posyanduId }) } })
    ]);

    // BATCH 2: Recent Activities & Groupings (5 concurrent connections)
    const [
      bumilGroups,
      pascaGroups,
      recentPemeriksaanBalita,
      recentPemeriksaanBumil,
      recentPemeriksaanLansia,
    ] = await Promise.all([
      // Bumil (active in last 9 months)
      prisma.pemeriksaanBumil.groupBy({
        by: ['warga_id'],
        where: { tanggal_kunjungan: { gte: nineMonthsAgo }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
      }),
      // Pasca Persalinan (active in last 3 months)
      prisma.pemeriksaanPascaPersalinan.groupBy({
        by: ['warga_id'],
        where: { tanggal_kunjungan: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) }, ...(posyanduId && { warga: { posyandu_id: posyanduId } }) },
      }),
      // Recent activities
      prisma.pemeriksaanBalitaBaduta.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        include: { warga: true }
      }),
      prisma.pemeriksaanBumil.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        include: { warga: true }
      }),
      prisma.pemeriksaanLansia.findMany({
        where: posyanduId ? { warga: { posyandu_id: posyanduId } } : {},
        orderBy: { created_at: 'desc' },
        take: 3,
        include: { warga: true }
      })
    ]);

    // BATCH 3: Chart Data (4 concurrent connections)
    const [
      chartBumil,
      chartPasca,
      chartLansia,
      chartAnak,
    ] = await Promise.all([
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

    const totalBumil = bumilGroups.length;
    const totalPasca = pascaGroups.length;

    let pendataanStatus = { status: 'draft' };
    if (posyanduId) {
      pendataanStatus = await pendataanService.getStatus(posyanduId, now.getMonth() + 1, now.getFullYear());
    }
    
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

    return {
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
      aktivitas_terkini: aktivitas_terkini,
      alerts: alerts
    };
  }
}
