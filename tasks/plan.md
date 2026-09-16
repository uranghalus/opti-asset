# Implementation Plan: PRD Gap Closure — Opti-Asset

Approved 2026-09-16 (build mode). Replaces the stale mobile-first plan.

## Overview
Close every verified gap between PRD v1.3 and the codebase: enforce RBAC on all ungated controllers (FR-11.3), guard disposed assets from transactions (FR-07.6), add automatic monthly depreciation (FR-13.5/13.10), asset-type dashboard breakdown (FR-13.8), book-value history UI (FR-13.10), type-change history entries (FR-13.9), Browse location filter + item-name search (FR-04), and make CI green (PHPStan + ESLint). Scope: full gap closure; NFR hardening (backups, perf, monitoring) and UI polish are out of scope. Depreciation choices: monthly per-period snapshots; standard formulas without salvage (straight-line = cost ÷ life; declining = 200% double-declining floored at zero; `none` = 0).

## Architecture Decisions
- Gates follow the existing permission catalogue (`asset.view/create/edit/delete`, `asset.transfer.*`, `asset.disposal.*`, `asset.category.*`, `asset.location.*`, `audit.view`); add `asset.item.*` for items (no permission exists today). Approve/reject map to `.edit`. Pattern: `Gate::authorize()` at controller top, as in `ReportController`/`CapitalizationThresholdController`.
- Sidebar links hidden when unauthorized using the existing gated-page pattern.
- Depreciation computed server-side in a `DepreciationCalculator` service, invoked from `AssetObserver` on save; `accumulated_depreciation` becomes derived (forms show it read-only). Monthly snapshot cadence replaces daily dedup — one row per (asset, month), first save of the month wins.
- Depreciation starts from `in_come_date` (months in service), capped at acquisition cost.
- Test convention (project memory): gated-endpoint tests create permission rows in `setUp` and `givePermissionTo`; count assertions stay relative to fixtures.

## Task List (detail + acceptance criteria in tasks/todo.md)

### Phase 1 — Security (fail fast)
1. Gates on AssetController + AssetHistoryController
2. Gates on Transfer + Disposal controllers
3. `asset.item.*` permissions + gates on Item/Category/Location + sidebar gating
4. `audit.view` gate on AuditLogController
5. FR-07.6 disposed-asset guard

### Phase 2 — FR-13 completion
6. DepreciationCalculator service (monthly SL + 200% DDB) wired into AssetObserver
7. Monthly book-value snapshots (replace daily dedup)
8. FR-13.10 book-value history UI on Show page
9. FR-13.9 record asset_type/override changes in history

### Phase 3 — Dashboard & filters
10. FR-13.8 dashboard breakdown per asset type (count + value)
11. FR-04 gaps — Browse location filter + item-name search

### Phase 4 — CI green
12. ESLint --fix + Pint + format residuals
13. PHPStan level 7 → 0 errors (93 pre-existing)
14. Full `composer ci:check` green + update PRD §12 + Memory + graphify update

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Adding gates breaks many of the 321 existing tests | High | Update fixtures per memory convention in the same task; run focused filter after each controller |
| Depreciation recompute changes existing book values | Med | Only compute when method != none and useful_life_years set; cap at cost; hand-verified test cases |
| Monthly snapshot change alters CapitalizationThresholdTest expectations | Low | Update expectations with explicit same-month dedup test |
| ESLint --fix churns dashboard files | Low | Own task (12), after feature tasks |
| PHPStan fixes mask real bugs | Med | Type-narrowing only; full suite after Task 13 |

## Open Questions
- Role-permission mapping defaults: staff-asset = full asset/item/transfer-create/disposal-create; manager = view + approve; akunting = view + reports. Adjust if the team wants different splits.
- `accumulated_depreciation` becomes fully derived; import action sets method + cost instead.

## Out of Scope (explicit)
- NFR hardening: scheduled backups (NFR-11), performance/load verification (NFR-01), monitoring hooks
- NOON/UI polish pass (dedicated session with impeccable skill)
- PRD §12.2 "Sync eksternal" row is stale (sync commands exist) — flagged to product owner
