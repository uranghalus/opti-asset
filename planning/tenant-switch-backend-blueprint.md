---
created: 2026-10-29
tags: [backend, architecture, tenant-switch, multitenancy, spatie-permission, spatie-multitenancy, contract]
status: draft
---

# Backend Blueprint: Tenant Switching

**Project:** opti-asset (Laravel 13, PHP 8.4, Inertia v3 + React 19, Tailwind v4)
**Branch:** development
**Scope:** Backend design ONLY — no code changes, no implementation, no file edits. Frontend (React/Inertia) is OUT OF SCOPE; this document defines the contracts it will consume.
**Domain:** Multi-tenant asset management, Indonesian enterprise

---

## 1. Capability Model & Provisioning

### Permission name
- `tenant.switch`, guard `web`.

### Provisioning path (idempotent, NOT the destructive seeder)
- `database/seeders/RolePermissionSeeder::run()` is **destructive** (truncates roles/permissions/pivots) and is read-only for this task — do not modify or run it for this capability.
- New idempotent provisioning: a dedicated seeder/command `TenantSwitchPermissionSeeder` that:
  1. `Permission::firstOrCreate(['name' => 'tenant.switch', 'guard_name' => 'web'])`.
  2. `$role = Role::where('name', 'administrator')->first(); if ($role && !$role->hasPermissionTo('tenant.switch')) { $role->givePermissionTo('tenant.switch'); }`.
  3. Does **not** touch any other roles/permissions.
- Fresh-install path: add `'tenant.switch'` to `RolePermissionSeeder::PERMISSIONS` and grant to `administrator` in `ROLE_PERMISSIONS` (so `db:seed` on fresh installs includes it). This is documentation-only in this blueprint; the destructive seeder itself is not edited here.

### Gate::define vs Spatie permission lookup
- Use **`Gate::define('tenant.switch', ...)`** in `AppServiceProvider::boot()`, consistent with existing `super-admin.view` / `super-admin.grant` pattern.
- Gate callback: `$user?->hasPermissionTo('tenant.switch') ?? false`.
- `super-admin` bypass is **already covered** by existing `Gate::before` in `AppServiceProvider::grantSuperAdmin()` (returns `true` for super-admin on every ability). No new Gate::before needed.
- Do **not** add a duplicate `Gate::define('tenant.switch')` that bypasses Spatie; Spatie permission lookup remains the source of truth inside the Gate.

### How frontend learns capability — compare (a) vs (b)
| Option | Mechanism | Prop | Pros | Cons |
|--------|-----------|------|------|------|
| (a) Reuse shared `auth.user.permissions` | Frontend checks `permissions.has('tenant.switch')` via existing `use-can()` | None (reuse `auth.user.permissions: string[]`) | Zero backend change; consistent with existing `use-can()` | Frontend must know that capability = permission alone (ignores "has no tenants" edge case); less explicit |
| (b) Explicit `canSwitchTenant` boolean | Server computes `canSwitchTenant` and shares it | `canSwitchTenant: boolean` on shared Inertia props | Single source of truth; server is authority; covers edge cases (no assigned tenants, single tenant) | One new shared prop |

### RECOMMENDATION
**Option (b): explicit `canSwitchTenant: boolean`** shared on every Inertia page via `HandleInertiaRequests::share()`.
- Exact prop key: `canSwitchTenant` (boolean).
- Computation: `auth()->user()?->can('tenant.switch') && $availableTenants->count() > 1` (super-admin implicitly can via Gate::before).
- Frontend also receives `availableTenants` (see §5) so it can independently decide the single-tenant static-label case.
- TypeScript declaration added to `@inertiajs/core` `InertiaConfig.sharedPageProps` (see §9).

---

## 2. Authorization Matrix

Enforcement point legend: **Gate** = `Gate::authorize()`/`can()`; **Pivot** = `user_tenants` membership check; **Prop** = shared Inertia prop; **Middleware** = auth/throttle/csrf.

