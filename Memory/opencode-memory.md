# Opti-Asset Project Memory

## Links

- **Memory File**: `Memory/opencode-memory.md` (this file — canonical, current-state-first)
- **Logs Directory**: `Memory/logs/` (per-session detail; latest: `2026-09-09.md`)

## Documentation

Memory documentation lives in this file and is linked to logs via the `logs/` directory.

**Important**: This file contains the canonical reference for design decisions and
architectural state. Session-by-session detail lives in the logs; check here first.

---

## Current State

### Stack

- **PHP 8.4** / Laravel 13 / Fortify 1 / Inertia v3 / React 19 / Tailwind 4 / Vite 8
- **Wayfinder** (typed TS routes; regenerate with `php artisan wayfinder:generate --with-form`)
- **Spatie laravel-permission v8** · shadcn/ui (New York) · React Compiler active
- OIDC SSO via Socialite (`OIDCProvider`, back-channel SLO endpoint exists for the IdP)

### Auth & Permissions (re-reconfigured 2026-09-18)

- **Spatie laravel-permission v8 kept** — schema (varchar model_id, 5 tables) and `config/permission.php` unchanged. Only the configuration layer was rebuilt.
- **Catalogue = actual gates** (`RolePermissionSeeder::PERMISSIONS`, 44 names): `audit.view`, `asset.view|create|edit|delete`, `asset.classification.*`, `asset.category.*`, `asset.location.*`, `asset.transfer.view|create|edit`, `asset.disposal.view|create|edit|delete`, `asset.item.*` (NOT inventory.*), `organization.*`, `department.view|edit`, `employee.view|edit`, `role.*`, `permission.*`, `setting.edit`. When adding a `Gate::authorize`, add the permission to the seeder too.
- **Dashboard is deliberately ungated** — it is the landing page for fresh OIDC/registered users with zero roles; gating it 403s them on login. Documented deviation.
- **Seeder wipes permission tables first** (clean-slate rerun), then rebuilds; `forgetCachedPermissions()` before/after (WithoutModelEvents gotcha still applies).
- **Roles**: `super-admin` (0 perms, bypass), `administrator` (all 44), `manager` (operational, ~26), `staff-asset` (view-heavy), `akunting` (views + disposal.edit + setting.edit).
- **SuperAdminSeeder** (after RolePermissionSeeder in DatabaseSeeder): `User::firstOrCreate(superadmin@appdutamall.com)` + `assignRole('super-admin')`; also assigns the role to a matching Employee row if one exists. Idempotent.
- **Sync guard**: `SyncUserRolesFromEmployeeAction` never revokes `super-admin` from a User during employee-role sync (union semantics for that role).
- **Gates newly wired**: OrganizationController (`organization.*`), DepartmentController (`department.view`/`department.edit`). Everything else already had gates (Asset, Item=asset.item.*, Category, Location, Transfer, Disposal, Classification, Audit, Reports=asset.view, Capitalization=setting.edit, Role, Permission, Employee assign=employee.edit).
- **Frontend**: Inertia shares `auth.user.permissions` (names array) + `auth.isSuperAdmin`. `useCan()` hook (`resources/js/hooks/use-can.ts`) returns `{ can, canAny, isSuperAdmin, roles }` — destructure `can`, it is NOT callable directly. Sidebar filtering live in `nav-main`, `mobile-sidebar-sheet`, `mobile-bottom-nav` via per-item `permission` metadata in `sidebar.ts` (metadata was dead before; `ac`→`organization`, import/export→`asset.create` fixed).
- **Roles/Permissions pages**: NOON palette violations fixed (sky/blue accents → amber #FFB23E / violet #B892FF / teal #5EEAD4); super-admin card shows "Bypass semua gate" badge; ACTION_STYLES semantics: teal=view, amber=create, violet=edit, rose=delete.

### Design System

**NOON token ramp (2026-09-18)**: `:root`/`.dark` semantic tokens in `app.css` migrated from the legacy blue ramp (hue 245–255) to NOON warm — primary amber `oklch(0.66 0.14 70)` light / `oklch(0.81 0.14 74)` dark, secondary violet, plum-300 foregrounds, warm paper surfaces, warm chart + sidebar tokens. Every `bg-primary`/ring/focus app-wide is now NOON, not blue. `glass-header` blue gradient → amber/violet wash; toast info/default accent → violet `#7a4bd6` (dark `#b892ff`); glass-card/panel shadows are soft multi-layer (contact + ambient). Status palette (donut, badges): ACT teal `#0D9488`, LOAN violet `#8B5CF6`, RPR amber `#D97706`, MUT deep violet `#6D28D9`, DSP rose `#E11D48` — WCAG AA on both glass surfaces. Rule: dashboard text uses `text-foreground`/`text-muted-foreground` tokens, never `text-white`/`#94A3B8` (invisible on light glass). NB: the impeccable detector's "color outside DESIGN.md" finding is a false positive — it cannot parse the palette YAML.

- **NOON warm glass** — amber primary `#FFB23E`, secondary `#B892FF`, tertiary `#5EEAD4`,
  base `#1B1230`. All shell chrome (sidebar, topbar, panels, toasts) follows the dashboard's
  warm palette — never blue. Tokens live in `resources/css/app.css` + `DESIGN.md`.
- **Light-first** default (dark opt-in) — `use-appearance.tsx`, `DESIGN.md`.
- Logo badge gradient: `primary→secondary` only (`app-sidebar.tsx`, `mobile-sidebar-sheet.tsx`).

### Testing Conventions

- In-memory SQLite; `RefreshDatabase`; `tests/TestCase::setUp()` pins
  `config(['cache.default' => 'array'])` — do NOT rely on phpunit.xml `<env>`/`<server>` to
  override `.env` (Laravel's env repo reads `.env` first; this defeated `CACHE_STORE=array`
  and caused Windows file-cache lock flakiness).
- `actingAs()` does **not** dispatch `Login` — use `auth()->login()` when testing the role bridge.
- Test users needing gated endpoints: create the Permission rows in `setUp` then
  `givePermissionTo` (tables start empty under RefreshDatabase).
- Make count/position assertions **relative** to setUp fixtures, not absolute.

### Persistent Gotchas

- `DatabaseSeeder` uses `WithoutModelEvents` → permission model events don't refresh the
  registrar cache. Any seeder that bulk-creates permissions must call
  `forgetCachedPermissions()` after the catalogue, before `syncPermissions`.
- Wayfinder: always regenerate with `--with-form`; never hardcode URLs; no global `route()`
  helper exists (that's Ziggy — two bugs already came from using it).
- `POST /logout` (Fortify) is the user logout; `POST /auth/oidc/logout` is the IdP
  back-channel SLO endpoint (JSON, not for browsers).
- Generated/gitignored: `resources/js/{actions,routes,wayfinder}/`, `components/ui/`.

---

## Session History (detail in logs)

| Date | Log | Summary |
|------|-----|---------|
| 2026-09-08 | `Memory/logs/2026-09-08.md` | Browse refactor (reusable pageProps), dashboard NOON redesign, asset-form derived accounting, shell NOON unification, light-first theme |
| 2026-09-09 | `Memory/logs/2026-09-09.md` | Assets review vs PRD v1.2 + critical fixes (bulk delete, `recorded_by`, threshold page), 22 FR-13 tests, flaky-test root cause, logout fix, PRD v1.3, **permissions feature full rebuild** (config check → teardown → migration → seeders → Employee→User bridge → gates → UI → 13 infra tests) |

## Key Decisions (chronological)

- Test env: pin config in `TestCase::setUp()`; never trust phpunit.xml env overrides against `.env`.
- Factories: never chain `->format()` on `$this->faker->optional()` — it returns null half the time (`AssetDisposalFactory` was intermittently breaking Disposal/Report suites with "format() on null").
- Book-value snapshots dedup per (asset, day); `recorded_by` nullable for CLI/seeder contexts.
- Threshold changes are not retroactive — use the "hitung ulang" (reassign) action.
- Employee-role changes take effect immediately (assignRoles re-syncs the User) and at every login.
- External changes landing mid-session (Gate::before FR-14, phpunit.xml edits, dashboard component
  deletions) are preserved, not reverted.
- Super-admin keeps zero DB permissions; direct role assignment on `User` remains valid for users
  without an employee record.

## Pending Work
**Next Sprint Priorities (Confirmed)**
1. **FR-13.8** — Dashboard breakdown by asset type (count + value)
2. **FR-11.3** — `Gate::authorize` in `AssetController` (asset CRUD ungated)
3. **Auto depreciation** — Calculate `accumulated_depreciation` from `depreciation_method`
4. **PHPStan Fixes** — Resolve 93 pre-existing errors for green CI
5. **UI polish** — Apply NOON warm glass design system (glassmorphism)

**Other leftovers**
- `AssetHistory`: record `asset_type`/override changes in `fromUpdate()`
- Location filter in Browse (FR-04.2) + search by item name (FR-04.1)
- Pre-existing lint/format noise in dashboard files (~2680 eslint errors)

## Referensi

- [[2026-09-09]] — latest session log
- [[2026-09-08]] — previous session log
