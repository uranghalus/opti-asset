# Plan — Tenant Sync Reconfiguration + SAML Login & Tenant Set (Approach B)

**Project:** opti-asset (`D:\Laravel Project\opti-asset`)  
**Reference:** opti-works (`D:\Laravel Project\opti-works`)  
**SAML library:** Keep `onelogin/php-saml` (Approach B — no dependency change)  
**Status:** Draft — for review before implementation  
**Parent plan:** `planning/sdlc-multitenancy-task-assignment.md` (vault), D1–D6 already approved  

---

## 1. What changes and why

### Task A — Tenant sync reconfiguration (backend + frontend)

`opti-asset`'s `app/Console\Commands\SyncTenants.php` is a basic single-page sync. `opti-works` has a robust version with pagination, deactivation of missing tenants, reactivation of returning tenants, field validation, and structured logging. Port the robust behavior into opti-asset.

**Frontend addition:** Rebuild the tenant sync UI in `resources/js/pages/tenants/Index.tsx` to display detailed sync results (created/updated/deactivated/reactivated counts), sync status, last-synced timestamps, and better error handling — accommodating the new backend sync output.

### Task B — SAML login & tenant set

`opti-asset`'s `SamlController` (onelogin/php-saml) finds/creates a user by email, sets `is_super_admin`, logs in, and redirects to `/dashboard`. It does **not**:
- Resolve a tenant from the SAML assertion's company name
- Provision roles at login (no `LoginProvisioningService`)
- Deny logins with no tenant/role (no `LoginLanding`, no `saml.denied` route)

Port opti-works' `LoginProvisioningService`, `SamlTenantResolver`, `SamlTenantResolution`, and `LoginLanding`, adapted to onelogin/php-saml's attribute-array API (Approach B).

---

## 2. File map

### New files

| Path | Responsibility |
|------|----------------|
| `app/Services/LoginProvisioningService.php` | Role bootstrap at SSO login: self-heal platform super-admin, grant `guest` role to role-less unlinked accounts. One transaction, idempotent. |
| `app/Services/SamlTenantResolution.php` | Value object: `found(Tenant)` or `denied(reason)`. Machine-readable denial reasons. |
| `app/Services/SamlTenantResolver.php` | Resolve tenant from SAML assertion's `company` attribute (exact, trimmed, case-insensitive match on `tenants.name`). Tenants come only from API sync — never created here. |
| `app/Services/LoginLanding.php` | Post-login landing: super-admin → admin dashboard; home tenant → tenant dashboard; role but no tenant → deny (`no_tenant`); no role → deny (`no_role`). Logs out before denying. |
| `planning/saml-login-tenant-sync-plan.md` | This plan. |

### Modified files — Backend

| Path | Change |
|------|--------|
| `app/Console/Commands/SyncTenants.php` | Rewrite with pagination (PER_PAGE=100, MAX_PAGES=100), deactivate-missing, reactivate-returning, field validation, structured logging, return counts (created/updated/deactivated/reactivated). |
| `app/Http/Controllers/TenantController.php` | Update `sync()` to return Inertia-compatible JSON with detailed sync counts instead of generic redirect flash message. |
| `app/Http/Controllers/Auth/SamlController.php` | After user provisioning, resolve tenant from assertion; deny + logout if no tenant; set `tenant_id` on user; use `LoginLanding` for redirect. |
| `routes/web.php` | Add `GET /saml/denied` route (Inertia page or simple view) named `saml.denied`. |

### Modified files — Frontend (Task A addition)

| Path | Change |
|------|--------|
| `resources/js/pages/tenants/Index.tsx` | Display detailed sync results (created/updated/deactivated/reactivated counts), sync status, last-synced timestamps per tenant, better error handling for sync failures. |
| `resources/js/routes/tenants/index.ts` | Ensure sync route type definition supports JSON response handling (if needed). |

### Test files (TDD — write first)

| Path | Responsibility |
|------|----------------|
| `tests/Feature/Console/SyncTenantsTest.php` | Pagination, create/update, deactivate missing, reactivate returning, missing config error. |
| `tests/Feature/Services/LoginProvisioningServiceTest.php` | Platform self-heal, guest role for role-less, idempotency. |
| `tests/Feature/Services/SamlTenantResolverTest.php` | Match by company name, no company data, no match, multiple matches, inactive tenant. |
| `tests/Feature/Services/LoginLandingTest.php` | Super-admin landing, home tenant landing, deny no_role, deny no_tenant. |
| `tests/Feature/Auth/SamlAcsTenantTest.php` | ACS resolves tenant, denies on no tenant, sets tenant_id, redirects correctly. |

