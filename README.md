# Posyandu Digital API (Backend)

Backend REST API untuk Sistem Digitalisasi Posyandu. Proyek ini dibangun menggunakan Node.js, Express.js, TypeScript, dan Prisma ORM dengan database PostgreSQL (Supabase).

## 🚀 Fitur Utama

- **Authentication & Authorization**: Supabase JWT (Bearer Token)
- **Validation**: Schema-based validation using Zod
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Error Handling**: Centralized error mapping
- **API Documentation**: OpenAPI 3.1.0 Swagger UI

## 📋 Modul Sistem

- Manajemen Posyandu
- Registrasi Warga
- Pemeriksaan Balita (Tumbuh Kembang)
- Riwayat Imunisasi
- Pemeriksaan Ibu Hamil
- Pemeriksaan Pasca Persalinan
- Pemeriksaan Lansia
- Tracking Pendataan Bulanan
- Dashboard & Statistik

## 🛠 Teknologi

- **Runtime**: Node.js 22+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma Client
- **Validation**: Zod
- **Logger**: Pino
- **Security**: Helmet, CORS, Express-Rate-Limit

## 📦 Instalasi

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

## 🚀 Menjalankan Server

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📚 Dokumentasi API

Sistem menyediakan interaktif Swagger UI untuk mengeksplorasi API secara langsung.

Setelah server berjalan, akses melalui browser:
```
http://localhost:3000/api-docs
```

## 📄 Struktur Proyek

- `/src/controllers` — Logic request dan response HTTP
- `/src/services` — Business logic dan validasi operasional
- `/src/repositories` — Akses ke database (Prisma)
- `/src/validations` — Schema Zod
- `/src/routes` — Pendaftaran routing Express
- `/docs` — Spesifikasi arsitektur, database, dan tugas

## 🔐 Keamanan & Validasi Bulanan

- NIK dienkripsi/divalidasi sebelum masuk database.
- Terdapat mekanisme penguncian (Locking Mechanism) untuk pendataan bulanan yang menandakan periode bulan berjalan telah selesai dan data tidak bisa dimodifikasi.
