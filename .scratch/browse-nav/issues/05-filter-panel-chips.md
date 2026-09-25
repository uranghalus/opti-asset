# 05: Filter panel + removable chips

**What to build:** Tipe/Status/Lokasi live in one labeled Filter panel (popover) with a count badge on its trigger; active filters render as removable chips beside the search; controls are legible on light theme (no `bg-white/10`). Proportioned at 1024–1440px.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] One Filter trigger opens a labeled panel containing Tipe, Status, Lokasi controls
- [ ] Trigger shows the active filter count as a badge; hidden when zero
- [ ] Active filters render as removable chips in a wrapping row (never clipped); chip × clears that one filter
- [ ] No off-token surfaces (`bg-white/10`, `border-white/15`) remain on the filter controls
- [ ] 44px touch targets preserved; keyboard operable (Esc closes, focus returns to trigger)
