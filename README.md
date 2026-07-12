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
- Tracking Pendataan Bulanan (Penguncian Data)
- Dashboard & Global Patient Search (One-Stop Action Center)

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

### Deploy ke Vercel
Kalau backend ini dipasang ke Vercel, pakai konfigurasi ini:

```bash
npm install
npm run build
```

File `vercel.json` sudah disiapkan untuk route semua request ke handler serverless di folder `api`.

### Checklist Vercel
Sebelum klik deploy, pastikan ini sudah diisi di Project Settings Vercel:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` jika memang dipakai backend

`JWT_SECRET` tidak dipakai oleh flow auth yang ada sekarang. Token login dan validasi user saat ini semuanya lewat Supabase Auth, jadi secret itu baru perlu kalau nanti kamu menambah JWT custom sendiri.

Kalau pakai domain produksi, pastikan CORS di backend mengizinkan origin frontend yang benar. Untuk backend ini, Swagger UI tetap tersedia di `/api-docs` selama file docs ikut terbaca saat build serverless.

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

2. **Gunakan Swagger UI (Auto-Auth)**
   - Buka Swagger UI di `http://localhost:3000/api-docs`.
   - Buka endpoint `POST /api/v1/auth/login` dan gunakan kredensial berikut untuk login uji coba:
     - **Email**: `kader@cipicung.com`
     - **Password**: `kader123`
   - Klik **Execute**. 
   - 🎉 **Selesai!** Script internal kami akan secara otomatis menangkap token dari response dan mengotorisasi seluruh sesi Swagger Anda. Anda tidak perlu lagi melakukan copy-paste secara manual ke tombol Authorize di atas!
   - *(Catatan: Tersedia juga tombol "Copy Bearer Token" di bawah hasil response jika Anda membutuhkan tokennya untuk pengujian manual menggunakan Postman).*

3. **Mulai Mengeksplorasi API**
   - Setelah login, semua gembok di sebelah kanan setiap endpoint akan terkunci (terotorisasi).
   - Sekarang Anda dapat langsung mencoba endpoint `GET /api/v1/balita`, `GET /api/v1/dashboard`, dll. Semua data dari proses seeding akan muncul dan otomatis difilter khusus untuk Posyandu dari akun Anda (tenant isolation).

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

## 📊 Standar Pertumbuhan (Z-Score)

Perhitungan status gizi balita pada sistem ini (BB/U, TB/U, dan BB/TB) dilakukan secara mandiri di dalam server menggunakan rumus matematis **Box-Cox Power Exponential (LMS)**. 
Dataset referensi yang digunakan bersumber langsung dari standar resmi **WHO Child Growth Standards (2006)**.

Referensi tabel L, M, S dapat divalidasi langsung melalui portal resmi WHO:
👉 [WHO Child Growth Standards - LMS Tables](https://www.who.int/tools/child-growth-standards/standards)