---

## 3. Interface contracts (exact names/signatures)

### `SamlTenantResolution`
```php
final class SamlTenantResolution
{
    private function __construct(
        public readonly ?Tenant $tenant,
        public readonly ?string $denialReason,
    ) {}
    public static function found(Tenant $tenant): self
    public static function denied(string $reason): self
    public function isFound(): bool
    public function isDenied(): bool
}
```
Constants: `REASON_NO_COMPANY_DATA`, `REASON_NO_MATCH`, `REASON_MULTIPLE_MATCHES`, `REASON_INACTIVE`

### `SamlTenantResolver`
```php
class SamlTenantResolver
{
    protected const COMPANY_ATTRIBUTE = 'company';
    public const REASON_NO_COMPANY_DATA = 'no_company_data';
    public const REASON_NO_MATCH = 'no_match';
    public const REASON_MULTIPLE_MATCHES = 'multiple_matches';
    public const REASON_INACTIVE = 'inactive';

    public function canAccessAnyTenant(User $user): bool
    public function resolve(array $attributes): SamlTenantResolution  // adapted: array, not Saml2User
}
```

### `LoginProvisioningService`
```php
class LoginProvisioningService
{
    private const SUPER_ADMIN_ROLE = 'super_admin';
    private const GUEST_ROLE = 'guest';

    public function provision(User $user): void
    // DB::transaction: ensurePlatformSuperAdmin($user), ensureGuestRole($user)
    // then $user->refresh()
}
```

### `LoginLanding`
```php
class LoginLanding
{
    public function deny(string $reason): RedirectResponse  // logout + redirect to saml.denied
    public function redirect(User $user): RedirectResponse  // super-admin → admin.dashboard; home tenant → tenant.dashboard; else deny
}
```

### `SyncTenants` (command)
```php
#[Signature('app:sync-tenants')]
#[Description('Sinkronisasi tenant dari Optigate Portal API (create/update/deactivate/reactivate).')]
class SyncTenants extends Command
{
    protected const PER_PAGE = 100;
    protected const MAX_PAGES = 100;

    public function handle(): int
    // Returns Command::SUCCESS or Command::FAILURE
    // Outputs: created, updated, deactivated, reactivated counts
}
```

### `TenantController::sync()` (updated return shape)
Returns Inertia response with JSON payload:
```json
{
  "success": true,
  "message": "Sinkronisasi selesai!",
  "data": {
    "created": 0,
    "updated": 0,
    "deactivated": 0,
    "reactivated": 0,
    "total": 0
  }
}
```

---

## 4. Task breakdown (atomic, testable, commit-able)

### Phase 1 — Task A: Tenant sync reconfiguration (backend + frontend)

**A1. Write tests first** (`tests/Feature/Console/SyncTenantsTest.php`)
- Sync with empty config → `FAILURE`, error message about `WEB_PORTAL_URL` / `WEB_PORTAL_TOKEN`
- Single page of companies → create + update counts correct
- Paginated response → fetches all pages
- Company missing from API but exists locally → `is_active = false`, `deactivated_at` set
- Company reappears in API → `is_active = true`, `deactivated_at` null
- Company with missing `id` or `name` → skipped with log warning
- Sync timestamps updated (`last_department_synced_at` untouched — only tenant-level)

**A2. Rewrite `SyncTenants.php`** following opti-works pattern (pagination, deactivate/reactivate, field validation, structured logging)

**A3. Update `TenantController::sync()`** to return Inertia JSON with detailed sync counts (created/updated/deactivated/reactivated) instead of generic redirect flash

**A4. Update `resources/js/pages/tenants/Index.tsx`** — frontend rebuild:
- Add sync result state (created/updated/deactivated/reactivated counts)
- Display sync results toast/notification after sync completes with breakdown
- Show last-synced timestamp per tenant or overall sync status
- Better error handling: display sync error messages with details
- Keep existing sync confirmation dialog and table

**A5. Run tests** — `php artisan test --filter=SyncTenantsTest` — all green

**A6. Pint + PHPStan** on `SyncTenants.php` and `TenantController.php`

**A7. ESLint/Prettier** on `Index.tsx`

**A8. Commit** — `feat: reconfigure tenant sync with pagination, deactivate/reactivate + frontend sync results UI`

