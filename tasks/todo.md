# Task List: Fitur Laporan Aset

## Implementation Plan: Asset Report Feature

### Phase 1: Backend - Controller Methods

#### Task 1.1: Tambah method report() di AssetController
**Description:** Buat method `report()` untuk menampilkan halaman laporan aset dengan filter dari Create.tsx sebagai basis.

**Acceptance criteria:**
- [ ] Method `report()` ada di AssetController.php
- [ ] Menggunakan Gate::authorize('asset.view')
- [ ] Mengembalikan Inertia response ke 'assets/Report'
- [ ] Mengirim data: assets (paginated), filters, summary, items, locations, departments, employees
- [ ] Menerapkan department filter seperti di method lain (applyDepartmentFilter)

**Verification:**
- [ ] Tests pass: `php artisan test --filter=AssetReportTest::test_report_shows_page`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Buka route `/{tenant}/assets/report`

**Files touched:**
- `app/Http/Controllers/AssetController.php`

**Estimated scope:** Small (1 file)

#### Task 1.2: Tambah method exportReport() di AssetController
**Description:** Buat method untuk export laporan aset ke format XLSX dan PDF dengan filter yang sama.

**Acceptance criteria:**
- [ ] Method `exportReport()` ada di AssetController.php
- [ ] Menerima parameter format (xlsx, pdf)
- [ ] Menggunakan filter yang sama dengan method report()
- [ ] Mengembalikan file download dengan nama yang tepat
- [ ] Menerapkan department filter dan tenant scope

**Verification:**
- [ ] Tests pass: `php artisan test --filter=AssetReportTest::test_export_xlsx`
- [ ] Tests pass: `php artisan test --filter=AssetReportTest::test_export_pdf`
- [ ] Manual check: Download file XLSX/PDF

**Files touched:**
- `app/Http/Controllers/AssetController.php`

**Estimated scope:** Small (1 file)

### Phase 2: Routes

#### Task 2.1: Tambah routes di web.php
**Description:** Tambahkan routes untuk asset report di routes/web.php.

**Acceptance criteria:**
- [ ] Route GET `/{tenant}/assets/report` dengan name `assets.report`
- [ ] Route GET `/{tenant}/assets/report/export` dengan name `assets.report.export`
- [ ] Routes menggunakan AssetController yang sama

**Verification:**
- [ ] `php artisan route:list` menampilkan routes baru
- [ ] Tests pass routing

**Files touched:**
- `routes/web.php`

**Estimated scope:** XS (1 file)

#### Task 2.2: Regenerate Wayfinder routes
**Description:** Jalankan perintah Wayfinder untuk membuat TypeScript route functions.

**Acceptance criteria:**
- [ ] File routes/tenant/assets/index.ts terupdate
- [ ] Ada export `report` dan `reportExport` route functions
- [ ] TypeScript tidak error

**Verification:**
- [ ] Build succeeds
- [ ] TypeScript compilation passes

**Estimated scope:** XS (generated file)

### Phase 3: Frontend - Report Page

#### Task 3.1: Buat komponen Report.tsx
**Description:** Buat halaman laporan dengan filter form dan tabel data.

**Acceptance criteria:**
- [ ] Komponen `resources/js/pages/assets/Report.tsx` dibuat
- [ ] Menggunakan filter props dari Create.tsx sebagai referensi
- [ ] Tampilkan form filter dengan: Item, Location, Department, Status, Condition, Asset Type, dll
- [ ] Tampilkan tabel hasil dengan kolom: Kode Aset, Item, Brand/Model, Serial, Status, Kondisi, Lokasi, Department, Vendor, Foto, Dokumen
- [ ] Tambahkan export buttons (XLSX, PDF)
- [ ] Tambahkan summary cards

**Verification:**
- [ ] Build succeeds
- [ ] Manual check: Buka halaman laporan

**Files touched:**
- `resources/js/pages/assets/Report.tsx`

**Estimated scope:** Medium (1-2 files)

#### Task 3.2: UI/UX - Form Filter & Layout
**Description:** Implementasikan tampilan filter yang responsif dan konsisten dengan design system.

**Acceptance criteria:**
- [ ] Filter form responsif di desktop/mobile
- [ ] Menggunakan komponen UI yang ada (Select, Input, DatePicker, Button, etc.)
- [ ] Tabel data dapat discroll horizontal pada mobile
- [ ] Pagination berfungsi dengan benar
- [ ] Export buttons diarahkan ke route yang benar

**Verification:**
- [ ] Build succeeds
- [ ] Manual check: UI responsif

**Estimated scope:** Medium

### Phase 4: Testing

#### Task 4.1: Buat test untuk AssetReport
**Description:** Buat test unit untuk memverifikasi fitur laporan berfungsi dengan benar.

**Acceptance criteria:**
- [ ] Test untuk menampilkan halaman laporan
- [ ] Test untuk filter status
- [ ] Test untuk filter asset type
- [ ] Test untuk export XLSX
- [ ] Test untuk export PDF
- [ ] Test untuk department filtering

**Verification:**
- [ ] `php artisan test --filter=AssetReportTest` semua test passing

**Files touched:**
- `tests/Feature/AssetReportTest.php`

**Estimated scope:** Medium (1 file)

## Checkpoint: Setelah Tasks 1.1-1.2
- [ ] Semua method controller berfungsi
- [ ] Routes terdaftar dengan benar
- [ ] Tests mendasar passing

## Checkpoint: Setelah Tasks 2.1-2.2
- [ ] Wayfinder routes tergenerate
- [ ] TypeScript tidak error

## Checkpoint: Setelah Tasks 3.1-3.2
- [ ] Halaman laporan dapat diakses
- [ ] Filter form berfungsi
- [ ] Export buttons berfungsi

## Checkpoint: Setelah Tasks 4.1
- [ ] Semua test passing
- [ ] Code coverage mencukupi
- [ ] Ready untuk review

---

**Total Estimated Scope:** Medium-Large (bisa dibagi menjadi 2 sesi)