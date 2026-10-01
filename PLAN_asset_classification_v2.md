# Plan - Asset Classification v2: Tipe Peralatan & Aktiva Tetap

## Konteks
Fitur asset-classification dirombak total untuk mendukung dimensi tipe klasifikasi tingkat atas: **peralatan** dan **aktiva_tetap**. Pohon klasifikasi Group/Category/Cluster/Sub-Cluster dipisah per tipe, dengan integritas DB dan validasi ketat.

## Keputusan Desain yang disepakati
- Dimensi tipe membagi pohon klasifikasi. Asset type diturunkan/ divalidasi dari klasifikasi.
- Tree dipisah per tipe, kode unik per `(tenant_id, classification_type, code)` di Group dan per `(tenant_id, classification_type, parent_id, code)` di anak.
- `classification_type` disimpan di semua tabel klasifikasi dengan composite FK ke parent `(id, classification_type)`.
- Enum `ClassificationType` nilai `peralatan` / `aktiva_tetap`, mapping ke `asset_type` via `ClassificationType::toAssetType()`.
- Migrasi data existing berdasarkan `asset_type`: equipment → peralatan, fixed_asset → aktiva_tetap. Node dipakai asset bertipe campur harus dipecah, dry-run + review bisnis.
- Feature flag `features.classification_v2`, default off di prod, gate di controller UI.

## Fase 1 - Migration, Enum, Constraint, Dry-Run Mapping

**STATUS: SHIPPED 2026-10-01** — 11 test hijau, full suite 383 pass/0 fail, PHPStan level 7 bersih, migrate up/down terbukti di MySQL + SQLite.

### Tasks
1. ✅ Enum `App\Enums\ClassificationType` (`peralatan`, `aktiva_tetap`, `toAssetType()`).
2. ✅ Migration nullable enum `classification_type` ke 4 tabel klasifikasi + unique `(id, classification_type)` + index filter.
3. ✅ Migration composite FK `(parent_id, classification_type)` → parent `(id, classification_type)` di 3 child tables (terverifikasi menolak child tipe beda di SQLite & MySQL).
4. ✅ Backfill via command `app:backfill-classification-type` (`--dry-run` untuk report): mapping dari `asset_type`, unmapped mewarisi tipe parent, root default `aktiva_tetap` pending review, konflik tipe tidak ditulis (masuk daftar conflicts).
5. ✅ Laporan dry-run dihasilkan (dev DB: 982 node ditulis, 0 mixed, 0 konflik tersisa).
6. ✅ Rollback terbukti (migrate:rollback --step=2 + re-migrate).

### Hasil dev DB (2026-10-01)
- asset_groups: 7 (3 peralatan, 4 aktiva_tetap) — 0 null
- asset_categories: 17 (13 peralatan, 4 aktiva_tetap) — 0 null
- asset_clusters: 67 (67 peralatan, diwarisi parent) — 0 null
- asset_sub_clusters: 909 (909 peralatan, diwarisi parent) — 0 null

### Acceptance
- ✅ Migration up/down mulus, rollback terbukti.
- ✅ Tidak ada baris NULL setelah backfill.
- ✅ Composite FK menolak child tipe berbeda (test `ClassificationTypeTest`).
- ⏳ Laporan dry-run disetujui owner bisnis (menunggu review).

## Fase 2 - Validasi, Generate Kode, Import

**STATUS: SHIPPED 2026-10-01** — code-review 2-axis selesai; temuan HIGH ditangani.

### Tasks
1. ✅ Migration unik kode per Q8: Group `(tenant_id, classification_type, code)`, child `(tenant_id, classification_type, parent_id, code)` — drop unique lama, add baru (`update_classification_unique_constraints_per_type`).
2. ✅ Controller klasifikasi: `classification_type` required (Rule::enum) pada store; tipe immutable di update; unique rules ter-scope per tipe; konsistensi tipe anak vs parent dengan pesan jelas (`assertChildTypeMatches`); reorder memvalidasi tipe node vs induk (`assertReparentTypeMatches`).
3. ✅ Import klasifikasi: kolom `tipe` wajib (per-row error bila hilang/tidak valid — keputusan terdokumentasi: template lama DITOLAK, tidak ada default buta); konsistensi tipe anak vs parent divalidasi per baris (`parentTypeMismatch`); lookup group type-aware (`code|tipe`).
4. ✅ Import asset: TIDAK pakai kolom tipe (alias header `tipe` sudah terpakai untuk field `model`); asset_type diturunkan dari klasifikasi via assigner; kode ambigu lintas tipe → per-row error, aset tetap dibuat tanpa klasifikasi (konsisten perilaku import existing).
5. ✅ AssetTypeAssigner: asset_type dengan klasifikasi → diturunkan dari chain root via `ClassificationType::toAssetType()`; tanpa klasifikasi → threshold capitalization (juga via enum — satu titik mapping); manual override (dengan reason) menang. `manualOverride()` dead code dihapus.
6. ✅ Test: validasi (tipe required, mismatch anak-parent, unique per tipe), import (tipe wajib, idempotent, kode collide), assigner (chain-derived, fallback threshold, override), kode existing tidak berubah. ClassificationTypeTest 16 test.

