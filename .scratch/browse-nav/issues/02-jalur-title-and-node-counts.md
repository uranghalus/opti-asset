# 02: Jalur page title + node counts

**What to build:** The page title carries the full classification path of the current scope once ("Peralatan Kantor & Rumah Tangga → Alat Kerja Kantor (Elektronik)"), replacing the redundant breadcrumb strip. Every tree node shows its asset count before clicking. "Tanpa Klasifikasi" stays pinned with its count as the primary nudge.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Scope page shows the full Golongan → … → node path as the page heading area (Jalur), per ADR 0001
- [ ] Breadcrumb strip removed from the Browse layout (no duplicate path)
- [ ] Tree rows and FolderChips show asset counts; Tanpa Klasifikasi remains pinned last
- [ ] Screen reader announces path context via the heading, no aria duplication
