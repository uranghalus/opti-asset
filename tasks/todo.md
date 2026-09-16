# TODO — PRD Gap Closure

Plan: `tasks/plan.md` · Approved 2026-09-16 · Scope: full gap closure

## Phase 1: Security

- [ ] Task 1: Gates on AssetController + AssetHistoryController (`asset.view/create/edit/delete`) + tests
- [ ] Task 2: Gates on AssetTransferController + AssetDisposalController + tests
- [ ] Task 3: `asset.item.*` permissions + gates on Item/Category/Location controllers + sidebar gating
- [ ] Task 4: `audit.view` gate on AuditLogController + sidebar link
- [ ] Task 5: FR-07.6 disposed-asset guard (transfer store + asset edit/delete paths) + tests

## Checkpoint: Security

- [ ] Focused test runs green; 403 for users without permissions; sidebar respects permissions

## Phase 2: FR-13 Completion

- [ ] Task 6: DepreciationCalculator (monthly straight-line + 200% DDB floored at zero) wired into AssetObserver; forms show derived accumulation
- [ ] Task 7: Monthly book-value snapshots (replace daily dedup) + tests
- [ ] Task 8: FR-13.10 book-value history UI on asset Show page (impeccable craft-floor)
- [ ] Task 9: FR-13.9 record asset_type/override changes in RecordAssetHistoryAction + tests

## Checkpoint: FR-13 Complete

- [ ] Hand-verified depreciation examples pass; FR-13.1–13.11 all demonstrably met

## Phase 3: Dashboard & Filters

- [ ] Task 10: FR-13.8 dashboard breakdown per asset type (count + value) (impeccable craft-floor) + tests
- [ ] Task 11: FR-04 Browse location filter + item-name search + tests

## Checkpoint: Features Complete

- [ ] Dashboard type card + Browse filters verified

## Phase 4: CI Green

- [ ] Task 12: ESLint --fix + Pint + format residuals
- [ ] Task 13: PHPStan level 7 → 0 errors
- [ ] Task 14: Full `composer ci:check` green + PRD §12 update + Memory update + graphify update

## Checkpoints

- [ ] After Phase 1: security tests green
- [ ] After Phase 2: depreciation hand-checks pass
- [ ] After Phase 4: `composer ci:check` fully green; PRD + memory updated