### Keputusan review (code-review 2-axis)
- **GenerateAssetCodeAction TIDAK diubah** (deviasi terdokumentasi dari rencana): sequencing berbagi antar tipe untuk base code yang sama menjaga `kode_asset` unik global per (tenant, base code). Sequencing per-tipe akan membuat kode_duplikat `01.01.01.01.001` di dua tipe — label tercetak ganda. Pertanyaan bisnis terbuka Q8 (prefiks tipe) diputuskan: tanpa prefiks, kode unik per tenant.
- **Mixed nodes**: ditulis dengan tipe dominan (fixed_asset pada tie) + ditandai eksplisit di report sebagai "Assigned (dominant)" — memenuhi acceptance "tidak ada baris NULL setelah backfill"; split dua node adalah aksi bisnis setelah review report.
- Inline comments dikonversi ke PHPDoc / helper (Standards axis).

### Acceptance
- ✅ Request menolak kombinasi tipe tak sesuai dengan pesan jelas.
- ✅ Kode asset existing tidak berubah (test `test_backfill_keeps_existing_asset_codes_unchanged`).
- ✅ Import menolak/ melaporkan tipe campur sesuai keputusan terdokumentasi.
- ✅ Test validasi, import, assigner lulus termasuk edge case (full suite 390 pass / 0 fail).

## Fase 3 - UI & Dashboard

**STATUS: SHIPPED 2026-10-01** — flag on/off teruji, detector impeccable 0 temuan, full suite 392 pass/0 fail.

### Tasks
1. ✅ Feature flag `classification_v2` di `config/features.php` (`FEATURE_CLASSIFICATION_V2`, default false — env-driven, hapus flag setelah split UI stabil).
2. ✅ `AssetClassificationController@index`: prop `classification_v2` + serialized group membawa `classification_type`.
3. ✅ Tree per tipe saat flag on: section Aktiva Tetap / Peralatan / Belum Bertipe (hanya jika ada isinya) dengan jumlah golongan. Form create group: picker tipe (radio 2 opsi, token tipe DESIGN.md); create child: tipe terkunci mengikuti induk; update: tipe immutable.
4. ✅ Dashboard: `assetByClassification` membawa label tipe per golongan (badge tint per DESIGN.md §3.2); breakdown per tipe (FR-13.8) + total gabungan tetap.
5. ✅ Ekspor Excel klasifikasi: kolom `tipe` ditambahkan (re-import aman); preview import menampilkan kolom tipe + penanda "wajib" bila kosong.
6. ✅ Test: flag on/off, tree carries type, dashboard tipe labels. `ClassificationTypeTest` 17 test, `DashboardTest` 7 test.

### Acceptance
- ✅ Tree tampil per tipe saat flag on; create node memvalidasi tipe (picker group / terkunci dari induk).
- ✅ Dashboard total gabungan sama dengan angka sebelum migrasi (migrasi tidak menyentuh data asset).
- ✅ Flag bisa dimatikan tanpa error dan tanpa kerusakan data (validasi + constraint DB selalu aktif).
- ✅ Detector impeccable: 0 temuan. Full suite: 392 pass / 0 fail / 15 skipped.
- ⏳ UAT disetujui owner bisnis (menunggu review).

## Risiko & Mitigasi
- Node campuran perlu dipecah → dry-run + review bisnis.
- Kode asset berubah → jaminan kode penuh tetap unik, tidak merubah kode tercetak jika tidak perlu.
- Flag teknis utang → tanggal penghapusan flag ditentukan setelah stabil.

## Deliverables
- Migrations + enum + seed mapping report.
- Validasi & import update.
- UI v2 dengan feature flag.
- Test suite diperbarui.
