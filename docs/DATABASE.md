# DATABASE.md

# Database Design

## Overview

Database menggunakan PostgreSQL (Supabase) dengan pendekatan **relational database**.

Setiap warga hanya memiliki **satu data identitas**, sedangkan data pemeriksaan disimpan sebagai **riwayat (transactional records)** sehingga seluruh histori kesehatan tetap tersimpan.

Sistem juga menyimpan **status pendataan bulanan** setiap kategori Posyandu untuk mengetahui apakah proses input data bulan tersebut telah selesai.

Seluruh operasi Create, Update, Delete dicatat dalam tabel **audit_log**.

---

# Entity Relationship Overview

```text
Posyandu
│
├── User (kader/bidan/admin)
│
├── Warga
│     │
│     ├── PemeriksaanBalitaBaduta
│     ├── RiwayatImunisasi
│     ├── PemeriksaanBumil
│     ├── PemeriksaanPascaPersalinan
│     └── PemeriksaanLansia
│
├── PendataanBulanan
│
└── AuditLog
```

---

# Enums

| Enum | Values |
|------|--------|
| `JenisKelamin` | `L`, `P` |
| `StatusKehamilan` | `TIDAK_HAMIL`, `HAMIL`, `PASCA_PERSALINAN` |
| `UserRole` | `kader`, `bidan`, `admin` |
| `KategoriPendataan` | `balita`, `imunisasi`, `bumil`, `pasca_persalinan`, `lansia` |
| `StatusPendataan` | `draft`, `selesai` |

---

# Master Tables

## posyandu

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| nama | String | Nama Posyandu |
| rw | String | RW Posyandu |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

## users

Profil user aplikasi, dipetakan ke Supabase Auth UUID.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| auth_id | UUID | Unique, Supabase Auth mapping |
| posyandu_id | UUID? | FK → posyandu (nullable untuk admin) |
| nama | String | |
| username | String | Unique |
| role | Enum | kader, bidan, admin |
| is_active | Boolean | Default true |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

## warga

Master data seluruh warga.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| posyandu_id | UUID | FK → posyandu |
| nomor | String | Nomor administrasi |
| nik | String | Unique |
| nama | String | |
| jenis_kelamin | Enum(L,P) | |
| status_kehamilan | Enum | TIDAK_HAMIL / HAMIL / PASCA_PERSALINAN |
| tanggal_lahir | Date | |
| created_at | Timestamp | |
| updated_at | Timestamp | |

**Catatan:** Kategori warga (balita, baduta, bumil, lansia, dll.) dihitung secara dinamis dari `tanggal_lahir` dan `status_kehamilan`, tidak disimpan sebagai kolom permanen.

---

# Transaction Tables

Semua tabel pemeriksaan memiliki struktur dasar:

| Field | Type |
|-------|------|
| id | UUID |
| warga_id | UUID (FK → warga) |
| tanggal_kunjungan | Date |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## pemeriksaan_balita_baduta

Menampung pemeriksaan balita (0–59 bulan) dan baduta (0–23 bulan). Diferensiasi dilakukan di frontend berdasarkan usia saat `tanggal_kunjungan`.

| Field | Type | Notes |
|-------|------|-------|
| bb | Decimal(5,2) | Berat badan (kg) |
| tb | Decimal(5,2) | Tinggi badan (cm) |
| lingkar_kepala | Decimal(5,2) | cm |
| lingkar_lengan_atas | Decimal(5,2) | cm |
| nama_ayah | String? | |
| nama_ibu | String? | |
| keluhan | Text? | |

---

## riwayat_imunisasi

Riwayat imunisasi berdiri sendiri dan tidak bergantung pada pemeriksaan balita.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| warga_id | UUID | FK → warga |
| jenis_vaksin | String | Teks bebas (input manual) |
| tanggal_pemberian | Date | |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

## pemeriksaan_bumil

| Field | Type | Notes |
|-------|------|-------|
| bb | Decimal(5,2) | kg |
| tb | Decimal(5,2) | cm |
| lingkar_perut | Decimal(5,2) | cm |
| lingkar_lengan_atas | Decimal(5,2) | cm |
| usia_kehamilan_minggu | Integer | minggu |
| hpht | Date | Hari Pertama Haid Terakhir |
| htp | Date | Hari Tafsiran Persalinan |
| keluhan | Text? | |

