import { createBalitaSchema } from '../balita.validation';

describe('createBalitaSchema', () => {
  it('should convert 0/- to null for optional fields', () => {
    const payload = {
      warga_id: '123e4567-e89b-12d3-a456-426614174000',
      tanggal_kunjungan: '2023-10-01',
      bb: 12,
      tb: 80,
      lingkar_kepala: '0',
    };
    
    const result = createBalitaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bb).toBe(12);
      expect(result.data.tb).toBe(80);
      expect(result.data.lingkar_kepala).toBeNull();
    }
  });

  it('should accept missing optional fields', () => {
    const payload = {
      warga_id: '123e4567-e89b-12d3-a456-426614174000',
      bb: 10,
      tb: 75
    };
    
    const result = createBalitaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lingkar_kepala).toBeUndefined();
    }
  });
});
