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
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma ORM |
| Authentication | Supabase Auth (JWT) |
| Validation | Zod |
| Logging | Pino |
| Documentation | OpenAPI 3.0 (Swagger) |

---

# High-Level Architecture

```text
                Frontend (Next.js)

                        │
                HTTPS REST API

                        │

                Express.js Backend

        ┌────────────┬────────────┬────────────┐
        │ Controllers│  Services  │Repositories│
        └────────────┴────────────┴────────────┘
                        │
                     Prisma ORM
                        │
              PostgreSQL (Supabase)
```

---

# Architectural Principles

- RESTful API.
- Layered Architecture.
- Separation of Concerns.
- Stateless API.
- Type-safe database access using Prisma.
- Validation before business logic.
- Authentication using JWT.
- Business rules handled by Services.
- Database access handled exclusively by Repositories.

---

# Folder Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── services/
├── validations/
├── generated/
├── lib/
├── utils/
├── types/
├── app.ts
└── server.ts
```

---

# Request Lifecycle

```text
HTTP Request

↓

Authentication Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

Prisma

↓

PostgreSQL

↓

HTTP Response
```

---

# Core Modules

## Authentication

Responsibilities

- Login using Supabase Auth.
- Verify JWT.
- Protect API endpoints.
- Attach authenticated user information to requests.

---

## Posyandu

Responsibilities

- Master data Posyandu.
- Menjadi induk untuk kader dan warga.
- Menjadi dasar pelaporan bulanan.

---

## Warga

Responsibilities

Master data seluruh warga.

Features

- CRUD warga
- Search berdasarkan NIK
- Search berdasarkan nama
- Menyimpan data identitas
- Terhubung ke Posyandu

Semua pemeriksaan kesehatan mengacu pada tabel ini melalui `warga_id`.

---

## Pemeriksaan Balita

Responsibilities

- Menyimpan riwayat pemeriksaan balita/baduta.
- Mendukung banyak kunjungan.
- Tidak menyimpan status laporan bulanan.

---

## Riwayat Imunisasi

Responsibilities

- Menyimpan seluruh riwayat imunisasi anak.
- Terhubung langsung ke warga.
- Tidak bergantung pada satu pemeriksaan tertentu.

---

## Pemeriksaan Ibu Hamil

Responsibilities

- Menyimpan seluruh riwayat pemeriksaan ibu hamil.
- Mendukung banyak kunjungan selama masa kehamilan.

---

## Pemeriksaan Pasca Persalinan

Responsibilities

- Menyimpan riwayat pemeriksaan pasca persalinan.

---

## Pemeriksaan Lansia

Responsibilities

- Menyimpan riwayat pemeriksaan lansia.

---

# Monthly Data Collection Module

Selain menyimpan riwayat pemeriksaan kesehatan, sistem juga mendukung proses administrasi pendataan bulanan Posyandu.

Setiap kategori pemeriksaan memiliki satu periode pendataan setiap bulan.

Kategori meliputi:

- Balita
- Imunisasi
- Ibu Hamil
- Pasca Persalinan
- Lansia

Selama status masih **Draft**, kader dapat:

- Menambah pemeriksaan
- Mengubah pemeriksaan
- Menghapus pemeriksaan

Setelah seluruh data selesai diinput, kader dapat menekan tombol:

> **Tandai Pendataan Selesai**

Tindakan ini menandakan bahwa seluruh pendataan kategori tersebut pada bulan berjalan telah selesai dilakukan.

---

# Monthly Workflow

```text
Pilih Kategori

↓

Daftar seluruh warga muncul

↓

Tambah/Edit Pemeriksaan

↓

Data pemeriksaan langsung tersimpan

↓

Ulangi hingga seluruh warga selesai

↓

Tandai Pendataan Selesai

↓

Periode terkunci
```

---

# Locking Rules

Setelah periode ditandai **Selesai**:

- Pemeriksaan pada periode tersebut tidak dapat diubah.
- Tidak dapat menambah pemeriksaan baru.
- Tidak dapat menghapus pemeriksaan.
- Riwayat tetap dapat dilihat.

Seluruh mekanisme penguncian wajib divalidasi di backend.

Frontend hanya menampilkan status.

---

# Dashboard

Dashboard menyediakan ringkasan:

- Jumlah warga
- Jumlah pemeriksaan bulan berjalan
- Status pendataan setiap kategori
- Ringkasan Posyandu

Contoh

```text
Posyandu Cipicung

Balita             ✓ Selesai
Imunisasi          ✓ Selesai
Ibu Hamil          ✓ Selesai
Pasca Persalinan   ⏳ Draft
Lansia             ✓ Selesai
```

---

# Security

Semua endpoint menggunakan JWT Supabase.

Data hanya dapat diakses oleh pengguna yang telah login.

Seluruh tabel menggunakan Row Level Security (RLS).

Backend tidak pernah mengekspos:

- Service Role Key
- Password
- JWT Internal
- Data sensitif yang tidak diperlukan

---

# Error Handling

Backend menggunakan centralized error handler.

Format response selalu konsisten.

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# Logging

Menggunakan Pino.

Log yang dicatat:

- Request
- Error
- Warning
- Authentication Failure

Tidak mencatat:

- Password
- JWT
- NIK lengkap
- Informasi kesehatan sensitif

---

# Future Improvements

- Role-Based Access Control (RBAC)
- Multi-Puskesmas support
- Reopen monthly period oleh Administrator
- Audit log aktivitas pengguna
- Background jobs
- Notification system
- Export PDF
- Export Excel
- Analytics Dashboard