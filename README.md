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

## 🧪 Panduan Testing API

Untuk mencoba API secara langsung dengan data dummy lengkap (termasuk pemeriksaan Balita, Lansia, Bumil, dsb.), ikuti langkah berikut:

1. **Jalankan Seed Database**
   Pastikan Anda sudah menjalankan migrasi (`npx prisma migrate dev`), lalu jalankan perintah seed berikut untuk membuat dummy data secara otomatis:
   ```bash
   npx prisma db seed
   ```
   *(Catatan: Perintah ini akan menghapus data lama dan mereset Posyandu serta Warga agar tidak terjadi konflik NIK).*

2. **Dapatkan Token JWT (Supabase)**
   Seluruh API dilindungi oleh Supabase JWT (kecuali `/api/v1/auth/login` dan `/health`).
   - Gunakan endpoint `POST /api/v1/auth/login` melalui Swagger atau Postman.
   - Gunakan kredensial berikut untuk login uji coba (akun ini dihubungkan dengan data seed):
     - **Email**: `kader@cipicung.com`
     - **Password**: `kader123`
   - Ambil token `access_token` yang diberikan di response body.

3. **Gunakan Swagger UI / Postman**
   - Buka Swagger UI di `http://localhost:3000/api-docs`
   - Klik tombol **"Authorize"** di pojok kanan atas.
   - Masukkan token Anda dengan format: `<TOKEN>` (tanpa embel-embel Bearer, karena Swagger sudah menyediakannya di background).
   - Sekarang Anda dapat mencoba endpoint `GET /api/v1/balita`, `GET /api/v1/dashboard`, dll. Semua data dari proses seeding tadi akan muncul di hasil response secara otomatis difilter sesuai Posyandu dari akun Kader tersebut.

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
