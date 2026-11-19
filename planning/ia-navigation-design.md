# Opti-Asset — Information Architecture & Navigation Design

**Project:** opti-asset | **Stack:** Laravel 13 + Inertia.js v3 + React 19 + Tailwind CSS v4  
**Domain:** Multi-tenant asset management (Indonesian enterprise) | **Language:** Indonesian (all UI text)  
**Status:** Design document — ready for developer handoff  
**Author:** ArchitectUX Agent | **Date:** 29 Oct 2026  

---

## 1. Executive Summary

This document specifies the Information Architecture (IA) and Navigation Structure for Opti-Asset, a multi-tenant asset management system serving 35 screens across 13 feature modules for 4 user roles. It covers site map, content hierarchy, role-based visibility, navigation structure (sidebar + mobile bottom nav), navigation flows (5 user journeys), and information hierarchy within 4 key screens.

### Source of Truth
- UX Research Reports: `planning/ux-research-report-part{1-4}.md`
- Existing nav config: `resources/js/data/sidebar.ts`
- Existing mobile nav: `resources/js/components/mobile-bottom-nav.tsx`
- Layout: `resources/js/layouts/app/app-sidebar-layout.tsx`
- Wayfinder routes: `resources/js/routes/**`

### Design Constraints (from UX research)
| Constraint | Value |
|---|---|
| Screen count | 35 screens across 13 modules |
| Roles | Super Admin, Asset Manager, Management, End User |
| Auth | Corporate SSO/OIDC, no local passwords; session-based tenant switching |
| Language | Indonesian |
| 3-click rule | Max 3 clicks to reach any asset detail or action |
| Performance | <3s page load; 10,000+ assets support |
| Devices | Desktop + Tablet + Mobile |
| Dark mode | WCAG 6:1 contrast, theme toggle required |
| Classification | 4-level: Golongan → Kategori → Cluster → Sub-Cluster |
| Asset statuses | ACT, LOAN, RPR, MUT, DSP |
| Asset types | Aktiva Tetap, Peralatan |

---

## 2. Information Architecture

### 2.1 Site Map — All 35 Screens by Module

The 35 screens are grouped into 13 feature modules. Each module has a primary entry point and child screens.

| # | Module | Screens | Entry URL | Role Visibility |
|---|--------|---------|-----------|-----------------|
| 1 | Dashboard | Dashboard | `/dashboard` | All roles |
| 2 | Asset Data Management | Asset List, Asset Create, Asset Edit, Asset Detail | `/assets` | All (read-only for Mgmt/End User) |
| 3 | Asset Classification | Classification Tree, Classification Detail/Edit (4 levels) | `/asset-classification` | Super Admin (CRUD), Asset Manager (view), Mgmt (view), End User (view) |
| 4 | Asset Item Management | Asset Item List, Asset Item Create/Edit | `/items` | Super Admin, Asset Manager |
| 5 | Barcode / QR Scan | Scan Camera, Scan Result, Manual Entry | `/assets/scan` | Super Admin, Asset Manager, End User |
| 6 | Mutation | Mutation List, Mutation Create, Mutation Detail, Approval | `/asset-transfers` | Super Admin, Asset Manager (create), Mgmt (view) |
| 7 | Disposal | Disposal List, Disposal Create, Disposal Detail, Approval | `/disposals` | Super Admin, Asset Manager (create), Mgmt (view) |
| 8 | Search & Filter | Global Search, Saved Filters, Filter Panel | `/search` | All roles |
| 9 | User & Role Management | User List, User Create/Edit, Role List, Role Edit, User Data Export | `/users`, `/employees/roles` | Super Admin only |
| 10 | Settings | Capitalization Threshold, Asset Type Rules, Tenant Settings | `/settings` | Super Admin only |
| 11 | Reporting | Report List, Report Builder, Report Export | `/reports` | Super Admin, Asset Manager, Mgmt (view) |
| 12 | Audit Trail | Audit Log List, Audit Log Detail | `/audit-logs` | Super Admin, Asset Manager (own), End User (own) |
| 13 | Asset Type / Accounting | Asset Type List, Accounting Rules | (Settings sub-section) | Super Admin only |

### 2.2 Content Hierarchy

