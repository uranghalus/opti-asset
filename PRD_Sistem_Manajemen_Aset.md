# Product Requirement Document (PRD)

## Sistem Manajemen Aset (Asset Management System)

**Versi:** 1.0
**Tanggal:** 23 Juli 2026
**Status:** Living Document — Draft untuk Review
**Pemilik Dokumen:** Product Owner / Tim Pengembangan Internal
**Klasifikasi:** Internal

---

## Riwayat Perubahan

| Versi | Tanggal     | Diubah oleh | Deskripsi Perubahan                                                                     |
| ----- | ----------- | ----------- | --------------------------------------------------------------------------------------- |
| 1.0   | 23 Jul 2026 | Tim Produk  | Draft awal PRD disusun dari problem statement, goals, user story, dan requirement awal. |
|       |             |             | _(catat perubahan berikutnya di sini — dokumen ini bersifat living document)_           |

---

## Daftar Isi

1. [Latar Belakang dan Problem Statement](#1-latar-belakang-dan-problem-statement)
2. [Tujuan dan Metrik Keberhasilan](#2-tujuan-dan-metrik-keberhasilan)
3. [Target Pengguna](#3-target-pengguna)
4. [Ruang Lingkup (Scope)](#4-ruang-lingkup-scope)
5. [Manajemen Status Aset](#5-manajemen-status-aset)
6. [User Stories](#6-user-stories)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Asumsi dan Batasan](#9-asumsi-dan-batasan)
10. [Risiko dan Mitigasi](#10-risiko-dan-mitigasi)
11. [Glosarium](#11-glosarium)
12. [Catatan Living Document](#12-catatan-living-document)

---

## 1. Latar Belakang dan Problem Statement

Saat ini, data aset organisasi masih disimpan dalam bentuk yang belum terkelola secara sistematis. Tidak ada mekanisme khusus untuk melacak riwayat perubahan data aset, sehingga setiap kali dilakukan pengecekan, tim pengelola harus mencari dokumen fisik (hardcopy) terlebih dahulu. Kondisi ini menyebabkan proses pengelolaan aset menjadi terganggu, tidak efisien, dan rentan terhadap ketidakakuratan data.

Diperlukan sebuah sistem digital yang mampu menyatukan pengelolaan data aset — mulai dari klasifikasi, status, hingga riwayat perubahannya — dalam satu platform yang terintegrasi, akurat, dan mudah ditelusuri.

---

## 2. Tujuan dan Metrik Keberhasilan

### 2.1 Tujuan (Goals)

Membangun pengelolaan data aset yang terpadu, mencakup tiga pilar utama:

- Pengelompokkan (klasifikasi) data aset secara terstruktur.
- Status aset yang valid dan selalu terkini.
- Riwayat (history) perubahan aset yang terdokumentasi secara lengkap dan dapat ditelusuri.

### 2.2 Metrik Keberhasilan

Keberhasilan pengelolaan data aset yang terpadu diukur dari persentase aset yang memenuhi ketiga aspek berikut secara bersamaan, dibandingkan dengan total aset yang dikelola:

- Aset telah terklasifikasi sesuai kategori yang benar.
- Aset memiliki status yang valid dan terkini.
- Aset memiliki riwayat perubahan yang terdokumentasi lengkap dan dapat ditelusuri.

> **Target:** minimal 95% aset memenuhi ketiga aspek di atas (terklasifikasi dengan benar, status akurat, dan histori lengkap serta dapat ditelusuri) dalam 3 bulan pertama pasca go-live.

---

## 3. Target Pengguna

| Kategori       | Peran                    | Deskripsi                                                                                                |
| -------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| End User       | Karyawan tiap department | Pemilik/pengguna data aset di unit kerja masing-masing; melihat dan mencari informasi aset yang relevan. |
| Stakeholder    | Super User (Root)        | Memiliki akses penuh atas seluruh modul sistem, termasuk konfigurasi dan manajemen pengguna.             |
| Stakeholder    | Staff Asset              | Memiliki akses untuk klasifikasi dan pengkodean aset, pengelolaan siklus hidup aset (mutasi, disposal).  |
| Stakeholder    | Manajemen                | Memantau kondisi, distribusi, dan status aset organisasi untuk pengambilan keputusan.                    |
| Stakeholder    | Auditor                  | Melakukan pengecekan fisik aset dan meninjau riwayat mutasi/disposal untuk kepatuhan.                    |
| Tim Pengembang | AI/Dev                   | Membangun aplikasi menggunakan pendekatan vibe coding (AI-assisted development).                         |

---

## 4. Ruang Lingkup (Scope)

### In Scope

- Manajemen Data Aset (CRUD Asset)
- Manajemen Klasifikasi Aset (CRUD Klasifikasi Asset)
- Manajemen Data Item Aset (CRUD Item)
- Pembuatan dan pengelolaan barcode untuk aset
- Pemindaian (scan) aset menggunakan barcode
- Pencarian dan filter data aset
- Mutasi aset antar lokasi, unit, atau pengguna
- Pengelolaan status aset
- Asset Disposal (penghapusan/pensiun aset)
- Pencatatan riwayat (history) aset — perubahan data, mutasi, dan disposal
- Dashboard ringkasan data aset
- Laporan data aset, mutasi aset, dan disposal aset
- Manajemen pengguna dan hak akses (role-based access)
- Audit trail aktivitas pengguna
- Multi-organisasi atau multi-tenant management

### Out of Scope

- Integrasi dengan sistem ERP, HRIS, atau sistem pihak ketiga lainnya
- Integrasi dengan perangkat IoT atau RFID untuk pelacakan aset otomatis
- Manajemen pengadaan (procurement) aset
- Manajemen pemeliharaan aset (preventive & corrective maintenance)
- Sistem peminjaman dan pengembalian aset
- Mobile application native (Android/iOS)
- Prediksi umur aset dan analitik berbasis AI
- Integrasi dengan sistem keuangan/akuntansi untuk depresiasi aset
- Notifikasi otomatis melalui email, WhatsApp, atau SMS
- Digital signature untuk proses persetujuan mutasi dan disposal

---

## 5. Manajemen Status Aset

Sistem mendukung siklus status aset berikut, yang diperbarui secara otomatis maupun manual sesuai proses bisnis yang berjalan:

| Status             | Deskripsi                                                                        | Kode |
| ------------------ | -------------------------------------------------------------------------------- | ---- |
| Aktif              | Aset tersedia dan digunakan dalam operasional normal.                            | ACT  |
| Dipinjamkan        | Aset sedang dipinjam/digunakan oleh unit atau pengguna tertentu.                 | LOAN |
| Dalam Perbaikan    | Aset sedang dalam proses perbaikan/maintenance dan tidak dapat digunakan.        | RPR  |
| Dimutasi           | Aset sedang dalam proses perpindahan lokasi/unit/pengguna.                       | MUT  |
| Dihapus (Disposed) | Aset telah dihapus/dipensiunkan dan tidak dapat digunakan dalam transaksi aktif. | DSP  |

---

## 6. User Stories

### 6.1 CRUD Asset

| Peran          | User Story                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| End User       | Aku mau melihat data aset supaya aku dapat mengetahui informasi aset yang tersedia.             |
| Pengelola Aset | Aku mau menambah, mengubah, dan menghapus data aset supaya data aset selalu akurat dan terkini. |
| Manajemen      | Aku mau melihat daftar aset supaya dapat memantau kondisi dan ketersediaan aset organisasi.     |

### 6.2 CRUD Klasifikasi Asset

| Peran          | User Story                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Pengelola Aset | Aku mau membuat dan mengelola klasifikasi aset supaya aset dapat dikelompokkan secara terstruktur.     |
| End User       | Aku mau melihat aset berdasarkan klasifikasi supaya lebih mudah menemukan aset yang dibutuhkan.        |
| Manajemen      | Aku mau melihat distribusi aset berdasarkan klasifikasi supaya memudahkan analisis dan pelaporan aset. |

### 6.3 CRUD Item

| Peran          | User Story                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Pengelola Aset | Aku mau mengelola data item aset supaya setiap aset memiliki informasi yang lengkap dan konsisten.                   |
| End User       | Aku mau melihat detail item aset supaya mengetahui spesifikasi dan informasi aset yang digunakan.                    |
| Manajemen      | Aku mau memantau data item aset supaya dapat mendukung pengambilan keputusan terkait pengadaan dan pengelolaan aset. |

### 6.4 Scan Asset Melalui Barcode

| Peran          | User Story                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| End User       | Aku mau memindai barcode aset supaya dapat memperoleh informasi aset secara cepat tanpa pencarian manual. |
| Pengelola Aset | Aku mau memindai barcode aset supaya proses verifikasi dan identifikasi aset menjadi lebih efisien.       |
| Auditor        | Aku mau memindai barcode aset supaya dapat melakukan pengecekan fisik aset dengan lebih akurat.           |

### 6.5 Mutasi Asset

| Peran          | User Story                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------- |
| Pengelola Aset | Aku mau mencatat mutasi aset supaya perpindahan aset antar lokasi atau unit dapat terlacak. |
| End User       | Aku mau mengetahui lokasi terkini aset supaya dapat menemukan aset yang dibutuhkan.         |
| Manajemen      | Aku mau melihat riwayat mutasi aset supaya dapat mengawasi pemanfaatan dan distribusi aset. |

### 6.6 Asset Disposal

| Peran          | User Story                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Pengelola Aset | Aku mau mencatat proses penghapusan aset supaya aset yang sudah tidak digunakan dapat terdokumentasi dengan baik.                |
| Manajemen      | Aku mau menyetujui penghapusan aset supaya proses disposal sesuai dengan kebijakan organisasi.                                   |
| Auditor        | Aku mau melihat riwayat penghapusan aset supaya dapat memastikan proses disposal dilakukan secara transparan dan terdokumentasi. |

### 6.7 User Story Umum Sistem

| Peran          | User Story                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| End User       | Aku mau mencari dan melihat informasi aset supaya dapat menggunakan aset yang tepat sesuai kebutuhan.                                       |
| Pengelola Aset | Aku mau mengelola seluruh siklus hidup aset mulai dari pencatatan, mutasi, hingga disposal supaya data aset selalu akurat dan terintegrasi. |
| Manajemen      | Aku mau memantau kondisi, lokasi, dan status aset supaya dapat mengambil keputusan yang tepat terkait pengelolaan aset organisasi.          |

---

## 7. Functional Requirements

### FR-01 — Manajemen Data Aset

| No.     | Deskripsi Requirement                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-01.1 | Sistem harus menyediakan fitur untuk menambah data aset baru.                                                                              |
| FR-01.2 | Sistem harus menyediakan fitur untuk melihat daftar aset.                                                                                  |
| FR-01.3 | Sistem harus menyediakan fitur untuk melihat detail aset.                                                                                  |
| FR-01.4 | Sistem harus menyediakan fitur untuk mengubah data aset.                                                                                   |
| FR-01.5 | Sistem harus menyediakan fitur untuk menghapus data aset.                                                                                  |
| FR-01.6 | Sistem harus menyimpan informasi aset seperti kode aset, nama aset, klasifikasi, lokasi, status, tanggal perolehan, dan informasi lainnya. |
| FR-01.7 | Sistem harus menghasilkan kode aset yang unik untuk setiap aset.                                                                           |

### FR-02 — Manajemen Klasifikasi Aset

| No.     | Deskripsi Requirement                                                       |
| ------- | --------------------------------------------------------------------------- |
| FR-02.1 | Sistem harus menyediakan fitur untuk menambah klasifikasi aset.             |
| FR-02.2 | Sistem harus menyediakan fitur untuk melihat daftar klasifikasi aset.       |
| FR-02.3 | Sistem harus menyediakan fitur untuk mengubah klasifikasi aset.             |
| FR-02.4 | Sistem harus menyediakan fitur untuk menghapus klasifikasi aset.            |
| FR-02.5 | Sistem harus menghubungkan setiap aset dengan satu klasifikasi yang sesuai. |

### FR-03 — Manajemen Item Aset

| No.     | Deskripsi Requirement                                                |
| ------- | -------------------------------------------------------------------- |
| FR-03.1 | Sistem harus menyediakan fitur untuk menambah data item aset.        |
| FR-03.2 | Sistem harus menyediakan fitur untuk melihat daftar item aset.       |
| FR-03.3 | Sistem harus menyediakan fitur untuk mengubah data item aset.        |
| FR-03.4 | Sistem harus menyediakan fitur untuk menghapus data item aset.       |
| FR-03.5 | Sistem harus menghubungkan item dengan klasifikasi aset yang sesuai. |

### FR-04 — Pencarian dan Filter Data

| No.     | Deskripsi Requirement                                                                    |
| ------- | ---------------------------------------------------------------------------------------- |
| FR-04.1 | Sistem harus menyediakan fitur pencarian aset berdasarkan nama, kode aset, atau barcode. |
| FR-04.2 | Sistem harus menyediakan filter berdasarkan klasifikasi, lokasi, dan status aset.        |
| FR-04.3 | Sistem harus menampilkan hasil pencarian secara cepat dan akurat.                        |

### FR-05 — Scan Asset Menggunakan Barcode

| No.     | Deskripsi Requirement                                                           |
| ------- | ------------------------------------------------------------------------------- |
| FR-05.1 | Sistem harus menghasilkan barcode untuk setiap aset.                            |
| FR-05.2 | Sistem harus menyediakan fitur pemindaian barcode aset.                         |
| FR-05.3 | Sistem harus menampilkan informasi aset berdasarkan hasil pemindaian barcode.   |
| FR-05.4 | Sistem harus memvalidasi barcode yang dipindai dengan data aset yang tersimpan. |

### FR-06 — Mutasi Aset

| No.     | Deskripsi Requirement                                                          |
| ------- | ------------------------------------------------------------------------------ |
| FR-06.1 | Sistem harus menyediakan fitur pencatatan mutasi aset.                         |
| FR-06.2 | Sistem harus mencatat lokasi asal dan lokasi tujuan mutasi aset.               |
| FR-06.3 | Sistem harus mencatat tanggal mutasi aset.                                     |
| FR-06.4 | Sistem harus mencatat pengguna yang melakukan mutasi aset.                     |
| FR-06.5 | Sistem harus memperbarui lokasi aset secara otomatis setelah mutasi disetujui. |
| FR-06.6 | Sistem harus menyimpan riwayat mutasi aset.                                    |

### FR-07 — Asset Disposal (Penghapusan Aset)

| No.     | Deskripsi Requirement                                                                       |
| ------- | ------------------------------------------------------------------------------------------- |
| FR-07.1 | Sistem harus menyediakan fitur pengajuan penghapusan aset.                                  |
| FR-07.2 | Sistem harus mencatat alasan penghapusan aset.                                              |
| FR-07.3 | Sistem harus mencatat tanggal penghapusan aset.                                             |
| FR-07.4 | Sistem harus mengubah status aset menjadi "Disposed" atau "Dihapus" setelah proses selesai. |
| FR-07.5 | Sistem harus menyimpan riwayat penghapusan aset.                                            |
| FR-07.6 | Sistem harus mencegah aset yang telah dihapus digunakan dalam transaksi aktif.              |

### FR-08 — Riwayat Aset (Asset History)

| No.     | Deskripsi Requirement                                                |
| ------- | -------------------------------------------------------------------- |
| FR-08.1 | Sistem harus mencatat seluruh aktivitas aset.                        |
| FR-08.2 | Sistem harus menyimpan riwayat perubahan data aset.                  |
| FR-08.3 | Sistem harus menyimpan riwayat mutasi aset.                          |
| FR-08.4 | Sistem harus menyimpan riwayat disposal aset.                        |
| FR-08.5 | Sistem harus menampilkan riwayat aset berdasarkan aset yang dipilih. |

### FR-09 — Manajemen Status Aset

| No.     | Deskripsi Requirement                                                                             |
| ------- | ------------------------------------------------------------------------------------------------- |
| FR-09.1 | Sistem harus menyediakan pengelolaan status aset.                                                 |
| FR-09.2 | Sistem harus mendukung status seperti Aktif, Dipinjamkan, Dalam Perbaikan, Dimutasi, dan Dihapus. |
| FR-09.3 | Sistem harus memperbarui status aset sesuai proses bisnis yang dilakukan.                         |

### FR-10 — Dashboard dan Pelaporan

| No.     | Deskripsi Requirement                                                   |
| ------- | ----------------------------------------------------------------------- |
| FR-10.1 | Sistem harus menampilkan jumlah aset berdasarkan klasifikasi.           |
| FR-10.2 | Sistem harus menampilkan jumlah aset berdasarkan status.                |
| FR-10.3 | Sistem harus menampilkan jumlah aset berdasarkan lokasi.                |
| FR-10.4 | Sistem harus menyediakan laporan mutasi aset.                           |
| FR-10.5 | Sistem harus menyediakan laporan disposal aset.                         |
| FR-10.6 | Sistem harus menyediakan fitur ekspor laporan ke format Excel atau PDF. |

### FR-11 — Manajemen Pengguna dan Hak Akses

| No.     | Deskripsi Requirement                                          |
| ------- | -------------------------------------------------------------- |
| FR-11.1 | Sistem harus menyediakan autentikasi pengguna.                 |
| FR-11.2 | Sistem harus mendukung manajemen peran (role) pengguna.        |
| FR-11.3 | Sistem harus membatasi akses fitur berdasarkan peran pengguna. |
| FR-11.4 | Sistem harus mencatat aktivitas pengguna dalam audit log.      |

### FR-12 — Audit Trail

| No.     | Deskripsi Requirement                                               |
| ------- | ------------------------------------------------------------------- |
| FR-12.1 | Sistem harus mencatat aktivitas tambah, ubah, dan hapus data.       |
| FR-12.2 | Sistem harus mencatat waktu aktivitas dilakukan.                    |
| FR-12.3 | Sistem harus mencatat pengguna yang melakukan aktivitas.            |
| FR-12.4 | Sistem harus menyediakan fitur pencarian dan penelusuran audit log. |

---

## 8. Non-Functional Requirements

### NFR-01 — Performance (Kinerja)

| No.      | Deskripsi Requirement                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| NFR-01.1 | Sistem harus mampu menampilkan data aset dalam waktu maksimal 3 detik untuk pencarian dan pengambilan data normal. |
| NFR-01.2 | Sistem harus mampu memproses hasil pemindaian barcode dalam waktu maksimal 2 detik.                                |
| NFR-01.3 | Sistem harus mampu menangani minimal 100 pengguna aktif secara bersamaan tanpa penurunan performa yang signifikan. |
| NFR-01.4 | Sistem harus mampu menangani penyimpanan dan pengelolaan minimal 10.000 data aset.                                 |

### NFR-02 — Availability (Ketersediaan)

| No.      | Deskripsi Requirement                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- |
| NFR-02.1 | Sistem harus tersedia (availability) minimal 99% selama jam operasional.                        |
| NFR-02.2 | Sistem harus dapat diakses melalui jaringan internal maupun internet sesuai hak akses pengguna. |
| NFR-02.3 | Sistem harus memiliki mekanisme backup data secara berkala.                                     |

### NFR-03 — Reliability (Keandalan)

| No.      | Deskripsi Requirement                                                                       |
| -------- | ------------------------------------------------------------------------------------------- |
| NFR-03.1 | Sistem harus menjamin konsistensi data saat proses tambah, ubah, mutasi, dan disposal aset. |
| NFR-03.2 | Sistem harus mampu melakukan pemulihan data dari backup jika terjadi kegagalan sistem.      |
| NFR-03.3 | Sistem harus mencegah kehilangan data akibat kegagalan proses transaksi.                    |

### NFR-04 — Security (Keamanan)

| No.      | Deskripsi Requirement                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| NFR-04.1 | Sistem harus menerapkan autentikasi pengguna sebelum mengakses aplikasi.                                                     |
| NFR-04.2 | Sistem harus menerapkan otorisasi berbasis peran (Role-Based Access Control/RBAC).                                           |
| NFR-04.3 | Sistem harus mengenkripsi komunikasi data menggunakan protokol HTTPS/TLS.                                                    |
| NFR-04.4 | Sistem harus mencatat seluruh aktivitas penting pengguna dalam audit trail.                                                  |
| NFR-04.5 | Sistem harus melindungi data dari akses tidak sah dan serangan umum aplikasi web (SQL Injection, XSS, CSRF, dan sejenisnya). |

### NFR-05 — Usability (Kemudahan Penggunaan)

| No.      | Deskripsi Requirement                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| NFR-05.1 | Antarmuka sistem harus mudah dipahami dan digunakan oleh pengguna non-teknis.              |
| NFR-05.2 | Pengguna harus dapat mengakses fungsi utama sistem dengan maksimal 3 klik dari menu utama. |
| NFR-05.3 | Sistem harus menyediakan pesan kesalahan dan notifikasi yang informatif.                   |
| NFR-05.4 | Sistem harus mendukung penggunaan pada perangkat desktop, laptop, tablet, dan smartphone.  |

### NFR-06 — Compatibility (Kompatibilitas)

| No.      | Deskripsi Requirement                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| NFR-06.1 | Sistem harus dapat berjalan pada browser modern seperti Google Chrome, Microsoft Edge, Mozilla Firefox, dan Safari. |
| NFR-06.2 | Sistem harus mendukung pembacaan barcode dari kamera perangkat maupun scanner barcode eksternal.                    |
| NFR-06.3 | Sistem harus dapat diintegrasikan dengan sistem lain melalui API jika diperlukan.                                   |

### NFR-07 — Scalability (Skalabilitas)

| No.      | Deskripsi Requirement                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-07.1 | Sistem harus dapat dikembangkan untuk menangani pertambahan jumlah aset, pengguna, dan transaksi tanpa perubahan arsitektur yang signifikan. |
| NFR-07.2 | Sistem harus mendukung penambahan modul atau fitur baru di masa mendatang.                                                                   |

### NFR-08 — Maintainability (Kemudahan Pemeliharaan)

| No.      | Deskripsi Requirement                                                                     |
| -------- | ----------------------------------------------------------------------------------------- |
| NFR-08.1 | Kode program harus mengikuti standar pengembangan yang terdokumentasi.                    |
| NFR-08.2 | Sistem harus memiliki dokumentasi teknis dan dokumentasi pengguna.                        |
| NFR-08.3 | Perubahan atau pembaruan sistem harus dapat dilakukan tanpa mengganggu operasional utama. |
| NFR-08.4 | Sistem harus mendukung proses monitoring dan troubleshooting.                             |

### NFR-09 — Auditability (Audit dan Pelacakan)

| No.      | Deskripsi Requirement                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| NFR-09.1 | Sistem harus menyimpan log aktivitas pengguna minimal selama 1 tahun.                      |
| NFR-09.2 | Sistem harus menyediakan riwayat perubahan data aset yang dapat ditelusuri.                |
| NFR-09.3 | Sistem harus mampu menampilkan informasi siapa, kapan, dan apa yang diubah pada data aset. |

### NFR-10 — Data Integrity (Integritas Data)

| No.      | Deskripsi Requirement                                                                         |
| -------- | --------------------------------------------------------------------------------------------- |
| NFR-10.1 | Setiap aset harus memiliki identitas unik yang tidak boleh duplikat.                          |
| NFR-10.2 | Sistem harus memvalidasi data sebelum disimpan ke dalam database.                             |
| NFR-10.3 | Sistem harus menjaga konsistensi relasi antara aset, klasifikasi, item, mutasi, dan disposal. |

### NFR-11 — Backup dan Recovery

| No.      | Deskripsi Requirement                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| NFR-11.1 | Sistem harus melakukan backup database secara otomatis minimal 1 kali per hari.                |
| NFR-11.2 | Sistem harus menyediakan mekanisme restore data dari backup.                                   |
| NFR-11.3 | Waktu pemulihan sistem (Recovery Time Objective/RTO) maksimal 4 jam setelah terjadi kegagalan. |

### NFR-12 — Compliance (Kepatuhan)

| No.      | Deskripsi Requirement                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| NFR-12.1 | Sistem harus mengikuti kebijakan dan prosedur pengelolaan aset yang berlaku di organisasi.                    |
| NFR-12.2 | Sistem harus mendukung penyimpanan data historis untuk kebutuhan audit dan pelaporan.                         |
| NFR-12.3 | Sistem harus menjaga kerahasiaan, integritas, dan ketersediaan data sesuai standar tata kelola TI organisasi. |

---

## 9. Asumsi dan Batasan

### 9.1 Asumsi

- Setiap aset organisasi dapat diberikan kode unik dan barcode fisik yang dapat ditempelkan pada aset.
- Pengguna memiliki perangkat (komputer, tablet, atau smartphone) dengan akses kamera untuk pemindaian barcode.
- Data aset eksisting (hardcopy) akan dimigrasikan secara bertahap ke dalam sistem oleh tim pengelola aset.
- Struktur klasifikasi aset dan daftar lokasi/unit organisasi sudah/akan disepakati sebelum implementasi.
- Koneksi internet/jaringan internal tersedia secara stabil di seluruh lokasi pengguna.

### 9.2 Batasan

- Sistem dikembangkan sebagai aplikasi web (bukan aplikasi mobile native) pada fase ini.
- Sistem tidak mencakup proses pengadaan, pemeliharaan preventif/korektif, maupun peminjaman-pengembalian aset.
- Sistem tidak melakukan integrasi otomatis dengan sistem keuangan/akuntansi untuk perhitungan depresiasi aset.
- Sistem bersifat single-tenant, hanya untuk satu organisasi dalam fase ini.

---

## 10. Risiko dan Mitigasi

| Risiko                                                           | Dampak                                                             | Mitigasi                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Data aset eksisting (hardcopy) tidak lengkap/akurat saat migrasi | Data awal di sistem tidak akurat, menghambat pencapaian target 95% | Verifikasi fisik bertahap (opname aset) saat proses migrasi data |
| Resistensi pengguna terhadap perubahan proses manual ke digital  | Adopsi sistem rendah, proses tetap menggunakan cara lama           | Pelatihan (training) dan sosialisasi bertahap ke seluruh unit    |
| Barcode fisik rusak/hilang pada aset                             | Aset tidak dapat diidentifikasi cepat via scan                     | Fitur pencarian manual (nama/kode aset) sebagai alternatif scan  |
| Kesalahan pemberian hak akses (role) pengguna                    | Risiko keamanan data dan penyalahgunaan akses                      | RBAC yang ketat dan audit trail atas seluruh aktivitas pengguna  |

---

## 11. Glosarium

| Istilah          | Definisi                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Aset             | Barang atau sumber daya milik organisasi yang dikelola dan dicatat dalam sistem.           |
| Klasifikasi Aset | Pengelompokan aset berdasarkan kategori tertentu (misal: elektronik, furnitur, kendaraan). |
| Item Aset        | Detail spesifikasi/atribut dari suatu aset.                                                |
| Mutasi Aset      | Proses perpindahan aset antar lokasi, unit, atau pengguna.                                 |
| Disposal Aset    | Proses penghapusan/pensiun aset yang sudah tidak digunakan.                                |
| Barcode          | Kode unik dalam bentuk visual yang digunakan untuk identifikasi cepat suatu aset.          |
| RBAC             | Role-Based Access Control — pembatasan akses fitur sistem berdasarkan peran pengguna.      |
| Audit Trail      | Catatan aktivitas pengguna (tambah/ubah/hapus) beserta waktu dan pelaku aktivitas.         |
| Super User       | Pengguna dengan akses penuh (root) atas seluruh modul dan konfigurasi sistem.              |
| Vibe Coding      | Pendekatan pengembangan aplikasi dengan bantuan AI (AI-assisted development).              |

---

## 12. Catatan Living Document

Dokumen ini bersifat living document. Setiap perubahan, penambahan, atau penyesuaian requirement wajib dicatat pada tabel **Riwayat Perubahan** di bagian awal dokumen ini, lengkap dengan versi, tanggal, penanggung jawab, dan deskripsi perubahan.
