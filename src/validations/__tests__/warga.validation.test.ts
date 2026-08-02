import { createWargaSchema } from '../warga.validation';

describe('createWargaSchema', () => {
  it('should accept minimal payload with only nama', () => {
    const payload = { nama: 'Fulan' };
    const result = createWargaSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should convert 0 and "-" to null for optional fields', () => {
    const payload = { 
      nama: 'Fulan', 
      nik: '-', 
      rt: '0', 
      rw: 0 as any, 
      tempat_lahir: '-',
      jumlah_anak: 0
    };
    
    const result = createWargaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nik).toBeNull();
      expect(result.data.rt).toBeNull();
      expect(result.data.rw).toBeNull();
      expect(result.data.tempat_lahir).toBeNull();
      expect(result.data.jumlah_anak).toBeNull();
    }
  });

  it('should convert empty strings "" to null for optional fields', () => {
    const payload = {
      nama: 'Fulan',
      nik: '',
      alamat: '',
      nama_ayah: '',
      nama_ibu: ''
    };
    
    const result = createWargaSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nik).toBeNull();
      expect(result.data.alamat).toBeNull();
      expect(result.data.nama_ayah).toBeNull();
      expect(result.data.nama_ibu).toBeNull();
    }
  });
});