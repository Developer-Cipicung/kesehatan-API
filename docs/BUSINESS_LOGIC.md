# BUSINESS_LOGIC.md

# Logika Bisnis Posyandu

Dokumen ini menjelaskan aturan bisnis (business rules) dan alur sistem Posyandu menggunakan bahasa manusia, berfokus pada sisi domain bisnis tanpa mencampuradukkan detail teknis implementasi database.

Sasaran pembaca dokumen ini adalah developer, agen AI, dan maintainer masa depan yang perlu memahami **MENGAPA** sistem didesain sedemikian rupa sebelum mengembangkan atau memodifikasi fitur baru.

---

## 1. Tujuan Sistem

Sistem Digitalisasi Posyandu bertujuan untuk menggantikan proses pencatatan kesehatan manual (berbasis kertas atau buku register) menjadi sistem digital yang terpusat.

Dalam alur dunia nyata, kader Posyandu secara rutin mengumpulkan data penimbangan balita, pemantauan ibu hamil, lansia, dll. pada hari buka Posyandu setiap bulan. Sistem ini mendigitalisasi proses tersebut untuk mencegah hilangnya data fisik, memudahkan pelacakan rekam medis secara historis, dan memfasilitasi pelaporan atau agregasi statistik (dashboard) secara real-time ke tingkat yang lebih tinggi.

---

## 2. Aktor Sistem

- **Kader Posyandu**: Petugas lapangan (pengguna utama aplikasi) yang bertugas melakukan pendaftaran warga, mencatat hasil pemeriksaan kesehatan, dan menyelesaikan serta mengunci laporan bulanan. Masing-masing kader terikat pada satu Posyandu tertentu.
- **Warga**: Penduduk atau pasien yang terdaftar di suatu Posyandu dan menjadi subjek pemeriksaan (Balita, Ibu Hamil, Lansia, dll). Warga bukan pengguna sistem (tidak memiliki akun login), melainkan entitas bisnis yang dikelola oleh Kader.
- **Posyandu**: Unit pelayanan kesehatan di tingkat wilayah (seperti RW atau Desa) yang menaungi kader dan melayani warga di wilayah teritorialnya.

---

## 3. Entitas Bisnis

- **Posyandu**: Master entitas pusat organisasi. Setiap data warga dan pemeriksaan terikat pada satu Posyandu tertentu untuk menjaga privasi dan batasan wilayah kerja (tenant isolation).
- **User/Kader**: Akun otentikasi yang digunakan oleh kader untuk masuk ke dalam sistem. User terhubung langsung dengan Posyandu tempatnya bertugas.
- **Warga**: Master data individu. Satu warga memiliki satu identitas unik (berbasis NIK), terlepas dari apakah ia diperiksa sebagai Balita, Ibu Hamil, atau Lansia. Identitas ini menjadi poros bagi semua riwayat kesehatannya.
- **Pemeriksaan**: Catatan historis kondisi kesehatan warga pada suatu tanggal kunjungan (seperti berat badan, tensi, tinggi fundus, dsb).
- **Riwayat Imunisasi**: Catatan vaksinasi spesifik yang pernah diterima oleh seorang anak.
- **Pendataan Bulanan**: Status pelaporan administratif yang menandakan apakah rekapitulasi data pemeriksaan untuk suatu kategori pada bulan tertentu sudah dianggap "Selesai" (ditutup) oleh Posyandu atau masih dalam pengerjaan ("Draft").

---

## 4. Kategori Layanan Posyandu

- **Balita / Baduta (Bawah Lima Tahun / Bawah Dua Tahun)**
  - **Siapa yang masuk**: Anak-anak.
  - **Kriteria**: Usia mulai dari baru lahir hingga sebelum genap 5 tahun.
  - **Kapan masuk**: Sejak anak lahir dan didaftarkan di Posyandu.
  - **Kapan keluar**: Secara otomatis keluar dari kategori ini ketika usia melewati batas 5 tahun.

- **Ibu Hamil (Bumil)**
  - **Siapa yang masuk**: Wanita yang sedang dalam masa mengandung.
  - **Kriteria**: Kondisi medis (kehamilan).
  - **Kapan masuk**: Saat warga atau kader melaporkan kehamilan pertama kali (tercatatnya Hari Pertama Haid Terakhir - HPHT).
  - **Kapan keluar**: Setelah kehamilan berakhir (persalinan), di mana ia akan berpindah ke layanan Pasca Persalinan.

