# Sprint Plan — Tenant Sync Reconfiguration + SAML Login & Tenant Set

**Project:** opti-asset (`D:\Laravel Project\opti-asset`)
**Reference plan:** `planning/saml-login-tenant-sync-plan.md` (PM-senior approved)
**Reference project:** opti-works (`D:\Laravel Project\opti-works`)
**SAML library:** Keep `onelogin/php-saml` (Approach B — no dependency change)
**Status:** Ready for implementation
**Sprint length:** 2 weeks (10 working days), 1 developer
**Total estimated effort:** ~44 story points (~105–115 developer hours)

---

## 1. Sprint Goal

Deliver both approved workstreams end-to-end, TDD-first:

- **Task A — Tenant sync reconfiguration:** Robust `SyncTenants` console command (pagination, deactivate-missing, reactivate-returning, field validation, structured logging, return counts) + `TenantController::sync()` returning Inertia JSON with detailed sync counts + `resources/js/pages/tenants/Index.tsx` displaying sync results, status, last-synced timestamps, and better error handling.
- **Task B — SAML login & tenant set:** New services `SamlTenantResolution`, `SamlTenantResolver`, `LoginProvisioningService`, `LoginLanding` + refactor `SamlController::acs()` to the provision → resolve → deny → set tenant → login → landing flow + new `GET /saml/denied` route.

**Constraint:** Zero new Composer dependencies. Keep `onelogin/php-saml`. TDD: tests written before implementation. Run `pint` + `phpstan` on every changed PHP file; `eslint` + `prettier` (+ `tsc`) on every changed frontend file.

---

## 2. Conventions to Follow (read from codebase)

| Area | Convention |
|------|------------|
| PHP namespace | `App\Console\Commands`, `App\Http\Controllers\Auth`, `App\Services`, `App\Models` |
| PHP style | Constructor property promotion, explicit return types, PHPDoc blocks (no inline comments except complex logic), `<?php` opening tag |
| Tests | PHPUnit (NOT Pest), `Tests\TestCase` base, `RefreshDatabase` trait, `Mockery`, `Http::fake()`, namespace `Tests\Unit\Services\*` / `Tests\Feature\*` |
| Services | Plain classes in `app/Services`, instantiated with `new` in controllers |
| Frontend | Inertia v3 + React 19, shadcn/ui (`@/components/ui/*`), Tailwind v4, Wayfinder helpers from `@/routes/tenants`, lucide-react icons |
| Lint/format | `vendor/bin/pint --format agent`, `vendor/bin/phpstan analyse -c phpstan.neon --no-progress`, `npx eslint <file> --fix`, `npx prettier --write <file>`, `npx tsc --noEmit` |
| Routes | `routes/web.php`, SAML routes under `Route::prefix('auth')` |

---

## 3. Subtask Breakdown

### Task A — Tenant Sync Reconfiguration (Backend + Frontend)