| Row | View switcher UI | List tenants | Switch assigned tenant | Switch unassigned tenant | Switch any tenant |
|-----|-----------------|-------------|-----------------------|-------------------------|------------------|
| **super-admin** | allowed — Gate::before bypass | allowed — all tenants (Prop) | allowed — Gate + no pivot check | allowed — Gate + no pivot check | allowed — Gate::before |
| **administrator WITH `tenant.switch` + assigned tenants** | allowed — Gate + Prop `canSwitchTenant=true` | allowed — own assigned tenants (Prop) | allowed — Gate + Pivot membership | denied — Pivot fails (403/validation) | denied — no `tenant.switch.any` |
| **administrator WITH `tenant.switch` + no assigned tenant** | allowed — Gate + Prop `canSwitchTenant=false` (empty list) | denied — empty list | denied — no pivots | denied — no pivots | denied |
| **administrator WITHOUT `tenant.switch`** | denied — Prop `canSwitchTenant=false` (static label) | denied | denied — Gate 403 | denied — Gate 403 | denied |
| **manager / staff-asset / akunting** | denied — no permission, Prop false | denied | denied — Gate 403 | denied — Gate 403 | denied |
| **unauthenticated** | denied — Middleware auth (redirect to login) | denied | denied — 401/redirect | denied — 401/redirect | denied |

Notes:
- "List tenants" for non-super-admin = only `user->tenants()` (pivot-derived), never all tenants.
- Enforcement for UI visibility is Prop-based (defense in depth); enforcement for the actual switch is Gate + Pivot server-side.

---

## 3. Endpoint Contract

### Route
- `POST /tenant/switch`, name `tenant.switch`, already registered at `routes/web.php:38`.
- Middleware stack: `web` (already), `auth` (already via group), add `throttle:tenant.switch` (rate-limit recommendation §3.7), keep CSRF (web middleware).
- Method signature contract: `TenantSwitchController@switch(TenantSwitchRequest $request): RedirectResponse`.

### FormRequest
- Use `App\Http\Requests\TenantSwitchRequest` (new file).
- Rules: `tenant_id` => `required|string|exists:tenants,id`.
- Custom validation (after `exists`): verify the tenant is **not soft-deleted / not archived** if such a concept exists; otherwise rely on pivot membership in controller.
- Authorize method: `$this->user()->can('tenant.switch')` → 403 if false.

### Order of checks (strict)
1. **Authenticate** — `auth` middleware (401/redirect to login if unauthenticated).
2. **Authorize** — `Gate::authorize('tenant.switch')` or FormRequest `authorize()` (403 if no capability).
3. **Validate** — `TenantSwitchRequest` validated (422 on bad `tenant_id`).
4. **Resolve tenant** — `Tenant::findOrFail($validated['tenant_id'])` (404 if missing; treat as validation/business error, not enumeration).
5. **Scope / pivot check** — unless super-admin: `$user->tenants()->where('tenants.id', $tenant->id)->exists()` → 403 if not assigned.
6. **Session** — `$request->session()->put('current_tenant_id', $tenant->id)`.
7. **Audit** — write ActivityLog switch record (see §6 audit wrinkle).
8. **Respond** — redirect to `dashboard` + Indonesian flash toast.

### Success response
- `redirect()->route('dashboard')`.
- Flash: Inertia `Inertia::flash('toast', ['type' => 'success', 'message' => 'Berhasil beralih ke tenant "<tenant name>".'])` — exact Indonesian message format.
- (If re-selecting the already-active tenant: still success, message `'Tenant "<name>" sudah aktif.'` — idempotent no-op.)

### Failure semantics
| Condition | HTTP | Response |
|-----------|------|----------|
| Unauthenticated | 302 | redirect to `/auth/saml/login` (existing auth flow) |
| No `tenant.switch` capability | 403 | `redirect()->back()->withErrors(['tenant' => 'Anda tidak memiliki izin untuk berpalih tenant.'])` |
| `tenant_id` missing/invalid/not found | 422 | validation errors via FormRequest |
| Tenant not assigned to user (non-super-admin) | 403 | `redirect()->back()->withErrors(['tenant_id' => 'Anda tidak memiliki akses ke tenant ini.'])` |
| Re-select active tenant | 200/302 | success toast "sudah aktif" (idempotent) |

### CSRF
- Protected by Laravel `web` middleware CSRF; Inertia sends `X-XSRF-TOKEN` automatically. No additional client contract needed beyond existing Inertia setup.

### Rate-limiting recommendation
- Route-level: `throttle:5,1` (5 attempts per minute) keyed by `user_id` + IP, applied to `tenant.switch` only.
- Rationale: Indonesian corporate NATs share IPs; key primarily on `user_id`, fallback to IP.

