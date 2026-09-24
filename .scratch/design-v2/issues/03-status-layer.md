# 03: Status & tipe layer — constants module + StatusBadge/TipeBadge

**What to build:** Any asset surfaced anywhere (card, table row, scan sheet, detail header, dashboard metric) shows status and tipe via two locked badge components driven by one shared constants module — DESIGN.md §3.2 recipes (text/bg/border per status, light + dark), never inline hexes. A viewer can name an asset's status in under a second without opening detail.

**Blocked by:** 01 (tokens & fonts — recipes use the new theme tokens).

**Status:** ready-for-agent

- [ ] Shared constants module maps all 5 status codes (ACT/LOAN/RPR/MUT/DSP) + 2 tipe values to §3.2 recipes; no inline hexes in components
- [ ] `StatusBadge` and `TipeBadge` components with soft-rectangle shape (4px), text + optional 6px leading dot; correct dark-theme variants
- [ ] Status colors used nowhere decoratively; primary CTAs remain teal (Status Lock Rule)
- [ ] Existing asset card/list/detail/scan surfaces render the badges; DSP rows get muted treatment in lists
- [ ] Badges expose real text content (not aria-label only); contrast verified AA in both themes
- [ ] Tests/unit checks cover the constants map (5 statuses × 2 themes + 2 tipe values)
