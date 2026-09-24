# 05: Asset Browse list per brief

**What to build:** The daftar aset journey works end-to-end per DESIGN.md: FilterBar (search + chips klasifikasi/lokasi/status/tipe, overflow → bottom sheet on mobile), card grid below 768px / DataTable at 1024px+ carrying the same fields, BulkToolbar (hapus massal with confirm, cetak label batch), pagination, remember-last-list intact, and §8 empty/loading/error/offline states.

**Blocked by:** 02 (glass removal — Browse carries the most legacy markup), 03 (status layer), 04 (shell).

**Status:** ready-for-agent

- [ ] FilterBar with search (nama/kode/barcode) + chips for klasifikasi, lokasi, status, tipe; mobile overflow → bottom sheet
- [ ] Responsive list switch: cards <768 / DataTable ≥1024 with identical decision-relevant fields
- [ ] DataTable: sticky `surface-sunken` header, sortable columns, checkbox bulk column, tabular-nums numerics, 44px rows
- [ ] BulkToolbar with permissioned hapus massal (confirm dialog) + cetak label batch
- [ ] Remember-last-list (page + filters) verified on return from detail/edit
- [ ] ImportResultPanel renders post-import (dismissible, no setState-in-effect)
- [ ] Skeleton loading in final geometry; empty state with Tambah/Impor CTAs; offline banner `role="status"` blocking writes
