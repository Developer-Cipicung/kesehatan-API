# DATABASE.md

# Database Design

## Overview

Database menggunakan PostgreSQL (Supabase) dengan pendekatan **relational database**.

Setiap warga hanya memiliki **satu data identitas**, sedangkan data pemeriksaan disimpan sebagai **riwayat (transactional records)** sehingga seluruh histori kesehatan tetap tersimpan.

Selain menyimpan data pemeriksaan, sistem juga menyimpan **status pendataan bulanan** setiap kategori Posyandu untuk mengetahui apakah proses input data bulan tersebut telah selesai.

---

# Entity Relationship Overview

```text
Posyandu
│
├── Warga
│     │
│     ├── Pemeriksaan Balita
│     ├── Riwayat Imunisasi
│     ├── Pemeriksaan Ibu Hamil
│     ├── Pemeriksaan Pasca Persalinan
│     └── Pemeriksaan Lansia
│
└── Pendataan Bulanan
```

---

# Master Tables

## posyandu

Menyimpan data Posyandu.

| Field | Type | Notes |
|--------|------|------|
| id | UUID | Primary Key |
| nama | String | Nama Posyandu |
| alamat | Text | |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

## warga

Master data seluruh warga.

| Field | Type | Notes |
|--------|------|------|
| id | UUID | Primary Key |
| posyandu_id | UUID | FK → posyandu |
| nomor | String | Nomor administrasi |
| nik | String | Unique |
| nama | String | |
| jenis_kelamin | Enum(L,P) | |
| tanggal_lahir | Date | |
| created_at | Timestamp | |
| updated_at | Timestamp | |

Umur dihitung secara dinamis dari `tanggal_lahir`.

---

# Transaction Tables

Semua tabel pemeriksaan menggunakan struktur dasar berikut.

| Field | Type |
|--------|------|
| id | UUID |
| warga_id | UUID |
| tanggal_kunjungan | Date |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## pemeriksaan_balita_baduta

| Field | Type |
|--------|------|
| bb | Decimal |
| tb | Decimal |
| lingkar_kepala | Decimal |
| lingkar_lengan_atas | Decimal |
| nama_ortu | String |

Relationship

```
Warga (1)

↓

Pemeriksaan Balita (N)
```

---

## riwayat_imunisasi

Riwayat imunisasi berdiri sendiri dan tidak bergantung pada pemeriksaan balita.

| Field | Type |
|--------|------|
| id | UUID |
| warga_id | UUID |
| jenis_vaksin | String |
| tanggal_pemberian | Date |
| created_at | Timestamp |
| updated_at | Timestamp |

Relationship

```
Warga (1)

↓

Riwayat Imunisasi (N)
```

---

## pemeriksaan_bumil

| Field | Type |
|--------|------|
| bb | Decimal |
| tb | Decimal |
| lingkar_perut | Decimal |
| lingkar_lengan_atas | Decimal |
| usia_kehamilan_minggu | Integer |
| hpht | Date |
| htp | Date |
| tekanan_darah_sistolik | Integer |
| tekanan_darah_diastolik | Integer |
| tinggi_fundus | Decimal |
| denyut_jantung_janin | Integer |
| hemoglobin | Decimal |
| keluhan | Text |

Relationship

```
Warga (1)

↓

Pemeriksaan Bumil (N)
```

---

## pemeriksaan_pasca_persalinan

| Field | Type |
|--------|------|
| tanggal_persalinan | Date |
| bb | Decimal |
| tekanan_darah_sistolik | Integer |
| tekanan_darah_diastolik | Integer |
| suhu_tubuh | Decimal |
| kondisi_ibu | Text |
| keluhan | Text |

Relationship

```
Warga (1)

↓

Pemeriksaan Pasca Persalinan (N)
```

---

## pemeriksaan_lansia

| Field | Type |
|--------|------|
| bb | Decimal |
| tb | Decimal |
| tekanan_darah_sistolik | Integer |
| tekanan_darah_diastolik | Integer |
| gula_darah_sewaktu | Integer |
| keluhan | Text |

Relationship

```
Warga (1)

↓

Pemeriksaan Lansia (N)
```

