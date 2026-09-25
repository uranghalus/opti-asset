# 07: Delete dead scaffolding + full verify

**What to build:** The unused NOON-era AssetCard duplicate is deleted, dead props removed, and the whole pipeline proves the rework: lint, format, types, PHPUnit, and a browser pass in both themes.

**Blocked by:** 03, 04, 05, 06.

**Status:** ready-for-agent

- [ ] `resources/js/components/asset-card.tsx` (NOON duplicate) deleted; no references remain
- [ ] Unused props (`allSelected`, `onToggleSelectAll`, `selectedCount`, `selectedNodeName` passthrough) removed from the filter bar API
- [ ] `npm run lint`, `npm run format:check`, `npm run types:check`, `php artisan test --compact` all green
- [ ] Browser pass: root + scoped + fallback + filters in light and dark at 1440px and 390px