```
Opti-Asset (tenant)
├── Dashboard (landing, role-specific widgets)
├── Manajemen Aset (sidebar group)
│   ├── Daftar Aset (Asset List — search, filter, table, pagination)
│   │   ├── Detail Aset (Asset Detail — Info / History / Accounting tabs)
│   │   ├── Tambah Aset (Asset Create)
│   │   └── Edit Aset (Asset Edit)
│   ├── Klasifikasi Aset (Classification Tree — 4-level drill-down)
│   │   └── Detail/Edit Klasifikasi
│   ├── Master Item (Asset Item List)
│   │   └── Tambah/Edit Item
│   ├── Pindai Barcode (Scan Camera → Scan Result → Manual fallback)
│   ├── Pindaan Aset (Mutation List → Create → Detail → Approval)
│   └── Penghapusan Aset (Disposal List → Create → Detail → Approval)
├── Organisasi (sidebar group)
│   ├── Users (User List → Create/Edit → Export)
│   └── Roles (Role List → Edit)
├── Laporan (sidebar group)
│   ├── Report List
│   ├── Report Builder
│   └── Export (PDF/Excel)
├── Audit Trail (sidebar group)
│   └── Audit Log List → Detail
└── Pengaturan (sidebar group)
    ├── Capitalization Threshold
    ├── Asset Type Rules
    └── Tenant Settings
```

### 2.3 Role-Based Visibility Matrix

| Screen | Super Admin | Asset Manager | Management | End User |
|--------|-------------|---------------|------------|----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Asset List | ✓ (all tenants) | ✓ (assigned) | ✓ (read-only) | ✓ (read-only, own assets) |
| Asset Create | ✓ | ✓ | ✗ | ✗ |
| Asset Edit | ✓ | ✓ | ✗ | ✗ |
| Asset Delete | ✓ | ✓ | ✗ | ✗ |
| Asset Detail | ✓ | ✓ | ✓ | ✓ (own) |
| Classification Tree | ✓ (CRUD) | ✓ (view) | ✓ (view) | ✓ (view) |
| Classification Edit | ✓ | ✗ | ✗ | ✗ |
| Asset Item List | ✓ | ✓ | ✗ | ✗ |
| Asset Item Create/Edit | ✓ | ✓ | ✗ | ✗ |
| Barcode Scan | ✓ | ✓ | ✗ | ✓ |
| Mutation List | ✓ | ✓ | ✓ (view) | ✗ |
| Mutation Create | ✓ | ✓ | ✗ | ✗ |
| Mutation Approve/Reject | ✓ | ✗ | ✗ | ✗ |
| Disposal List | ✓ | ✓ | ✓ (view) | ✗ |
| Disposal Create | ✓ | ✓ | ✗ | ✗ |
| Disposal Approve/Reject | ✓ | ✗ | ✗ | ✗ |
| Search & Filter | ✓ | ✓ | ✓ | ✓ |
| User List | ✓ | ✗ | ✗ | ✗ |
| User Create/Edit | ✓ | ✗ | ✗ | ✗ |
| Role List/Edit | ✓ | ✗ | ✗ | ✗ |
| User Data Export (FR-10.6) | ✓ | ✗ | ✗ | ✗ |
| Settings | ✓ | ✗ | ✗ | ✗ |
| Reports | ✓ | ✓ | ✓ (view) | ✗ |
| Audit Trail | ✓ | ✓ (own) | ✗ | ✓ (own) |

### 2.4 Screen-to-Module Mapping (35 screens)

1. Dashboard — Beranda
2. Asset List — Daftar Aset
3. Asset Create — Tambah Aset
4. Asset Edit — Edit Aset
5. Asset Detail — Detail Aset (Info tab)
6. Asset Detail — History tab
7. Asset Detail — Accounting tab
8. Classification Tree — Pohon Klasifikasi
9. Classification Detail — Detail Klasifikasi
10. Classification Edit — Edit Klasifikasi
11. Asset Item List — Daftar Item
12. Asset Item Create — Tambah Item
13. Asset Item Edit — Edit Item
14. Scan Camera — Kamera Pindai
15. Scan Result — Hasil Pindai
16. Manual Entry — Input Manual
17. Mutation List — Daftar Pindaan
18. Mutation Create — Ajukan Pindaan
19. Mutation Detail — Detail Pindaan
20. Mutation Approval — Persetujuan Pindaan
21. Disposal List — Daftar Penghapusan
22. Disposal Create — Ajukan Penghapusan
23. Disposal Detail — Detail Penghapusan
24. Disposal Approval — Persetujuan Penghapusan
25. Search — Pencarian
26. Saved Filters — Filter Tersimpan
27. User List — Daftar Pengguna
28. User Create/Edit — Tambah/Edit Pengguna
29. Role List — Daftar Peran
30. Role Edit — Edit Peran
31. User Data Export — Ekspor Data Pengguna (FR-10.6 pending)
32. Settings — Pengaturan Sistem
33. Capitalization Threshold — Ambang Kapitalisasi
34. Audit Trail — Jejak Audit
35. Reports — Laporan


