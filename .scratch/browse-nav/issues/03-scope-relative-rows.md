# 03: Scope-relative rows + code-first chains

**What to build:** List rows stop repeating classification levels at or above the current scope (ADR 0002). Rows show only levels below the scope, code-first, wrapping to two lines — the "what data is this?" confusion ends.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] With a cluster scope, rows show only sub-cluster level (no cluster/category repetition)
- [ ] Without a scope, rows show the full chain code-first (kode mono leads the classification text)
- [ ] Long chains wrap to two lines instead of truncating to ellipsis; codes never truncated
- [ ] Table and card variants share the same rule; FolderChips child slots unchanged
