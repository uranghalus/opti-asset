# 01: Root search + filter value fixes

**What to build:** A layperson lands on the asset list, types in search, and finds assets — without selecting any classification node. "Semua Tipe" shows everything instead of nothing. The "Filter" button opens filter controls instead of silently clearing them.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `/assets?search=laptop` returns matching assets while no node is selected (root search works)
- [ ] Choosing "Semua Tipe" returns all assets, not zero (no `asset_type=all` reaches the query)
- [ ] The Filter button opens the filter controls; a separate reset control clears filters
- [ ] Existing AssetTest suite still passes; new coverage for root search
