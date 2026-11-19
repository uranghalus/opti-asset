# UI/UX Audit: AppSidebarLayout + Tenant Switcher

**Project:** Opti-Asset (Laravel 13 + Inertia.js v3 + React 19 + Tailwind CSS v4)  
**Audit Scope:** `resources/js/layouts/app/app-sidebar-layout.tsx` + all child components + tenant switcher  
**Audit Method:** ui-ux-pro-max skill (BM25 search on design system data + UX guidelines + stack guidelines)  
**Design System:** Persisted at `design-system/optiasset/MASTER.md` (Swiss Modernism 2.0)  
**Status:** Research & Planning complete — awaiting user review before implementation  

---

## 1. Audit Scope — Component Inventory

### Layout (root)
| # | Component | Path | Lines |
|---|-----------|------|-------|
| L1 | `AppSidebarLayout` | `resources/js/layouts/app/app-sidebar-layout.tsx` | 61 |

### Shell / Wrapper
| # | Component | Path | Lines |
|---|-----------|------|-------|
| S1 | `AppShell` | `resources/js/components/app-shell.tsx` | 22 |
| S2 | `AppContent` | `resources/js/components/app-content.tsx` | 22 |

### Sidebar (desktop)
| # | Component | Path | Lines |
|---|-----------|------|-------|
| SB1 | `AppSidebar` | `resources/js/components/app-sidebar.tsx` | 135 |
| SB2 | `NavMain` | `resources/js/components/nav-main.tsx` | 107 |
| SB3 | `NavUser` | `resources/js/components/nav-user.tsx` | 72 |
| SB4 | `AppLogoIcon` | `resources/js/components/app-logo-icon.tsx` | 13 |

### Header / Topbar
| # | Component | Path | Lines |
|---|-----------|------|-------|
| H1 | `AppSidebarHeader` | `resources/js/components/app-sidebar-header.tsx` | 116 |
| H2 | `SearchBar` | `resources/js/components/search-bar.tsx` | 40 |
| H3 | `NotificationBell` | `resources/js/components/notification-bell.tsx` | 197 |
| H4 | `ThemeToggle` | `resources/js/components/theme-toggle.tsx` | 117 |
| H5 | `UserMenuContent` | `resources/js/components/user-menu-content.tsx` | 76 |

### Mobile
| # | Component | Path | Lines |
|---|-----------|------|-------|
| M1 | `MobileBottomNav` | `resources/js/components/mobile-bottom-nav.tsx` | 114 |
| M2 | `MobileSidebarSheet` | `resources/js/components/mobile-sidebar-sheet.tsx` | 181 |

### UI Primitives (shadcn/ui)
| # | Component | Path | Lines |
|---|-----------|------|-------|
| P1 | Sidebar (Radix-based) | `resources/js/components/ui/sidebar.tsx` | 719 |

### Data
| # | File | Path | Lines |
|---|------|------|-------|
| D1 | `sidebarData` | `resources/js/data/sidebar.ts` | 289 |

### Tenant Switcher
| # | Component | Path | Lines |
|---|-----------|------|-------|
| T1 | `TenantSelector` | `resources/js/components/tenant-selector.tsx` | 119 |

### Utilities
| # | File | Path | Lines |
|---|------|------|-------|
| U1 | `cn` + `toUrl` | `resources/js/lib/utils.ts` | 12 |

---

## 2. Design System Reference (from ui-ux-pro-max)

**Pattern:** Swiss Modernism 2.0 (Light + Dark supported)  
**Colors:** Primary `#1E3A8A`, On Primary `#FFFFFF`, Secondary `#3B82F6`, Accent `#7C3AED`, Background `#F8FAFC`, Card `#FFFFFF`, Border `#BFDBFE`, Destructive `#DC2626`  
**Typography:** EB Garamond / Crimson Text (academic mood)  
**Key Effects:** CSS Grid 12-col, gap 1rem, mathematical ratios  
**Avoid:** No search + flat hierarchy + noisy page chrome  