---

## pemeriksaan_pasca_persalinan

| Field | Type | Notes |
|-------|------|-------|
| tanggal_persalinan | Date | |
| bb | Decimal(5,2) | kg |
| tekanan_darah_sistolik | Integer | mmHg |
| tekanan_darah_diastolik | Integer | mmHg |
| suhu_tubuh | Decimal(4,2) | °C |
| kondisi_ibu | Text? | |
| keluhan | Text? | |

---

## pemeriksaan_lansia

| Field | Type | Notes |
|-------|------|-------|
| bb | Decimal(5,2) | kg |
| tb | Decimal(5,2) | cm |
| tekanan_darah_sistolik | Integer | mmHg |
| tekanan_darah_diastolik | Integer | mmHg |
| gula_darah_sewaktu | Integer | mg/dL |
| keluhan | Text? | |

---

# Monthly Data Collection

## pendataan_bulanan

Tabel ini **bukan** menyimpan data pemeriksaan.

Tabel ini menyimpan status administrasi bahwa satu Posyandu telah menyelesaikan pendataan untuk suatu kategori pada bulan tertentu.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| posyandu_id | UUID | FK → posyandu |
| bulan | Integer | 1–12 |
| tahun | Integer | Contoh: 2026 |
| status | Enum | draft, selesai |
| submitted_at | Timestamp? | Nullable |
| submitted_by | UUID? | User ID yang submit |
| created_at | Timestamp | |
| updated_at | Timestamp | |

**Unique Constraint:** `(posyandu_id, bulan, tahun)` — satu record per posyandu per bulan (tidak per kategori, berbeda dari desain awal).

---

# System Tables

## audit_log

Menyimpan riwayat seluruh perubahan data (Create, Update, Delete, Submit).

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| posyandu_id | UUID | FK → posyandu |
| action | String | CREATE, UPDATE, DELETE, SUBMIT |
| entity | String | Nama entitas (Warga, PemeriksaanBalitaBaduta, RiwayatImunisasi, dll.) |
| entity_id | UUID | ID baris yang berubah |
| old_value | JSON? | Data sebelum diubah |
| new_value | JSON? | Data setelah diubah |
| created_at | Timestamp | Waktu log dibuat |

---

# Monthly Workflow

```text
Awal bulan → status = draft (otomatis via upsert)

↓

Kader menambah/edit/hapus pemeriksaan

↓

Setelah semua data selesai diinput

↓

Kader klik "Tandai Pendataan Selesai"

↓

status = selesai, submitted_at = now(), submitted_by = user_id

↓

Periode terkunci — tidak dapat diubah
```

---

# Locking Rules

Saat status `pendataan_bulanan` berubah menjadi **selesai**:

- Tidak boleh membuat pemeriksaan baru.
- Tidak boleh mengubah pemeriksaan.
- Tidak boleh menghapus pemeriksaan.
- Riwayat pemeriksaan tetap dapat dilihat.

`LockValidationService.ensureNotLocked()` wajib dipanggil di semua service sebelum CUD.

---

# Indexes

| Table | Index |
|-------|-------|
| warga | posyandu_id, nik |
| pemeriksaan_* | warga_id |
| riwayat_imunisasi | warga_id |
| pendataan_bulanan | posyandu_id |
| audit_log | posyandu_id, (entity, entity_id) |

---

# Data Integrity Rules

- NIK harus unik di seluruh sistem.
- Seluruh pemeriksaan harus memiliki `warga_id` yang valid.
- Seluruh warga harus terhubung ke satu Posyandu.
- Riwayat imunisasi tidak bergantung pada pemeriksaan balita.
- Pendataan bulanan bersifat unik berdasarkan `(posyandu_id, bulan, tahun)`.
- Backend wajib memeriksa status `pendataan_bulanan` sebelum CUD pada data pemeriksaan.
- Kader hanya dapat mengakses data Posyandu mereka sendiri (divalidasi via `posyandu_id` dari token).