| ID | Subtask | File paths | Depends on | Effort | DoD (Definition of Done) | Verification |
|----|---------|------------|------------|--------|--------------------------|--------------|
| **A1** | TDD: write `SyncTenantsTest.php` covering pagination, create/update, deactivate-missing, reactivate-returning, missing-config error | `tests/Feature/SyncTenantsTest.php` | — | 3 pts / ~4 h | • Test file exists and compiles\n• Tests cover: paginated API fetch, create new tenant, update existing tenant, deactivate tenants missing from API, reactivate previously-deactivated returning tenants, missing `WEB_PORTAL_URL`/`WEB_PORTAL_TOKEN` error\n• All tests currently FAIL (red) before implementation | `php artisan test --compact tests/Feature/SyncTenantsTest.php` |
| **A2** | Rewrite `SyncTenants.php` console command with pagination, deactivate-missing, reactivate-returning, field validation, structured logging, return counts | `app/Console/Commands/SyncTenants.php` | A1 (tests red first) | 5 pts / ~6 h | • `handle()` paginates the Optigate `/api/companies` endpoint (respects `per_page`/next-page cursor)\n• Creates/updates tenants via `updateOrCreate` on `optigate_company_id`, validating required fields (`id`, `name`); skips invalid rows with a warning log\n• Deactivates (`is_active = false`, `deactivated_at = now()`) local tenants not present in latest API page set\n• Reactivates (`is_active = true`, `deactivated_at = null`) previously-deactivated tenants that return\n• Structured logging via `Log::info/...` with context arrays\n• Returns/summarizes counts: created, updated, deactivated, reactivated, skipped, errors\n• Throws/returns clear error when `services.optigate_portal.url` or `.token` is blank\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Feature/SyncTenantsTest.php`\n`vendor/bin/pint app/Console/Commands/SyncTenants.php --format agent`\n`vendor/bin/phpstan analyse app/Console/Commands/SyncTenants.php --no-progress -c phpstan.neon` |
| **A3** | Update `TenantController::sync()` to invoke `SyncTenants` and return Inertia JSON with detailed sync counts | `app/Http/Controllers/TenantController.php` | A2 | 3 pts / ~4 h | • `sync()` authorizes `tenant.manage`\n• Validates config present; returns Inertia error JSON if missing config\n• Dispatches/calls `SyncTenants` and captures returned counts\n• Returns `Inertia::render('tenants/Index', [...])` **or** an Inertia JSON response carrying `created`, `updated`, `deactivated`, `reactivated`, `skipped`, `errors` counts and `last_synced_at` timestamp\n• On exception, returns Inertia JSON error with message (no raw exception leak)\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Feature/TenantControllerTest.php --filter=sync` (if exists) or manual smoke\n`vendor/bin/pint app/Http/Controllers/TenantController.php --format agent`\n`vendor/bin/phpstan analyse app/Http/Controllers/TenantController.php --no-progress -c phpstan.neon` |
| **A4** | (Quality gate) Pint + PHPStan on all Task A PHP files | `app/Console/Commands/SyncTenants.php`, `app/Http/Controllers/TenantController.php` | A2, A3 | 1 pt / ~1 h | • `vendor/bin/pint --dirty --format agent` reports no diffs\n• `vendor/bin/phpstan analyse -c phpstan.neon --no-progress` reports 0 errors on changed files | `vendor/bin/pint --dirty --format agent`\n`vendor/bin/phpstan analyse -c phpstan.neon --no-progress` |
| **A5** | Update `resources/js/pages/tenants/Index.tsx` to display sync results, status, last-synced timestamps, better error handling | `resources/js/pages/tenants/Index.tsx` | A3 (backend contract) | 5 pts / ~6 h | • Page accepts new sync props: `syncResult` (`{created, updated, deactivated, reactivated, skipped, errors, last_synced_at, status}`)\n• Shows a sync-result summary panel (created/updated/deactivated/reactivated counts) after sync completes\n• Shows sync status (idle/syncing/success/error) and last-synced timestamp\n• `handleSync` reads `onSuccess`/`onError` from the Inertia response to surface results/errors via `sonner` toast or inline alert\n• Better error handling: distinct messages for missing config vs API failure vs exception\n• Retains existing search, pagination, table, and sync button behavior\n• `eslint` + `prettier` + `tsc --noEmit` clean | `npx eslint resources/js/pages/tenants/Index.tsx --fix`\n`npx prettier --write resources/js/pages/tenants/Index.tsx`\n`npx tsc --noEmit` |
| **A6** | (Quality gate) ESLint + Prettier on changed frontend file | `resources/js/pages/tenants/Index.tsx` | A5 | 1 pt / ~1 h | • `npx eslint resources/js/pages/tenants/Index.tsx` reports 0 problems\n• `npx prettier --check resources/js/pages/tenants/Index.tsx` passes\n• `npx tsc --noEmit` passes | `npm run lint:check` (scoped to file)\n`npm run format:check` (scoped to file)\n`npm run types:check` |

### Task B — SAML Login & Tenant Set (Approach B: onelogin/php-saml)

