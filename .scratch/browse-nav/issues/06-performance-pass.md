# 06: Performance pass (queries + render)

**What to build:** Measured baseline before/after: Browse payload stays one round trip, tree uses its existing single withCount query set (verified against N+1), and the list render is profiled so the ledger records what was measured, what moved, and what was reverted.

**Blocked by:** 02, 05.

**Status:** ready-for-agent

- [ ] Query count for `/assets` (root and scoped) captured before and after; no N+1 introduced or left in tree building
- [ ] Inertia partial props (`only`) still used for filter navigation; full reload not reintroduced
- [ ] AssetCard / AssetLedgerTable rendering profiled (React DevTools / long tasks); changes kept only if they beat baseline beyond noise, reverted otherwise — ledger in ticket comments
- [ ] No new memo/useMemo added where React Compiler already covers it (project rule)
- [ ] PHPUnit suite green after changes
