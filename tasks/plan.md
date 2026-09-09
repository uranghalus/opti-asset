# Implementation Plan: Permissions Feature Rebuild (Spatie laravel-permission v8)

## Overview

Remove the entire permissions feature (config artifacts, migrations, seeders, super-admin gate,
admin controllers, admin UI, tests) and recreate it end-to-end following Spatie's v8 best
practices — super-admin via `Gate::before` (no permissions on the role), UUID-compatible pivot
schema, a login-time role bridge from Employee → User, and gate-protected admin endpoints.

**Scope confirmed by user:** Full rebuild (backend + UI + tests) · Role bridge = sync at login ·
`migrate:fresh --seed` approved for the dev database.

## Current State (verified)

| Artifact | Location | Problem |
|---|---|---|
| Config | `config/permission.php` | Stock v8, correct (teams off, guard `web`, gate check registered) — no changes needed |
| Migrations | `2026_08_06_143741_create_permission_tables.php`, `2026_08_08_120000_make_permission_model_id_string.php` | Two-step `model_id` string patch — replaced by one clean migration |
| Seeders | `RolePermissionSeeder`, `AssetClassificationPermissionSeeder` | Super-admin gets **all** permissions (contradicts `Gate::before` pattern); duplicate seeder |
| Super-admin gate | `AppServiceProvider::grantSuperAdmin()` | OK pattern (`true`/`null`), rebuild references it |
| Admin controllers | `RoleController`, `PermissionController` | **No authorization** — any authenticated user can manage roles/permissions |
| Employee roles | `EmployeeController::assignRoles` + `AssignEmployeeRolesRequest` | `authorize()` returns `true`; no gate |
| Role bridge | **none** | Roles assigned to `Employee`, but gates run on `User` — split brain |
| UI | `pages/roles/Index.tsx`, `pages/permissions/Index.tsx`, `pages/Employees/*` | Works, but no permission awareness; rebuilt under full scope |
| Tests | `RolePermissionTest` (14), `EmployeeTest` (role part) | No infra/bridge tests; no 403 coverage |

Target users of `HasRoles`: `App\Models\User` (int id) and `App\Models\Employee` (UUID PK,
`$guard_name = 'web'`) — schema must hold both morph types.

## Architecture Decisions

1. **One clean migration** recreating all 5 spatie tables with `model_id` as `string`
   (pre-empting the two-step patch). Composite primary keys unchanged from vendor shape.
2. **Super-admin = zero permissions.** `Gate::before` grants everything; seeding permissions onto
   the role is redundant and slows cache rebuilds (per docs page supplied by user).
   `administrator` role becomes the "all permissions" operator role.
3. **Role bridge via `Illuminate\Auth\Events\Login` listener.** One listener covers every login
   path (OIDC callback, Fortify) — `SyncUserRolesFromEmployee` action copies the employee's roles
   to the user (matched by email + tenant, `withoutGlobalScopes`). No employee found → user roles
   left untouched. Also re-synced immediately after `EmployeeController::assignRoles` so changes
   apply without re-login.
4. **Gates in controllers** (`Gate::authorize`) — same pattern as `AssetClassificationController`.
   Employees = `organization.*`, roles = `role.*`, permissions = `permission.*` (names already in
   the permission catalogue).
5. **No permission list shared to the frontend.** UI keeps using `auth.user.roles` (existing
   convention, e.g. `tenant-switcher.tsx`); backend 403s are the real boundary.
6. **Route names/URLs preserved** → Wayfinder types stay compatible; regenerate anyway.

## Task List

### Phase 1: Teardown

- [ ] Task 1: Remove the permissions feature
  - Delete: both permission migrations, `RolePermissionSeeder`,
    `AssetClassificationPermissionSeeder`, `RoleController`, `PermissionController`,
    `StoreRoleRequest`, `UpdateRoleRequest`, `StorePermissionRequest`, `UpdatePermissionRequest`,
    `tests/Feature/RolePermissionTest.php`, `pages/roles/`, `pages/permissions/`
  - Edit: `routes/web.php` (drop roles/permissions routes), `DatabaseSeeder` (drop deleted
    seeders), sidebar entries (`resources/js/data/sidebar.ts`)
  - **Acceptance:**
    - [ ] `composer.json` unchanged (package stays installed)
    - [ ] No dangling references (`grep -rn "RoleController\|PermissionController" app/ routes/`)
  - **Verification:** `php artisan test --compact` — suite green minus removed tests
  - **Dependencies:** None · **Size:** M (removal across ~14 files)

### Phase 2: Foundation

- [ ] Task 2: Recreate schema — single permission-tables migration
  - One migration with `model_id` string, rest copied from vendor v8 stub
  - Run `php artisan migrate:fresh --seed` (user-approved; DB is disposable seed data)
  - **Acceptance:**
    - [ ] `model_has_roles`/`model_has_permissions` accept a UUID string model_id and an int id
    - [ ] `migrate:fresh` + `db:show` clean
  - **Verification:** `php artisan test --compact` (RefreshDatabase re-migrates on SQLite)
  - **Dependencies:** Task 1 · **Size:** S (1 file + command)

