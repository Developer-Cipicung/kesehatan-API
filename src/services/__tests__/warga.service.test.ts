import { WargaService } from '../warga.service';
import { prisma } from '../../lib/prisma';
import { auditLogService } from '../audit-log.service';
import { WargaRepository } from '../../repositories/warga.repository';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    warga: { findMany: jest.fn() },
    $transaction: jest.fn(),
  }
}));

jest.mock('../../repositories/warga.repository');

jest.mock('../audit-log.service', () => ({
  auditLogService: { logAction: jest.fn() }
}));

jest.mock('../dashboard.service', () => ({
  clearDashboardCache: jest.fn()
}));

describe('WargaService.bulkCreate', () => {
  let wargaService: WargaService;

  beforeEach(() => {
    jest.clearAllMocks();
    wargaService = new WargaService();
  });

  it('should auto link ibu_id if nama_ibu matches an existing mother in the posyandu', async () => {
    const posyanduId = 'posyandu-1';
    const userId = 'user-1';
    
    // Mock the repo methods on the prototype since it's auto-mocked
    (WargaRepository.prototype.findAll as jest.Mock).mockResolvedValue({
      data: [
        { id: 'ibu-123', nama: 'Siti Hajar', jenis_kelamin: 'P', posyandu_id: posyanduId }
      ]
    });
    (WargaRepository.prototype.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const dataList = [
      { nik: '123', nama: 'Anak Siti', nama_ibu: ' SITI HAJAR ', posyandu_id: posyanduId }
    ];

    await wargaService.bulkCreate(dataList as any, posyanduId, userId);

    // Assert that findMany was called to look for mothers
    expect(WargaRepository.prototype.findAll).toHaveBeenCalled();

    // Assert that the data sent to createMany has the linked ibu_id
    expect(WargaRepository.prototype.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          nama: 'Anak Siti',
          nama_ibu: ' SITI HAJAR ',
          ibu_id: 'ibu-123'
        })
      ])
    );
  });
});
