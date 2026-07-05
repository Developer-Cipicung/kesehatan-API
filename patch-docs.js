const fs = require('fs');
const path = require('path');

// 1. Architecture.md
const archPath = path.join(__dirname, 'docs/Architecture.md');
let arch = fs.readFileSync(archPath, 'utf8');
arch = arch.replace(/## Database Architecture/i, "## Database Architecture\n\nThe system supports Multi-Tenancy based on Posyandu. Each authenticated request resolves the corresponding user via the `users` table to dynamically retrieve the assigned `posyandu_id`. All read/write database actions are automatically scoped to this Posyandu context to enforce secure tenant isolation.\n");
fs.writeFileSync(archPath, arch);

// 2. DATABASE.md
const dbPath = path.join(__dirname, 'docs/DATABASE.md');
let db = fs.readFileSync(dbPath, 'utf8');
if (!db.includes('Users Table')) {
    db += "\n## Users Table\nStores application-specific user profiles uniquely mapped to Supabase Auth UUIDs.\n- `id`: UUID (Primary Key)\n- `auth_id`: UUID (Unique, Supabase mapping)\n- `posyandu_id`: UUID (Foreign Key)\n- `nama`: String\n- `email`: String\n- `role`: Enum (kader, bidan, admin)\n- `is_active`: Boolean\n";
}
fs.writeFileSync(dbPath, db);

// 3. API.md
const apiPath = path.join(__dirname, 'docs/API.md');
let api = fs.readFileSync(apiPath, 'utf8');
api = api.replace(/"posyandu_id": "string \(uuid\)",\n\s*/g, ""); // Remove posyandu_id from payloads
fs.writeFileSync(apiPath, api);

// 4. OPENAPI.md
const openApiPath = path.join(__dirname, 'docs/OPENAPI.md');
let openApi = fs.readFileSync(openApiPath, 'utf8');
if (!openApi.includes('Multi-Tenancy')) {
    openApi += "\n## Multi-Tenancy\nAll APIs dynamically inject `posyandu_id` from the Bearer Token user context. Client payloads must omit `posyandu_id`.\n";
}
fs.writeFileSync(openApiPath, openApi);

// 5. swagger.yaml
const swgPath = path.join(__dirname, 'docs/swagger.yaml');
let swg = fs.readFileSync(swgPath, 'utf8');
// Remove posyandu_id property from Warga schemas
swg = swg.replace(/\s+posyandu_id:\n\s+type: string\n\s+format: uuid\n\s+description: .*\n/g, "\n");
fs.writeFileSync(swgPath, swg);

// 6. TASK.md
const taskPath = path.join(__dirname, 'docs/TASK.md');
let task = fs.readFileSync(taskPath, 'utf8');
if (!task.includes('Phase 12')) {
    task += "\n## Phase 12 — Multi-Posyandu Support\n\n- [x] Create Users master table\n- [x] Update Posyandu table schema\n- [x] Scope all APIs to the user's Posyandu automatically\n- [x] Update seed.ts\n- [x] Revise Documentation (API, DB, Architecture)\n";
}
fs.writeFileSync(taskPath, task);
