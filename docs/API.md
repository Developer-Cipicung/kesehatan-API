# API.md

# REST API Specification

## Overview

Backend menyediakan REST API untuk mendukung sistem Digitalisasi Posyandu.

Seluruh endpoint menggunakan format JSON dan dilindungi menggunakan **Supabase JWT Authentication**.

Base URL

```
/api/v1
```

---

# Authentication

Semua endpoint (kecuali login dan health check) memerlukan Bearer Token.

Header

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Standard Response

## Success

```json
{
    "success": true,
    "message": "Operation successful.",
    "data": {}
}
```

---

## Error

```json
{
    "success": false,
    "message": "Validation failed.",
    "errors": []
}
```

---

# Authentication

## POST /auth/login

Login menggunakan Supabase Authentication.

---

## GET /auth/me

Mengambil informasi user yang sedang login.

---

# Posyandu

## GET /posyandu

Daftar Posyandu.

---

## GET /posyandu/:id

Detail Posyandu.

---

## POST /posyandu

Membuat Posyandu baru.

---

## PUT /posyandu/:id

Mengubah data Posyandu.

---

## DELETE /posyandu/:id

Menghapus Posyandu.

---

# Warga

## GET /warga

Mengambil daftar warga.

Query

```
page
limit
search
jenis_kelamin
posyandu_id
```

---

## GET /warga/:id

Detail warga.

---

## POST /warga

Menambahkan warga baru.

---

## PUT /warga/:id

Mengubah data warga.

---

## DELETE /warga/:id

Menghapus warga.

---

# Pemeriksaan Balita

## GET /balita

Daftar pemeriksaan bulan tertentu.

Query

```
bulan
tahun
page
limit
search
```

---

## POST /balita

Menambahkan pemeriksaan balita.

---

## GET /balita/:id

Detail pemeriksaan.

---

## PUT /balita/:id

Mengubah pemeriksaan.

---

## DELETE /balita/:id

Menghapus pemeriksaan.

---

## GET /balita/:id/history

Riwayat pemeriksaan balita.

---

# Riwayat Imunisasi

## GET /imunisasi

Daftar imunisasi.

---

## POST /imunisasi

Tambah riwayat imunisasi.

---

## PUT /imunisasi/:id

Edit imunisasi.

---

## DELETE /imunisasi/:id

Hapus imunisasi.

---

## GET /imunisasi/:wargaId/history

Riwayat imunisasi warga.

---

# Pemeriksaan Ibu Hamil

## GET /bumil

Mengambil daftar seluruh ibu hamil beserta status pemeriksaan bulan berjalan.

Query

```
bulan
tahun
page
limit
search
```

---

## POST /bumil

Menambahkan pemeriksaan ibu hamil.

---

## GET /bumil/:id

Detail pemeriksaan.

---

## PUT /bumil/:id

Mengubah pemeriksaan.

---

## DELETE /bumil/:id

Menghapus pemeriksaan.

---

## GET /bumil/:wargaId/history

Riwayat pemeriksaan ibu hamil.

---

# Pemeriksaan Pasca Persalinan

## GET /pasca-persalinan

Daftar pasien.

---

## POST /pasca-persalinan

Tambah pemeriksaan.

---

## PUT /pasca-persalinan/:id

Edit pemeriksaan.

---

## DELETE /pasca-persalinan/:id

Hapus pemeriksaan.

---

## GET /pasca-persalinan/:wargaId/history

Riwayat pemeriksaan.

---

# Pemeriksaan Lansia

## GET /lansia

Daftar pasien.

---

## POST /lansia

Tambah pemeriksaan.

---

## PUT /lansia/:id

Edit pemeriksaan.

---

## DELETE /lansia/:id

Hapus pemeriksaan.

---

## GET /lansia/:wargaId/history

Riwayat pemeriksaan.

---

# Pendataan Bulanan

Modul ini mengelola status administrasi pendataan bulanan setiap kategori Posyandu.

Status pendataan **tidak menyimpan data pemeriksaan**, tetapi menandakan bahwa seluruh proses input data pada kategori tersebut telah selesai.

---

## GET /pendataan-bulanan

Mengambil status pendataan suatu kategori.

Query

```
kategori
bulan
tahun
```

Response

```json
{
    "success": true,
    "data": {
        "id": "uuid-here",
        "kategori": "bumil",
        "bulan": 7,
        "tahun": 2026,
        "status": "draft",
        "submitted_at": null
    }
}
```

---

## POST /pendataan-bulanan/:id/submit

Menandai pendataan kategori sebagai selesai. (Idempotent: Jika sudah selesai, maka akan mengembalikan 200 OK)

Request (Empty Body)
```json
{}
```

Response

```json
{
    "success": true,
    "message": "Pendataan berhasil diselesaikan."
}
```

Business Rules

- Hanya dapat dilakukan sekali.
- Seluruh pemeriksaan harus sudah selesai diinput.
- Setelah berhasil, periode menjadi terkunci.
- Tidak dapat dibatalkan oleh kader.

---

## GET /pendataan-bulanan/status

Mengambil status seluruh kategori pada bulan tertentu.

Query

```
bulan
tahun
```

Response

```json
{
    "success": true,
    "data": [
        {
            "id": "uuid-here",
            "kategori": "balita",
            "status": "selesai"
        },
        {
            "id": "uuid-here",
            "kategori": "imunisasi",
            "status": "draft"
        },
        {
            "kategori": "bumil",
            "status": "selesai"
        },
        {
            "kategori": "pasca_persalinan",
            "status": "draft"
        },
        {
            "kategori": "lansia",
            "status": "selesai"
        }
    ]
}
```

---

# Dashboard

## GET /dashboard

Ringkasan dashboard.

Response

```json
{
    "total_warga": 512,
    "total_balita": 84,
    "total_bumil": 17,
    "total_lansia": 63,
    "pendataan": {
        "balita": "selesai",
        "imunisasi": "draft",
        "bumil": "selesai",
        "pasca_persalinan": "draft",
        "lansia": "selesai"
    }
}
```

---

# Lock Validation

Backend **wajib** memeriksa status `pendataan_bulanan` sebelum menjalankan operasi berikut:

- POST pemeriksaan
- PUT pemeriksaan
- DELETE pemeriksaan

Apabila status periode adalah **selesai**, backend harus menolak permintaan.

HTTP Status

```
409 Conflict
```

Response

```json
{
    "success": false,
    "message": "Pendataan untuk kategori ini pada periode tersebut telah diselesaikan dan tidak dapat diubah."
}
```

Seluruh validasi dilakukan oleh backend.

Frontend hanya menampilkan status dan menonaktifkan tombol aksi sesuai respons API.

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# API Versioning

Seluruh endpoint menggunakan versi API.

```
/api/v1
```

Perubahan besar (breaking changes) akan dirilis melalui versi baru, misalnya:

```
/api/v2
```
---

# Users (Super Admin)

## GET /users

Daftar seluruh users. (Hanya admin)

## GET /users/:id

Detail user.

## POST /users

Membuat user baru.

## PUT /users/:id

Update data user (assign posyandu dll).

## DELETE /users/:id

Hapus user.