## 3. Navigation Structure

### 3.1 Navigation Architecture — Two-Tier System

Opti-Asset uses a **two-tier navigation** that adapts by device:

| Tier | Desktop (≥768px) | Tablet/Mobile (<768px) |
|------|------------------|------------------------|
| Primary | Persistent left sidebar (AppSidebar) | Mobile bottom nav (5 tabs) |
| Secondary | AppSidebarHeader (tenant switcher, profile, theme) | AppSidebarSheet (slide-over drawer) |
| Contextual | Breadcrumbs (page-level) | Breadcrumbs (condensed) |

**Layout contract** (existing): `AppSidebarLayout` renders `AppSidebar` on desktop, `MobileBottomNav` + `MobileSidebarSheet` on mobile, with `AppContent` as `SidebarInset` wrapper.

### 3.2 Primary Navigation — Desktop Sidebar

**Container:** `AppSidebar` (persistent, left, collapsible)  
**Config source:** `resources/js/data/sidebar.ts` → `sidebarData.navGroups`

#### Sidebar Groups (in order)

| Group | Title | Items | Role Gate |
|-------|-------|-------|-----------|
| 1 | Umum | Dashboard | All |
| 2 | Manajemen Aset | Daftar Aset, Klasifikasi Aset, Master Item, Pindai Barcode, Pindaan Aset, Penghapusan Aset | Per-item permission |
| 3 | Organisasi | Users, Roles | Super Admin |
| 4 | Laporan | Report List, Report Builder | Super Admin, Asset Manager, Mgmt |
| 5 | Audit Trail | Audit Log List | Super Admin, Asset Manager, End User |
| 6 | Pengaturan | Settings, Capitalization Threshold, Asset Type Rules | Super Admin |

#### Sidebar Item Spec (per `SidebarNavItem` type)

```ts
{
    title: string;        // Indonesian label
    url: string;          // Wayfinder-generated URL (e.g., assets())
    icon: LucideIcon;     // From lucide-react
    permission?: {        // Optional; checked via useCan hook
        resource: string;
        actions: string[];
    };
}
```

**Permission enforcement:** Sidebar items with `permission` are hidden if `useCan(resource, actions)` returns false. Items render but are disabled (not hidden) when the user lacks permission — prevents "mystery meat" navigation while maintaining 3-click discoverability.

#### Sidebar Header (AppSidebarHeader)

Persistent at top of sidebar on all viewports:
- **Tenant Switcher** — dropdown showing current tenant name + badge; opens tenant list (session-based switching)
- **Profile** — user avatar, name, role; opens profile menu (Profil, Keluar/Logout)
- **Theme Toggle** — light/dark/system (WCAG 6:1, persists to localStorage)

### 3.3 Primary Navigation — Mobile Bottom Nav

**Container:** `MobileBottomNav` (fixed bottom, 5 tabs, 44px+ touch targets)  
**Config source:** `resources/js/components/mobile-bottom-nav.tsx` → `NAV_ITEMS`

| Tab | Label | Icon | URL | Permission | Active Match |
|-----|-------|------|-----|------------|--------------|
| 1 | Beranda | LayoutDashboard | `dashboard()` | null | path === '/dashboard' || '/' |
| 2 | Aset | Boxes | `assetsIndex()` | `asset.view` | path.startsWith('/assets') && !== scan |
| 3 | Pindai | ScanLine | `assetsScan()` | `asset.view` | path === '/assets/scan' |
| 4 | Organisasi | Building2 | `organizationsIndex()` | (org permission) | path.startsWith('/organizations') |
| 5 | Profil | Settings | `profileEdit()` | null | path.startsWith('/profile') |

