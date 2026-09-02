# Opti-Asset Project Memory

## Links

- **Logs Directory**: `Memory/logs/`
- **Log File**: `Memory/logs/2026-08-31.md`
- **Memory File**: `Memory/opencode-memory.md`

## Documentation

Memory documentation lives in `Memory/opencode-memory.md` and is linked to logs via the `logs/` directory.

**Note**: All logs are stored in `Memory/logs/` and referenced in `Memory/opencode-memory.md`.

## Memory & Logs Relationship

The memory documentation (`Memory/opencode-memory.md`) contains all project decisions, architecture notes, and implementation details. Log files in `Memory/logs/` provide runtime context that complements the static documentation.

**Important**: The memory.md file contains the canonical reference for all design decisions and architectural choices. Always check memory.md before making changes to understand the current state of the system.

---

## Session Progress — 2026-09-02

### Completed Tasks ✅

1. **OIDC Migration** — Verified migration `add_oidc_fields_to_users_table` already applied (fields `oidc_id`, `last_login_at`, `last_login_ip` exist in DB)

2. **Wayfinder Regeneration** — Ran `php artisan wayfinder:generate --with-form` successfully

3. **Import Assets — Positional Fallback & Tests** 
   - Fixed `ImportAssetsAction::resolveClassificationFromKode()` to select `['id', 'code']` for error messages
   - Added 5 new tests in `RoleFilterLevelTest.php`:
     - `test_import_resolves_classification_by_exact_kode`
     - `test_import_resolves_classification_by_positional_fallback`
     - `test_import_records_errors_for_unknown_group_segment`
     - `test_import_records_errors_for_unknown_category_segment`
     - `test_import_records_errors_for_unknown_subcluster_segment`

4. **Import Asset — Optional Item Selection**
   - Made `item_id` nullable in `ImportAssetsRequest`
   - Added `resolveFallbackItem()` to auto-create "Imported Item" when no item selected and no item column in file
   - Updated `AssetController::import()` to pass null when `item_id` not provided
   - Replaced `test_import_requires_item` with `test_import_without_item_or_item_column_creates_default_item`

5. **Role-Based Filter Levels (Backend)**
   - Created `config/asset_filters.php` with role-to-level mapping:
     - `super-admin`, `staff-asset`, `akunting` → `group`
     - `default` → `cluster`
   - Added `initialFilterLevel()` method to `AssetController`
   - Updated `index()` to pass `initialLevel` in filters prop
   - Updated `browse()` to use `initialFilterLevel()` as default level
   - Added 5 tests in `RoleFilterLevelTest.php` covering all roles

### In Progress 🔄

6. **Frontend: Role-Based Filter Levels (UI)**
   - **Done**: Added `initialFilterLevel` prop to `Index` page
   - **Done**: Added `view` state (`list` | `category`), `browseData`, `browseLoading` states
- **Done**: Added `useEffect` to fetch browse data when switching to category view
    - **Done**: Fixed TypeScript errors (added `route` global declaration, fixed `router.get` signature, `onSuccess` callback types)
    - **Done**: Added Tab/SegmentedControl UI for switching between List and Category views (glassmorphic)
    - **Done**: Conditional render `AssetsBrowse` component when `view === 'category'`
    - **Done**: Added `?json=1` branch in `AssetController::browse()` for lightweight client fetch
    - **Remaining**: Refactor `Browse.tsx` to be a reusable component accepting `pageProps` prop (Browse.tsx already accepts `Partial<PageProps>`; re-verify prop propagation through embedded fetch)

### Pending 📋

7. **CI Pipeline** — Run full checks: `npm run lint:check`, `npm run format:check`, `npm run types:check`, `php artisan test --compact` ✅ done on 2026-09-02 (all green)

8. **Impeccable UI Review** — Apply design system polish to new components

9. **Update Memory & Logs** — Finalize this entry

10. **Create graphify-out directory** — Initialize knowledge graph for project context ✅ done on 2026-09-02

11. **Update graphify with current memory state** — Add completed and pending tasks to graph

### Files Modified

| File | Change |
|------|--------|
| `config/asset_filters.php` | New config file for role-level mapping |
| `app/Actions/ImportAssetsAction.php` | Fix `first(['id','code'])`, add `resolveFallbackItem()` |
| `app/Http/Requests/ImportAssetsRequest.php` | Make `item_id` nullable |
| `app/Http/Controllers/AssetController.php` | Add `initialFilterLevel()`, update `index()` & `browse()` |
| `resources/js/types/global.d.ts` | Add global `route()` declaration |
| `resources/js/pages/assets/Index.tsx` | Add view state, browse data fetch, type fixes |
| `tests/Feature/AssetTest.php` | Replace import test, add role filter tests |
| `tests/Feature/RoleFilterLevelTest.php` | New test file for role-based filter levels |