| ID | Subtask | File paths | Depends on | Effort | DoD (Definition of Done) | Verification |
|----|---------|------------|------------|--------|--------------------------|--------------|
| **B1** | TDD: write `SamlTenantResolverTest.php` | `tests/Unit/Services/SamlTenantResolverTest.php` | — | 2 pts / ~3 h | • Test file exists, extends `Tests\TestCase`, uses `RefreshDatabase`\n• Covers: company attribute matches `tenants.name` → found; no match → denied; case-insensitive/trim match via `Tenant::whereCode`/`where('name')`; missing attribute → denied | `php artisan test --compact tests/Unit/Services/SamlTenantResolverTest.php` |
| **B2** | Create `SamlTenantResolution.php` value object (found/denied) | `app/Services/SamlTenantResolution.php` | B1 (red first) | 1 pt / ~1.5 h | • Value object class with `found()` / `denied()` state + reason + optional `Tenant`\n• Immutable, self-documenting PHPDoc\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Unit/Services/SamlTenantResolutionTest.php` (if created) or rely on B3 tests\n`vendor/bin/pint app/Services/SamlTenantResolution.php --format agent`\n`vendor/bin/phpstan analyse app/Services/SamlTenantResolution.php --no-progress -c phpstan.neon` |
| **B3** | Create `SamlTenantResolver.php` matching SAML company attribute to `tenants.name` | `app/Services/SamlTenantResolver.php` | B1, B2 | 3 pts / ~4 h | • `resolve(?string $company): SamlTenantResolution`\n• Matches `company` attribute to `Tenant::where('name', ...)` (trimmed, case-insensitive), fallback to `Tenant::whereCode(...)`\n• Returns `found(tenant)` when a single active tenant matches; `denied(reason)` when none or ambiguous\n• Logs resolution outcome via `Log::info/...`\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Unit/Services/SamlTenantResolverTest.php` (green)\n`vendor/bin/pint app/Services/SamlTenantResolver.php --format agent`\n`vendor/bin/phpstan analyse app/Services/SamlTenantResolver.php --no-progress -c phpstan.neon` |
| **B4** | TDD: write `LoginProvisioningServiceTest.php` | `tests/Unit/Services/LoginProvisioningServiceTest.php` | — | 3 pts / ~4 h | • Test file exists, `RefreshDatabase`\n• Covers: super-admin self-heal (email matches `config('auth.super_admin_email')` → `is_super_admin = true` + `super-admin` role) on every SAML login; guest role bootstrap for non-super-admin users; idempotent provisioning (no duplicate roles) | `php artisan test --compact tests/Unit/Services/LoginProvisioningServiceTest.php` |
| **B5** | Create `LoginProvisioningService.php` (role bootstrap: super-admin self-heal, guest role) | `app/Services/LoginProvisioningService.php` | B4 (red first) | 3 pts / ~4 h | • `provision(User $user, array $samlAttributes): void`\n• Super-admin self-heal: if `$user->email === config('auth.super_admin_email')` → set `is_super_admin = true`, sync `super-admin` Spatie role (remove other conflicting platform roles per convention)\n• Non-super-admin → assign `guest` role (role bootstrap)\n• Updates user fields from SAML attributes (`name`, `department`, `position`, `last_login_at`, `last_login_ip`)\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Unit/Services/LoginProvisioningServiceTest.php` (green)\n`vendor/bin/pint app/Services/LoginProvisioningService.php --format agent`\n`vendor/bin/phpstan analyse app/Services/LoginProvisioningService.php --no-progress -c phpstan.neon` |
| **B6** | TDD: write `LoginLandingTest.php` | `tests/Unit/Services/LoginLandingTest.php` | — | 2 pts / ~3 h | • Test file exists\n• Covers: super-admin → `tenants.index` (admin); home tenant set → `tenant.dashboard` for that tenant code; no tenant / denied → `saml.denied` route | `php artisan test --compact tests/Unit/Services/LoginLandingTest.php` |
| **B7** | Create `LoginLanding.php` (post-login landing: super-admin → admin, home tenant → tenant dashboard, deny otherwise) | `app/Services/LoginLanding.php` | B6 (red first) | 2 pts / ~3 h | • `landing(User $user): string` route name\n• Super-admin → `route('tenants.index')`\n• User with `tenant_id` and active tenant → `route('tenant.dashboard', ['tenant' => $tenant->code])`\n• Otherwise → `route('saml.denied')`\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Unit/Services/LoginLandingTest.php` (green)\n`vendor/bin/pint app/Services/LoginLanding.php --format agent`\n`vendor/bin/phpstan analyse app/Services/LoginLanding.php --no-progress -c phpstan.neon` |
| **B8** | TDD: write `SamlAcsTenantTest.php` (ACS flow end-to-end) | `tests/Feature/SamlAcsTenantTest.php` | B2, B3, B5, B7 (services exist) | 3 pts / ~4 h | • Test file exists, `RefreshDatabase`, mocks `SamlAuth`\n• Covers: valid SAML assertion + matching company → user provisioned, tenant resolved, `tenant_id` set, redirected to correct landing, session has success flash\n• SAML assertion + NO matching company → redirected to `saml.denied`, not logged in\n• SAML assertion + super-admin email → super-admin self-heal + `tenants.index`\n• Missing email attribute → error redirect (existing behavior preserved) | `php artisan test --compact tests/Feature/SamlAcsTenantTest.php` |
| **B9** | Refactor `SamlController::acs()` to provision → resolve tenant → deny if none → set tenant_id → login → landing | `app/Http/Controllers/Auth/SamlController.php` | B2, B3, B5, B7, B8 | 5 pts / ~6 h | • ACS flow order: (1) provision user via `LoginProvisioningService`, (2) resolve tenant via `SamlTenantResolver`, (3) if denied → redirect `route('saml.denied')` WITHOUT login, (4) set `$user->tenant_id` to resolved tenant, (5) `Auth::login($user)`, (6) redirect via `LoginLanding::landing($user)`\n• Preserves existing `processResponse`/`getErrors`/`isAuthenticated`/`getAttributes`/nameId handling\n• Preserves super-admin self-heal (delegated to `LoginProvisioningService`)\n• Structured logging of ACS outcome\n• `pint` + `phpstan` clean | `php artisan test --compact tests/Feature/SamlAcsTenantTest.php` (green)\n`php artisan test --compact tests/Feature/SamlLoginTest.php` (regression — existing behavior)\n`vendor/bin/pint app/Http/Controllers/Auth/SamlController.php --format agent`\n`vendor/bin/phpstan analyse app/Http/Controllers/Auth/SamlController.php --no-progress -c phpstan.neon` |
| **B10** | Add `GET /saml/denied` route | `routes/web.php` | B9 | 1 pt / ~1 h | • `Route::get('saml/denied', ...)->name('saml.denied')` under `Route::prefix('auth')`\n• Returns a friendly "akses ditolak / no tenant assigned" page (view or inline response) with link back to `/auth/saml/login`\n• Named route `saml.denied` resolvable by `LoginLanding` and `SamlController` | `php artisan route:list --name=saml.denied`\n`php artisan test --compact tests/Feature/SamlAcsTenantTest.php` |
| **B11** | (Quality gate) Pint + PHPStan on all Task B PHP files | `app/Services/SamlTenantResolution.php`, `app/Services/SamlTenantResolver.php`, `app/Services/LoginProvisioningService.php`, `app/Services/LoginLanding.php`, `app/Http/Controllers/Auth/SamlController.php`, `routes/web.php` | B2–B10 | 1 pt / ~1 h | • `vendor/bin/pint --dirty --format agent` reports no diffs\n• `vendor/bin/phpstan analyse -c phpstan.neon --no-progress` reports 0 errors on changed files | `vendor/bin/pint --dirty --format agent`\n`vendor/bin/phpstan analyse -c phpstan.neon --no-progress` |

