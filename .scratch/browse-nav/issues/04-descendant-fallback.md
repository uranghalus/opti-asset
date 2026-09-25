# 04: Descendant fallback for empty scopes

**What to build:** Clicking a node with zero direct assets shows every asset below that node with an honest label ("X aset di bawah node ini") instead of an empty page. No dead ends in the drill-down.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] Scoping a cluster with 0 direct assets but N descendant assets lists those N assets
- [ ] The list header states "X aset di bawah node ini" when fallback is active; direct-match header unchanged
- [ ] Tanpa Klasifikasi node keeps its exact current behavior (no fallback semantics)
- [ ] Empty result only when the node truly has no descendants; guidance state points up one level
