# 09: Masters, settings, audit, reports & RBAC screens on the system

**What to build:** All remaining screens conform: klasifikasi tree (keyboard nav ↑↓←→), item/kategori/lokasi tables, organizations/departments/employees, peran/izin permission matrix (NOON amber/violet accents → semantic tokens), audit log ledger table (tabular-nums), laporan with XLSX/PDF export buttons, and settings pages including ambang kapitalisasi with confirm dialog on hitung ulang.

**Blocked by:** 02 (glass removal), 03 (status layer), 04 (shell).

**Status:** ready-for-agent

- [ ] Klasifikasi tree: 4 levels, drag handles, keyboard nav (↑↓ move, ←→ collapse, Enter open), InlineEdit panel
- [ ] Item/kategori/lokasi CRUD tables on DataTable pattern with §8 states
- [ ] Organizations/departments/employees + peran/izin: NOON accents gone; super-admin "Bypass semua gate" badge on semantic tokens; permission matrix readable in both themes
- [ ] Audit log: ledger table with actor/action/target/timestamp, tabular-nums, filter bar
- [ ] Laporan: filters + XLSX/PDF export buttons; "Tidak ada data" empty state
- [ ] Settings: profile/security/appearance + ambang kapitalisasi with confirm dialog on hitung ulang
