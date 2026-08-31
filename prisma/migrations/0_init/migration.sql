-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusKehamilan" AS ENUM ('TIDAK_HAMIL', 'HAMIL', 'PASCA_PERSALINAN', 'ABORTUS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('kader', 'bidan', 'admin');

-- CreateEnum
CREATE TYPE "KategoriPendataan" AS ENUM ('balita', 'imunisasi', 'bumil', 'pasca_persalinan', 'lansia');

-- CreateEnum
CREATE TYPE "StatusPendataan" AS ENUM ('draft', 'selesai');

-- CreateTable
CREATE TABLE "posyandu" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posyandu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "posyandu_id" UUID,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'kader',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warga" (
    "id" UUID NOT NULL,
    "posyandu_id" UUID NOT NULL,
    "nomor" TEXT,
    "nik" TEXT,
    "nama" TEXT NOT NULL,
    "jenis_kelamin" "JenisKelamin",
    "status_kehamilan" "StatusKehamilan" DEFAULT 'TIDAK_HAMIL',
    "tanggal_lahir" DATE,
    "tempat_lahir" TEXT,
    "alamat" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "tempat_persalinan" TEXT,
    "penggunaan_kontrasepsi" TEXT,
    "jumlah_anak" INTEGER,
    "memiliki_bpjs" BOOLEAN NOT NULL DEFAULT false,
    "nama_ayah" TEXT,
    "nama_ibu" TEXT,
    "hpht" DATE,
    "htp" DATE,
    "kategori_terdaftar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ibu_id" UUID,

    CONSTRAINT "warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_balita_baduta" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "bb" DECIMAL(5,2),
    "tb" DECIMAL(5,2),
    "lingkar_kepala" DECIMAL(5,2),
    "lingkar_lengan_atas" DECIMAL(5,2),
    "nama_ayah" TEXT,
    "nama_ibu" TEXT,
    "catatan" TEXT,
    "kondisi" TEXT,
    "asi_eksklusif" BOOLEAN,
    "zscore_bb_u" DECIMAL(5,2),
    "zscore_tb_u" DECIMAL(5,2),
    "zscore_bb_tb" DECIMAL(5,2),
    "fasilitasi_bantuan_sosial" BOOLEAN,
    "tanggal_kunjungan_berikut" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_balita_baduta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_imunisasi" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "jenis_vaksin" TEXT NOT NULL,
    "tanggal_pemberian" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riwayat_imunisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_bumil" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "bb" DECIMAL(5,2),
    "tb" DECIMAL(5,2),
    "lingkar_perut" DECIMAL(5,2),
    "tinggi_fundus" DECIMAL(5,2),
    "lingkar_lengan_atas" DECIMAL(5,2),
    "tekanan_darah_sistolik" INTEGER,
    "tekanan_darah_diastolik" INTEGER,
    "usia_kehamilan_minggu" INTEGER,
    "catatan" TEXT,
    "status_risiko_pe" TEXT DEFAULT 'Belum Diperiksa',
    "riwayat_penyakit" TEXT,
    "kadar_hemoglobin" DECIMAL(5,2),
    "berat_janin" DECIMAL(5,2),
    "terpapar_rokok" BOOLEAN,
    "kie" BOOLEAN,
    "suplemen_tambah_darah" INTEGER,
    "mms" INTEGER,
    "fasilitasi_rujukan" BOOLEAN,
    "fasilitasi_bantuan_sosial" BOOLEAN,
    "tanggal_kunjungan_berikut" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_bumil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_pasca_persalinan" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "tanggal_persalinan" DATE,
    "bb" DECIMAL(5,2),
    "tb" DECIMAL(5,2),
    "tekanan_darah_sistolik" INTEGER,
    "tekanan_darah_diastolik" INTEGER,
    "kondisi_ibu" TEXT,
    "catatan" TEXT,
    "tinggi_badan_bayi" DECIMAL(5,2),
    "berat_badan_bayi" DECIMAL(5,2),
    "kie" BOOLEAN,
    "fasilitasi_rujukan" BOOLEAN,
    "fasilitasi_bantuan_sosial" BOOLEAN,
    "tanggal_kunjungan_berikut" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_pasca_persalinan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_lansia" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "bb" DECIMAL(5,2),
    "tb" DECIMAL(5,2),
    "tekanan_darah_sistolik" INTEGER,
    "tekanan_darah_diastolik" INTEGER,
    "gula_darah_sewaktu" INTEGER,
    "kolesterol" INTEGER,
    "asam_urat" DECIMAL(4,2),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_lansia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendataan_bulanan" (
    "id" UUID NOT NULL,
    "posyandu_id" UUID NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "status" "StatusPendataan" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "submitted_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendataan_bulanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "posyandu_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_posyandu_id_idx" ON "users"("posyandu_id");

-- CreateIndex
CREATE UNIQUE INDEX "warga_nik_key" ON "warga"("nik");

-- CreateIndex
CREATE INDEX "warga_posyandu_id_idx" ON "warga"("posyandu_id");

-- CreateIndex
CREATE INDEX "warga_nik_idx" ON "warga"("nik");

-- CreateIndex
CREATE INDEX "pemeriksaan_balita_baduta_warga_id_idx" ON "pemeriksaan_balita_baduta"("warga_id");

-- CreateIndex
CREATE INDEX "riwayat_imunisasi_warga_id_idx" ON "riwayat_imunisasi"("warga_id");

-- CreateIndex
CREATE INDEX "pemeriksaan_bumil_warga_id_idx" ON "pemeriksaan_bumil"("warga_id");

-- CreateIndex
CREATE INDEX "pemeriksaan_pasca_persalinan_warga_id_idx" ON "pemeriksaan_pasca_persalinan"("warga_id");

-- CreateIndex
CREATE INDEX "pemeriksaan_lansia_warga_id_idx" ON "pemeriksaan_lansia"("warga_id");

-- CreateIndex
CREATE INDEX "pendataan_bulanan_posyandu_id_idx" ON "pendataan_bulanan"("posyandu_id");

-- CreateIndex
CREATE UNIQUE INDEX "pendataan_bulanan_posyandu_id_bulan_tahun_key" ON "pendataan_bulanan"("posyandu_id", "bulan", "tahun");

-- CreateIndex
CREATE INDEX "audit_log_posyandu_id_idx" ON "audit_log"("posyandu_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_ibu_id_fkey" FOREIGN KEY ("ibu_id") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_balita_baduta" ADD CONSTRAINT "pemeriksaan_balita_baduta_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_imunisasi" ADD CONSTRAINT "riwayat_imunisasi_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_bumil" ADD CONSTRAINT "pemeriksaan_bumil_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_pasca_persalinan" ADD CONSTRAINT "pemeriksaan_pasca_persalinan_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_lansia" ADD CONSTRAINT "pemeriksaan_lansia_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendataan_bulanan" ADD CONSTRAINT "pendataan_bulanan_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendataan_bulanan" ADD CONSTRAINT "pendataan_bulanan_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