**Design rules (from DESIGN.md §6):**
- Thumb-first placement (bottom, within easy reach)
- Scan tab centered as the most frequent field action
- Active state follows current URL via `match()` function
- Permission-gated tabs are hidden (not disabled) on mobile

**Note:** On mobile, the sidebar is replaced by `MobileSidebarSheet` (slide-over from left, triggered by hamburger in AppSidebarHeader). The bottom nav handles the 5 most frequent destinations; the sheet handles all remaining screens.

### 3.4 Secondary Navigation

| Element | Placement | Purpose |
|---------|-----------|---------|
| Tenant Switcher | AppSidebarHeader (top-right of sidebar/header) | Switch active tenant (session-based) |
| Theme Toggle | AppSidebarHeader | Light / Dark / System |
| Profile Menu | AppSidebarHeader | View profile, logout |
| Breadcrumbs | Below header, above content | Show location hierarchy; clickable to parent levels |
| Page Actions | Top-right of content area | Create, Export, Print, Filter |

### 3.5 Breadcrumb Strategy

**Pattern:** `Home > Module > Sub-section > Current Page`  
**Separator:** `/` or `>` chevron  
**First item:** "Beranda" linking to `/dashboard`  
**Last item:** Current page title (non-clickable, bold)

| Path | Breadcrumbs |
|------|-------------|
| `/assets` | Beranda / Daftar Aset |
| `/assets/create` | Beranda / Daftar Aset / Tambah Aset |
| `/assets/123` | Beranda / Daftar Aset / Aset #123 |
| `/assets/123/edit` | Beranda / Daftar Aset / Aset #123 / Edit |
| `/asset-classification` | Beranda / Klasifikasi Aset |
| `/assets/scan` | Beranda / Pindai Barcode |

**Implementation:** Breadcrumb component receives array of `BreadcrumbItem { title, href }`. Rendered as inline flex with truncation on mobile (show last 2 items + ellipsis).

**3-click rule compliance:** Any breadcrumb parent is one click away; combined with sidebar, any screen is reachable in ≤3 clicks from Dashboard.

### 3.6 Tenant Switcher Placement

**Location:** Top-right of `AppSidebarHeader`, always visible (desktop) / in mobile sheet (mobile).

**UX flow:**
1. User clicks tenant name/badge → dropdown opens
2. Dropdown lists available tenants (from session)
3. User selects tenant → session switches, page reloads with new tenant context
4. Current tenant shown with "Aktif" indicator

**Empty state:** Single tenant → show tenant name as static label (no dropdown). No tenants → redirect to onboarding.

**Visual:** Tenant icon (Building2) + tenant name + dropdown chevron + "Aktif" badge when selected.

---

## 4. Navigation Flow — User Journeys

Each journey specifies: Actor, Entry point, Step-by-step path with screens, Decision points, Exit conditions, and Click count (must satisfy 3-click rule).

### Journey 1: Asset CRUD

**Actor:** Asset Manager  
**Entry:** Dashboard → Daftar Aset (sidebar)  
**Click count to Asset Detail:** 2 clicks (Sidebar > Daftar Aset > click row) ✓

**Step-by-step:**
1. Login (SSO/OIDC) → Dashboard
2. Click "Daftar Aset" in sidebar → Asset List
3. (Optional) Search/filter assets → filtered list
4. Click asset row → Asset Detail (Info tab)
5. Decision: View → History tab / Accounting tab / Edit button
6. Click "Edit" → Asset Edit form → save → toast "Berhasil disimpan" → back to Asset Detail
7. Click "Hapus" → confirmation dialog (Indonesian) → confirm → toast "Berhasil dihapus" → back to Asset List
8. Click "Tambah Aset" → Asset Create → auto-generate code → fill form → save → Asset Detail of new asset

**Decision points:**
- After search: click row vs. apply filter vs. clear filter
- On Asset Detail: Info / History / Accounting tab switch
- On Asset Detail: Edit vs. Delete vs. Scan barcode
- On Asset Edit: Save vs. Cancel vs. Delete

**Exit conditions:** Asset saved/edited/deleted → return to Asset List with toast confirmation.

### Journey 2: Barcode Scan

