# Sprint Plan — SAML Login Tenant Routing & Session Tenant

**Project:** opti-asset (`D:\Laravel Project\opti-asset`)
**Stack:** Laravel 13, PHP 8.4, Inertia v3, React 19, Tailwind v4, Spatie Multitenancy, onelogin/php-saml
**Feature:** SAML login → tenant routing (`/{tenant_code}/dashboard`) + employee session storage + 401 page
**Sprint length:** 1 week (5 working days), 1 developer
**Total estimated effort:** ~24–28 developer hours (~8–9 story points)
**Status:** Ready for implementation
**Reference:** `planning/saml-login-tenant-sync-sprint-plan.md`, `RUNBOOK_SAML_TENANT_SYNC.md`

---

## 1. Sprint Goal

Enable SAML-authenticated users to be routed to their own tenant dashboard at `/{tenant_code}/dashboard` using the tenant resolved from the SAML `company` assertion attribute (stored in session), with the user's employee record (department/division/position, matched by email/NIK) persisted in session, and a designed 401 error page for unauthorized access.

**Business value:** Tenant-scoped access after SAML SSO works end-to-end; users land on the correct unit-bisnis dashboard without manual tenant selection; employee context is available session-wide for downstream UI.

---

## 2. Current State Reconciliation (read from codebase)

| Item | Status | File |
|------|--------|------|
| `SamlTenantResolver::resolve()` matches SAML `company` → `tenants.name` | ✅ exists | `app/Services/SamlTenantResolver.php` |
| `SamlTenantResolution` value object | ✅ exists | `app/Services/SamlTenantResolution.php` |
| `SamlController::acs()` resolves tenant, sets `$user->tenant_id`, logs in | ✅ exists (but does NOT store tenant in session) | `app/Http/Controllers/Auth/SamlController.php` |
| `LoginLanding::redirect()` uses `$user->tenant_id` (NOT session tenant) | ⚠️ exists, needs change | `app/Services/LoginLanding.php` |
| `/{tenant}/dashboard` route named `tenant.dashboard` | ✅ exists, controller-based | `routes/web.php:55` |
| `{tenant}` route group middleware | ⚠️ only `['auth']`; needs `['auth', 'tenant.access']` | `routes/web.php:53` |
| `TenantAccessMiddleware` resolves tenant by code, makes current, enforces access | ✅ exists | `app/Http/Middleware/TenantAccessMiddleware.php` |
| `saml.denied` route | ✅ exists | `routes/web.php:197` |
| Employee→session storage | ❌ not implemented | — |
| `resources/js/pages/dashboard/Index.tsx` | ❌ not implemented (`dashboard.tsx` single file exists) | — |
| 401 error page | ❌ not implemented (no `resources/views/errors/` files) | — |
| User model has no `nik` field; Employee has `nik_employee` + `email` | — | `app/Models/User.php`, `app/Models/Employee.php` |

---

## 3. User Stories (testable units, with acceptance criteria)

**US-01 — Session tenant storage after SAML ACS**
As a SAML-authenticated user, after the ACS response the tenant resolved from the SAML `company` attribute is stored in my session.
- AC1: `SamlController::acs()` puts the resolved Tenant (`id`, `code`, `name`) into the session under a documented key (e.g. `saml.tenant`) when resolution is `found()`.
- AC2: When resolution is `denied()`, no tenant is stored in session and the user is sent to `saml.denied` (existing behavior preserved).
- AC3: Session tenant survives the redirect to `/{tenant_code}/dashboard`.

**US-02 — LoginLanding uses session tenant**
As a logged-in SAML user, `LoginLanding::redirect()` sends me to my tenant dashboard using the SAML tenant from session.
- AC1: If session tenant exists → `redirect()->route('tenant.dashboard', ['tenant' => $sessionTenant->code])`.
- AC2: If no session tenant but `$user->tenant_id` set → fall back to existing behavior (protects non-SAML logins).
- AC3: If neither session tenant nor `$user->tenant_id` → `deny('no_tenant')` (existing behavior preserved).
- AC4: Super admin → `admin.dashboard` (unchanged); no roles → `deny('no_role')` (unchanged).

