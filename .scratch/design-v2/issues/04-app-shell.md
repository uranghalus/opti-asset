# 04: App shell — opaque sidebar, topbar, mobile bottom tabs

**What to build:** Navigation matches the brief at every breakpoint: desktop = opaque collapsible sidebar + topbar with tenant switcher; mobile = top bar + 5-tab bottom bar (Beranda / Aset / **Scan** center-emphasized / Laporan / Lainnya) with toasts stacking above it. Permission-filtered nav items keep working via `useCan()`.

**Blocked by:** 01 (tokens & fonts — shell consumes the new tokens).

**Status:** ready-for-agent

- [ ] Sidebar fully opaque (`bg-surface`, 1px border, no translucency/blur at any opacity); active nav item uses teal treatment
- [ ] Topbar opaque with tenant switcher, appearance toggle, user menu; sticky shadow = `sticky` token only
- [ ] Mobile bottom bar: 5 tabs, Scan center-emphasized (larger glyph, same 44px target), opaque surface
- [ ] Toast region sits above mobile tab bar (safe-area aware) and stacks correctly
- [ ] `aria-current` on active nav items; skip link → main landmark present
- [ ] Permission-filtered items (`useCan()`) verified for super-admin, staff-asset, and a zero-role user
- [ ] Shell verified at 375px, 768px, 1024px, 1440px in both themes
