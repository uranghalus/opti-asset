# 10: Dashboard + FR-13.8 tipe breakdown

**What to build:** Dashboard per brief: MetricStrip (status counts with locked status colors), ChartPanel for jumlah & nilai per Tipe Aset (FR-13.8 — closes the last PRD dashboard gap), QuickActions (Scan, Tambah aset), zero/loading/error states (panel-level retry, staleness timestamp offline). Chart ramp = status hues for status series, §3.2 five-hue neutral ramp for others; no new hues, no purple.

**Blocked by:** 03 (status layer), 04 (shell).

**Status:** ready-for-agent

- [ ] MetricStrip: status counts using locked §3.2 colors + text labels (not color-only)
- [ ] ChartPanel: jumlah & nilai per Tipe Aset (Aktiva Tetap vs Peralatan) — FR-13.8 delivered
- [ ] Chart colors from §3.2 ramp only; tabular-nums on all metrics; money in ID-ID
- [ ] QuickActions (Scan, Tambah aset) in thumb zone on mobile
- [ ] Zero-state with Tambah aset pertama; metric skeletons; panel-level error with retry while other panels render
- [ ] Stale timestamp "Data terakhir: …" when offline
- [ ] Dashboard remains ungated (documented deviation — landing page for zero-role users)