**US-03 — Employee session storage on login**
As a logged-in user, my employee record is matched by email (primary) / NIK (if SAML carries NIK) and department/division/position are stored in session.
- AC1: Employee matched where `tb_employee.email = user->email` (primary match).
- AC2: NIK match attempted only if a NIK value is available from the assertion/User (confirm attribute name; otherwise skip gracefully).
- AC3: On match, session stores `employee.id`, `department_id`, `division_id`, `id_position`, `tenant_id`.
- AC4: On no match → session employee is null, login continues (no denial), warning logged.

**US-04 — Tenant dashboard route protected & rendered**
As a user, `/{tenant_code}/dashboard` requires `auth` + `tenant.access` and renders the tenant dashboard Inertia page.
- AC1: `{tenant}` route group uses `middleware(['auth', 'tenant.access'])`.
- AC2: `GET /{tenant}/dashboard` returns the tenant dashboard Inertia page (`dashboard.Index`).
- AC3: Unauthenticated → redirected to login; no tenant access → 403 via `TenantAccessMiddleware`; unknown tenant → 404.

**US-05 — Designed 401 page**
As a user hitting an unauthorized endpoint, I see a designed 401 page consistent with the app design style.
- AC1: 401 page designed first (visual spec/mockup) before implementation.
- AC2: `resources/views/errors/401.blade.php` implements the design.
- AC3: `abort(401)` renders the 401 page (verify `App\Exceptions\Handler` if needed).

---

## 4. Task Breakdown

Each task is small enough for one agent to complete in a few hours. TDD: tests written before implementation. Run `pint`, `phpstan`, `eslint`, `prettier`, `tsc` on every changed file.

| ID | Description | Files affected | Est. effort | Depends | Required skills |
|----|-------------|----------------|-------------|---------|-----------------|
| **T-01** | Write test: `SamlController::acs()` stores resolved tenant in session (`saml.tenant`) and denies without storing | `tests/Feature/.../SamlAcsSessionTest.php` (extend `SamlAcsTenantTest.php`) | 1.5h | — | Backend/Laravel + SAML + PHPUnit |
| **T-02** | Implement session tenant storage in `SamlController::acs()` | `app/Http/Controllers/Auth/SamlController.php` | 2h | T-01 | Backend/Laravel + SAML |
| **T-03** | Write test: `LoginLanding::redirect()` prefers session tenant, falls back to `$user->tenant_id`, denies otherwise | `tests/Feature/Services/LoginLandingTest.php` (new) | 1.5h | — | Backend/Laravel + PHPUnit |
| **T-04** | Implement session-tenant logic in `LoginLanding::redirect()` | `app/Services/LoginLanding.php` | 2h | T-02, T-03 | Backend/Laravel |
| **T-05** | Write test: `EmployeeSessionResolver` matches by email/NIK and stores `department_id`/`division_id`/`id_position` in session | `tests/Feature/Services/EmployeeSessionResolverTest.php` (new) | 1.5h | — | Backend/Laravel + Eloquent + PHPUnit |
| **T-06** | Create `EmployeeSessionResolver` service; invoke from `SamlController::acs()` after login | New: `app/Services/EmployeeSessionResolver.php`; modify `SamlController.php` | 3h | T-02, T-05 | Backend/Laravel + Eloquent |
| **T-07** | Align `{tenant}` route group middleware to `['auth', 'tenant.access']` (opti-works pattern) | `routes/web.php` | 1h | — | Backend/Laravel routing |
| **T-08** | Write test: `/{tenant}/dashboard` protected by `auth`+`tenant.access`, renders dashboard page, 404/403 behavior | `tests/Feature/TenantDashboardTest.php` (new) | 1.5h | T-07 | Backend/Laravel + PHPUnit |
| **T-09** | Create `resources/js/pages/dashboard/Index.tsx` tenant-dashboard Inertia page; wire `DashboardController` to render `dashboard.Index`; retire `dashboard.tsx` | New: `resources/js/pages/dashboard/Index.tsx`; `app/Http/Controllers/DashboardController.php`; delete `resources/js/pages/dashboard.tsx` | 4h | T-07 | Frontend/React + Inertia + Tailwind |
| **T-10** | Design 401 page (visual spec/mockup per design style) | Design spec (supermemory/planning) | 3h | — | UI/UX design |
| **T-11** | Implement 401 error view `resources/views/errors/401.blade.php`; register in `App\Exceptions\Handler` if needed | `resources/views/errors/401.blade.php`; `app/Exceptions/Handler.php` (maybe) | 3h | T-10 | Frontend/Blade + Laravel |
| **T-12** | Write test: `abort(401)` renders the designed 401 page | `tests/Feature/Error401Test.php` (new) | 1h | T-11 | Backend/Laravel + PHPUnit |

