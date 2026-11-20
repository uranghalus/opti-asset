# Asset Browse Filter Design

## Intent & Why
Tingkatkan produktivitas pencarian aset di halaman Browse/Index agar setara dengan kekuatan filter Report, sekaligus mempertahankan alur browsing klasifikasi. Semua role perlu filter yang cepat, akurat, dan mudah dipahami tanpa menambah beban kognitif.

## Goals
- Filter utama tersedia dalam 1 layar tanpa scroll berlebih
- Filter lanjutan dapat diakses dengan 1 klik dan tidak mengganggu tree klasifikasi
- Filter state konsisten dengan URL query string untuk shareable link
- Waktu tempuh dari masuk halaman ke hasil relevan < 10 detik untuk kasus umum

## Non-Goals
- Tidak memindahkan logika Report ke Browse secara penuh; Report tetap jadi ekspor dan analisis mendalam
- Tidak mengganti sistem klasifikasi tree

## Anti-Goals
- Filter yang membuat halaman lambat atau membingungkan dengan terlalu banyak kontrol sekaligus
- Duplicate input label yang berbeda dengan Create Form

## Constraints
- Harus memakai komponen UI existing: Select, DatePicker, Input, MultiSelect, Button
- Harus menjaga `applyDepartmentFilter` dan bypass role
- Query harus server-side, paginasi max 100
- Aksesibilitas WCAG AA minimum

## Approaches
1. Extend browsePayload dengan semua filter Report → kompleksitas tinggi, payload besar
2. Quick + Advanced progressive disclosure → dipilih. Menjaga kecepatan untuk kasus umum, akses mendalam saat dibutuhkan
3. Filter terpisah halaman → ditolak, menambah navigasi

Pilihan: Opsi 2

## Design Specification

### Layout
- Header sticky filter bar di atas ledger
- Kiri: tree klasifikasi tetap
- Kanan: ledger tabel aset
- Filter bar terdiri dari Quick Row dan Advanced Panel collapsible

### Komponen
- Quick Row: Search global, Status segmented, Kondisi select, Lokasi select, Department select, Tipe Aset select, Tombol Filter Lanjutan
- Advanced Panel grid 2 kolom desktop, 1 kolom mobile:
  Item select, Brand, Model, Serial Number, Part Number
  Vendor, Harga Pembelian min, Harga Pembelian max, Tanggal Pembelian dari-sampai
  Tanggal Masuk, Tanggal Rusak, Garansi habis, Garansi vendor
  PIC MultiSelect, No SPB, Nomor Dokumen
  Nilai Perolehan, Masa Manfaat, Metode Penyusutan
  Has Photo checkbox, Has Document checkbox, Catatan contains
- Chips aktif filter di bawah quick row dengan remove per chip dan Reset All

### Design Tokens
Spacing 8dp, radius 8px, focus ring 2px primary, transition 150ms ease
Color semantic existing: primary, success, warning, error, info

### Interaction
- Debounce search 300ms
- Select dengan search untuk Lokasi/Department/Item/PIC
- Date range menggunakan 2 DatePicker per field
- Submit otomatis on change untuk quick, manual Apply untuk advanced
- Loading skeleton pada tabel saat filter berubah

### Accessibility
Label terasosiasi, aria-describedby untuk hint, keyboard tab order logis, focus visible, kontras 4.5:1

### Backend Changes
- `browsePayload` menerima parameter baru dan menerapkan `when()` filter mirip `report`
- Menambah `items`, `locations`, `departments`, `employees` ke payload jika belum ada
- Update `filters` array untuk UI state

### Developer Handoff Notes
- Reusable component `AssetFilterBar` dan `AssetAdvancedFilters`
- Props: initialFilters, onChange, options
- Semua nama field sama dengan Create Form agar mapping mudah

## Calls Made
- Field prioritas: Item, Brand, Model, Serial, Part, Vendor, Harga & Tanggal Pembelian, Lokasi, Department, PIC, Status, Kondisi, Tipe Aset, Garansi, No SPB/Dokumen, Has Photo/Document
- UI pattern: progressive disclosure dengan chips
