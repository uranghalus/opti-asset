# Aset Drill-down Navigation: Findable, Readable, Forgiving

## Problem Statement
How might we let a non-technical first-time user find the right asset through the 4-level classification drill-down — without misreading truncated labels, getting lost, or fighting cramped filters — while trained staff keep full speed?

## Recommended Direction
**Honor the end user's requested drill-down, and make it self-explanatory.** Four connected fixes, all grounded in live-tested findings:

1. **Wayfinding over repetition.** The selected node's full path appears once, as the page title ("Jalur"): "Alat Kerja Kantor (Elektronik) — Alat Kerja Kantor". Sidebar tree, breadcrumb, table chain, and folder chips all repeat it today; ancestors at or above the scope are removed from rows and chips (ADR 0002). Classification codes stay monospace-first so staff can pattern-match `03.08.01.03` at a glance.
2. **No empty dead-ends.** Every node shows its asset count before you click it. Scoping to a node with zero direct assets auto-falls back to showing descendant assets with the count visible ("5 aset di bawah node ini"), so a layperson never lands on what looks like a broken page. "Tanpa Klasifikasi" (23 of 28 assets today) stays pinned with its count as the visible nudge to classify.
3. **Filters proportioned and honest.** Search takes the wide first slot; Tipe/Status/Lokasi move into one labeled Filter panel (popover) whose trigger shows the active count; active filters render as removable chips so the current query is always visible. Fixes the live bugs: the mislabeled Filter button that actually clears, invisible `bg-white/10` triggers, and root search returning nothing (backend `assets=null` without a node — removed per ADR 0001).
4. **Truncation budget.** Labels wrap to two lines in the tree with min-width columns; "code-first" ordering means the truncation hits the *name tail*, not the identifying code.

## Key Assumptions to Validate
- [ ] Laypeople actually search first, drill-down second — watch 3–5 real users' first 2 minutes ( moderated test or session replay)
- [ ] Auto-fallback showing descendant assets doesn't mislead users into thinking they see the node's *direct* children — test with the count label copy
- [ ] Staff don't lose speed when ancestor repetition is removed — check with 1–2 Staff Asset users

## MVP Scope
- Browse page only (sidebar tree, FilterBar, table + cards, page title).
- Scope-relative rows (hide ancestors), code-first chains, 2-line wrap, counts on every tree node.
- Filter panel + removable active-filter chips + wide search; fix root search (backend) and the Filter-clears bug.
- Tanpa Klasifikasi pinned with count; empty-scope guidance state.

## Not Doing (and Why)
- **Replacing the tree with cascading selects or a flat table** — the end user explicitly asked for drill-down grouping; this would re-litigate the request, not fix usability (ADR 0001).
- **Tooltips for truncated labels** — meaning hidden behind hover fails on touch and for first-time users.
- **Renaming master classification data** — governance problem, not UI; do it in the Klasifikasi module with the data owner.
- **Saved filter views / custom columns** — power-user features; staff needs are served by the existing table + toggle.
- **Mobile drill-down redesign** — separate surface (bottom-sheet tree); this one-pager covers the desktop Browse.

## Open Questions
- ~~Should the auto-fallback apply one level down or all descendants (flat)?~~ **Resolved: all descendants** with the count label.
- ~~Does the Klasifikasi master module need the same treatment in the same pass?~~ **Resolved: no — Browse only** this pass.
- Do we keep the "Indeks klasifikasi" drawer on mobile as the pattern for the later mobile pass, or rework it?