---

### Phase 2 — Task B: SAML login & tenant set

**B1. Write tests first**

`tests/Feature/Services/SamlTenantResolverTest.php`:
- Match assertion company name → `found(tenant)`
- No `company` attribute → `denied(REASON_NO_COMPANY_DATA)`
- Company name doesn't match any tenant → `denied(REASON_NO_MATCH)`
- Multiple tenants with same name → `denied(REASON_MULTIPLE_MATCHES)`
- Matched tenant is inactive → `denied(REASON_INACTIVE)`
- Case-insensitive, trimmed match works

`tests/Feature/Services/LoginProvisioningServiceTest.php`:
- Platform email → `is_super_admin = true`, `super_admin` role, `tenant_id` untouched
- Non-platform user, no roles, no employee link → `guest` role assigned
- Already has roles → no `guest` role added
- Idempotent: running twice doesn't duplicate roles

`tests/Feature/Services/LoginLandingTest.php`:
- Super-admin → `admin.dashboard`
- User with home tenant → `tenant.dashboard` with tenant code
- User with roles but no tenant → deny `no_tenant`, session logged out
- User with no roles → deny `no_role`, session logged out

`tests/Feature/Auth/SamlAcsTenantTest.php`:
- Valid assertion with matching company → login, tenant_id set, redirect to tenant dashboard
- Assertion with no matching tenant → logout, redirect to `saml.denied` with reason
- Platform super-admin → bypasses tenant denial, goes to admin dashboard

**B2. Create `app/Services/SamlTenantResolution.php`** — value object

**B3. Create `app/Services/SamlTenantResolver.php`** — adapted to onelogin attribute array

**B4. Create `app/Services/LoginProvisioningService.php`** — role bootstrap

**B5. Create `app/Services/LoginLanding.php`** — post-login landing

**B6. Modify `app/Http/Controllers/Auth/SamlController.php`** — ACS flow: provision → resolve tenant → deny if no tenant → set tenant_id → login → landing redirect

**B7. Add `GET /saml/denied` route** in `routes/web.php` (Inertia page or simple view showing denial reason)

**B8. Run all Task B tests** — `php artisan test --filter=SamlTenantResolverTest|LoginProvisioningServiceTest|LoginLandingTest|SamlAcsTenantTest` — all green

**B9. Pint + PHPStan** on all new/modified PHP files

**B10. Commit** — `feat: SAML login with tenant resolution and role provisioning`

---

## 5. Integration notes

- **User model** already has `isSuperAdmin()`, `tenant_id` fillable, `HasRoles` — no changes needed.
- **Tenant model** already has `whereCode()`, `is_active`, `deactivated_at` — no changes needed.
- **TenantFinder** already does 3-tier resolution — no changes needed.
- **TenantAccess** already has `canOperate()`, `operableTenants()`, `canManageTenants()` — no changes needed.
- **`config/auth.php`** already has `super_admin_email` — no changes needed.
- **SAML settings** in `config/saml.php` already configured — no changes needed.
- **The `company` SAML attribute** must be released by OptiGate IdP (per docs: assertion carries company NAME). If not present, resolver returns `REASON_NO_COMPANY_DATA`.
- **Frontend:** `Index.tsx` already imports `tenantsSync` from `@/routes/tenants` and has a sync confirmation dialog — only needs sync result display enhancement.

---

## 6. Verification (before declaring complete)

1. `vendor/bin/pint --format agent` on all changed PHP files
2. `vendor/bin/phpstan analyse` at level 7 on changed files
3. Run affected tests:
   - `php artisan test --filter=SyncTenantsTest`
   - `php artisan test --filter=SamlTenantResolverTest`
   - `php artisan test --filter=LoginProvisioningServiceTest`
   - `php artisan test --filter=LoginLandingTest`
   - `php artisan test --filter=SamlAcsTenantTest`
   - `php artisan test --filter=SamlLoginTest` (existing — ensure no regression)
   - `php artisan test --filter=TenantSwitchTest` (existing — ensure no regression)
4. Run ESLint/Prettier on changed frontend files
5. Ask user if they want full suite: `php artisan test --compact`

---

## 7. Effort estimate

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 — Tenant sync (backend + frontend) | A1–A8 | ~0.75 day |
| Phase 2 — SAML login + tenant set | B1–B10 | ~1 day |
| **Total** | | **~1.75 days** |

---

*Prepared per writing-plans skill. Ready for review before implementation.*