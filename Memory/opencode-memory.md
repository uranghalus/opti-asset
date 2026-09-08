# Opti-Asset Project Memory

## Links

- **Logs Directory**: `Memory/logs/`
- **Log File**: `Memory/logs/2026-09-08.md`
- **Memory File**: `Memory/opencode-memory.md`

## Documentation

Memory documentation lives in `Memory/opencode-memory.md` and is linked to logs via the `logs/` directory.

**Note**: All logs are stored in `Memory/logs/` and referenced in `Memory/opencode-memory.md`.

## Memory & Logs Relationship

The memory documentation (`Memory/opencode-memory.md`) contains all project decisions, architecture notes, and implementation details. Log files in `Memory/logs/` provide runtime context that complements the static documentation.

**Important**: The memory.md file contains the canonical reference for all design decisions and architectural choices. Always check memory.md before making changes to understand the current state of the system.

---

## Session Progress — 2026-09-08

### Completed Tasks ✅

1. **OIDC Migration** — Verified `add_oidc_fields_to_users_table` (oidc_id/last_login)
2. **Wayfinder Regeneration** — `php artisan wayfinder:generate --with-form`
3. **Import Assets — Positional Fallback & Tests** — fixed `resolveClassificationFromKode`, 5 tests
4. **Import Asset — Optional Item Selection** — nullable item_id, resolveFallbackItem
5. **Role-Based Filter Levels (Backend)** — `config/asset_filters.php`, `initialFilterLevel()`
6. **Frontend Role Filter UI** — initialFilterLevel prop, view (list|category), Tab, ?json branch
7. **Browse Refactor** — extracted `Browse.tsx` as reusable `pageProps` component, thin `Index.tsx`, fixed `asset_type` param propagation + clearFilters + only:[items,unclassifiedCount]
8. **Dashboard NOON Redesign** — AMEX blue → `#1B1230`/`#FFB23E`/`#B892FF`/`#5EEAD4`, glass-panel throughout, KPI/Icon/Badge unified
9. **Asset-Form Fix** — derived `showAccountingFields` from `form.data.asset_type`, clear accounting on switch to equipment
10. **Shell NOON Unification (app-sidebar-layout chrome)** — unified sidebar + dashboard to single world
    - `resources/css/app.css`: `sidebar-glass` #006fcf→#ffb23e/#ff9a3e, `sidebar-wrapper` ambient blue→amber/violet (`255,178,62`/`184,146,255`), `[data-sidebar=sidebar]` & `glass-topbar` white→warm `255,252,248/255,247,235` (light) & `34,21,51/22,14,35` (dark), `sidebar-nav-active` blue→amber, `glass-card`/`glass-panel` warm frosted, toast shadows `0,23,90`→`27,18,48`
    - `resources/js/components/app-sidebar.tsx:48` & `mobile-sidebar-sheet.tsx:70`: logo badge gradient `#1374D4→#006FCF` / `#5EEAD4→#006FCF` → `#FFB23E→#B892FF` (DESIGN.md primary→secondary)
    - `app-sidebar-layout.tsx`: confirmed wiring-only, no color logic
11. **Light-First Theme** — `DESIGN.md` flipped `○ Light / ✓ Dark` → `✓ Light / ○ Dark`, `use-appearance.tsx` default `system`→`light` | `currentAppearance='light'`, `initializeTheme()` writes `light`

### Fixes Applied (Code Review 2026-09-08) ✅

- `Browse.tsx:137` added `asset_type` to `currentParams`, unified `handleNodeSelect/clearNode/clearFilters` to reuse `currentParams`
- `Browse.tsx:125` added `items,unclassifiedCount` to `router.get only:`
- `asset-form.tsx:150` derived accounting toggle, null-out accounting values when exiting fixed_asset

### Verification ✅

- `npm run types:check` — clean (tsc --noEmit)
- `php artisan test --compact` — pass (in-memory SQLite)
- Screenshot audit dark+light vs DESIGN.md — hero/KPI/panel all warm amber/indigo, no blue remnant except toast intent colors (by design)

### Pending 📋

- Asset-form 1000-line split deferred (refactor-cleaner)
- Empty-state glass-panel polish deferred
- `npm run lint:check` / `format:check` — pre-existing warnings, not blocking

### Files Modified (2026-09-08 delta)

| File | Change |
|------|--------|
| `resources/js/pages/assets/Browse.tsx` | New reusable component, full drill-down + search + filters |
| `resources/js/pages/assets/Index.tsx` | Thin `usePage → Browse pageProps` wrapper |
| `resources/js/pages/dashboard.tsx` | NOON hero, bars/locations/ledgers recolored |
| `resources/js/components/dashboard/kpi-cards.tsx` | NOON colors, glass-panel cards |
| `resources/js/components/assets/asset-form.tsx` | Derived accounting toggle + clear |
| `resources/css/app.css` | Full NOON chrome retoken (sidebar/chrome/panel/toast) |
| `resources/js/components/app-sidebar.tsx` | Logo gradient primary→secondary |
| `resources/js/components/mobile-sidebar-sheet.tsx` | Logo gradient primary→secondary |
| `resources/js/hooks/use-appearance.tsx` | Light-first default |
| `DESIGN.md` | Light/Dark flag flipped |

### Decisions — 2026-09-08

- NOON is warm glass (amber primary), not blue glass — all shell chrome must follow dashboard, not compete
- Single source `app.css` + `DESIGN.md` tokens; logo badge is `primary→secondary` gradient only
- Light-first is new default; dark remains opt-in via toggle
