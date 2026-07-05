-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "KategoriPendataan" AS ENUM ('balita', 'imunisasi', 'bumil', 'pasca_persalinan', 'lansia');

-- CreateEnum
CREATE TYPE "StatusPendataan" AS ENUM ('draft', 'selesai');

-- CreateTable
CREATE TABLE "posyandu" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posyandu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warga" (
    "id" UUID NOT NULL,
    "posyandu_id" UUID NOT NULL,
    "nomor" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_balita_baduta" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "bb" DECIMAL(5,2) NOT NULL,
    "tb" DECIMAL(5,2) NOT NULL,
    "lingkar_kepala" DECIMAL(5,2) NOT NULL,
    "lingkar_lengan_atas" DECIMAL(5,2) NOT NULL,
    "nama_ortu" TEXT NOT NULL,
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
    "bb" DECIMAL(5,2) NOT NULL,
    "tb" DECIMAL(5,2) NOT NULL,
    "lingkar_perut" DECIMAL(5,2) NOT NULL,
    "lingkar_lengan_atas" DECIMAL(5,2) NOT NULL,
    "usia_kehamilan_minggu" INTEGER NOT NULL,
    "hpht" DATE NOT NULL,
    "htp" DATE NOT NULL,
    "tekanan_darah_sistolik" INTEGER NOT NULL,
    "tekanan_darah_diastolik" INTEGER NOT NULL,
    "tinggi_fundus" DECIMAL(5,2) NOT NULL,
    "denyut_jantung_janin" INTEGER NOT NULL,
    "hemoglobin" DECIMAL(5,2) NOT NULL,
    "keluhan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_bumil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_pasca_persalinan" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "tanggal_persalinan" DATE NOT NULL,
    "bb" DECIMAL(5,2) NOT NULL,
    "tekanan_darah_sistolik" INTEGER NOT NULL,
    "tekanan_darah_diastolik" INTEGER NOT NULL,
    "suhu_tubuh" DECIMAL(4,2) NOT NULL,
    "kondisi_ibu" TEXT,
    "keluhan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_pasca_persalinan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_lansia" (
    "id" UUID NOT NULL,
    "warga_id" UUID NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "bb" DECIMAL(5,2) NOT NULL,
    "tb" DECIMAL(5,2) NOT NULL,
    "tekanan_darah_sistolik" INTEGER NOT NULL,
    "tekanan_darah_diastolik" INTEGER NOT NULL,
    "gula_darah_sewaktu" INTEGER NOT NULL,
    "keluhan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_lansia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendataan_bulanan" (
    "id" UUID NOT NULL,
    "posyandu_id" UUID NOT NULL,
    "kategori" "KategoriPendataan" NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "status" "StatusPendataan" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "submitted_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendataan_bulanan_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "pendataan_bulanan_posyandu_id_kategori_bulan_tahun_key" ON "pendataan_bulanan"("posyandu_id", "kategori", "bulan", "tahun");

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_balita_baduta" ADD CONSTRAINT "pemeriksaan_balita_baduta_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_imunisasi" ADD CONSTRAINT "riwayat_imunisasi_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_bumil" ADD CONSTRAINT "pemeriksaan_bumil_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_pasca_persalinan" ADD CONSTRAINT "pemeriksaan_pasca_persalinan_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_lansia" ADD CONSTRAINT "pemeriksaan_lansia_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendataan_bulanan" ADD CONSTRAINT "pendataan_bulanan_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