### Pre-Delivery Checklist (from ui-ux-pro-max)
- [x] No emojis as icons (use SVG: Heroicons/Lucide) — COMPLIANT (lucide-react used throughout)
- [x] cursor-pointer on all clickable elements — PARTIAL
- [x] Hover states with smooth transitions (150-300ms) — COMPLIANT (duration-150/300 used)
- [ ] Light mode: text contrast 4.5:1 minimum — NEEDS VERIFICATION
- [ ] Focus states visible for keyboard nav — PARTIAL (focus rings present but inconsistent)
- [ ] prefers-reduced-motion respected — NOT IMPLEMENTED
- [ ] Responsive: 375px, 768px, 1024px, 1440px — PARTIAL (768px breakpoint used)

---

## 3. Component-by-Component Audit

### L1: AppSidebarLayout (ROOT LAYOUT)

**What's good:**
- Proper mobile detection via `window.innerWidth < 768`
- Sidebar auto-closes when switching from mobile to desktop (`setSidebarOpen(false)`)
- Event listener cleanup on unmount
- Uses `AppShell` variant `"sidebar"` correctly

**Issues (polish only, no design change):**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| L1-1 | `isMobile` state initializes as `false` before `checkMobile()` runs, causing potential flash of desktop layout on mobile first load | Medium | Initialize with `typeof window !== 'undefined' ? window.innerWidth < 768 : false` |
| L1-2 | `pb-[calc(56px+env(safe-area-inset-bottom))]` on AppContent — hardcoded `56px` assumes bottom nav height; if MobileBottomNav height changes, this breaks | Medium | Use CSS variable or derive from actual nav height |
| L1-3 | No `aria-label` or landmark role on the layout wrapper for screen readers | Medium | Add `role="region"` with `aria-label="Main application shell"` to AppShell |
| L1-4 | Resize listener fires on every pixel change (no debounce/throttle) — performance concern on frequent resize | Low | Add requestAnimationFrame throttling or debounce (100ms) |

---

### S1: AppShell

**What's good:**
- Clean variant-based rendering (`sidebar` vs `header`)
- Uses `SidebarProvider` with `defaultOpen` from page props

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| S1-1 | `isOpen = page.props.sidebarOpen ?? true` — relies on server-rendered prop that may not match client state on hydration | Low | Consider `useEffect` to sync after mount instead of SSR prop |
| S1-2 | Header variant renders bare `<div>` without semantic `main` or `role` | Low | Use `<main>` tag with appropriate ARIA role |

---

### S2: AppContent

**What's good:**
- Uses `SidebarInset` from shadcn/ui for proper sidebar offset
- Variant-based rendering

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| S2-1 | Non-sidebar variant uses `max-w-7xl` which may be too wide for some content | Low | Consider `max-w-[90rem]` or container-query based |
| S2-2 | No `aria-label` on the `<main>` element for non-sidebar variant | Low | Add `aria-label="Main content"` |

---

### SB1: AppSidebar

**What's good:**
- Uses shadcn/ui Sidebar primitives (Sidebar, SidebarContent, etc.)
- Proper `cn()` utility for conditional classes
- Mobile variant: `fixed top-0 left-0 z-50 h-full w-[300px] max-w-[85vw]` — respects viewport width
- Glass effect with border
- Syncs controlled `open` prop with sidebar context (avoids initial render collapse)

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| SB1-1 | `_onClose` parameter has underscore prefix but is used — inconsistent naming | Low | Rename to `onClose` |
| SB1-2 | `sidebarData` imported but only used via `AppSidebar` → `NavMain` — check if sidebarData is passed down correctly | Low | Verify prop drilling chain |
| SB1-3 | `isMobile` prop is optional (`isMobile = false`) but layout always passes it — fine | Low | No action |
| SB1-4 | No `aria-label` on the Sidebar itself for screen readers | Medium | Add `aria-label="Main navigation"` to Sidebar component |
| SB1-5 | Mobile sidebar `z-50` may conflict with other z-50 elements (header is also `z-50`) | Low | Use distinct z-index scale (e.g., sidebar z-60, header z-50) |

---

### SB2: NavMain

