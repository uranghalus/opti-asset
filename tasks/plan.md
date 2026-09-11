# Implementation Plan: Phase 2 — Mobile-First Asset UI Enhancements

## Overview
Harden mobile UX for asset management: guarantee 44px touch targets, 1/2/3-column card grid, camera scanner with manual fallback, bottom nav, and larger form controls. Most infra already exists — ~70% done (CSS coarse-pointer rules, grid classes, Scan.tsx, MobileBottomNav, scanLookup). Remaining work is 3 shadcn ui tweaks + Browse drawer polish + CI gate. Sized MEDIUM (1–2 days actual, not 3–4).

## Architecture Decisions
- **CSS over JS for touch targets:** `app.css` `@media (pointer: coarse)` already enforces 44px. Adding `mobileMinH56`/`stackMobile` JS helpers duplicates it. Decision: verify CSS covers Button/Input/Select via `h-9` override; only add helpers if audit proves gap. YAGNI default = skip utils.ts.
- **Tailwind 4 responsive grid is source of truth:** `AssetCardGrid` uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` — correct per success criteria. No JS breakpoint switch needed; CSS handles it. Browse.tsx task reduces to confirming `drawerOpen` + `ClassificationSidebar` collapses < lg.
- **Scan uses html5-qrcode + fetch to `scanLookup`:** No controller change unless mobile payload needs shaping. `scanLookup` already returns `{asset}` / 404 JSON — verified working.
- **Bottom nav already mounted in `AppSidebarLayout`:** `MobileBottomNav` toggled by `isMobile` (<768px) + `pb-[56px]` spacer. No new component; just audit active state + safe-area.
- **shadcn/ui components are generated but tracked:** Patch `button.tsx`/`input.tsx`/`select.tsx` directly; do not run `shadcn add` (overwrites).

## Task List

### Phase 1: Verify "Current Status" claims (fail-fast)
- [ ] Task 1 — Audit touch-target CSS vs actual rendered heights
- [ ] Task 2 — Audit AssetCardGrid + Browse sidebar on real breakpoints
- [ ] Task 3 — Verify Scan flow + scanLookup JSON contract

### Checkpoint: Foundation
- [ ] Claims confirmed or gaps filed as Tasks 4–8

### Phase 2: Component touch targets (parallelizable)
- [ ] Task 4 — Button: ensure =44px on coarse pointer
- [ ] Task 5 — Input: ensure =44px + 16px font on mobile
- [ ] Task 6 — SelectTrigger: ensure =44px on coarse pointer
- [ ] Task 7 — Decide on utils.ts helpers (YAGNI gate)

### Checkpoint: Components
- [ ] `npm run lint` + `npm run types:check` clean for touched files

### Phase 3: Browse polish + Controller gate
- [ ] Task 8 — Browse.tsx mobile drawer / `useIsMobile` wiring
- [ ] Task 9 — AssetController scan/lookup mobile response check (likely no-op)

### Checkpoint: Integration
- [ ] Manual phone/tablet/desktop check: 1/2/3 cols, drawer, scanner fallback

### Phase 4: CI + Ship
- [ ] Task 10 — Full CI: lint / types / pint / php tests / Cypress
- [ ] Task 11 — Commit + PR referencing PRD

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS `min-height:44px` on `button` breaks `size-8` icon buttons (AssetCard) | Med | Keep CSS as `min-height`; icon buttons already `size-8` but CSS overrides to 44px — scope fix to `data-slot=button` or add `min-h-0` escape for icon variant |
| `font-size:16px` on inputs causes layout shift | Low | Already in CSS for coarse pointer; verify no zoom on iOS (needs 16px exactly) |
| Over-adding JS breakpoint logic duplicates Tailwind | Low | Prefer CSS; only add `useIsMobile` in Browse if drawer logic broken |
| Cypress spec path `cypress/integration/...` is Cypress v9 layout | Med | Repo may use Cypress v12+ (`cypress/e2e/`); verify config before CI |

## Open Questions
- PRD `mobile-first-asset-ui.prd.md` — locate it; confirms exact 44px scope and barcode lib version (Html5Qrcode).
- Cypress version + config? Determines spec location.
- Should `mobileMinH56`/`stackMobile` actually ship or be dropped? Recommend drop.

## Dependencies
```
app.css (touch rules) --+
AssetCardGrid (cols) ---+-? Button/Input/Select touch audit -? Browse drawer polish -? CI/PR
Scan.tsx + scanLookup --+
MobileBottomNav + AppSidebarLayout (already wired)
```

## Parallelization
- Tasks 4/5/6 parallel (independent files)
- Tasks 7/8/9 parallel after Phase 1
- Task 10 must be sequential after all code changes
