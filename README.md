<div align="center">
  <img src="docs/logo-cipicung.webp" alt="Logo Posyandu Digital Cipicung" width="130" />
  <h1>⚙️ API Dashboard Kesehatan Cipicung (Backend)</h1>
  <p><b>Backend RESTful API & Engine Kalkulasi Z-Score Posyandu Cipicung</b></p>
  <p>Didevelop menggunakan Node.js 22+, Express.js, TypeScript, dan Prisma ORM dengan database PostgreSQL (Supabase).</p>
</div>

---

## 📑 Daftar Isi (Table of Contents)
- [Fitur Utama & Logika Bisnis (Key Features)](#-fitur-utama--logika-bisnis-key-features)
- [Teknologi (Tech Stack)](#-teknologi-tech-stack)
- [Struktur Arsitektur (Project Architecture)](#-struktur-arsitektur-project-architecture)
- [Panduan Instalasi (Quick Start)](#-panduan-instalasi-quick-start)
- [Perintah Tersedia (Available Scripts)](#-perintah-tersedia-available-scripts)
- [Dokumentasi API & Swagger UI](#-dokumentasi-api--swagger-ui)
- [Deployment (Vercel Serverless)](#-deployment-vercel-serverless)

---

## 🌟 Fitur Utama & Logika Bisnis (Key Features)

### 1. 👶 Kalkulasi Otomatis Z-Score Status Gizi (WHO LMS Standard)
- Perhitungan **Z-Score gizi balita** dilakukan otomatis di tingkat server menggunakan algoritma matematis **Box-Cox Power Exponential (LMS)** berdasarkan dataset **WHO Child Growth Standards (2006)**:
  - **BB/U** (Berat Badan menurut Umur) $\rightarrow$ *Sangat Kurang, Kurang, Normal, Risiko Lebih*.
  - **TB/U** (Tinggi/Panjang Badan menurut Umur) $\rightarrow$ *Sangat Pendek (Stunting), Pendek, Normal, Tinggi*.
  - **BB/TB** (Berat Badan menurut Tinggi Badan) $\rightarrow$ *Gizi Buruk, Gizi Kurang, Gizi Baik, Berisiko Gizi Lebih, Gizi Lebih, Obesitas*.

### 2. 🤱 Manajemen Siklus Kehamilan & Transisi Status
- Penanganan status kehamilan komprehensif melalui Enum `StatusKehamilan` (`HAMIL`, `PASCA_PERSALINAN`, `TIDAK_HAMIL`, `ABORTUS`):
  - `POST /api/v1/warga/:id/hamil-kembali`: Mengaktifkan kembali status kehamilan pasien terdaftar tanpa menduplikasi data warga/NIK.
  - `POST /api/v1/warga/:id/bersalin`: Mengubah status menjadi Pasca Persalinan serta mendaftarkan entri anak baru secara konsisten dalam satu transaksi database.
  - `POST /api/v1/warga/:id/abortus`: Mengubah status ke `ABORTUS` (keguguran) dengan registrasi lokasi penanganan & catatan riwayat medis.

### 3. 📈 Modul Pelayanan & Pemeriksaan Kesehatan
- **Balita & Baduta**: Antropometri (BB, TB, LK, LILA), Imunisasi dasar & lanjutan, Vitamin A, Obat Cacing, ASI Eksklusif.
- **Ibu Hamil (K1-K6)**: TTD, Imunisasi TT, TFU, DJJ, Hemoglobin (HB), Lingkar Lengan Atas (LILA).
- **Ibu Pasca Persalinan (KF1-KF4)**: Vit A Nifas, Pelayanan KB, Suhu, Tekanan Darah.
- **Lansia**: Skrining PTM (Penyakit Tidak Menular), Gula Darah, Kolesterol, Asam Urat, Lingkar Perut.

### 4. 📂 Import & Export Data Massal
- Parsing dan penanganan *bulk import* e-PPGBM/Excel untuk registrasi masal data warga & rekam medis.
- Ekspor rekapitulasi data laporan bulanan posyandu.

### 5. 🔐 Keamanan, Autentikasi & Lock Validation
- Integrated **Supabase Authentication** (JWT Bearer Token validation).
- **Audit Logging**: Pencatatan riwayat perubahan data sensitif oleh pengguna.
- **Pendataan Lock Validation**: Penguncian periode pendataan bulanan untuk mencegah pengubahan data histori.

---

## 🛠 Teknologi (Tech Stack)

| Kategori | Teknologi |
| --- | --- |
| **Runtime & Framework** | Node.js (v22+), Express.js |
| **Language** | TypeScript |
| **Database & ORM** | PostgreSQL (via Supabase), Prisma ORM |
| **Validation** | Zod Schema Validation |
| **Autentikasi & Security** | Supabase JWT Auth, Helmet, CORS, Express-Rate-Limit |
| **Documentation** | Swagger UI (`swagger-ui-express`, `tsoa`/OpenAPI) |
| **Logging** | Pino Logger |

---

## 🏗 Struktur Arsitektur (Project Architecture)

Sistem menggunakan pola **Layered Architecture (MVC / Service-Repository Pattern)**:

```text
src/
├── controllers/       # HTTP Request/Response Handler & Error Catching
├── middleware/        # Authentication, Validation, & Error Handlers
├── repositories/      # Database Access Layer (Prisma ORM queries)
├── routes/            # Express Endpoint Routers
├── services/          # Pure Business Logic, Calculations, & Transactions
├── validations/       # Request Payload Schemas (Zod)
├── types/             # Custom TypeScript Interfaces & Enums
└── utils/             # Math utilities (Z-Score LMS algorithm)
```

---

## 🚀 Panduan Instalasi (Quick Start)

### 1. Persyaratan Sistem
- Node.js v18.x atau lebih baru
- Database PostgreSQL (lokal / Supabase)

### 2. Langkah Instalasi
```bash
# 1. Clone repositori
git clone https://github.com/Developer-Cipicung/kesehatan-API.git

# 2. Masuk direktori
cd kesehatan-API

# 3. Install dependensi
npm install

# 4. Salin file .env
cp .env.example .env
```

Sesuaikan konfigurasi environment di `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

```bash
# 5. Jalankan migrasi database
npx prisma migrate dev

# 6. Generate Prisma Client
npx prisma generate

# 7. Seed data awal (Optional)
npx prisma db seed

# 8. Jalankan server pengembang
npm run dev
```

---

## 💻 Perintah Tersedia (Available Scripts)

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan Express dev server dengan Nodemon / ts-node-dev (`http://localhost:3000`) |
| `npm run build` | Menjalankan compile TypeScript (`tsc`) ke direktori `dist/` |
| `npm start` | Menjalankan server produksi dari berkas `dist/index.js` |
| `npm test` | Menjalankan suite pengujian unit & integrasi menggunakan Jest |
| `npx prisma db seed` | Menghapus & mengisi ulang database sampel secara otomatis |

---

## 📚 Dokumentasi API & Swagger UI

Sistem dilengkapi **Swagger UI** interaktif yang dapat diakses saat server berjalan di:
```text
http://localhost:3000/api-docs
```

### Panduan Autentikasi Otomatis di Swagger:
1. Buka `http://localhost:3000/api-docs`.
2. Eksekusi endpoint `POST /api/v1/auth/login` menggunakan kredensial default (`kader@cipicung.com` / `kader123`).
3. Script internal Swagger secara otomatis akan menyimpan Bearer Token dan memasukkannya ke header authorization untuk semua request berikutnya.

---

## ☁️ Deployment (Vercel Serverless)

Repositori ini disesuaikan untuk di-deploy ke **Vercel** sebagai Serverless Function:

- Entry Point: `api/index.ts`
- File `vercel.json` secara otomatis mengarahkan semua siklus request Express ke fungsi Serverless Vercel.
- Environment variables (`DATABASE_URL`, `SUPABASE_URL`, dll) harus dikonfigurasi di dashboard Vercel.
