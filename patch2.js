const fs = require('fs');
const path = require('path');

const resources = [
  { name: 'balita', repo: 'balitaRepo' },
  { name: 'bumil', repo: 'bumilRepo' },
  { name: 'lansia', repo: 'lansiaRepo' },
  { name: 'pasca-persalinan', repo: 'pascaPersalinanRepo' },
  { name: 'imunisasi', repo: 'imunisasiRepo' }
];

// Fix Services (repo name)
for (const res of resources) {
  const filePath = path.join(__dirname, `src/services/${res.name}.service.ts`);
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/await repo\.findByWargaId/g, `await ${res.repo}.findByWargaId`);
  fs.writeFileSync(filePath, code);
}

// Fix Imunisasi Repository
const imRepoPath = path.join(__dirname, 'src/repositories/imunisasi.repository.ts');
let imCode = fs.readFileSync(imRepoPath, 'utf8');
// If `where` is not declared before my injected code, let's fix it.
imCode = imCode.replace(/    if \(params\.posyanduId\) \{\n      where\.warga = \{ \.\.\.where\.warga, posyandu_id: params\.posyanduId \};\n    \}\n\n    const \[data, total\] = await Promise\.all\(\[/,
  `    const where: import('../../prisma/generated-schema').Prisma.RiwayatImunisasiWhereInput = {};\n    if (params.posyanduId) {\n      where.warga = { ...where.warga, posyandu_id: params.posyanduId };\n    }\n\n    const [data, total] = await Promise.all([`
);
// Make sure we didn't duplicate `where` declaration if it's there
imCode = imCode.replace(/const where: Prisma\.RiwayatImunisasiWhereInput = \{\};\n\n    const where: import/, 'const where: import');
fs.writeFileSync(imRepoPath, imCode);

