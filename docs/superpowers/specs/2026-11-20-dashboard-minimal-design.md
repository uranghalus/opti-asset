# Dashboard Minimal – Design

## Intent & Why
Enduser meminta dashboard hanya menampilkan bagian penting saja dan tidak ada scroll pada halaman dashboard. Mengurangi kebisingan visual dan fokus pada aksi operasional harian.

## Goals
- Halaman dashboard muat tanpa scroll di viewport desktop default.
- Fokus pada urgensi: KPI, approval, peringatan garansi.
- Bahasa card lebih mudah dipahami.

## Non-goals / Anti-goals
- Tidak menambah fitur baru atau sparkline.
- Tidak mengubah kontrak data DashboardController.

## Constraints
- Tetap menggunakan komponen existing FluxUI / Register*.
- Tidak mengubah rute atau API.

## Approaches yang dipertimbangkan
1. Ultra minimal – hanya Masthead + Strip KPI + Approval.
2. Prioritas operasional + ringkasan status.
3. Tabbed collapsible.

Dipilih: varian prioritas operasional disesuaikan dengan permintaan penghapusan spesifik.

## Perubahan Spesifik

### Layout
- `resources/js/pages/dashboard.tsx`
  - Hapus `ValueLedger` dari grid.
  - Hapus section `Aset per Lokasi`.
  - Pertahankan: `RegisterMasthead`, `RegisterStrip`, `ApprovalQueue`, `StatusLedger`, `RegisterSection Aset per Klasifikasi`, `ActivityLedger`, `WarrantyWatch`.
  - Atur grid agar tinggi total ≤ viewport tanpa scroll: kurangi padding, batasi tinggi `ActivityLedger` dan `WarrantyWatch`, gunakan `max-h-[...] overflow-auto` internal jika perlu.

### RegisterStrip KPI
Hapus KPI `Garansi Kedaluwarsa`.
Sisa 3 KPI dengan label baru:
- `Mutasi Menunggu` → `Mutasi Belum Disetujui`
- `Disposal Menunggu` → `Penghapusan Belum Disetujui`
- `Garansi ≤ 30 Hari` → `Garansi Akan Habis`
Subtitle disesuaikan.

### WarrantyWatch
- Title `Garansi` → `Peringatan Garansi`
- Deskripsi `Batas waktu garansi dalam 30 hari ke depan`
- Badge teks: `kedaluwarsa` → `habis`, `segera` → `segera habis`
- Alert title `{expired} aset garansi kedaluwarsa` → `{expired} aset garansi sudah habis`

### Bahasa lain
- `StatusLedger` title tetap `Distribusi Status` atau `Status Aset` – opsional.
- Tooltip dan subtext disesuaikan dengan kosakata baru.

## Calls yang dibuat
- Penghapusan KPI Garansi Kedaluwarsa mengikuti instruksi eksplisit user.
- Penghapusan Nilai Aset per Tipe = `ValueLedger`.
- Penghapusan Aset per Lokasi.

## Builder notes
- Pastikan `RegisterStrip` tetap render 3 kartu dengan grid 3 kolom di lg.
- Setelah edit, jalankan `graphify update .`.
- Uji di mobile & desktop agar tidak scroll halaman.
