# TODO — Permissions Feature Rebuild

Plan: `tasks/plan.md` · Scope: full rebuild · Bridge: sync-at-login · `migrate:fresh --seed` approved.

## Phase 1: Teardown

- [x] Task 1: Remove permissions feature (migrations, seeders, controllers, requests, tests, UI pages, routes, sidebar links)

## Phase 2: Foundation

- [x] Task 2: Single permission-tables migration (`model_id` string) + `migrate:fresh --seed`
- [x] Task 3: Seeders rebuilt (super-admin = no permissions) + `Gate::before` cleanup

## Phase 3: Role Bridge

- [x] Task 4: `SyncUserRolesFromEmployeeAction` + `Login` event listener + re-sync after employee role change

## Phase 4: Admin Slices

- [x] Task 5: Role admin slice (controller + requests + `role.*` gates + routes + wayfinder)
- [x] Task 6: Permission admin slice (controller + requests + `permission.*` gates + routes + wayfinder)
- [x] Task 7: Recreate roles/permissions UI pages (restored from git) + sidebar entries

## Phase 5: Polish

- [x] Task 8: Pint, phpstan (my files clean), full suite (321 passed), frontend checks, wayfinder, memory + graphify

## Checkpoints

- [x] After Task 3: `migrate:fresh --seed` green; infra tests pass
- [x] After Task 7: end-to-end login→roles→gates covered by tests
- [x] Task 8: all suites green, docs updated