---

## 4. Dependency Graph & Sequencing (Maximum Parallelism)

### Wave 1 — Day 1–2 (independent; write tests first per TDD)

These subtasks have no cross dependencies and can be worked on in parallel (or sequentially by one developer):

```
A1  SyncTenantsTest.php                          (write tests first — red)
B1  SamlTenantResolverTest.php                   (write tests first — red)
B4  LoginProvisioningServiceTest.php             (write tests first — red)
B6  LoginLandingTest.php                         (write tests first — red)
```

### Wave 2 — Day 2–4 (implementation against red tests)

```
A2  Rewrite SyncTenants.php                      ← A1
B2  SamlTenantResolution.php                     ← B1
B3  SamlTenantResolver.php                       ← B1, B2
B5  LoginProvisioningService.php                 ← B4
B7  LoginLanding.php                             ← B6
```

### Wave 3 — Day 4–6 (integration; depends on Wave 2)

```
A3  TenantController::sync() returns Inertia JSON ← A2
B8  SamlAcsTenantTest.php                         ← B2, B3, B5, B7
B9  SamlController::acs() refactor                ← B2, B3, B5, B7, B8
B10 routes/web.php GET /saml/denied               ← B9
```

### Wave 4 — Day 6–8 (frontend + verification)

```
A5  Index.tsx sync results / status / timestamps  ← A3 (backend contract)
A6  ESLint + Prettier (frontend)                  ← A5
A4  Pint + PHPStan (Task A PHP)                   ← A2, A3
B11 Pint + PHPStan (Task B PHP)                   ← B2..B10
```

### Wave 5 — Day 8–10 (full test suite, regression, buffer)

```
Run entire test suite: php artisan test --compact
Regression: tests/Feature/SamlLoginTest.php (existing SAML behavior)
Manual smoke: sync a tenant from the portal; log in via SAML as super-admin and as a tenant user
Buffer / fixes / polish
```

**Parallelism note:** With a single developer, "parallel" means ordering independent subtasks so no subtask blocks another unnecessarily. With two developers, split: Developer 1 owns Task A (A1→A6), Developer 2 owns Task B (B1→B11), synchronizing on A3 (backend contract) before A5.

---

## 5. Verification & Quality Gates

Run these **after every implementation subtask**, not only at the end.

