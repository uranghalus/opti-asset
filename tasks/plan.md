# Implementation Plan: Fitur Laporan Aset

## Overview
Membuat fitur laporan untuk AssetController yang menggunakan filter dari Create.tsx sebagai basis. Fitur ini akan menampilkan laporan data aset dengan filter yang dapat diekspor ke XLSX/PDF.

## Understanding the Requirements

### Filter yang ada di Create.tsx (AssetForm component):
- **Item** - pemilih item aset
- **Location** - lokasi aset
- **Department** - department aset
- **Employees (PIC)** - penanggung jawab
- **Status** - status aset (Aktif, Dipinjamkan, Dalam Perbaikan, Dimutasi, Dihapus)
- **Condition** - kondisi aset (Baik, Rusak Ringan, Rusak Berat)
- **Asset Type** - tipe aset (Aktiva Tetap, Peralatan)
- **Purchase Date** - tanggal pembelian
- **Brand, Model, Serial Number, Part Number**
- **Vendor Name**
- **No SPB, No Dokumen**
- **Warranty/Garansi dates**
- **Photo & Document availability**
- **Notes**

### Perbedaan dengan laporan yang sudah ada
Laporan yang ada (`reports/assets`) memiliki filter yang mirip, namun:
- Tidak ada filter berdasarkan Item yang dipilih di Create.tsx
- Tidak ada filter berdasarkan Department/Location yang sama
- Fokus lebih pada export data, bukan tampilan interaktif dengan filter form

## Architecture Decisions
1. **Backend**: Tambah method di `AssetController.php` untuk menampilkan laporan dan export
2. **Frontend**: Buat komponen baru `resources/js/pages/assets/Report.tsx`
3. **Routes**: Tambahkan routes di `routes/web.php` untuk asset report
4. **Wayfinder**: Generate TypeScript routes untuk asset report

## Task List

### Phase 1: Backend - Controller Methods
- [ ] Tambahkan method `report()` di AssetController.php untuk menampilkan laporan
- [ ] Tambahkan method `exportAssetsReport()` di AssetController.php untuk export XLSX/PDF
- [ ] Buat Request validation class `ReportAssetRequest.php` (opsional, bisa pakai validasi inline)
- [ ] Pastikan ada department ownership enforcement seperti di method lain

### Phase 2: Frontend - Routes & Types
- [ ] Regenerate Wayfinder routes untuk asset report
- [ ] Pastikan TypeScript types sudah ada untuk route parameters

### Phase 3: Frontend - Report Page
- [ ] Buat komponen `resources/js/pages/assets/Report.tsx`
- [ ] Implementasikan filter form berdasarkan pola Create.tsx
- [ ] Implementasikan tampilan data tabel dengan pagination
- [ ] Tambahkan export buttons (XLSX, PDF)
- [ ] Tambahkan summary cards seperti laporan assets yang ada

### Phase 4: Testing
- [ ] Buat test untuk method report di AssetController
- [ ] Buat test untuk export XLSX
- [ ] Buat test untuk export PDF
- [ ] Pastikan semua filter bekerja dengan benar

## Files yang akan diubah/Dibuat

### Backend (PHP)
- `app/Http/Controllers/AssetController.php` - tambah methods report dan export
- `routes/web.php` - tambah routes untuk asset report
- `tests/Feature/AssetReportTest.php` - test baru (opsional, bisa ditambahkan ke ReportTest.php)

### Frontend (React/TSX)
- `resources/js/pages/assets/Report.tsx` - halaman laporan baru (dibuat baru)

### Generated (TypeScript)
- `resources/js/routes/tenant/assets/index.ts` - update untuk menambahkan route report

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Konflik dengan route yang sudah ada di ReportController | Medium | Pastikan route memiliki nama yang unik, gunakan `/reports/assets` yang sudah ada atau buat `/assets/report` |
| Filter tidak konsisten dengan Create.tsx | Medium | Ikuti pola yang sama di AssetForm |
| Export tidak performa baik | Medium | Gunakan chunked query untuk XLSX jika data banyak |

## Open Questions
- Apakah laporan ini harus terpisah dari laporan di ReportController, atau bisa digabung?
- Apakah user ingin laporan ini diakses lewat menu khusus atau dari halaman Create?