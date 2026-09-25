# 14: AssetCard rebuild (signature component)

**What to build:** The asset card matches the DESIGN.md §7 signature spec: photo as a modest thumbnail (not a decorative banner), hierarchy status → nama → kode (mono) → lokasi, tipe badge (Aktiva Tetap/Peralatan) next to status, classification chain as one quiet text line, muted tombstone treatment for Dihapus rows. A field user can read status, identity, and location at a glance; selection and row actions don't fight for attention.

**Blocked by:** 12 (status & classification recipes on-system), 13 (asset page shell de-glass).

**Status:** done (e573dec)

- [ ] Card layout: thumbnail 48px · nama (Title) · kode mono · StatusBadge + TipeBadge · lokasi/departemen caption; classification chain as muted single line
- [ ] TipeBadge shows tipe when the data exists (aktiva tetap/peralatan tint per §3.2)
- [ ] DSP cards render muted (reduced emphasis) per the tombstone rule
- [ ] Selection: checkbox visible, card selected state = primary-muted bg + border; never color-only
- [ ] Row actions always visible; hover lift reduced to subtle feedback (no translate-y jumps)
- [ ] Empty-photo placeholder neutral (no rainbow wash per status)
- [ ] Verified in both themes at 375px and desktop widths