---

# Monthly Data Collection

## pendataan_bulanan

Tabel ini **bukan** menyimpan data pemeriksaan.

Tabel ini menyimpan status administrasi bahwa satu Posyandu telah menyelesaikan pendataan untuk suatu kategori pada bulan tertentu.

| Field | Type | Notes |
|--------|------|------|
| id | UUID | Primary Key |
| posyandu_id | UUID | FK → posyandu |
| kategori | Enum | balita, imunisasi, bumil, pasca_persalinan, lansia |
| bulan | Integer | 1-12 |
| tahun | Integer | Contoh: 2026 |
| status | Enum | draft, selesai |
| submitted_at | Timestamp | Nullable |
| submitted_by | UUID | User ID |
| created_at | Timestamp | |
| updated_at | Timestamp | |

Unique Constraint

```text
(posyandu_id, kategori, bulan, tahun)
```

Artinya, setiap Posyandu hanya boleh memiliki **satu status pendataan** untuk setiap kategori pada setiap bulan.

---

# System Tables

## audit_log

Tabel ini menyimpan riwayat perubahan data (Create, Update, Delete) pada tabel-tabel utama (seperti warga, pemeriksaan, dll).

| Field | Type | Notes |
|--------|------|------|
| id | UUID | Primary Key |
| user_id | UUID | User yang melakukan aksi |
| posyandu_id | UUID | Posyandu terkait |
| action | String | CREATE, UPDATE, DELETE, SUBMIT |
| entity | String | Nama tabel / entitas (Warga, PemeriksaanBalitaBaduta, dsb) |
| entity_id | UUID | ID baris yang berubah |
| old_value | JSON | Data sebelum diubah |
| new_value | JSON | Data setelah diubah |
| created_at | Timestamp | Waktu log dibuat |

---

# Monthly Workflow

```text
Draft

↓

Tambah Pemeriksaan

↓

Tambah Pemeriksaan

↓

Tambah Pemeriksaan

↓

Tandai Pendataan Selesai

↓

Status = selesai

↓

Periode Terkunci
```

---

# Locking Rules

Saat status `pendataan_bulanan` berubah menjadi **selesai**:

- Tidak boleh membuat pemeriksaan baru.
- Tidak boleh mengubah pemeriksaan.
- Tidak boleh menghapus pemeriksaan.
- Riwayat pemeriksaan tetap dapat dilihat.

Penguncian **wajib divalidasi oleh backend**.

Frontend hanya menampilkan status.

---

# Relationships

```text
Posyandu (1)
│
├── Warga (N)
│      │
│      ├── Pemeriksaan Balita (N)
│      ├── Riwayat Imunisasi (N)
│      ├── Pemeriksaan Bumil (N)
│      ├── Pemeriksaan Pasca Persalinan (N)
│      └── Pemeriksaan Lansia (N)
│
└── Pendataan Bulanan (N)
```

---

# Data Integrity Rules

- NIK harus unik.
- Seluruh pemeriksaan harus memiliki `warga_id` yang valid.
- Seluruh warga harus terhubung ke satu Posyandu.
- Riwayat pemeriksaan tidak boleh dihapus saat warga masih aktif (soft delete dapat dipertimbangkan di masa depan).
- Riwayat imunisasi tidak bergantung pada pemeriksaan balita.
- Pendataan bulanan bersifat unik berdasarkan `(posyandu_id, kategori, bulan, tahun)`.
- Backend wajib memeriksa status `pendataan_bulanan` sebelum melakukan operasi **Create**, **Update**, atau **Delete** pada data pemeriksaan.

---

- Multi-Puskesmas
- Reopen Pendataan Bulanan oleh Administrator
- Arsip Pendataan Tahunan
- Statistik dan Pelaporan Otomatis
## Users Table
Stores application-specific user profiles uniquely mapped to Supabase Auth UUIDs.
- `id`: UUID (Primary Key)
- `auth_id`: UUID (Unique, Supabase mapping)
- `posyandu_id`: UUID (Foreign Key)
- `nama`: String
- `email`: String
- `role`: Enum (kader, bidan, admin)
- `is_active`: Boolean
