const fs = require('fs');
const path = require('path');

const resources = ['balita', 'bumil', 'lansia', 'pasca-persalinan', 'imunisasi'];

for (const res of resources) {
  // 1. Controller
  const ctrlPath = path.join(__dirname, `src/controllers/${res}.controller.ts`);
  let ctrl = fs.readFileSync(ctrlPath, 'utf8');
  
  // Add posyanduId to findAll payload
  ctrl = ctrl.replace(/search: req\.query\.search as string,(\s*)\}/, "search: req.query.search as string,\n    posyanduId: req.appUser!.posyandu_id,$1}");
  // Replace service.findById(id) -> service.findById(id, req.appUser!.posyandu_id)
  ctrl = ctrl.replace(/\.findById\((req\.params\.id as string)\)/g, ".findById($1, req.appUser!.posyandu_id)");
  // Replace service.findHistory(wargaId) -> service.findHistory(wargaId, req.appUser!.posyandu_id)
  ctrl = ctrl.replace(/\.findHistory\((req\.params\.wargaId as string)\)/g, ".findHistory($1, req.appUser!.posyandu_id)");
  // Replace service.create(req.body) -> service.create(req.body, req.appUser!.posyandu_id)
  ctrl = ctrl.replace(/\.create\(req\.body\)/g, ".create(req.body, req.appUser!.posyandu_id)");
  // Replace service.update(id, req.body) -> service.update(id, req.body, req.appUser!.posyandu_id)
  ctrl = ctrl.replace(/\.update\((req\.params\.id as string), req\.body\)/g, ".update($1, req.body, req.appUser!.posyandu_id)");
  // Replace service.delete(id) -> service.delete(id, req.appUser!.posyandu_id)
  ctrl = ctrl.replace(/\.delete\((req\.params\.id as string)\)/g, ".delete($1, req.appUser!.posyandu_id)");
  
  fs.writeFileSync(ctrlPath, ctrl);

  // 2. Service
  const svcPath = path.join(__dirname, `src/services/${res}.service.ts`);
  let svc = fs.readFileSync(svcPath, 'utf8');

  // findById(id: string) -> findById(id: string, posyanduId: string) { const data = ...; if (!data || data.warga.posyandu_id !== posyanduId) throw new AppError(404, ...);
  // Wait, `findById` currently doesn't include `warga` in all repositories? Let's check repository.
  // Actually, balita repo findById includes { warga: true }.
}
