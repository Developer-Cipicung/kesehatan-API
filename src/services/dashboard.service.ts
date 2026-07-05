import { prisma } from '../lib/prisma';
import { PendataanBulananService } from './pendataan-bulanan.service';

const pendataanService = new PendataanBulananService();

export class DashboardService {
  async getSummary(posyanduId: string) {
    const now = new Date();

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    const sixtyYearsAgo = new Date();
    sixtyYearsAgo.setFullYear(now.getFullYear() - 60);

    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(now.getMonth() - 9);

    const [totalWarga, totalBalita, totalLansia, bumilGroups] = await Promise.all([
      prisma.warga.count({ where: { posyandu_id: posyanduId } }),
      prisma.warga.count({
        where: {
          posyandu_id: posyanduId,
          tanggal_lahir: { gte: fiveYearsAgo },
        },
      }),
      prisma.warga.count({
        where: {
          posyandu_id: posyanduId,
          tanggal_lahir: { lte: sixtyYearsAgo },
        },
      }),
      prisma.pemeriksaanBumil.groupBy({
        by: ['warga_id'],
        where: {
          tanggal_kunjungan: { gte: nineMonthsAgo },
          warga: { posyandu_id: posyanduId },
        },
      }),
    ]);

    const totalBumil = bumilGroups.length;

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const pendataanStatuses = await pendataanService.getAllStatus(
      posyanduId,
      currentMonth,
      currentYear,
    );

    const pendataanMap: Record<string, string> = {};
    pendataanStatuses.forEach((p) => {
      pendataanMap[p.kategori] = p.status;
    });

    return {
      total_warga: totalWarga,
      total_balita: totalBalita,
      total_bumil: totalBumil,
      total_lansia: totalLansia,
      pendataan: pendataanMap,
    };
  }
}