- [ ] Task 3: Recreate seeders + super-admin gate
  - New `RolePermissionSeeder`: full permission catalogue; `super-admin` = **no permissions**,
    `administrator` = all, `manager`/`staff-asset`/`akunting` = sensible subsets (as today);
    cache forget before/after
  - `DatabaseSeeder` calls only the new seeder
  - `AppServiceProvider::grantSuperAdmin()` kept, cleaned up per Spatie doc example
  - **Acceptance:**
    - [ ] Seeder idempotent (safe to run twice)
    - [ ] `super-admin` role has 0 permissions but passes any `Gate::authorize`
    - [ ] `administrator` has the full catalogue
  - **Verification:** new `tests/Feature/PermissionInfrastructureTest.php`
  - **Dependencies:** Task 2 · **Size:** M (4 files + test)

### Checkpoint: Foundation
- [ ] `migrate:fresh --seed` green; infrastructure tests pass

### Phase 3: Role Bridge (Employee → User)

- [ ] Task 4: Sync user roles at login
  - `App\Actions\SyncUserRolesFromEmployee` (match by email + user's tenant_id,
    `withoutGlobalScopes`, `syncRoles` with employee role names)
  - `Event::listen(Login::class, ...)` in `AppServiceProvider`
  - `EmployeeController::assignRoles` re-syncs the matched user immediately
  - **Acceptance:**
    - [ ] Login event copies employee roles to user (assert via `$user->hasRole` + `can`)
    - [ ] No employee → user roles unchanged; users without employee unaffected
    - [ ] Role change on Employees page applies to the logged-in user without re-login
    - [ ] Works across tenants (employee of another tenant never matches)
  - **Verification:** new `tests/Feature/SyncUserRolesFromEmployeeTest.php`
  - **Dependencies:** Task 3 · **Size:** M (3 files + test)

### Phase 4: Admin Slices (recreated)

- [ ] Task 5: Role admin slice — `RoleController` + `StoreRoleRequest`/`UpdateRoleRequest` with
  `Gate::authorize('role.view'|'role.edit'|...)`, routes restored in `web.php`, wayfinder
  regenerated
  - **Acceptance:** CRUD + permission-sync work; 403 without `role.*`; super-admin role
    undeletable (behavior preserved)
  - **Verification:** recreated `RolePermissionTest` (role half) · **Dependencies:** Task 3 ·
  **Size:** M (5 files)

- [ ] Task 6: Permission admin slice — `PermissionController` + `StorePermissionRequest`/
  `UpdatePermissionRequest` with gates, routes, wayfinder regenerated
  - **Acceptance:** grouped index + batch create + update/delete work; 403 without
    `permission.*`
  - **Verification:** recreated `RolePermissionTest` (permission half) · **Dependencies:** Task 5 ·
  **Size:** M (4 files)

- [ ] Task 7: Recreate admin UI — `pages/roles/Index.tsx`, `pages/permissions/Index.tsx`,
  sidebar entries; Employees pages keep their role-assignment panel (small gate-aware touch-ups
  only)
  - **Acceptance:**
    - [ ] Visual parity with previous pages; same Wayfinder imports still typecheck
    - [ ] 403 surfaces as toast/error page, not crash
  - **Verification:** `npm run types:check`, `npx eslint` on touched files
  - **Dependencies:** Tasks 5–6 · **Size:** M (3–4 files)

### Checkpoint: Feature complete
- [ ] End-to-end: login as employee → roles effective → roles page gated → employee role change
  applies immediately

### Phase 5: Polish

- [ ] Task 8: Full verification + docs
  - `vendor/bin/pint --dirty`, `phpstan analyse`, `php artisan test --compact`,
    `npm run lint:check`/`types:check`, `graphify update .`, memory + session log update
  - **Dependencies:** Task 7 · **Size:** S

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Employee lookup at login hits `BelongsToTenant` global scope before tenant is resolved | High | Query with `withoutGlobalScopes()` + explicit `tenant_id` filter; test both paths |
| Existing suites assign roles directly to `User` (`RoleFilterLevelTest`, `AssetClassificationTest`) | Medium | `HasRoles` stays on `User`; bridge is additive, never removes user-only roles when no employee matches |
| `model_id` string composite primary key on MySQL key-length | Low | Match current production shape (varchar), tests run SQLite; verify with `phpstan`/`migrate:fresh` |
| Deleted pages referenced by Wayfinder imports elsewhere | Medium | `npm run types:check` after regeneration; recreate pages before final check |
| First super-admin bootstrap | Low | Document tinker one-liner + Employees-page assignment; no auto-assign in seeder (open question below) |

## Open Questions

- None blocking — first-super-admin bootstrap documented as tinker/Employees-page step.