**Actor:** Asset Manager / End User  
**Entry:** Asset List → Pindai button (or bottom nav "Pindai")  
**Click count to scan:** 2 clicks (Sidebar > Pindai / bottom nav tab) ✓

**Step-by-step:**
1. Click "Pindai Barcode" (sidebar) or "Pindai" (bottom nav) → Scan Camera
2. Camera permission prompt (first time only) → allow
3. Camera viewfinder active → point at barcode/QR
4. Auto-scan (<2s) → Scan Result screen with asset info
5. Decision: Asset found → "Lihat Detail" → Asset Detail; Asset not found → "Input Manual" → Manual Entry form → search by code
6. Manual Entry: type code → search → result → Asset Detail

**Decision points:**
- Camera access granted vs. denied → if denied, show "Input Manual" fallback prominently
- Scan result: valid asset → detail view; invalid/unknown → manual entry option
- Low light → toggle flashlight (camera control)

**Exit conditions:** Asset detail viewed → user continues workflow; manual entry completed → Asset Detail.

### Journey 3: Mutation / Disposal Approval

**Actor:** Super Admin (approver)  
**Entry:** Dashboard → Pindaan Aset / Penghapusan Aset  
**Click count to approval:** 3 clicks (Sidebar > Pindaan Aset > click item > Approve) ✓

**Step-by-step (Mutation):**
1. Dashboard shows pending approvals count → click "Pindaan Aset" → Mutation List
2. Filter by status "Menunggu Persetujuan" → filtered list
3. Click mutation item → Mutation Detail
4. Review asset details, from/to location, reason
5. Decision: Approve → confirmation dialog → "Disetujui" → status updates → toast; Reject → reason input → "Ditolak" → toast
6. After action → back to Mutation List (filtered view preserved)

**Step-by-step (Disposal):** same pattern, Disposal List → Disposal Detail → Approve/Reject.

**Decision points:**
- Approve vs. Reject (requires reason for reject)
- Reject reason: required field, Indonesian validation message
- Bulk actions: select multiple → bulk approve/reject (optional)

**Exit conditions:** Decision made → return to list with updated status badge + toast.

### Journey 4: Dashboard Review

**Actor:** Management (read-only)  
**Entry:** Login → Dashboard (auto-landing)  
**Click count to asset detail:** 3 clicks (Dashboard card → filter → asset row) ✓

**Step-by-step:**
1. Login → Dashboard (default landing for Management)
2. View summary cards: total assets, by status (ACT/LOAN/RPR/MUT/DSP), by type (Aktiva Tetap/Peralatan) [FR-13.8 pending]
3. Click chart segment (e.g., "LOAN 45 assets") → filtered Asset List
4. View asset table → click asset row → Asset Detail (read-only)
5. (Optional) Click "Laporan" → Report List → view/export report

**Decision points:**
- Which card/chart segment to drill into
- Date range filter on charts
- Export report (PDF/Excel)

**Exit conditions:** Review complete → logout or switch tenant.

### Journey 5: Settings Configuration

**Actor:** Super Admin  
**Entry:** Sidebar → Pengaturan  
**Click count to setting change:** 3 clicks (Sidebar > Pengaturan > Capitalization Threshold > edit) ✓

**Step-by-step:**
1. Click "Pengaturan" → Settings index page (cards/grid of setting categories)
2. Click "Ambang Kapitalisasi" → Capitalization Threshold form
3. Edit threshold value → validation (must be positive number) → save → toast
4. (Optional) Click "Aturan Tipe Aset" → Asset Type Rules → configure Aktiva Tetap vs Peralatan rules
5. (Optional) Click "Pengaturan Tenant" → tenant-specific config

**Decision points:**
- Which setting category to configure
- Value validation before save
- Apply to all tenants vs. current tenant (multi-tenant context)

**Exit conditions:** Settings saved → toast → back to Settings index.

---

## 5. Information Hierarchy — Key Screens

### 5.1 Asset List (Daftar Aset)

**Purpose:** Primary asset discovery and management screen. Most visited screen.