---

## 4. Tenant Resolution & Session Contract

### Re-validate every request
- `App\TenantFinder::findForRequest()` (already exists) reads `session('current_tenant_id')` and resolves `Tenant::find(...)`. Called on every authenticated request via multitenancy middleware.
- Controller must **not** trust the session blindly: on switch, resolve fresh from DB and verify `exists` + (pivot membership or super-admin) before writing session.

### Deleted / lost active tenant recovery
- If `current_tenant_id` in session references a deleted/archived tenant: `Tenant::find()` returns null → TenantFinder returns null → `Tenant::current()` null.
- Recovery: next request re-resolves; if user has assigned tenants, fall back to user's **first assigned tenant** (by `name` ASC) and re-populate session; if none, session remains null (static label UI).
- Frontend contract: `tenant` prop may be `null`; `availableTenants` empty → static label.

### `users.tenant_id` null but pivots exist
- `users.tenant_id` is **legacy/default only**, NOT used for switch authorization or available-tenant list.
- Source of truth for switchable tenants: `user_tenants` pivot (`User::tenants()`).
- `HandleInertiaRequests` availableTenants query must use `$user->tenations()` → `->get()` (already does for non-super-admin).

### Multi-tab session-sharing
- Session is server-side (`current_tenant_id`), shared across tabs of the same browser.
- Last write wins; acceptable. No optimistic-locking needed. Frontend should refresh page after switch (Inertia `reload`) to synchronize tabs.

### Logout behavior
- On logout (Fortify/Saml), clear `session('current_tenant_id')` → `session()->forget('current_tenant_id')` (or `$request->session()->invalidate()`).
- TenantFinder returns null on next request until re-login/re-select.

---

## 5. Shared-Prop Contract

Handled by `App\Http\Middleware\HandleInertiaRequests::share()` (already shares `tenant` and `availableTenants`; extend per §9).

### Exact shapes/types
```ts
tenant: { id: string; name: string } | null;
availableTenants: Array<{ id: string; name: string }>;
canSwitchTenant: boolean;  // new
```

### Select strategy
- `tenant`: `Tenant::current()?->only(['id', 'name'])` — `select(['id','name'])` equivalent.
- `availableTenants`: `Tenant::query()->select(['id','name'])->orderBy('name', 'asc')->get()`.
  - super-admin → all tenants.
  - others → `$user->tenants()->select(['id','name'])->orderBy('name', 'asc')->get()`.

### Ordering
- `name ASC` for UI predictability (alphabetical Indonesian names).

### Scale strategy with threshold
- Threshold: **50 tenants**.
- `<= 50`: return full `availableTenants` array (current behavior).
- `> 50`: return first 50 ordered by name + `availableTenantsTruncated: true` flag (or paginated) so frontend can show search instead of a huge dropdown. Contract exposes `availableTruncated: boolean` if threshold exceeded. (Recommended; frontend decides rendering.)

---

## 6. Security Review

| Threat | Control | Location |
|--------|---------|----------|
| Elevation via `tenant_id` tampering | Server-side pivot membership check (unless super-admin); never trust `users.tenant_id` for authorization | `TenantSwitchController` / Gate |
| Tenant enumeration | `availableTenants` returns only user's assigned tenants (all only for super-admin); `exists` check returns generic 422/403, no "tenant exists but not yours" distinction | `HandleInertiaRequests`, `TenantSwitchRequest` |
| Session fixation | Regenerate session on login; `current_tenant_id` bound to authenticated user only | `Login` event / session middleware (existing) |
| CSRF | Laravel `web` CSRF + Inertia `X-XSRF-TOKEN` | `web` middleware (existing) |
| Error leakage | Generic Indonesian messages; no tenant internals, stack traces, or SQL in responses | Exception handler / controller |
| Audit logging — where switch row lands | `ActivityLog` is tenant-scoped via `BelongsToTenant` (reads current tenant). Switch audit recorded **in the NEW (target) tenant** context, i.e. **after** session put, with `properties` = `['from_tenant_id' => ..., 'to_tenant_id' => ..., 'action' => 'tenant.switch']`. Previous tenant context preserved in properties for cross-tenant reconciliation. | `TenantSwitchController` step 7 / new `RecordTenantSwitchActivity` listener |
| Switch spam / DoS | Rate limit `throttle:5,1` per user; audit every attempt | Route middleware + ActivityLog |

