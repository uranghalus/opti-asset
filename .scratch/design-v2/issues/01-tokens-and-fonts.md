# 01: Design tokens & fonts in app.css (Opname Field Desk v2.0 §3)

**What to build:** A user opening any screen sees the ledger system: cool-paper background, white opaque surfaces, mineral-teal primary/focus, Public Sans UI text, Noto Sans Mono for codes, 4/8/12px radii, and a cool-navy dark peer. Legacy glass class names (`.glass-card`, `.glass-panel`, `.glass-topbar`, `.glass-header`, `.sidebar-glass`, `.premium-toast`) are redefined **in place** to opaque border/shadow recipes so all consuming screens conform without TSX edits (expand–contract; the rename/deletion sweep is ticket 02).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `--font-sans` → Public Sans (self-hosted, no Benton Sans); `--font-mono` → Noto Sans Mono
- [ ] Light `:root` + `.dark` semantic tokens match DESIGN.md §3.6 map exactly (teal primary, paper bg, ink foreground, cool-navy dark — no plum)
- [ ] Legacy tokens deleted: `--color-soft-blue/pink/green`, `--color-scan-red`, `--sidebar-glow`, `--sidebar-gradient`, `.noon` scope, bezel utilities
- [ ] `.glass-*`/`.sidebar-glass`/`.premium-toast` redefined opaque: `surface` bg, 1px `border`, structural shadows only (no `backdrop-filter`, no gradients)
- [ ] Glass toasts restyled to solid `.premium-toast` surface with semantic accent icons (success `#1B7F5A`, warning `#B45309`, info `#1D6A9F`, error `destructive`); violet accents removed
- [ ] `.sidebar-nav-active` redefined to teal treatment (primary-muted bg wash + 3px primary leading edge)
- [ ] Radii theme: `--radius-sm/md/lg` = 4/8/12px; motion tokens 120/180/220ms with shared easing; `card-enter` retimed to ≤220ms; `animate-pulse-slow`/glow/`reveal` utilities removed
- [ ] Dashboard ambient glow blobs + amber/violet inline hexes removed from TSX (single-file exception granted to this ticket)
- [ ] `tabular-nums` utility available; mobile 44px tap-target block kept
- [ ] Verified: `npm run build` passes; dashboard, assets browse, roles pages visually on-system in both themes
