import { BalitaService } from '../balita.service';
import { prisma } from '../../lib/prisma';
import { auditLogService } from '../audit-log.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    warga: { findMany: jest.fn() },
    pemeriksaanBalitaBaduta: { createMany: jest.fn() },
    $transaction: jest.fn(),
  }
}));

jest.mock('../audit-log.service', () => ({
  auditLogService: { logAction: jest.fn() }
}));

jest.mock('../../repositories/pendataan-bulanan.repository', () => {
  return {
    PendataanBulananRepository: jest.fn().mockImplementation(() => ({
      upsert: jest.fn()
    }))
  };
});

describe('BalitaService.bulkCreate', () => {
  let balitaService: BalitaService;

  beforeEach(() => {
    jest.clearAllMocks();
    balitaService = new BalitaService();
  });

  it('should use createMany to insert multiple valid records at once', async () => {
    // Arrange
    const posyanduId = 'posyandu-1';
    const userId = 'user-1';
    const dataList = [
      { nik: '111', tanggal_kunjungan: '2023-10-01', bb: 10, tb: 80, lingkar_kepala: 40 },
      { nik: '222', tanggal_kunjungan: '2023-10-02', bb: 12, tb: 85, lingkar_kepala: 42 }
    ];

    // Mock prisma.warga.findMany to return both wargas
    (prisma.warga.findMany as jest.Mock).mockResolvedValue([
      { id: 'warga-1', nik: '111', posyandu_id: posyanduId },
      { id: 'warga-2', nik: '222', posyandu_id: posyanduId }
    ]);

    // Mock createMany to return count
    (prisma.pemeriksaanBalitaBaduta.createMany as jest.Mock).mockResolvedValue({ count: 2 });

    // Act
    const result = await balitaService.bulkCreate(dataList, posyanduId, userId);

    // Assert
    expect(result.successCount).toBe(2);
    expect(result.errors.length).toBe(0);

    // Verify N+1 is fixed: transaction loop should NOT be used for creating
    expect(prisma.$transaction).not.toHaveBeenCalled();

    // Verify createMany is called exactly once with all valid records
    expect(prisma.pemeriksaanBalitaBaduta.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.pemeriksaanBalitaBaduta.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ warga_id: 'warga-1', bb: 10 }),
        expect.objectContaining({ warga_id: 'warga-2', bb: 12 })
      ]),
      skipDuplicates: true
    });

    // Verify audit log is called once in bulk mode
    expect(auditLogService.logAction).toHaveBeenCalledTimes(1);
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      userId, posyanduId, 'CREATE', 'PemeriksaanBalita', 'bulk', null, { count: 2 }
    );
  });
});
