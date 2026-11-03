# Runbook Todos — SAML Login & Tenant Sync Reconfiguration

## Phase 0 — Initiation & Alignment
- [x] P0.1 Stakeholder alignment (scope, timeline, DoD)
- [x] P0.2 Compliance & security scoping (SAML assertion handling, tenant resolution denial)
- [x] P0.3 Gate criteria sign-off
- [x] P0.4 SSL certificate fix: SyncTenants.php now respects WEB_PORTAL_VERIFY_SSL config
- [x] P0.5 Bug fix: admin/dashboard 404 — route ordering conflict with {tenant}/dashboard; moved admin/dashboard before auth middleware group

## Phase 1 — Task A Backend (TDD)
- [ ] P1.1 Write `SyncTenantsTest.php` — RED (all tests fail first)
- [ ] P1.2 Rewrite `SyncTenants.php` (pagination, deactivate-missing, reactivate-returning, validation, logging, counts)
- [ ] P1.3 Update `TenantController::sync()` → Inertia JSON with sync counts
- [ ] P1.4 Pint + PHPStan on changed PHP files
- [ ] P1.5 Run Task A PHP tests — all GREEN

## Phase 2 — Task A Frontend
- [ ] P2.1 Update `Index.tsx` sync results/status/timestamps/error handling
- [ ] P2.2 ESLint + Prettier + tsc on `Index.tsx`
- [ ] P2.3 Verify sync results displayed in UI

## Phase 3 — Task B SAML Services (TDD)
- [ ] P3.1 Write `SamlTenantResolverTest.php` — RED
- [ ] P3.2 Write `LoginProvisioningServiceTest.php` — RED
- [ ] P3.3 Write `LoginLandingTest.php` — RED
- [ ] P3.4 Create `SamlTenantResolution.php` value object
- [ ] P3.5 Create `SamlTenantResolver.php`
- [ ] P3.6 Create `LoginProvisioningService.php`
- [ ] P3.7 Create `LoginLanding.php`
- [ ] P3.8 Pint + PHPStan on Task B PHP files
- [ ] P3.9 Run Task B unit tests — all GREEN

## Phase 4 — Task B SAML ACS & Denied Route
- [ ] P4.1 Write `SamlAcsTenantTest.php` — RED
- [ ] P4.2 Refactor `SamlController::acs()` provision→resolve→deny→set tenant_id→login→landing
- [ ] P4.3 Add `GET /saml/denied` route
- [ ] P4.4 Pint + PHPStan on `SamlController.php` + `routes/web.php`
- [ ] P4.5 Run ACS e2e tests + `SamlLoginTest` regression — all GREEN

## Phase 5 — Full Integration & Regression
- [ ] P5.1 Full test suite `php artisan test --compact`
- [ ] P5.2 Manual smoke: sync tenant from portal; SAML login as super-admin + tenant user
- [ ] P5.3 Pint dirty-check, PHPStan full, ESLint/Prettier/tsc full

## Phase 6 — Compliance & Security Sign-off
- [ ] P6.1 Legal/Compliance review (SAML data handling, tenant denial)
- [ ] P6.2 Brand Guardian review (denied page UI, Indonesian language)
- [ ] P6.3 Executive summary

## Phase 7 — Deployment & Launch
- [ ] P7.1 Deploy to production
- [ ] P7.2 Monitor + rollback plan
- [ ] P7.4 Vault + Supermemory sync per AGENTS.md protocol