- **Ibu Pasca Persalinan**
  - **Siapa yang masuk**: Wanita yang baru saja melahirkan (masa nifas).
  - **Kriteria**: Kondisi medis pasca melahirkan.
  - **Kapan masuk**: Segera setelah persalinan selesai.
  - **Kapan keluar**: Setelah masa nifas dan pemantauan kondisi ibu stabil (sesuai standar waktu nifas).

- **Lansia (Lanjut Usia)**
  - **Siapa yang masuk**: Warga berusia lanjut.
  - **Kriteria**: Telah mencapai usia lansia (umumnya didefinisikan 60 tahun ke atas).
  - **Kapan masuk**: Saat kriteria usianya memenuhi syarat.
  - **Kapan keluar**: Hanya keluar ketika warga meninggal dunia atau pindah domisili secara permanen.

---

## 5. Alur Pendataan Bulanan

Proses pencatatan rutin setiap bulan mengikuti alur berikut:

1. **Pendataan Dibuka**: Setiap masuk bulan baru, status pendataan berada dalam kondisi *Draft*.
2. **Kader Memilih Kategori**: Kader membuka menu layanan yang sedang dikerjakan (misalnya, meja pemeriksaan Balita).
3. **Melihat Daftar Warga**: Sistem menampilkan daftar warga yang memenuhi syarat untuk kategori tersebut.
4. **Menambah / Mengubah Pemeriksaan**: Kader memasukkan data hasil timbang, ukur, dan observasi kesehatan berdasarkan kunjungan riil hari itu.
5. **Mengulangi**: Kader terus menginput atau mengubah data hingga seluruh antrean warga di Posyandu pada bulan tersebut selesai dicatat.
6. **Klik "Tandai Pendataan Selesai"**: Di akhir bulan atau setelah hari buka Posyandu usai, kader menekan penyelesaian.
7. **Status Menjadi SELESAI**: Sistem mengubah status pendataan bulan tersebut dari *Draft* ke *Selesai*.
8. **Penguncian Data (Locking)**: Seluruh data pemeriksaan untuk kategori tersebut pada bulan ini dikunci secara permanen.

---

## 6. Locking Rules

Aturan penguncian (Locking Rules) mengatur modifikasi data bergantung pada status administratif bulan tersebut:

- **Status Draft**:
  - Artinya periode bulan ini masih terbuka dan kader masih aktif mengumpulkan data.
  - **Create (Buat)**: Diizinkan (Kader bisa menambah pemeriksaan baru).
  - **Update (Ubah)**: Diizinkan (Kader bisa memperbaiki *typo* atau data yang salah).
  - **Delete (Hapus)**: Diizinkan (Kader bisa menghapus record jika ternyata salah sasaran).

- **Status Selesai**:
  - Artinya laporan bulan ini telah final dan siap diajukan/dianggap sah.
  - **Create**: TIDAK DIIZINKAN.
  - **Update**: TIDAK DIIZINKAN.
  - **Delete**: TIDAK DIIZINKAN.

**Kewajiban Sistem**: Aturan penguncian **wajib dan selalu** dipertahankan oleh Backend. Frontend (UI) tidak boleh dipercaya sebagai satu-satunya sistem pelindung. API harus menolak setiap perubahan (HTTP 409 Conflict) jika status pelaporan telah *Selesai*.

---

## 7. Aturan Pemeriksaan

- **Satu warga memiliki banyak pemeriksaan**: Data pemeriksaan adalah entitas *one-to-many* dari Warga. 
- **Pemeriksaan bersifat Catatan Historis (Historical Records)**: Data pemeriksaan bulan sebelumnya tidak pernah ditimpa (overwritten) oleh pemeriksaan bulan ini.
- **Keterikatan Waktu**: Setiap record pemeriksaan harus memiliki "Tanggal Kunjungan" yang sah untuk merepresentasikan kondisi fisik pasien pada hari itu.
- **Preservasi Sejarah**: Riwayat masa lalu dibiarkan utuh agar grafik pertumbuhan dan tren medis pasien dapat dipantau dari waktu ke waktu.

---

## 8. Riwayat Imunisasi

