# API Dashboard Kesehatan Cipicung

Backend REST API untuk Sistem Dashboard Kesehatan Cipicung. Proyek ini dibangun menggunakan Node.js, Express.js, TypeScript, dan Prisma ORM dengan database PostgreSQL (Supabase), dirancang untuk mendukung operasional kader posyandu dari pencatatan hingga pelaporan secara terpusat dan digital.

## 📑 Daftar Isi 
- [Teknologi (Tech Stack)](#-teknologi-tech-stack)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Architecture & Struktur Proyek](#-architecture--struktur-proyek)
- [Deployment (Vercel)](#-deployment-vercel)
- [Dokumentasi API & Pengujian](#-dokumentasi-api--pengujian)

## 🛠 Teknologi (Tech Stack)

- **Runtime**: Node.js 22+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma Client
- **Database**: PostgreSQL (via Supabase)
- **Validation**: Zod
- **Logger**: Pino
- **Security**: Helmet, CORS, Express-Rate-Limit
- **Authentication**: Supabase JWT (Bearer Token)

## 🚀 Quick Start

1. Clone repositori ini.
2. Install dependensi: 
   ```bash
   npm install
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan variabel di dalam `.env` (terutama `DATABASE_URL` dan `SUPABASE_URL`).
5. Jalankan migrasi database:
   ```bash
   npx prisma migrate dev
   ```
6. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
7. Jalankan server:
   ```bash
   npm run dev
   ```

## 💻 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Menjalankan development server dengan fitur auto-reload |
| `npm run build` | Melakukan compile TypeScript ke JavaScript untuk environment production |
| `npm start` | Menjalankan server production dari hasil build |
| `npm test` | Menjalankan *unit test* dan *integration test* menggunakan Jest |
| `npx prisma db seed` | Menghapus dan mengisi ulang database dengan data *dummy* secara otomatis |

## 🏗 Architecture & Struktur Proyek

Proyek ini dibangun dengan arsitektur MVC berlapis (*Layered Architecture*) untuk memisahkan *concern* dan mempermudah pengujian:

- `/src/controllers` — Menangani *request/response* HTTP
- `/src/services` — Berisi *business logic* dan validasi operasional tingkat lanjut
- `/src/repositories` — Menangani isolasi akses data dan query menggunakan Prisma ORM
- `/src/validations` — Skema Zod untuk validasi ketat *payload request*
- `/src/routes` — Registrasi *routing endpoint* API Express
- `/docs` — Spesifikasi teknis, ADRs (Architecture Decision Records), dan rancangan database

**Catatan Arsitektur:**
- **Z-Score Calculation**: Perhitungan status gizi balita dilakukan secara mandiri di sisi server menggunakan rumus matematis **Box-Cox Power Exponential (LMS)** berdasarkan dataset referensi **WHO Child Growth Standards (2006)**.

## ☁️ Deployment (Vercel)

File `vercel.json` telah dikonfigurasi untuk menjalankan aplikasi ini sebagai kumpulan Serverless Functions (`api/index.ts`).

### Checklist Produksi
1. Jika terjadi error resolusi dependensi (seperti `jest-mock-extended`), pastikan Anda menjalankan install dengan konfigurasi `.npmrc` (`legacy-peer-deps=true`).
2. Pastikan *Environment Variables* berikut dikonfigurasi di Vercel:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (jika digunakan)

## 📚 Dokumentasi API & Pengujian

Sistem menyediakan **Swagger UI** interaktif yang selalu diperbarui, dapat diakses di:
```
http://localhost:3000/api-docs
```

### Panduan Testing & Auto-Auth
1. Jalankan seed database (`npx prisma db seed`).
2. Buka Swagger UI, cari endpoint `POST /api/v1/auth/login`.
3. Login menggunakan data uji coba:
   - **Email**: `kader@cipicung.com`
   - **Password**: `kader123`
4. Klik **Execute**. Script internal swagger UI secara otomatis akan menangkap Bearer Token dan mengunci (authorize) sesi Anda, sehingga Anda dapat langsung mencoba endpoint privat seperti `GET /api/v1/balita` tanpa perlu memasukkan token secara manual.
