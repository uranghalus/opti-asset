# 02: Glass removal contract — migrate TSX to semantic classes, delete legacy names

**What to build:** Screens are visually unchanged from ticket 01's output, but the source no longer contains legacy glass class names. Mechanical TSX migration: `glass-card`/`glass-panel` → `bg-card border border-border` (or shadcn `Card`), `glass-topbar`/`glass-header` → `bg-surface border-b`, `premium-toast` → the solid toast utility, `sidebar-glass` removed from `app-sidebar.tsx` (opaque sidebar tokens). Amber/violet inline accents (`#FFB23E`, `#B892FF`, `#5EEAD4`, rose gradients) on roles/permissions/audit/organizations pages → semantic tokens. Ends with the legacy class definitions deleted from `app.css` (contract closed).

**Blocked by:** 01 (tokens & fonts — migrated classes must land on the new definitions).

**Status:** ready-for-agent

- [ ] No `glass-card|glass-panel|glass-topbar|glass-header|sidebar-glass|premium-toast` remains in `resources/js/**`
- [ ] Legacy class definitions deleted from `app.css` (only semantic equivalents remain)
- [ ] No inline `#FFB23E|#B892FF|#5EEAD4|#1B1230` or amber/violet gradient icon chips in TSX
- [ ] Decorative gradient icon chips → neutral `bg-surface`/`bg-muted` chips with primary icon color
- [ ] Visual regression: screens identical to ticket 01 output in both themes
- [ ] `npm run build` + `npm run lint:check` + `npm run types:check` pass