**What's good:**
- Permission-based filtering (`useCan()`)
- Groups empty groups after filtering
- Uses `tenantUrl()` helper for tenant-prefixed URLs
- `isCurrentUrl` for active state detection

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| SB2-1 | Sidebar group labels use `text-[10px] font-extrabold tracking-widest` — very small, may be hard to read | Medium | Increase to `text-xs` or `text-[11px]` for better readability |
| SB2-2 | No visual indicator for collapsed state on group labels | Low | Add chevron/caret for collapsible groups |
| SB2-3 | Active state styling not clearly visible in truncated view | Medium | Ensure active item has distinct background/border in both light/dark |

---

### SB3: NavUser

**What's good:**
- Uses `useSidebar()` for mobile toggle
- `useIsMobile()` for responsive behavior
- Dropdown menu for user actions

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| SB3-1 | `SidebarMenuButton` with `size="lg"` and complex shadow — may be too prominent in sidebar | Low | Consider reducing visual weight |
| SB3-2 | Dropdown trigger inside `SidebarMenuItem` — nested interactive contexts may confuse screen readers | Medium | Ensure `aria-haspopup="menu"` and `aria-expanded` on trigger |

---

### SB4: AppLogoIcon

**What's good:**
- SVG with proper `viewBox`
- Accepts `SVGAttributes` for extensibility

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| SB4-1 | No `aria-label` or `role="img"` on the SVG | Medium | Add `aria-label="DutaAsset logo"` and `role="img"` |
| SB4-2 | No `focusable="false"` on SVG | Low | Add to prevent accidental focus |

---

### H1: AppSidebarHeader

**What's good:**
- Glass topbar with `backdrop-blur`
- Mobile menu button (lg:hidden)
- User avatar with initials fallback
- Theme toggle, notification bell, search bar, tenant selector
- Sticky positioning

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| H1-1 | `bg-glass px-4 py-3` — padding may be insufficient for touch on mobile (44px minimum) | Medium | Increase vertical padding to ensure 44px touch target |
| H1-2 | No `aria-label` on header landmark | Medium | Add `aria-label="Top navigation"` |
| H1-3 | `transition-[width,height]` on header — animating width/height causes layout recalculation (performance) | Low | Consider `transform` instead |
| H1-4 | Search bar and tenant selector have no visible labels for screen readers | Medium | Add `aria-label="Search"` and `aria-label="Select tenant"` |

---

### H2: SearchBar

**What's good:**
- Focus ring with `ring-4` and soft glow
- Group focus-within states
- Proper icon container

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| H2-1 | `<input type="text">` has no `name`, `id`, or `aria-label` — inaccessible | High | Add `aria-label="Search assets"` and associated `id` |
| H2-2 | Placeholder "Cari aset,..." — no visible label when input is empty | Medium | Add visible `<label>` or ensure aria-label is present |
| H2-3 | No `autocomplete` attribute | Low | Add `autocomplete="off"` or appropriate value |
| H2-4 | `ml-4 min-w-50 flex-1 md:min-w-62.5 lg:ml-6` — responsive widths inconsistent | Low | Standardize breakpoints |

---

### H3: NotificationBell

**What's good:**
- Hardcoded notifications with proper types (warning, success, info)
- `unread` flag per notification
- Type-based color coding (amber, emerald, blue)
- Popover-based dropdown

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| H3-1 | Notifications are hardcoded mock data — not connected to real API | High | Connect to real notification endpoint (out of scope for UI polish) |
| H3-2 | Bell icon has no `aria-label` or `aria-expanded` for the popover trigger | Medium | Add `aria-label="Notifications"` and `aria-expanded` |
| H3-3 | Popover content may not respect `focus-not-obscured` when header is sticky | Medium | Add `scroll-padding-top` to content area |
| H3-4 | Notification items: no clear visual distinction between read/unread beyond icon color | Low | Add background tint for unread items |

---

### H4: ThemeToggle

**What's good:**
- Three options: light, dark, system
- Uses `useAppearance()` hook
- Proper icons (Sun, Moon, Monitor)

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| H4-1 | Dropdown trigger button has no `aria-label` | Medium | Add `aria-label="Select appearance theme"` |
| H4-2 | Dropdown items have no `aria-pressed` or `aria-checked` for active selection | Medium | Add `aria-checked={appearance === option.value}` |

---

### H5: UserMenuContent

