# 07: Scan flow per brief

**What to build:** The field journey F1 works per DESIGN.md: full-bleed camera viewport, manual code entry fallback, ScanResultSheet with status-first hierarchy (status badge → nama → mono kode → lokasi → tipe), primary Lanjut pindai sticky, not-found error sheet with assertive live announcement, and ≤2s lookup perception preserved (NFR-01.2).

**Blocked by:** 03 (status layer), 04 (shell).

**Status:** ready-for-agent

- [x] `.noon` wrapper removed from Scan page; page renders on standard tokens (2026-09-25; ScanResultSheet restyled status-first + TipeBadge; real-phone verification still open)
- [ ] Full-bleed camera viewport with viewfinder framing; manual entry visible below
- [ ] ScanResultSheet: status badge (largest element) → nama → mono kode → lokasi → tipe badge
- [ ] Primary Lanjut pindai sticky; secondary Buka detail
- [ ] Not-found sheet focuses manual entry; failure announced `aria-live="assertive"`
- [ ] Camera-unavailable path focuses manual entry automatically (keyboard a11y)
- [ ] Verified on a real phone: outdoor legibility + camera permissions flow
