# ARCHITECTURE.md

# Backend Architecture

## Project Overview

Sistem Digitalisasi Posyandu adalah backend REST API untuk mendukung proses digitalisasi pencatatan kesehatan Posyandu. Sistem ini menggantikan proses pencatatan manual menjadi sistem terpusat menggunakan PostgreSQL sehingga data kesehatan warga dapat dikelola secara aman, terdokumentasi, dan mudah direkap.

Target pengguna utama adalah kader Posyandu, bidan, dan administrator.

---

# Technology Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 22+ |
| Framework | Express.js v5 |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma ORM v6 |
| Authentication | Supabase Auth (JWT) |
| Validation | Zod v4 |
| Logging | Pino + pino-http |
| Documentation | OpenAPI 3.0 (Swagger UI via CDN) |
| Deployment | Vercel (serverless) |

---

# High-Level Architecture

```text
            Frontend (React/Vite — Vercel)

                        │
                HTTPS REST API
                        │

            Express.js Backend (Vercel Serverless)

    ┌────────────┬────────────┬────────────┐
    │ Controllers│  Services  │Repositories│
    └────────────┴────────────┴────────────┘
                        │
                     Prisma ORM
                        │
              PostgreSQL (Supabase)
                  ├── Connection Pooler (DATABASE_URL, port 6543)
                  └── Direct URL (DIRECT_URL, port 5432) — digunakan prisma migrate
```

---

# Architectural Principles

- RESTful API.
- Layered Architecture: Controller → Service → Repository.
- Separation of Concerns.
- Stateless API.
- Type-safe database access using Prisma.
- Validation (Zod) sebelum business logic.
- Authentication menggunakan JWT Supabase.
- Business rules dikelola oleh Services.
- Database access eksklusif melalui Repositories.
- Lock Validation: data tidak dapat diubah setelah pendataan ditandai selesai.
- Audit Log: setiap operasi CUD dicatat di tabel `audit_log`.

---

# Folder Structure

```text
kesehatan-API/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── generated-schema/     ← Prisma Client hasil generate
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── validations/
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── supabase.ts
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── asyncHandler.ts
│   │   ├── logger.ts
│   │   ├── posyandu.ts
│   │   └── response.ts
│   ├── types/
│   ├── app.ts
│   └── server.ts
└── docs/
```

---

# Request Lifecycle

```text
HTTP Request
     ↓
authMiddleware (verifikasi JWT Supabase, attach req.appUser)
     ↓
validateRequest (Zod schema validation)
     ↓
Controller (parse params, call service)
     ↓
Service (business logic, lock validation, audit log)
     ↓
Repository (Prisma query)
     ↓
PostgreSQL (Supabase)
     ↓
HTTP Response (format: { success, message, data })
```

---

# Core Modules

## Authentication (`/api/v1/auth`)

- Login menggunakan Supabase Auth → mengembalikan JWT.
- Middleware `authMiddleware` memverifikasi JWT, mencari user di tabel `users`, dan meng-attach `req.appUser`.
- Endpoint `GET /auth/me` untuk cek sesi aktif.

---

## Posyandu (`/api/v1/posyandu`)

- Master data Posyandu.
- Menjadi induk untuk warga dan pendataan bulanan.

---

## Warga (`/api/v1/warga`)

- Master data seluruh warga.
- Field utama: `nik` (unik), `nama`, `jenis_kelamin`, `tanggal_lahir`, `kategori` (dihitung dinamis dari usia), `status_kehamilan`.
- Endpoint `GET /warga` mendukung query: `page`, `limit`, `search`, `kategori`, `posyanduId`.
- Semua pemeriksaan kesehatan mengacu ke tabel ini melalui `warga_id`.

---

## Pemeriksaan Balita/Baduta (`/api/v1/balita`)

- Menyimpan riwayat pemeriksaan balita dan baduta (0–59 bulan).
- Diferensiasi baduta (< 24 bulan) vs balita (24–59 bulan) dilakukan di frontend berdasarkan usia saat kunjungan.
- Field: `bb`, `tb`, `lingkar_kepala`, `lingkar_lengan_atas`, `keluhan`.
- Endpoint `GET /balita/:wargaId/history` untuk riwayat per warga.

---

## Riwayat Imunisasi (`/api/v1/imunisasi`)

- Menyimpan seluruh riwayat imunisasi anak (balita/baduta).
- Berdiri sendiri — tidak bergantung pada satu pemeriksaan tertentu.
- Field: `jenis_vaksin` (teks bebas), `tanggal_pemberian`.
- Endpoint `GET /imunisasi/:wargaId/history` untuk riwayat per warga.
- Mendukung operasi CRUD dengan lock validation per periode.