**Layout zones (top to bottom):**
1. **Page Header** — Title "Daftar Aset", subtitle count, action button "Tambah Aset" (primary), "Pindai" (secondary, scan icon)
2. **Search & Filter Bar** — Debounced search input (placeholder: "Cari kode/nama aset..."), filter chips (status, type, location), "Reset" link, "Filter" button opens drawer
3. **Results Summary** — "Menampilkan X dari Y aset" + sort dropdown
4. **Data Table** — Columns: Kode Aset, Nama Aset, Klasifikasi, Lokasi, Status (badge), Tanggal Perolehan, Aksi (detail/edit)
5. **Pagination** — Page selector, per-page dropdown, prev/next, total count
6. **Empty State** — Illustration + "Tidak ada aset ditemukan" + action buttons

**Information hierarchy:**
```
H1: Daftar Aset
  └── Search input (highest priority, top-left)
  └── Filter chips (secondary)
  └── Add button (primary action, top-right)
  └── Table (primary content)
       ├── Row: Kode Aset (strong) → Nama Aset → Klasifikasi → Status badge
       └── Aksi column: Detail (primary icon), Edit (secondary icon)
  └── Pagination (bottom)
```

**Responsive behavior:**
- Desktop: Full table, all columns visible, filter bar horizontal
- Tablet: Table scrolls horizontally, filter bar wraps
- Mobile: Cards instead of table (each asset = card), filter drawer slides from bottom, search at top

**Performance (NFR-06):** Skeleton loading states, virtual scrolling for 10,000+ assets, search debounce 300ms, pagination server-side.

### 5.2 Asset Detail (Detail Aset)

**Purpose:** Comprehensive asset information with three contexts: operational info, history, accounting.

**Layout:** Tabs below page header
- **Tab 1: Informasi (default)** — Asset identity, classification, location, status, acquisition
- **Tab 2: Riwayat (History)** — Timeline of mutations, disposals, status changes
- **Tab 3: Akuntansi (Accounting)** — Depreciation, book value, asset type, capitalization

**Tab 1 — Informasi hierarchy:**
```
H2: Informasi Aset
  ├── Asset Code (prominent, copy button)
  ├── Asset Name (H3)
  ├── Status badge (color-coded: ACT=green, LOAN=blue, RPR=orange, MUT=purple, DSP=red)
  ├── Grid of key-value: Classification, Location, Custodian, Acquisition Date, Condition
  ├── Action buttons: Edit, Hapus, Pindai Barcode (if has camera)
  └── Photo/upload area (if applicable)
```

**Tab 2 — Riwayat hierarchy:**
```
H2: Riwayat Aset
  └── Timeline (vertical, chronological desc)
       ├── Event: Pindaan → from Location A → Location B → date → user
       ├── Event: Penghapusan → date → approved by
       └── Event: Status change → ACT → LOAN → date
```

**Tab 3 — Akuntansi hierarchy:**
```
H2: Akuntansi Aset
  ├── Asset Type: Aktiva Tetap / Peralatan
  ├── Acquisition Value
  ├── Depreciation Method
  ├── Book Value (current)
  └── Depreciation Schedule (table)
```

**Responsive behavior:**
- Desktop: Tabs horizontal, full-width content
- Mobile: Tabs scrollable horizontally, content stacks vertically

### 5.3 Dashboard (Beranda)

**Purpose:** Role-specific executive overview. Landing page after login.

**Role-specific layouts:**

**Super Admin / Asset Manager:**
```
Grid of cards:
├── Total Aset (big number + trend)
├── Aset Aktif (ACT badge green)
├── Aset Dipinjam (LOAN badge blue)
├── Aset Perbaikan (RPR badge orange)
├── Aset Dipindahkan (MUT badge purple)
├── Aset Dihapus (DSP badge red)
└── Aset by Tipe (chart: Aktiva Tetap vs Peralatan) [FR-13.8 pending]
```

**Management:**
```
Grid of cards:
├── Total Aset (tenant)
├── Aset by Status (donut chart)
├── Aset by Tipe (bar chart) [FR-13.8 pending]
├── Recent Activity (list)
└── Quick Actions: Lihat Laporan, Ekspor
```

**End User:**
```
Simplified view:
├── My Assets (owned/custodian) count
├── Asset List (read-only, limited columns)
└── Scan button (barcode)
```

**Information hierarchy:**
```
H1: Beranda (or "Dashboard [Tenant]")
  └── Role-based greeting
  └── KPI cards row (2-4 columns, most important first)
  └── Charts row (donut/bar, interactive)
  └── Quick actions (secondary)
  └── Recent items (tertiary)
```