**What's good:**
- `DropdownMenuLabel` with user info card
- `DropdownMenuSeparator` with gradient
- Settings and logout options

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| H5-1 | `DropdownMenuLabel` used as interactive element but may not be keyboard accessible | Medium | Ensure label is not focusable if not actionable |
| H5-2 | Logout uses `router` from Inertia — ensure it triggers proper POST with CSRF | Low | Verify route definition |
| H5-3 | No `aria-label` on menu items | Low | Add `aria-label` to each menu item |

---

### M1: MobileBottomNav

**What's good:**
- 5 tabs (Beranda, Aset, Pindai, etc.)
- Uses Wayfinder for URLs (no hardcoding)
- Active state follows current URL
- Permission-based visibility (`useCan()`)
- Comment references DESIGN.md §6: P2 thumb-first, 44px+ touch, Scan centered

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| M1-1 | Tab buttons need to be verified for 44px minimum touch target | High | Verify each tab is at least 44x44px tap target |
| M1-2 | No `aria-label` on individual nav tabs | Medium | Add `aria-label` to each tab button |
| M1-3 | `match` function for active state uses string comparison — fragile if URL structure changes | Low | Use route name matching instead |
| M1-4 | Scan tab centered — good for thumb zone | Good | Keep |

---

### M2: MobileSidebarSheet

**What's good:**
- Uses `Sheet` from shadcn/ui
- Filters sidebar items by permission
- `document.body.style.overflow = 'hidden'` prevents background scroll when open
- Restores overflow on close

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| M2-1 | `document.body.style.overflow` manipulation can conflict with other scroll-lock logic | Low | Consider using a dedicated scroll-lock utility |
| M2-2 | Sheet content may not have proper `aria-modal="true"` | Medium | Verify SheetContent has `aria-modal` |
| M2-3 | No keyboard escape handling (Escape key to close) | Medium | Add Escape key listener to close sheet |
| M2-4 | Logo and user info at top — good for mobile context | Good | Keep |

---

### T1: TenantSelector (TENANT SWITCHER)

**What's good:**
- Uses `usePage()` for route context
- `switchTenant` from `@/lib/tenant` for Wayfinder-based switching
- Falls back to `onSelect` prop if provided
- Empty state with `Building2` icon

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| T1-1 | No visible label for the tenant selector itself | Medium | Add `aria-label="Select tenant"` or visible label |
| T1-2 | Empty state: "Belum ada tenant" message but no action to add/request tenant | Low | Add "Hubungi administrator" link/button |
| T1-3 | Tenant cards: need to verify touch target size (44px min) | Medium | Ensure each card is at least 44x44px |
| T1-4 | No visual indication of which tenant is currently active | Medium | Add `ring-2 ring-primary` or border highlight on active tenant |
| T1-5 | Cards may be too small for easy tapping on mobile | Medium | Increase card padding for mobile |
| T1-6 | `switchTenant(code, route)` — passes current route, but `route` from `usePage()` may not include all params | Low | Verify route object completeness |

---

### P1: Sidebar UI Primitive (shadcn/ui)

**What's good:**
- Radix-based (accessible by default)
- `SidebarProvider` with cookie persistence (`sidebar_state`, 7 days)
- `SidebarTrigger` with keyboard shortcut `b`
- `SidebarMenu` with proper Radix menu structure

**Issues:**

| ID | Issue | Severity | Recommendation |
|----|-------|----------|----------------|
| P1-1 | `SIDEBAR_WIDTH_ICON = "3rem"` (48px) — collapsed sidebar width may be too narrow for touch on mobile | Low | Acceptable for desktop collapsed state |
| P1-2 | Cookie-based state persistence — may conflict with server-rendered `sidebarOpen` prop | Low | Ensure client-side hydration sync |

---

### U1: `cn` Utility

**What's good:**
- Standard `clsx` + `tailwind-merge` combination
- `toUrl` helper for Inertia link props

**Issues:** None significant.

---

## 4. Cross-Cutting Issues