**Estimated total:** ~24.5h implementation + tests (~5 days with QA/regression buffer → 1 week).

---

## 5. Priority Ordering (MoSCoW)

**Must have (sprint commitment):**
- T-01, T-02 — US-01 session tenant storage (core of the feature)
- T-03, T-04 — US-02 LoginLanding session tenant
- T-07, T-08, T-09 — US-04 protected tenant dashboard route + page
- All tests for Must items (T-01, T-03, T-08)

**Should have:**
- T-05, T-06 — US-03 employee session storage (valuable for downstream UI, but login flow works without it)

**Could have:**
- T-10, T-11, T-12 — US-05 401 page (design first, then implement; nice-to-have if time permits)

**Won't have this sprint:**
- Separate department assignment (user confirmed: department data comes from Employee record, not assigned separately)
- Tenant auto-creation in SAML (resolver never creates tenants; they come from Optigate API sync)
- NIK matching unless the SAML assertion/User carries a NIK attribute (confirm attribute name first)

---

## 6. Definition of Done (sprint overall)

- [ ] All **Must** and **Should** tasks implemented, committed on a feature branch (not `main`).
- [ ] New tests pass: SAML session tenant, LoginLanding redirect, Employee session resolver, tenant dashboard route, 401 page (`php artisan test --compact` on affected test files).
- [ ] No regression in existing SAML/tenant tests (`tests/Feature/*Saml*`, tenant-scoped tests).
- [ ] `vendor/bin/pint --format agent` clean on changed PHP files; `eslint` + `prettier` + `tsc` clean on changed frontend files.
- [ ] Manual/e2e verification: SAML ACS → session tenant stored → redirect to `/{tenant_code}/dashboard` → tenant dashboard renders; Employee data present in session; `abort(401)` shows designed 401 page.
- [ ] No `.env`, credentials, API keys, or secrets committed.
- [ ] Route group change (`tenant.access` on `{tenant}`) regression-tested across all tenant-scoped routes.

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SAML attribute mapping mismatch (`company`/`email` names differ from IdP assertion) | Medium | High | Log incoming SAML attributes on ACS; test against real assertion dump; monitor `REASON_NO_COMPANY_DATA`/`REASON_NO_MATCH` denials |
| Session not persisting across ACS redirect (domain/same-site/session config) | Medium | High | Test session persistence end-to-end; verify `SESSION_DOMAIN`, `same_site`, secure cookie config |
| Employee email non-unique in `tb_employee` → wrong employee matched | Low | Medium | Enforce unique index on `tb_employee.email`; use `first()`; log warning when multiple matches |
| NIK attribute unknown → NIK matching cannot be implemented as specified | Medium | Low | Implement email match now; document NIK as conditional fallback; confirm NIK attribute with user before building |
| Adding `tenant.access` middleware to whole `{tenant}` group breaks existing tenant pages | Medium | Medium | Regression-test all tenant-scoped routes; run full test suite before merge |
| 401 page not rendered (Inertia/Exception handler intercepts `abort(401)`) | Medium | Medium | Verify `App\Exceptions\Handler::render`; test `abort(401)` directly in feature test |
| `dashboard.tsx` retired but still referenced elsewhere | Low | Low | Grep for `dashboard` page references before deleting; keep file if referenced until confirmed |

---

## Notes / Open Items to Confirm with User

1. **Vault path not found:** The AGENTS.md-configured vault at `C:\Users\Administrator\OneDrive\SecondBrain\01 Projects\opti-asset` does not exist on this machine. I saved this plan to the repo (`planning/sprint-saml-login-tenant-routing.md`) and to Supermemory (project scope). Please confirm the correct vault location so I can sync notes there per protocol.
2. **NIK attribute:** `User` has no `nik` field and the SAML attributes observed don't include NIK. Confirm whether the Optigate assertion carries a NIK attribute (and its name) before building NIK-based matching; email-only matching proceeds regardless.
3. **401 rendering approach:** Laravel renders `resources/views/errors/401.blade.php` by default, but this is an Inertia SPA — confirm whether 401 should be a Blade error view or an Inertia/React page before implementation (T-11).
