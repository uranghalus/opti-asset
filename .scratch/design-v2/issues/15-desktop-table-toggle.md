# 15: Desktop ledger table + view toggle

**What to build:** On wide screens (≥1280px) the asset list presents as a proper ledger table — sticky sunken header (Kode mono / Aset / Status / Tipe / Klasifikasi / Lokasi / Departemen / Aksi), checkbox column, tabular numerals, 44px rows, row click → detail — with cards remaining below the breakpoint. A view toggle lets users switch back to cards; the choice persists across visits. Desktop density matches the brief's 7/10 without losing any decision-relevant field that the card shows.

**Blocked by:** 12 (status & classification recipes on-system), 13 (asset page shell de-glass), 14 (AssetCard rebuild).

**Status:** done (74f970c)

- [ ] Table view renders at ≥1280px by default; cards remain default below 1280px
- [ ] View toggle (Tabel/Kartu) in the list header; choice persists across visits
- [ ] Table columns: checkbox, kode (mono), aset (nama + brand/model), status badge, tipe badge, klasifikasi chain, lokasi, departemen, row actions
- [ ] Sticky header on surface-sunken; sortable-feeling column headers may defer; tabular-nums on numeric cells; 1px row dividers
- [ ] Row click opens detail; checkbox + actions stop propagation
- [ ] Bulk selection works in both views (shared selection state)
- [ ] Empty state, pagination, and import panel work identically in both views
- [ ] Verified at 1280px, 1440px, 1920px in light + dark; cards verified at 375px