| ID | Area | Issue | Severity |
|----|------|-------|----------|
| X1 | Touch targets | Several buttons/icon buttons use `size-9` (36px) or `h-10` (40px) — below 44px WCAG minimum for mobile | High |
| X2 | Focus visible | Inconsistent `focus-visible:ring` usage across components | Medium |
| X3 | ARIA labels | Multiple interactive elements lack `aria-label` (search, bell, theme toggle, tenant cards, nav tabs) | High |
| X4 | Keyboard navigation | No Escape key handling on mobile sheet; no focus trap verification | Medium |
| X5 | Safe areas | `pb-[calc(56px+env(safe-area-inset-bottom))]` — good attempt but hardcoded 56px | Medium |
| X6 | Reduced motion | No `prefers-reduced-motion` handling | Low |
| X7 | Color contrast | Uses `slate-400`/`slate-500` for muted text — may be below 4.5:1 on some backgrounds | Medium |

---

## 5. Polish Recommendations (Priority Order)

### Phase 1 — Accessibility (High)
1. Add `aria-label` to all interactive elements without labels (search, bell, theme toggle, tenant cards, nav tabs, logo)
2. Verify all touch targets meet 44px minimum on mobile
3. Add `aria-expanded`/`aria-pressed` to dropdown triggers and toggle buttons
4. Add `role="img"` + `aria-label` to AppLogoIcon SVG

### Phase 2 — Mobile Polish (Medium)
1. Increase header padding for 44px touch compliance
2. Add Escape key handling to MobileSidebarSheet
3. Add `aria-label` to MobileBottomNav tabs
4. Add active tenant visual indicator in TenantSelector

### Phase 3 — Visual Polish (Low)
1. Debounce resize listener in AppSidebarLayout
2. Increase NavMain group label text size from `text-[10px]` to `text-xs`
3. Add `scroll-padding-top` to content for sticky header offset
4. Consider distinct z-index for sidebar vs header

---

## 6. Tenant Switcher Specific Recommendations

The `TenantSelector` is used in `AppSidebarHeader`. Key polish items:

1. **Active state:** Add visual ring/border on currently active tenant card
2. **Touch target:** Ensure each tenant card is min 44x44px
3. **Empty state:** Add actionable link ("Hubungi administrator") when no tenants
4. **Labeling:** Add `aria-label="Pilih tenant"` to the selector container
5. **Loading state:** Add loading spinner during tenant switch (currently uses `switching` state in dashboard page, not in selector itself)

---

## 7. Files Involved

**To be polished (no design change):**
- `resources/js/layouts/app/app-sidebar-layout.tsx`
- `resources/js/components/app-shell.tsx`
- `resources/js/components/app-content.tsx`
- `resources/js/components/app-sidebar.tsx`
- `resources/js/components/app-sidebar-header.tsx`
- `resources/js/components/nav-main.tsx`
- `resources/js/components/nav-user.tsx`
- `resources/js/components/app-logo-icon.tsx`
- `resources/js/components/search-bar.tsx`
- `resources/js/components/notification-bell.tsx`
- `resources/js/components/theme-toggle.tsx`
- `resources/js/components/user-menu-content.tsx`
- `resources/js/components/mobile-bottom-nav.tsx`
- `resources/js/components/mobile-sidebar-sheet.tsx`
- `resources/js/components/tenant-selector.tsx`
- `resources/js/components/ui/sidebar.tsx`

**Already deleted (from previous task):**
- `app/Http/Controllers/Admin/DashboardController.php`
- `resources/js/pages/admin/dashboard.tsx`
- `tests/Feature/Admin/DashboardTest.php`

---

## 7. Next Steps (Awaiting User Review)

This is **PLANNING ONLY** — no implementation code has been written or modified.

**Proposed agent delegation (via @agents-orchestrator):**

| Agent | Task | Components |
|-------|------|------------|
| `engineering-frontend-developer` | Accessibility polish (aria-labels, focus visible, touch targets) | All components above |
| `engineering-frontend-developer` | Mobile polish (Escape key, debounce resize, safe areas) | Layout, MobileSidebarSheet, MobileBottomNav |
| `engineering-frontend-developer` | Tenant switcher polish (active state, labels, touch targets) | TenantSelector |

**Estimated effort:** 6–8 hours total across 2–3 agents.

**Please review this audit plan. Once approved, I will delegate to the appropriate agents via @agents-orchestrator for implementation.**