**Responsive behavior:**
- Desktop: 4-column card grid, charts side-by-side
- Tablet: 2-column card grid, charts stacked
- Mobile: Single column cards, charts full-width scrollable

### 5.4 Classification Tree (Pohon Klasifikasi)

**Purpose:** 4-level hierarchical classification management: Golongan → Kategori → Cluster → Sub-Cluster.

**Layout:** Master-detail split
- **Left panel (30%):** Tree view, 4 levels, collapsible nodes
- **Right panel (70%):** Selected node detail or empty state

**Tree hierarchy (visual indentation):```
Golongan (Level 1) — root nodes, expandable
  └── Kategori (Level 2) — indented, expandable
       └── Cluster (Level 3) — indented, expandable
            └── Sub-Cluster (Level 4) — leaf, selectable
```

**Node interaction:**
- Click node → select → load detail in right panel
- Click expand/collapse arrow → toggle children
- Super Admin: "Tambah" button appears on hover for addable levels
- Asset Manager / others: view-only, no edit controls

**Right panel — Node Detail:**
```
H2: [Level Name] — [Node Name]
  ├── Kode: [code]
  ├── Level: [Golongan|Kategori|Cluster|Sub-Cluster]
  ├── Induk: [parent name or "-" for root]
  ├── Jumlah Aset: [count]
  └── Aksi: Edit (Super Admin), Hapus (Super Admin), Tambah Child (if not Level 4)
```

**Responsive behavior:**
- Desktop: Split panel (tree left, detail right)
- Tablet: Split panel, narrower tree
- Mobile: Tree as full-screen list, drill-down navigation (back button), detail replaces tree

---

## 6. Navigation Component Specifications

### 6.1 Sidebar Item Component (desktop)

```tsx
// Conceptual — follows existing SidebarNavItem type
<SidebarItem item={navItem} isActive={boolean}>
  <Link href={item.url} className={cn("flex items-center gap-3...", isActive ? "bg-primary" : "")}>
    <item.icon className="w-5 h-5" />
    <span>{item.title}</span>
    {item.permission && <Badge>{item.permission.actions.join(',')}</Badge>}
  </Link>
</SidebarItem>
```

**States:** Default, Hover, Active (bg-primary + text-white), Disabled (opacity-50, cursor-not-allowed)

### 6.2 Mobile Bottom Tab Component

```tsx
// Follows existing NAV_ITEMS pattern in mobile-bottom-nav.tsx
<BottomTab item={navItem} isActive={boolean}>
  <Link href={item.href}>
    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted")} />
    <span className={cn("text-[10px] font-medium", isActive ? "font-bold" : "")}>
      {item.label}
    </span>
  </Link>
</BottomTab>
```

**States:** Default, Active (primary color + font-bold), Disabled (hidden if no permission)

### 6.3 Tenant Switcher Component

```tsx
<ThemeTenantSwitcher>
  <TenantDropdown>
    <Building2 className="w-4 h-4" />
    <span>{currentTenant.name}</span>
    <ChevronDown className="w-4 h-4" />
  </TenantDropdown>
  <ThemeToggle />
  <ProfileDropdown />
</ThemeTenantSwitcher>
```

### 6.4 Breadcrumb Component

```tsx
<Breadcrumbs items={[{title:'Beranda', href:'/'}, {title:'Daftar Aset', href:'/assets'}]}>
  <Link href={item.href}>{item.title}</Link>
  <Separator>/</Separator>
</Breadcrumbs>
```

**Mobile truncation:** Show first + last 2 items, ellipsis in middle when >3 items.

---

## 7. Accessibility & UX Standards

### 7.1 Keyboard Navigation
- Tab order: Sidebar → Search → Table → Actions → Footer
- Focus visible: `focus-visible:ring-2 focus-visible:ring-primary`
- Skip link: "Langsung ke konten" (skip to main content)
- Arrow keys in tree: expand/collapse classification nodes

### 7.2 Screen Reader Support
- All icons have `aria-hidden="true"` with text labels
- Buttons have aria-label in Indonesian
- Status badges: `aria-label="Status: Aktif"` etc.
- Breadcrumb: `aria-label="Breadcrumb"` nav landmark
- Sidebar: `aria-label="Navigasi Utama"`

