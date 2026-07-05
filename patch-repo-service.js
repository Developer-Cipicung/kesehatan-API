const fs = require('fs');
const path = require('path');

const resources = ['balita', 'bumil', 'lansia', 'pasca-persalinan', 'imunisasi'];

// Repositories
for (const res of resources) {
  const filePath = path.join(__dirname, `src/repositories/${res}.repository.ts`);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Interface
  code = code.replace(/(export interface FindAll\w+Params \{[\s\S]*?)(\})/, "$1  posyanduId?: string;\n$2");
  
  // FindAll logic (warga query)
  const oldWargaQuery = `    if (params.search) {
      where.warga = {
        nama: { contains: params.search, mode: 'insensitive' },
      };
    }`;
  
  const newWargaQuery = `    if (params.posyanduId || params.search) {
      where.warga = {
        ...(params.posyanduId && { posyandu_id: params.posyanduId }),
        ...(params.search && { nama: { contains: params.search, mode: 'insensitive' } }),
      };
    }`;
    
  if (code.includes(oldWargaQuery)) {
    code = code.replace(oldWargaQuery, newWargaQuery);
  } else {
    // Some might not have search, just insert posyanduId query before Promise.all
    if (!code.includes('params.posyanduId')) {
      const target = '    const [data, total] = await Promise.all([';
      code = code.replace(target, `    if (params.posyanduId) {\n      where.warga = { ...where.warga, posyandu_id: params.posyanduId };\n    }\n\n${target}`);
    }
  }
  
  fs.writeFileSync(filePath, code);
}

// Services
for (const res of resources) {
  const filePath = path.join(__dirname, `src/services/${res}.service.ts`);
  let code = fs.readFileSync(filePath, 'utf8');

  // findById
  code = code.replace(/findById\(id: string\)/, "findById(id: string, posyanduId: string)");
  code = code.replace(/if \(\!data\) throw new AppError\(404, 'Data pemeriksaan tidak ditemukan'\);/, "if (!data || data.warga.posyandu_id !== posyanduId) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');");
  code = code.replace(/if \(\!record\) throw new AppError\(404, 'Data pemeriksaan tidak ditemukan'\);/, "if (!record || record.warga.posyandu_id !== posyanduId) throw new AppError(404, 'Data pemeriksaan tidak ditemukan');");

  // findHistory
  code = code.replace(/findHistory\(wargaId: string\)/, "findHistory(wargaId: string, posyanduId: string)");
  code = code.replace(/wargaId\);/, "wargaId);\n    // We rely on controller ensuring posyandu_id via Warga or we just filter here\n    const history = await repo.findByWargaId(wargaId);\n    return history;"); // Actually findHistory just needs wargaId check. Let's do it manually if needed.

  // create
  code = code.replace(/create\(data: (.*?)\)/, "create(data: $1, posyanduId: string)");
  code = code.replace(/if \(\!warga\) throw new AppError\(404, 'Warga tidak ditemukan'\);/, "if (!warga || warga.posyandu_id !== posyanduId) throw new AppError(404, 'Warga tidak ditemukan');");

  // update
  code = code.replace(/update\(id: string, data: (.*?)\)/, "update(id: string, data: $1, posyanduId: string)");
  
  // delete
  code = code.replace(/delete\(id: string\)/, "delete(id: string, posyanduId: string)");

  fs.writeFileSync(filePath, code);
}