- **Pemisahan dari Pemeriksaan Reguler**: Imunisasi tidak disimpan di dalam satu kesatuan tabel Pemeriksaan Balita.
- **Alasan Bisnis**: Imunisasi adalah intervensi medis khusus yang tujuannya adalah pencapaian kekebalan tubuh (perlindungan jangka panjang), bukan metrik observasi rutin seperti berat badan. Dalam satu kali kunjungan (satu tanggal), seorang balita bisa saja ditimbang namun tidak disuntik (nol imunisasi), disuntik satu vaksin, atau menerima dua jenis vaksin sekaligus (multiple immunizations).
- Karena kardinalitas kejadian vaksin dan penimbangan tidak selalu berbanding 1:1, riwayat imunisasi harus berdiri mandiri sebagai catatan hidup sang anak.

---

## 9. Penentuan Kategori

- **Pendekatan Kategori Berbasis Logika**: Kategori layanan (Balita, Lansia, dll) ditentukan dan dihitung secara *on-the-fly*, **tidak** disimpan secara permanen sebagai kolom atau atribut statis di dalam profil Warga.
- **Alasan Bisnis**: 
  - Kategori berbasis umur (Balita, Lansia) bertambah seiring berjalannya waktu. Menyimpan status "Balita" di profil warga akan membuat data tersebut cepat kedaluwarsa (stale). Jika sistem tidak memperbaruinya tepat pada hari ulang tahun ke-5, data tersebut menjadi cacat.
  - Dengan menghitung umur secara dinamis (berdasarkan Tanggal Lahir), warga akan otomatis masuk ke kategori Lansia atau otomatis keluar dari Balita tanpa perlu aksi pembaharuan database sama sekali.
  - Untuk Bumil dan Pasca Persalinan, kategorinya dipicu oleh ada/tidaknya kondisi medis temporer.

---

## 10. Dashboard Logic

Dashboard menyajikan statistik agregat dengan makna bisnis sebagai berikut:

- **Total Warga**: Total populasi unik yang terdaftar di bawah pengawasan Posyandu tersebut.
- **Jumlah Balita / Jumlah Bumil / Jumlah Lansia**: Menampilkan jumlah warga yang saat ini (hari ini) secara kriteria aktif masuk dalam kategori layanan tersebut. Berguna bagi kader untuk mengetahui jumlah target sasaran.
- **Status Pendataan Bulan Ini**: Indikator *Draft* vs *Selesai* untuk setiap layanan. Berfungsi sebagai daftar tugas (to-do list) bagi kader, sehingga mereka tahu laporan mana yang belum selesai ditutup pada bulan berjalan.

---

## 11. Business Rules

Aturan bisnis inti yang mengikat sistem:

- **Isolasi Tenant**: Setiap Posyandu dan kader yang beroperasi di dalamnya hanya dapat melihat, mengubah, dan menambah warga serta pemeriksaan yang berada di bawah otoritas Posyandu tersebut.
- **Kekekalan Data Pasca-Laporan**: Riwayat pemeriksaan tidak bisa dihapus, diubah, atau dimanipulasi setelah status pendataan bulanan dinyatakan Selesai.
- **Laporan Unik**: Setiap Posyandu hanya menyerahkan satu status penyelesaian untuk tiap kategori di setiap bulan (contoh: Laporan Lansia Posyandu Cipicung bulan Juli hanya ada satu status).
- **Riwayat Konsisten**: Walaupun kondisi seorang warga berubah (misalnya Ibu Hamil berubah menjadi Ibu Pasca Persalinan), data kunjungan lamanya sewaktu ia masih hamil harus tetap ada dan dapat dilacak.
- **Validasi Data Inti**: Sistem tidak menerima data yang mustahil (misal: tekanan darah negatif, tanggal kunjungan di masa depan).

---

## 12. Design Decisions

Bagian ini mendokumentasikan keputusan arsitektur bisnis yang penting beserta alasannya.

**DD-001: Balita dan Baduta Disatukan**
- **Problem**: Haruskah pemeriksaan anak di bawah lima tahun (Balita) dan anak di bawah dua tahun (Baduta) dipisah tabel?
- **Decision**: Disatukan dalam satu struktur pemeriksaan.
- **Reasoning**: Parameter medis yang diukur identik (Berat Badan, Tinggi Badan, Lingkar Kepala). Memisahkan tabel akan membuat kode duplikat, padahal perbedaannya hanyalah urusan filter umur saat pelaporan statistik.
- **Consequences**: Query pada Dashboard atau Laporan harus secara cerdas mem-filter rentang umur dari tanggal lahir jika hanya ingin melihat metrik khusus Baduta.

