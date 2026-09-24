# 12: Status & classification recipes on-system (prefactor)

**What to build:** Everywhere an asset's status or classification level appears (asset page, dashboard, other consumers), colors follow the locked DESIGN.md §3.2 status map and neutral level treatments instead of the ad-hoc rainbow. Status badges render as soft-rectangle tints (text/bg/border recipes, sans labels, no mono-caps stamps); classification level chips are quiet neutral outline chips where color no longer encodes hierarchy. Visual change is immediate in both themes; behavior untouched.

**Blocked by:** None (can start immediately).

**Status:** done (d2cb226)

- [ ] Status chip recipes in the shared status lib map to DESIGN.md §3.2 tokens (light + dark) for all 5 statuses; unknown/empty falls back to neutral
- [ ] Status badge shape: 4px radius soft-rectangle, sans-serif label, optional icon — no mono-caps ledger stamp styling
- [ ] Classification level tints replaced with neutral outline chips (bg/fg pairs legible in both themes); LevelIcon stays as the per-level affordance
- [ ] All consumers of the shared libs render correctly in light + dark (spot-check asset page + dashboard)
- [ ] `npm run types:check` and lint on touched files pass