### 7.3 Color Contrast (WCAG 6:1 dark mode)
| Element | Light | Dark | Contrast |
|---------|-------|------|----------|
| Text on bg-primary | #111827 | #F9FAFB | 6:1+ |
| Status badge ACT | #166534 | #4ADE80 | 6:1+ |
| Status badge DSP | #991B1B | #F87171 | 6:1+ |
| Primary button | #FFFFFF on #2563EB | #FFFFFF on #3B82F6 | 6:1+ |

### 7.4 Touch Targets
- Minimum 44x44px (mobile bottom nav tabs, action buttons)
- Minimum 8px spacing between touch targets
- Swipe gestures: table rows swipe for quick actions (mobile)

---

## 8. Developer Implementation Guide

### 8.1 File Structure (navigation-related)

```
resources/js/
├── layouts/
│   ├── app/
│   │   └── app-sidebar-layout.tsx    # Shell: sidebar + content + mobile sheet
│   └── app-layout.tsx                # Wrapper → app-sidebar-layout
├── components/
│   ├── app-sidebar.tsx               # Persistent desktop sidebar
│   ├── app-sidebar-header.tsx        # Tenant switcher, theme, profile
│   ├── mobile-bottom-nav.tsx         # 5-tab mobile nav (existing)
│   ├── mobile-sidebar-sheet.tsx      # Slide-over drawer (mobile)
│   ├── breadcrumbs.tsx               # Breadcrumb component
│   └── ui/
│       └── sidebar/                  # SidebarInset, Sidebar components
├── data/
│   └── sidebar.ts                    # sidebarData config (existing)
├── types/
│   └── navigation.ts                 # BreadcrumbItem, NavItem, SidebarData types
└── routes/
    └── **/                           # Wayfinder-generated route functions
```

### 8.2 Priority Order for Implementation

1. **Foundation:** Update `sidebar.ts` nav groups with all 13 modules + permissions
2. **Layout:** Verify `AppSidebarLayout` handles sidebar + mobile sheet + bottom nav
3. **Navigation:** Build breadcrumb component, tenant switcher in header
4. **Mobile:** Verify `MobileBottomNav` permission gating, active state matching
5. **Key Screens:** Asset List, Asset Detail, Dashboard, Classification Tree
6. **Theme:** Dark mode toggle (WCAG 6:1) + localStorage persistence
7. **Accessibility:** Skip links, focus states, ARIA labels, keyboard nav

### 8.3 Wayfinder Usage

All navigation URLs must use Wayfinder route functions (no hardcoded strings):

```ts
// ✅ Correct
import { index as assetsIndex } from '@/routes/assets';
<Link href={assetsIndex()}>Daftar Aset</Link>

// ✅ Correct with params
import { show as assetsShow } from '@/routes/assets';
<Link href={assetsShow({ id: asset.id })}>Detail</Link>

// ❌ Incorrect
<Link href="/assets">Daftar Aset</Link>
```

### 8.4 Permission Checking

```ts
import { useCan } from '@/hooks/use-can';

// In sidebar item rendering
{item.permission && !useCan(item.permission.resource, item.permission.actions) && (
  // render disabled or hide based on role policy
)}
```

### 8.5 Theme Toggle Integration

Theme toggle must be in `AppSidebarHeader` (visible on all pages). Uses `ThemeManager` class pattern with `data-theme` attribute on `<html>`.

---

## 9. Open Items (Pending from UX Research)

| Item | Reference | Status | Navigation Impact |
|------|-----------|--------|-------------------|
| FR-10.6 User data export | Part 4 §5 | PENDING | Add "Ekspor" button in User List screen → export CSV/Excel |
| FR-13.8 Dashboard asset type breakdown | Part 4 §5 | PENDING | Add Aktiva Tetap vs Peralatan chart on Dashboard |

---

## 10. Approval & Handoff

**ArchitectUX Agent** — Foundation complete. Ready for LuxuryDeveloper implementation.

**Next steps for developer:**
1. Review `sidebar.ts` and align nav groups with this IA
2. Implement breadcrumb component following Section 6.4
3. Build the 4 key screens (Section 5) with specified information hierarchy
4. Verify dark mode theme toggle in `AppSidebarHeader`
5. Run 3-click rule audit on all 35 screens

---
*End of document*
