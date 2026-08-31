import { BumilService } from '../bumil.service';
import { prisma } from '../../lib/prisma';
import { auditLogService } from '../audit-log.service';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    warga: { findMany: jest.fn() },
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

describe('BumilService.bulkCreate', () => {
  let bumilService: BumilService;

  beforeEach(() => {
    jest.clearAllMocks();
    bumilService = new BumilService();
  });

  it('should use single transaction and bulk updates to fix N+1 issue', async () => {
    const posyanduId = 'posyandu-1';
    const userId = 'user-1';
    const dataList = [
      { nik: '111', tanggal_kunjungan: '2023-10-01', bb: 50, hpht: '2023-01-01' },
      { nik: '222', tanggal_kunjungan: '2023-10-02', bb: 55 } // no hpht
    ];

    (prisma.warga.findMany as jest.Mock).mockResolvedValue([
      { id: 'warga-1', nik: '111', posyandu_id: posyanduId, jenis_kelamin: 'P' },
      { id: 'warga-2', nik: '222', posyandu_id: posyanduId, jenis_kelamin: 'P' }
    ]);

    // Mock transaction to immediately execute the callback
    const txMock = {
      pemeriksaanBumil: { createMany: jest.fn() },
      warga: { updateMany: jest.fn(), update: jest.fn() }
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      await callback(txMock);
    });

    const result = await bumilService.bulkCreate(dataList, posyanduId, userId);

    expect(result.successCount).toBe(2);
    expect(result.errors.length).toBe(0);

    // Verify exactly ONE transaction was used
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // Verify createMany was called once with array
    expect(txMock.pemeriksaanBumil.createMany).toHaveBeenCalledTimes(1);
    
    // Verify updateMany was called once for mass status update (warga without hpht)
    expect(txMock.warga.updateMany).toHaveBeenCalledTimes(1);
    expect(txMock.warga.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['warga-2'] } },
      data: { status_kehamilan: 'HAMIL' }
    });

    // Verify single update was called once (warga with specific hpht)
    expect(txMock.warga.update).toHaveBeenCalledTimes(1);
    expect(txMock.warga.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'warga-1' } })
    );

    expect(auditLogService.logAction).toHaveBeenCalledTimes(1);
  });
});
