import { createBalitaSchema } from '../balita.validation';

describe('createBalitaSchema', () => {
  it('should allow completely optional fields and convert 0/- to null', () => {
    const payload = {
      warga_id: '123e4567-e89b-12d3-a456-426614174000',
      tanggal_kunjungan: '2023-10-01',
      bb: 0,
      tb: '-',
      lingkar_kepala: '0',
    };
    
    const result = createBalitaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bb).toBeNull();
      expect(result.data.tb).toBeNull();
      expect(result.data.lingkar_kepala).toBeNull();
    }
  });

  it('should accept missing optional fields', () => {
    const payload = {
      warga_id: '123e4567-e89b-12d3-a456-426614174000',
      // no other fields provided
    };
    
    const result = createBalitaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bb).toBeUndefined();
    }
  });
});