---

## 7. Observability

### Structured log fields (per switch event)
- `event`: `tenant.switch.attempted` \| `tenant.switch.succeeded` \| `tenant.switch.denied`
- `user_id`: string
- `user_name`: string
- `from_tenant_id`: string|null (previous active tenant)
- `to_tenant_id`: string|null (target tenant)
- `result`: `success` \| `denied_permission` \| `denied_not_assigned` \| `validation_error`
- `reason`: string
- `ip`: string
- `user_agent`: string

### What never to log
- Passwords, tokens, SAML assertions, PII beyond `user_id`/`user_name`, raw request body with secrets.

### Log channel
- Default `stack` channel (daily + slack if configured). Security-relevant events (denied switches) also emit to a `security` channel if configured; otherwise `stack` suffices. Channel name: `tenant.switch` context via `Log::channel('stack')->context([...])`.

---

## 8. Test Matrix — tests/Feature/TenantSwitchTest.php

RED-first ordering (write failing tests first, then implement):

| # | Test name | Setup | Assertions |
|---|-----------|-------|------------|
| 1 | `test_switch_denied_without_permission` | manager user, no `tenant.switch`, assigned tenant | 403, session unchanged, no audit log |
| 2 | `test_switch_denied_for_unassigned_tenant` | administrator with permission, tenant not in pivots | 403/validation error, session unchanged |
| 3 | `test_switch_success_for_administrator` | administrator with permission + assigned tenant | session `current_tenant_id` = target, redirect `dashboard`, flash success Indonesian, audit log written |
| 4 | `test_switch_idempotent_re_select_active_tenant` | already on tenant A, re-select A | success, toast "sudah aktif", session unchanged |
| 5 | `test_switch_clears_stale_session_for_deleted_tenant` | session tenant deleted, user has another tenant | next request resolves to first assigned tenant; `tenant` prop not null |
| 6 | `test_super_admin_can_switch_any_tenant` | super-admin, tenant not in pivots | success, no pivot check required, redirect dashboard |
| 7 | `test_unauthenticated_redirected_to_login` | no auth | 302 to `/auth/saml/login` |
| 8 | `test_available_tenants_limited_to_assigned` | user with 2 assigned tenants + 1 unassigned | Inertia prop `availableTenants` length = 2, excludes unassigned |
| 9 | `test_single_tenant_shows_static_label` | user with exactly 1 assigned tenant | `availableTenants` count = 1, `canSwitchTenant` = false |
| 10 | `test_audit_log_written_on_switch` | successful switch | ActivityLog row exists, action `tenant.switch`, properties has from/to tenant ids |
| 11 | `test_rate_limiting_on_switch` | 6 rapid requests | 6th returns 429 |

Existing tests that could regress:
- `tests/Feature/EmployeeTest::test_sync_after_switching_tenant_does_not_duplicate` — uses `withSession(['current_tenant_id' => 'other'])`; ensure session-based switching still scopes correctly.
- Any feature test relying on `HandleInertiaRequests` shared `tenant`/`availableTenants` props — adding `canSwitchTenant` must not break existing prop assertions.

---

## 9. Change List (dependency order)

### New files
1. `app/Http/Requests/TenantSwitchRequest.php` — FormRequest with `tenant_id` rules + `authorize()` returning `$user->can('tenant.switch')`.
2. `database/seeders/TenantSwitchPermissionSeeder.php` — idempotent `firstOrCreate('tenant.switch')` + grant to `administrator` (non-destructive; for production seeding).
3. `app/Listeners/RecordTenantSwitchActivity.php` (optional) — if audit extracted to listener; else inline in controller. Decision: inline in controller, listener listed as alternative.

