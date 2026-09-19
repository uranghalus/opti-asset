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

### Auth & Permissions (rebuilt 2026-09-09)

- **Roles are assigned to `Employee`** (UUID PK, `tb_employee`) in the Employees section;
  **gates run against `User`** (int id). The bridge between them:
  - `App\Actions\SyncUserRolesFromEmployeeAction` — matches Employee by email
    (`withoutGlobalScopes`), `syncRoles` onto the User. No employee → User roles untouched.
  - Fired on `Illuminate\Auth\Events\Login` (listener closure in `AppServiceProvider` —
    project convention, no Listeners folder) → covers OIDC + Fortify logins.
  - Also fired immediately after `EmployeeController::assignRoles` (which uses `syncRoles`)
    so role changes apply without re-login.
- **super-admin = 0 permissions in DB** — `Gate::before` in `AppServiceProvider::grantSuperAdmin()`
  grants everything (Spatie "super-admin" pattern). `administrator` = full 58-permission catalogue.
- Seed roles: `super-admin` (0), `administrator` (58), `manager` (24), `staff-asset` (9), `akunting` (8).
- Schema: single migration `2026_09_09_010000_create_permission_tables.php` with `model_id`
  as **varchar** (supports both `User` int and `Employee` UUID morphs).
- Admin endpoints are gated: `role.*` / `permission.*` on Role/PermissionController,
  `employee.edit` on assignRoles, `setting.edit` on capitalization threshold.
- **Bootstrap**: first super-admin gets the role via Employees page or tinker; `Gate::before` does the rest.

### Design System

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

- 2026-09-19: Asset import matches Department by kode_department OR nama_department
  (trimmed, case-insensitive) via `ImportAssetsAction::departmentLookup()`; departments are
  master data and are never auto-created by import (unmatched → warning, department_id null).
- 2026-09-19: Asset import result reporting — controller flashes `import_report`
  (imported/skipped/total_errors/errors capped at 250) alongside the toast; assets Browse
  page renders it in `ImportResultPanel` (dismissible, reference-equality reset — never
  setState-in-effect, ESLint react-hooks enforces). Toast stays capped at 3 details.

- Test env: pin config in `TestCase::setUp()`; never trust phpunit.xml env overrides against `.env`.
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