---

## Pemeriksaan Ibu Hamil (`/api/v1/bumil`)

- Menyimpan seluruh riwayat pemeriksaan ibu hamil.
- Field: `bb`, `tb`, `lingkar_perut`, `lingkar_lengan_atas`, `usia_kehamilan_minggu`, `hpht`, `htp`, `keluhan`.

---

## Pemeriksaan Pasca Persalinan (`/api/v1/pasca-persalinan`)

- Menyimpan riwayat pemeriksaan ibu pasca persalinan.
- Field: `tanggal_persalinan`, `bb`, `tekanan_darah_sistolik`, `tekanan_darah_diastolik`, `suhu_tubuh`, `kondisi_ibu`, `keluhan`.

---

## Pemeriksaan Lansia (`/api/v1/lansia`)

- Menyimpan riwayat pemeriksaan lansia.
- Field: `bb`, `tb`, `tekanan_darah_sistolik`, `tekanan_darah_diastolik`, `gula_darah_sewaktu`, `keluhan`.

---

## Pendataan Bulanan (`/api/v1/pendataan-bulanan`)

- Mengelola status administrasi pendataan bulanan per kategori.
- Kategori: `balita`, `imunisasi`, `bumil`, `pasca_persalinan`, `lansia`.
- Status: `draft` → `selesai`.
- Setelah `selesai`, semua operasi CUD pada pemeriksaan periode tersebut akan ditolak (HTTP 409).
- Unique constraint: `(posyandu_id, bulan, tahun)` — satu record per posyandu per bulan.

---

## Dashboard (`/api/v1/dashboard`)

- Ringkasan statistik: `total_warga`, `total_balita`, `total_bumil`, `total_lansia`.
- Status pendataan per kategori bulan berjalan.
- Aktivitas pemeriksaan terbaru.

---

## Users (`/api/v1/users`)

- Manajemen user (hanya admin).
- Field: `auth_id` (Supabase UUID), `posyandu_id`, `nama`, `username`, `role` (kader/bidan/admin), `is_active`.

---

# Lock Validation

`LockValidationService.ensureNotLocked()` dipanggil oleh seluruh service sebelum operasi Create, Update, Delete.

Jika `pendataan_bulanan.status === 'selesai'`, maka throw `AppError(409)`.

---

# Audit Log

`AuditLogService.logAction()` dipanggil setiap selesai operasi CUD.

Mencatat: `user_id`, `posyandu_id`, `action` (CREATE/UPDATE/DELETE/SUBMIT), `entity`, `entity_id`, `old_value`, `new_value`.

---

# Swagger / API Docs

Tersedia di `/api-docs`.

Asset Swagger UI (CSS dan JS) dimuat dari CDN `unpkg.com/swagger-ui-dist@5` sehingga dapat berjalan di environment serverless (Vercel).

Spesifikasi lengkap tersedia di `docs/swagger.yaml`.

---

# Security

- Semua endpoint dilindungi JWT Supabase (kecuali `/auth/login` dan `/`).
- Helmet untuk HTTP security headers.
- CORS aktif.
- Rate limiting: 100 req/menit (general), 5 req/menit (auth).
- Backend tidak pernah mengekspos Service Role Key, password, atau JWT internal.

---

# Error Handling

Backend menggunakan centralized error handler (`errorMiddleware`).

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

`AppError` digunakan untuk error yang sudah diantisipasi (404, 409, dll).

`asyncHandler` membungkus seluruh controller untuk menangkap error async.

---

# Logging

Menggunakan Pino + pino-http.

Log yang dicatat: request HTTP, error, authentication failure.

Tidak mencatat: password, JWT, NIK lengkap, informasi kesehatan sensitif.

---

# Implemented Features

- ✅ CRUD Warga
- ✅ Pemeriksaan Balita/Baduta (termasuk diferensiasi baduta vs balita)
- ✅ Riwayat Imunisasi (tambah, hapus, edit, history per warga)
- ✅ Pemeriksaan Ibu Hamil
- ✅ Pemeriksaan Pasca Persalinan
- ✅ Pemeriksaan Lansia
- ✅ Pendataan Bulanan (draft → selesai, lock validation)
- ✅ Dashboard statistik + aktivitas terbaru
- ✅ Manajemen Posyandu dan User (admin)
- ✅ Audit Log
- ✅ Swagger UI (via CDN)
- ✅ Export PDF dan Excel (dilakukan di frontend)

---

# Future Improvements

- Role-Based Access Control (RBAC) yang lebih granular
- Multi-Puskesmas support
- Reopen monthly period oleh Administrator
- Notification system
- Analytics Dashboard
- Background jobs untuk laporan otomatis