**DD-002: Imunisasi Terpisah Dari Pemeriksaan**
- **Problem**: Imunisasi biasanya diberikan saat kunjungan Posyandu rutin. Bolehkah dijadikan satu kolom di pemeriksaan?
- **Decision**: Tidak boleh, harus tabel `riwayat_imunisasi` tersendiri.
- **Reasoning**: Satu anak dapat menerima beberapa vaksin sekaligus dalam sehari.
- **Consequences**: Hubungan data ditarik dari Warga ke Imunisasi, bukan dari Pemeriksaan ke Imunisasi.

**DD-003: Tabel Pendataan Bulanan**
- **Problem**: Bagaimana kita tahu apakah laporan Posyandu bulan ini sudah rampung atau kader baru setengah jalan input data?
- **Decision**: Diciptakan entitas `pendataan_bulanan` (sebagai state-machine administratif).
- **Reasoning**: Memfasilitasi alur kerja birokrasi nyata di mana "buku register ditutup". Entitas ini tidak menampung data medis, tetapi menampung status birokrasi.
- **Consequences**: Memerlukan validasi tambahan di setiap titik API penyimpanan/pengubahan data.

**DD-004: Kategori Warga Tidak Disimpan Secara Fisik**
- **Problem**: Kebutuhan mengklasifikasikan warga.
- **Decision**: Kategori ditentukan secara logika (calculated on read).
- **Reasoning**: Mencegah *stale data* karena penuaan usia berjalan otomatis tiap hari.
- **Consequences**: Warga bisa tidak muncul di daftar Balita jika input tanggal lahir salah sejak awal.

**DD-005: Kader Diikat Ke Posyandu**
- **Problem**: Arsitektur keamanan data multi-Posyandu menggunakan satu database.
- **Decision**: Setiap `User` memiliki `posyandu_id`. Identitas ini diteruskan otomatis (inject) di backend.
- **Reasoning**: Kader tidak boleh memanipulasi parameter di URL atau JSON payload untuk mengubah data Posyandu tetangga.
- **Consequences**: Payload request dari *client* tidak perlu menyertakan field `posyandu_id` sama sekali.

---

## 13. Future Business Rules

Aturan bisnis berikut saat ini di luar cakupan MVP (Minimum Viable Product), namun perlu didesain dengan pertimbangan pengembangannya kelak:

- **Multi-Role & Approval**: Hadirnya peran seperti *Bidan* atau *Puskesmas* yang bertugas mereview dan memberikan *Approval* atas data yang di-*Selesai*-kan oleh kader.
- **Reopen Period (Unlocking)**: Mekanisme di mana Supervisor dapat membuka kembali (Draft) periode yang telah dikunci jika kader mengajukan koreksi kesalahan data medis historis.
- **Mutasi Warga**: Jika warga berpindah RW/Posyandu, sejarah kesehatannya harus tetap utuh dan berpindah otoritas baca-tulisnya ke Posyandu yang baru.
- **Audit Trail yang Ketat**: Pencatatan siapa mengubah data apa dan kapan, terutama pada rekam medis untuk mematuhi regulasi kesehatan digital.
- **Tingkatan Hierarki Pelaporan**: Fitur merekap seluruh data Posyandu di satu kelurahan/kecamatan untuk dilaporkan secara kumulatif.

---

## 14. Catatan dan Asumsi

- **Transisi Manual Bumil ke Pasca Persalinan**: Belum ada trigger otomatis yang mendeteksi kapan persisnya seorang Ibu Hamil telah melahirkan untuk memindahkan antreannya ke Pasca Persalinan. Diasumsikan kader mengetahui fakta persalinan ini di lapangan dan secara mandiri mulai mendaftarkan pemeriksaan di menu Pasca Persalinan.
- **Kesalahan Umur Demografis**: Perhitungan sistem yang mengandalkan usia bersifat absolut berdasarkan entri `tanggal_lahir`. Kesalahan input di awal pendaftaran akan menghasilkan klasifikasi warga yang fatal (misal: bayi berumur 25 tahun), yang hanya bisa diatasi dengan melakukan update pada `tanggal_lahir` di data Warga.