### Modified files
4. `routes/web.php:38` — `Route::post('tenant/switch', ...)->middleware('throttle:tenant.switch,5,1')`; controller method now takes `TenantSwitchRequest`.
5. `app/Http/Controllers/TenantSwitchController.php` — rewrite `switch()` to order: authorize → validate → resolve → scope → session → audit → respond; remove inline `$request->validate()`.
6. `app/Providers/AppServiceProvider.php` — add `Gate::define('tenant.switch', fn ($u) => $u?->hasPermissionTo('tenant.switch') ?? false);` in `grantSuperAdmin()`.
7. `app/Http/Middleware/HandleInertiaRequests.php` — add `canSwitchTenant` to shared `auth` props; ensure `availableTenants` uses `select(['id','name'])->orderBy('name','asc')`; threshold logic for `> 50`.
8. `resources/js/types/global.d.ts` — extend `InertiaConfig.sharedPageProps` with `canSwitchTenant?: boolean`.
9. `database/seeders/RolePermissionSeeder.php` — add `'tenant.switch'` to `PERMISSIONS` and to `administrator` in `ROLE_PERMISSIONS` (fresh-install path only; destructive seeder remains read-only for runtime).

### Not modified (read-only, consulted)
- `app/TenantFinder.php`, `app/Models/User.php`, `app/Models/Tenant.php`, `app/Models/ActivityLog.php`, `app/Observers/RecordsActivity.php`, `resources/js/hooks/use-can.ts`, `resources/js/types/ui.ts`.

---

## 10. Rollout & Rollback

### Deployment order
1. Deploy code to staging (new FormRequest, controller, Gate, middleware, seeder).
2. Run `TenantSwitchPermissionSeeder` on staging (non-destructive).
3. Run test suite (`TenantSwitchTest` + regression on `EmployeeTest`).
4. Deploy to production; run `TenantSwitchPermissionSeeder` (non-destructive, safe to re-run).
5. Verify `canSwitchTenant` prop appears on dashboard.

### Seeding per environment
- local/testing: existing `RolePermissionSeeder` after adding `tenant.switch` to catalog (fresh install).
- production/staging: `TenantSwitchPermissionSeeder` only (idempotent, no truncation).

### Quick-disable
- Config flag `tenant_switch.enabled` (default true). Gate returns false when disabled; frontend hides switcher via `canSwitchTenant=false`.
- Or remove `Gate::define('tenant.switch')` line → all calls return false (denied).

### Rollback steps
1. Revert `routes/web.php`, `TenantSwitchController`, `AppServiceProvider`, `HandleInertiaRequests`, `global.d.ts` to previous versions.
2. Permission row `tenant.switch` remains in DB but is unused (harmless).
3. No data migration to reverse (session key `current_tenant_id` predates this feature).
4. Re-deploy.

---

## 11. Open Risks & Explicit Assumptions

### Assumptions
1. `user_tenants` pivot is the source of truth for which tenants a user may switch to; `users.tenant_id` is legacy/default only.
2. `super-admin` bypass via existing `Gate::before` covers `tenant.switch` — no additional super-admin handling needed.
3. Multi-tab last-write-wins session behavior is acceptable (no tab isolation required).
4. `Tenant::current()` / `TenantFinder` already resolves active tenant from session on every request.

### Risks
1. **ActivityLog tenant scoping wrinkle**: switch audit lands in the NEW tenant (after session put). Cross-tenant reconciliation queries must filter by `properties.from_tenant_id`/`to_tenant_id`, not just `tenant_id`. Risk of misattributed audit rows if not documented.
2. **Shared corporate NAT / IP rate limiting**: rate limit keyed primarily on `user_id` to avoid blocking multiple employees behind one IP; IP as fallback only.
3. **Single-tenant static label contract**: frontend must handle `availableTenants.length === 1` → static label; if frontend misimplements, users see a non-functional switcher. Mitigation: `canSwitchTenant=false` when count <= 1.
4. **Destructive seeder temptation**: `RolePermissionSeeder::run()` truncates all permission data; must never be run in production after initial seed. The idempotent `TenantSwitchPermissionSeeder` is the production path.

---

## Appendix: Contract Summary for Frontend (out of scope, for reference)

- Endpoint: `POST route('tenant.switch')` with body `{ tenant_id: string }`, CSRF token required.
- Success: 302 to `route('dashboard')` + Inertia flash toast `{ type: 'success', message: 'Berhasil beralih ke tenant "<name>".' }`.
- Shared props consumed: `tenant: {id, name} | null`, `availableTenants: [{id, name}]`, `auth.canSwitchTenant?: boolean` (recommended), `auth.user.permissions: string[]` (fallback).
- Single tenant → `availableTenants.length <= 1` → render static label.