### PHP (every changed PHP file)
```bash
# Formatting
vendor/bin/pint app/Console/Commands/SyncTenants.php --format agent
vendor/bin/pint app/Http/Controllers/TenantController.php --format agent
vendor/bin/pint app/Services/SamlTenantResolution.php --format agent
vendor/bin/pint app/Services/SamlTenantResolver.php --format agent
vendor/bin/pint app/Services/LoginProvisioningService.php --format agent
vendor/bin/pint app/Services/LoginLanding.php --format agent
vendor/bin/pint app/Http/Controllers/Auth/SamlController.php --format agent

# Static analysis (level 7)
vendor/bin/phpstan analyse -c phpstan.neon --no-progress

# Dirty-check at end of sprint
vendor/bin/pint --dirty --format agent
```

### PHP tests (per test file)
```bash
php artisan test --compact tests/Feature/SyncTenantsTest.php
php artisan test --compact tests/Unit/Services/SamlTenantResolverTest.php
php artisan test --compact tests/Unit/Services/LoginProvisioningServiceTest.php
php artisan test --compact tests/Unit/Services/LoginLandingTest.php
php artisan test --compact tests/Feature/SamlAcsTenantTest.php
php artisan test --compact tests/Feature/SamlLoginTest.php          # regression
php artisan test --compact                                            # full suite (final)
```

### Frontend (every changed JS/TSX file)
```bash
npx eslint resources/js/pages/tenants/Index.tsx --fix
npx prettier --write resources/js/pages/tenants/Index.tsx
npx tsc --noEmit
```

### Route check
```bash
php artisan route:list --name=saml.denied
php artisan route:list --name=saml.acs --except-vendor
```

---

## 6. Sprint-Level Definition of Done

The sprint is complete only when ALL of the following are true:

- [ ] `SyncTenantsTest.php` is green: pagination, create/update, deactivate-missing, reactivate-returning, missing-config error all pass.
- [ ] `SyncTenants.php` returns `{created, updated, deactivated, reactivated, skipped, errors}` counts and logs structured output.
- [ ] `TenantController::sync()` returns Inertia JSON with detailed sync counts and `last_synced_at`.
- [ ] `Index.tsx` displays sync results, sync status, last-synced timestamps, and distinct error messages; eslint/prettier/tsc clean.
- [ ] `SamlTenantResolution`, `SamlTenantResolver`, `LoginProvisioningService`, `LoginLanding` all exist with green unit tests.
- [ ] `SamlController::acs()` implements provision → resolve → deny → set tenant_id → login → landing; existing `SamlLoginTest.php` still green (no regression).
- [ ] `GET /saml/denied` route exists and is reachable; denied SAML logins land there without session.
- [ ] `vendor/bin/pint --dirty --format agent` reports zero diffs.
- [ ] `vendor/bin/phpstan analyse -c phpstan.neon --no-progress` reports zero errors.
- [ ] Full test suite `php artisan test --compact` passes.
- [ ] No new Composer dependencies added; `onelogin/php-saml` retained.
- [ ] Vault + Supermemory updated per AGENTS.md protocol (session log + any new decisions/patterns).

---

## 7. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| `TenantController::sync()` signature changes from `RedirectResponse` to Inertia JSON; frontend `router.post(...)` relied on flash messages | Update `handleSync()` in `Index.tsx` to read `onSuccess`/`onError` and props; keep `preserveScroll: true`; test both success and error paths |
| SAML attribute arrays (`onelogin/php-saml` returns `['email' => [...]]`) | Keep the existing `static fn first(...)` helper in `SamlController`; services receive scalar values already extracted |
| Pagination cursor format unknown for Optigate `/api/companies` | Start with simple `?page=` pagination; log the raw response shape on first run; adjust in Wave 4 buffer if API uses cursor tokens |
| `tenant.switch` permission required by `TestCase::setUp()` for every authenticated request | Already handled in `TestCase`; ensure `LoginLandingTest`/`SamlAcsTenantTest` don't trigger authenticated Inertia shares unexpectedly |
| Windows file-lock / cache issues in tests | `TestCase` already sets `cache.default = 'array'`; keep `RefreshDatabase` for DB isolation |

---

## 8. Estimated Capacity Check

| Wave | Points | Hours | Days (1 dev, ~6 productive h/day) |
|------|--------|-------|-----------------------------------|
| Wave 1 (tests) | 10 | ~14 | 2.3 |
| Wave 2 (services/command impl) | 13 | ~19 | 3.2 |
| Wave 3 (integration) | 12 | ~17 | 2.8 |
| Wave 4 (frontend + QA) | 7 | ~10 | 1.7 |
| Wave 5 (full suite + buffer) | 2 | ~5 | 0.8 |
| **Total** | **44** | **~65–75** | **~10.8** |

With ~10 working days and a small buffer, this fits a 2-week sprint. If a second developer is available, Task A and Task B can be truly parallel, targeting completion in ~1 week plus QA.

---