# Opti-Asset — UI Design System

**Project:** opti-asset | **Stack:** Laravel 13 + Inertia.js v3 + React 19 + Tailwind CSS v4  
**Domain:** Multi-tenant asset management (Indonesian enterprise) | **Language:** Indonesian (all UI text)  
**Design Decision:** Approach 2 — Soft UI Evolution (user-approved)  
**Brand Primary:** `#2D82B7` (blue) | **Light + Dark modes** both supported  
**Status:** Design document — ready for developer handoff  
**Author:** UI Designer Agent | **Date:** 29 Oct 2026  

---

## Source of Truth

- IA & Navigation Design: `planning/ia-navigation-design.md`
- UX Research Reports: `planning/ux-research-report-part{1-4}.md`
- ui-ux-pro-max search results: design-system (Soft UI Evolution), color (B2B blue palettes), typography, ux, stack/laravel

---

## 🎨 Design Foundations

### Design System Pattern
- **Name:** Soft UI Evolution
- **Mode Support:** Light supported | Dark supported
- **Keywords:** Evolved soft UI, better contrast, modern aesthetics, subtle depth, accessibility-focused, improved shadows, hybrid
- **Best For:** Modern enterprise apps, SaaS platforms, professional business tools
- **Accessibility Risk:** low | Requires: contrast-text-4.5, keyboard, visible-focus, reduced-motion
- **Compliant With:** WCAG AA (targeting 6:1 for normal text per PRD NFR)

### Style Reference
- **Source Style:** Data-Dense Dashboard (`data-dense-dashboard`)
- **Type:** BI/Analytics / Operational dashboard
- **Characteristics:** Multiple charts/widgets, data tables, KPI cards, minimal padding, grid layout, space-efficient, maximum data visibility
- **Light/Dark:** both supported
- **CSS/Technical:** `display: grid`, `grid-template-columns: repeat(12, 1fr)`, `gap: 8px`, `padding: 12px`, `font-size: 12-14px`, `overflow: auto` for tables, sticky headers

### Complementary Color Palette (#2D82B7 Primary)

Note: Direct `#2D82B7` database match returned 0 results in colors.csv. Retried with "blue complementary palette professional" — verified matches: B2B Service (navy + blue CTA), CRM & Client Management (Professional blue + deal green), Real Estate/Property (trust teal + professional blue). All three are professional blue-based palettes fitting enterprise asset management. No exact #2D82B7 match found; palette below is derived from the verified blue-family results and project constraints.

| Role | Light Mode | Dark Mode | CSS Variable | Usage |
|------|-----------|-----------|-------------|-------|
| **Primary** | `#2D82B7` | `#5FA8D3` | `--color-primary` | Brand, primary actions, links |
| Primary (hover) | `#246A94` | `#4E90BA` | `--color-primary-hover` | Primary button hover |
| Primary (active) | `#1E537A` | `#3D78A6` | `--color-primary-active` | Primary button active |
| On Primary | `#FFFFFF` | `#FFFFFF` | `--color-on-primary` | Text/icons on primary |
| **Secondary** | `#64748B` | `#94A3B8` | `--color-secondary` | Secondary actions, muted text |
| On Secondary | `#FFFFFF` | `#0F172A` | `--color-on-secondary` | Text/icons on secondary |
| **Surface** | `#FFFFFF` | `#0F172A` | `--color-surface` | Card surfaces, elevated containers |
| **Background** | `#F8FAFC` | `#020617` | `--color-background` | App page background |
| **Foreground** | `#0F172A` | `#F8FAFC` | `--color-foreground` | Primary body text |
| **Muted** | `#E2E8F0` | `#1E293B` | `--color-muted` | Subtle backgrounds, disabled states |
| Muted Foreground | `#64748B` | `#94A3B8` | `--color-muted-foreground` | Secondary/tertiary text |
| **Border** | `#E2E8F0` | `#334155` | `--color-border` | Input borders, dividers, card borders |
| **Ring** | `#2D82B7` | `#5FA8D3` | `--color-ring` | Focus rings, selected states |

### Semantic / Status Colors

| Role | Light Mode | Dark Mode | CSS Variable | Usage |
|------|-----------|-----------|-------------|-------|
| Success | `#15803D` | `#4ADE80` | `--color-success` | Active assets, confirmations |
| Warning | `#D97706` | `#FBBF24` | `--color-warning` | Loaned assets, pending actions |
| Error / Destructive | `#DC2626` | `#F87171` | `--color-destructive` | Deletion, disposal, errors |
| Info | `#2D82B7` | `#5FA8D3` | `--color-info` | Informational messages, neutral status |
| On Success/Warning/Error/Info | `#FFFFFF` | `#FFFFFF` | `--color-on-{status}` | Text/icons on status chips |

### Asset Status Colors (per IA: ACT, LOAN, RPR, MUT, DSP)

| Status | Label (Indonesian) | Color | Usage |
|--------|-------------------|-------|-------|
| ACT | Aktif | Success green | Asset in active use |
| LOAN | Dipinjam | Warning amber | Asset on loan |
| RPR | Perbaikan | Warning amber | Asset under repair |
| MUT | Mutasi | Info blue | Asset in transfer |
| DSP | Disposisi | Destructive red | Asset disposed |

---

## Typography Scale

Project already uses **Public Sans** (UI/body) + **Noto Sans Mono** (codes, barcodes, monospace). Verified via typography.csv search — Noto Sans variants confirmed professional/clean/multilingual; Public Sans is the project's established heading/body sans.

| Token | Size | Line Height | Weight | Font Family | Usage |
|-------|------|-------------|--------|-------------|-------|
| `--text-xs` | 0.75rem (12px) | 1rem | 400 | Public Sans | Captions, labels, helper text |
| `--text-sm` | 0.875rem (14px) | 1.25rem | 400 | Public Sans | Body secondary, table cells |
| `--text-base` | 1rem (16px) | 1.5rem | 400 | Public Sans | Body primary, default text |
| `--text-lg` | 1.125rem (18px) | 1.75rem | 500 | Public Sans | Section headings, list items |
| `--text-xl` | 1.25rem (20px) | 1.75rem | 600 | Public Sans | Page sub-headings |
| `--text-2xl` | 1.5rem (24px) | 2rem | 600 | Public Sans | Page titles, card headers |
| `--text-3xl` | 1.875rem (30px) | 2.25rem | 700 | Public Sans | Dashboard major headings |
| `--text-mono-xs` | 0.75rem (12px) | 1rem | 400 | Noto Sans Mono | Barcodes, asset codes |
| `--text-mono-sm` | 0.875rem (14px) | 1.5rem | 400 | Noto Sans Mono | Serial numbers, QR data |
| `--text-mono-base` | 1rem (16px) | 1.5rem | 400 | Noto Sans Mono | Code blocks, technical IDs |

**Indonesian Language Considerations:** Public Sans supports Latin Extended needed for Indonesian. Avoid text truncation mid-word; Indonesian compound words can be long — allow 2-line wrap for labels. Button labels keep under 3 words where possible (e.g., "Simpan Aset", "Hapus", "Cetak").

---

## Iconography

**Decision: Standardize on lucide-react.** 

- Project already uses lucide-react; ui-ux-pro-max defaults to Phosphor but migration is unnecessary overhead with no visual benefit.
- lucide-react provides consistent stroke width (2px), 24x24 base grid, tree-shakeable imports, and full coverage of needed icons (Barcode, Scan, QrCode, Edit2, Trash2, Save, Search, Filter, Settings, LogOut, LayoutDashboard, Table, BarChart3, PieChart, Clock, Shield, User, Building2, CreditCard, Folder, Plus, ChevronLeft/Right, ArrowUpDown, MoreHorizontal, AlertCircle, CheckCircle, Loader2, Download, Print).
- **Icon sizes:** 16px (compact/table), 20px (default/button), 24px (prominent/nav)
- **Icon colors:** inherit from parent text color (--color-foreground / --color-muted-foreground); active states use --color-primary

---

## 🧱 Component Specifications

### Spacing Rhythm (4/8dp base)
Base unit: **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.  
- Component internal padding: 8–16px
- Component gap: 8px (compact), 12px (default), 16px (spacious)
- Section spacing: 24–48px
- Screen page padding: 24px (desktop), 16px (tablet), 16px (mobile)

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-badge` | 4px | Badges, pills, chips |
| `--radius-control` | 8px | Inputs, buttons, selects, modal headers |
| `--radius-card` | 12px | Cards, KPI charts, dialogs |
| `--radius-sidebar` | 0px | Sidebar (full-height, square edges) |

### Shadow Tokens
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--shadow-xs` | 0 1px 2px 0 rgb(0 0 0 / 0.05) | 0 1px 2px 0 rgb(0 0 0 / 0.4) | Subtle inputs, chips |
| `--shadow-sm` | 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) | 0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.8) | Cards, hover states |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) | 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.8) | Dialogs, dropdowns |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) | 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.8) | Modals, mobile bottom nav |

---

### 1. Button

| Variant | Background | Text | Border | Hover | Use |
|---------|-----------|------|--------|-------|-----|
| Primary | `--color-primary` | `--color-on-primary` | none | `--color-primary-hover` | Main actions (Simpan, Buat, Konfirmasi) |
| Secondary | transparent | `--color-foreground` | 1px `--color-border` | `--color-muted` | Tertiary actions (Batal, Kembali) |
| Ghost | transparent | `--color-muted-foreground` | none | `--color-muted` | Icon-only buttons, inline actions |
| Destructive | `--color-destructive` | `--color-on-destructive` | none | darker `--color-destructive` | Hapus, Buang, Nonaktifkan |
| Outline | transparent | `--color-primary` | 1px `--color-primary` | `--color-primary` (fill) | Secondary CTAs |

**Specs:** Height 40px (default) / 32px (compact) / 48px (large). Min width 80px. Padding: 0–16px horizontal. Font: Public Sans 500, 14px. Radius: 8px. Focus-visible: 2px ring `--color-ring`, offset 2px. Disabled: opacity 0.5, cursor not-allowed. Touch target min 44x44px.

### 2. Input (Text, Number, Select, Date, Password)

**Specs:** Height 40px. Padding: 10px–12px horizontal, 10px vertical. Background: `--color-card` (`--color-surface` in dark). Border: 1px `--color-border`. Radius: 8px. Font: Public Sans 14px. Focus: border `--color-primary`, ring `--color-ring` (3px, 25% opacity). Error: border `--color-destructive`, ring destructive. Label: Public Sans 12px, 500, `--color-foreground`, above input with 4px gap. Helper text: 12px, `--color-muted-foreground`. Placeholder: `--color-muted-foreground`, 400. Disabled: background `--color-muted`, opacity 0.6.

**Indonesian labels:** Label text in Indonesian (e.g., "Kode Aset", "Nama Aset", "Tanggal Perolehan"). Avoid placeholder-only labels (per ux-guidelines.csv Form Labels — High severity).

### 3. Card

**Specs:** Background: `--color-card`. Border: 1px `--color-border`. Radius: 12px. Shadow: `--shadow-sm` (light) / `--shadow-lg` (dark). Padding: 16px (compact) / 24px (default). Hover: shadow `--shadow-md`, translateY -1px. Transition: all 200ms ease.

### 4. Table

**Specs:** Header row: background `--color-muted`, text `--color-muted-foreground` 500 12px, border-bottom 1px `--color-border`. Body row: background `--color-card`, border-bottom 1px `--color-border`. Row height: 40px (compact) / 48px (default). Hover: background `--color-muted`. Sticky header. Sort indicators: chevron icons 16px `--color-muted-foreground`, active `--color-primary`. Pagination: centered below, 40px touch targets. Empty state: illustration + "Tidak ada data aset" + primary button "Tambah Aset".

### 5. Sidebar (Persistent Layout)

Per stack/laravel search result: Use persistent layouts to preserve state — wrap pages in persistent layout so header/sidebar don't remount on navigation. `MyPage.layout = (page) => <AppLayout>{page}</AppLayout>`.

**Specs:** Width 260px (desktop collapsed 80px). Background: `--color-surface`. Border-right: 1px `--color-border`. Height: 100vh (fixed). Items: 40px height, 16px padding horizontal, 4px gap between icon and label. Active item: background `--color-primary` 10% opacity, left border 3px `--color-primary`, text `--color-primary`. Hover: background `--color-muted`. Collapsed: icons only, tooltips on hover. Logo at top 32px height. User profile at bottom. Radius: 0px (square edges per radius spec).

**Mobile:** Sidebar hidden; replaced by Mobile Bottom Nav.

### 6. Mobile Bottom Nav

**Specs:** Height 72px. Background: `--color-surface`. Border-top: 1px `--color-border`. Shadow: `--shadow-md`. 3–5 items. Each: 48x48px touch target, icon 20px + label 10px below. Active: color `--color-primary`. Inactive: `--color-muted-foreground`. Items: Dashboard, Aset, Scan, Notifikasi, Profil.

### 7. Theme Toggle

**Specs:** Button 36x36px, radius 50% (circle). Background: `--color-muted`. Icon: sun (light mode) / moon (dark mode), 18px. Hover: background `--color-border`. Focus-visible ring `--color-ring`. Positioned in top header, right of user profile. Smooth transition 200ms between modes (no flash).

### 8. Search

**Specs:** Input height 36px. Left: Search icon 16px `--color-muted-foreground`. Right: clear (x) icon when populated, 16px. Placeholder: "Cari aset...". Debounce: 300ms (per NFR-06.3 search response <1s). Loading state: spinner inside right side. Results dropdown: max-height 280px, scrollable, each item 40px touch target.

### 9. Filter Chips

**Specs:** Height 32px. Padding: 0–10px. Background: `--color-muted` (inactive) / `--color-primary` (active). Text: `--color-muted-foreground` (inactive) / `--color-on-primary` (active). Radius: 16px (pill). Font: Public Sans 400 12px. Remove (x) icon 12px on right. Gap: 8px between chips. Wrap: flexible.

### 10. Breadcrumb

**Specs:** Height 24px. Items: Public Sans 400 12px, color `--color-muted-foreground`. Separator: chevron-right 12px `--color-muted-foreground`. Current page: color `--color-foreground`, 500. Last item: non-clickable, 600. Max 4 levels (per 3-click rule).

### 11. Tenant Switcher

**Specs:** Select-like component in top header. Height 36px. Left: Building2 icon 16px. Text: tenant name 14px `--color-foreground`. Right: chevron-down 16px. Dropdown: list of tenants, each 40px, active highlighted `--color-primary` 10%. SSO/OIDC note: "Login via SSO" subtitle 11px `--color-muted-foreground`.

### 12. Toast (Glass Premium)

**Specs:** Glassmorphism: background `--color-surface` with 60% opacity, backdrop-blur. Border: 1px `--color-border`. Radius: 12px. Shadow: `--shadow-lg`. Position: top-right, offset 24px. Auto-dismiss: 4000ms. Progress bar at bottom: `--color-primary`. Close (x) icon 16px. Title: 13px 600 `--color-foreground`. Message: 12px 400 `--color-muted-foreground`. Icon left 18px (success/check, warning/alert, error/alert-circle, info/info). Indonesian messages (e.g., "Aset berhasil disimpan", "Gagal menghapus aset").

### 13. Modal / Dialog

**Specs:** Backdrop: `--color-background` 40% opacity, backdrop-blur-sm. Panel: background `--color-surface`, radius 12px, border 1px `--color-border`, shadow `--shadow-lg`. Max-width: 640px (default), 90vw (mobile). Header: title 18px 600 `--color-foreground`, subtitle 13px `--color-muted-foreground`, close (x) 20px top-right. Body: 24px padding. Footer: gap 8px, buttons right-aligned (Cancel secondary left, Confirm primary right). Focus trap on open. Escape to close. Click-outside to close (optional per action).

### 14. Badge

**Specs:** Height 24px. Padding: 0–8px. Radius: 4px. Font: Public Sans 500 11px, uppercase 0.5px letter-spacing. Variants:
- Default: bg `--color-muted`, text `--color-muted-foreground`
- Primary: bg `--color-primary`, text `--color-on-primary`
- Success: bg `--color-success`, text `#FFFFFF`
- Warning: bg `--color-warning`, text `#FFFFFF`
- Error: bg `--color-destructive`, text `#FFFFFF`
- Info: bg `--color-info`, text `#FFFFFF`

### 15. Avatar

**Specs:** Sizes: 24px (compact), 32px (default), 40px (profile), 48px (large). Radius: 50% (circle). Background: `--color-muted`. Text: initials 600 `--color-on-surface`, centered. Border: 2px `--color-border` (default), 2px `--color-primary` (active/online). Fallback: User icon 60% of size.

### 16. KPI Card

**Specs:** Background: `--color-surface`, border 1px `--color-border`, radius 12px, shadow `--shadow-sm`. Padding: 16px. Layout: value (large, 24px 700 `--color-foreground`) top-left; label (12px 400 `--color-muted-foreground`) below value; trend/icon top-right (18px, `--color-primary` positive / `--color-destructive` negative). Sparkline optional (100px width). Hover: translateY -2px, shadow `--shadow-md`.

### 17. Donut / Status Charts

**Specs:** Donut: stroke 8px, radius 48px, segments colored by status (ACT green, LOAN amber, RPR amber, MUT blue, DSP red). Legend below: status dot 8px + label 12px `--color-muted-foreground`. Empty state: "--" + "Tidak ada data". Tooltip on hover: status name + count + percentage. Dark mode: segments use same hues, slightly lighter for contrast on dark surface.

---

## 📱 Screen Designs (Key Screens)

### Screen Layout Principles
- **Persistent layout:** Sidebar + header persist across navigation (per stack/laravel Inertia persistent layout guideline).
- **3-click rule:** Max 3 clicks to reach any asset detail or action.
- **Mobile:** Bottom nav replaces sidebar; single-column; stackable cards.
- **Skeleton loading:** Required on Dashboard and Asset List (NFR-06.1 page load <3s).

### 1. Dashboard (Management role primary)

**Layout:** 12-column grid.
- **Top row:** KPI cards row (4 cards): Total Aset, Aktif, Dipinjam, Perbaikan. Each: KPI Card spec with trend + sparkline.
- **Second row:** Donut chart (asset status distribution) left (6 cols), Bar chart (asset type breakdown: Aktiva Tetap vs Peralatan — pending FR-13.8) right (6 cols).
- **Third row:** Recent assets table (compact, 8 rows, sortable, with "Lihat Semua" link to Asset List).
- **Empty/loading:** Skeleton cards + skeleton chart bars.

**Indonesian labels:** "Dashboard", "Total Aset", "Aktif", "Dipinjam", "Perbaikan", "Distribusi Status", "Jenis Aset", "Aset Terbaru", "Lihat Semua".

### 2. Asset List

**Layout:** Top toolbar + table below.
- **Toolbar:** Search input (placeholder "Cari aset..."), Filter chips (Status: Aktif/Dipinjam/Perbaikan/Mutasi/Disposisi), Tenant Switcher, Primary button "Tambah Aset".
- **Table:** Columns: Kode Aset (mono), Nama Aset, Klasifikasi (Golongan → Kategori), Lokasi, Status (badge), Tanggal Perolehan, Aksi (Edit, Detail, Hapus icon buttons).
- **Bulk actions:** Checkbox column (when items selected), toolbar switches to bulk: "Hapus Terpilih", "Ekspor Terpilih".
- **Empty state:** Illustration + "Belum ada aset terdaftar" + "Tambah Aset pertama Anda" button.
- **Loading:** Skeleton table rows.

**3-click:** List → click row → Detail (2 clicks).

### 3. Asset Detail

**Layout:** Header (asset name + code mono badge) + action row + tabbed content.
- **Header:** Kode Aset (large mono), Nama Aset, Status badge, Tenant chip, actions: Edit, Scan, Mutasi, Buang, Cetak.
- **Info cards grid (2-col):** Kode Aset, Nama Aset, Klasifikasi, Lokasi, Tanggal Perolehan, Nilai Perolehan, Kondisi, Penanggung Jawab.
- **Tabs:** Detail (default), Riwayat (mutation/disposal log), Dokumen (attachments).
- **Loading:** Skeleton info cards.

**Indonesian labels:** "Detail Aset", "Edit", "Scan", "Mutasi", "Buang", "Cetak", "Riwayat", "Dokumen".

### 4. Asset Create / Edit

**Layout:** Single-column form, max-width 640px, centered card.
- **Form sections (grouped with fieldset legends):** Data Dasar (Kode Aset auto-generated read-only, Nama Aset, Klasifikasi 4-level dropdown, Lokasi, Tanggal Perolehan, Nilai Perolehan), Detail Teknis (Merk, Model, Nomor Seri, Kondisi), Penanggung Jawab (user select).
- **Submit:** Primary "Simpan Aset" + Secondary "Batal". Delete (Edit only): Destructive "Hapus Aset" with confirmation dialog.
- **Validation:** Inline error messages under field, Indonesian (e.g., "Nama aset wajib diisi", "Kode aset sudah digunakan").
- **Auto-generate:** Kode Aset field shows generated code with "Salin" button.

### 5. Barcode Scan

**Layout:** Camera full-screen (mobile) / right panel (desktop).
- **Camera viewfinder:** Full aspect with scan line animation. Permission prompt: "Izinkan akses kamera untuk scan barcode/QR".
- **Controls:** Toggle camera (front/back), flash on/off, manual entry fallback link ("Masukkan kode manual").
- **Result overlay:** Bottom sheet slides up: Kode Aset (mono large), Nama Aset, Status badge, Primary "Lihat Detail Aset", Secondary "Scan Lagi".
- **Error:** "Barcode tidak dikenali" with retry.
- **Desktop fallback:** Manual input field + "Cari" button.

### 6. Classification Tree

**Layout:** 4-level tree: Golongan → Kategori → Cluster → Sub-Cluster.
- **Left panel:** Collapsible tree nodes, each with expand/collapse chevron, node name, item count badge. Selected node highlighted `--color-primary` 10% bg.
- **Right panel:** Assets in selected classification (table) or classification detail form.
- **Actions:** "Tambah Golongan/Kategori/Cluster/Sub-Cluster" (context-dependent), "Edit", "Hapus" (confirmation).
- **Empty:** "Belum ada klasifikasi" + add button.

### 7. Mutation

**Layout:** Two-column: Asset list left, target location/form right.
- **Source:** Select asset (searchable dropdown), current location displayed.
- **Target:** Target location dropdown, target user dropdown, reason textarea, effective date picker.
- **Submit:** Primary "Ajukan Mutasi" → toast "Permintaan mutasi diajukan".
- **Status badge:** Draft, Pending, Approved, Rejected.

### 8. Disposal

**Layout:** Form card, max-width 640px.
- **Asset selector** (searchable), current status shown.
- **Disposal reason:** dropdown (Rusak Berat, Hilang, Kadaluarsa, Lainnya), reason textarea (required if Lainnya).
- **Date:** Tanggal Diajukan (date picker).
- **Submit:** Primary "Ajukan Disposisi" → confirmation dialog → toast "Pengajuan disposisi diterima".
- **Status badge:** Draft, Pending, Approved, Rejected, Disposed.

### 9. Settings

**Layout:** Left nav (profile, tenant, system), right content.
- **Tabs:** Profil, Tenant, Sistem (Super Admin only), Tampilan (theme toggle: Light/Dark/System), Bahasa (Indonesian fixed), Notifikasi.
- **Tampilan:** Theme toggle (Theme Toggle spec), color accent picker (read-only, brand #2D82B7).
- **Sistem:** Capitalization threshold input, asset type rules, backup/recovery buttons (Super Admin).

### 10. Audit Logs

**Layout:** Table with filters.
- **Table columns:** Waktu (mono), Pengguna, Aksi, Aset (Kode + Nama), Detail, IP Address.
- **Filters:** Date range (from/to), Pengguna dropdown, Aksi dropdown (Create, Update, Delete, Mutasi, Disposisi), Search.
- **Export:** "Ekspor CSV" button (secondary).
- **Pagination:** 10/25/50/100 per page.

---

## 🌓 Light / Dark Mode Token Mapping

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--color-background` | `#F8FAFC` | `#020617` |
| `--color-surface` | `#FFFFFF` | `#0F172A` |
| `--color-card` | `#FFFFFF` | `#0F172A` |
| `--color-foreground` | `#0F172A` | `#F8FAFC` |
| `--color-muted` | `#E2E8F0` | `#1E293B` |
| `--color-muted-foreground` | `#64748B` | `#94A3B8` |
| `--color-border` | `#E2E8F0` | `#334155` |
| `--color-primary` | `#2D82B7` | `#5FA8D3` |
| `--color-primary-hover` | `#246A94` | `#4E90BA` |
| `--color-primary-active` | `#1E537A` | `#3D78A6` |
| `--color-ring` | `#2D82B7` | `#5FA8D3` |
| `--color-success` | `#15803D` | `#4ADE80` |
| `--color-warning` | `#D97706` | `#FBBF24` |
| `--color-destructive` | `#DC2626` | `#F87171` |
| `--color-info` | `#2D82B7` | `#5FA8D3` |
| `--shadow-sm` | 0 1px 3px rgb(0 0 0 / 0.1) | 0 1px 3px rgb(0 0 0 / 0.5) |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1) | 0 4px 6px -1px rgb(0 0 0 / 0.5) |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1) | 0 10px 15px -3px rgb(0 0 0 / 0.5) |

**Theme toggle:** Persists preference in localStorage. Respects `prefers-color-scheme` system default on first visit. No flash of wrong theme (apply class to `<html>` before paint). Toggle icon: Sun (→ dark) / Moon (→ light).

---

## ♿ Accessibility (WCAG AA → targeting 6:1)

| Requirement | Spec | Verification |
|-------------|------|--------------|
| **Color contrast (normal text)** | 6:1 minimum (exceeds WCAG AA 4.5:1) | `--color-foreground` on `--color-background` both modes |
| **Color contrast (large text)** | 3:1 minimum | Headings 18px+ |
| **Color contrast (UI components)** | 3:1 minimum | Buttons, inputs, borders |
| **Touch targets** | 44x44px minimum | All buttons, icons, chips, nav items |
| **Touch target spacing** | 8px minimum gap between adjacent targets | Per ux-guidelines.csv Touch Spacing |
| **Focus-visible** | 2px ring `--color-ring`, offset 2px | All interactive elements |
| **Keyboard navigation** | Logical tab order, no focus traps (except modal) | Sidebar → header → main content → footer |
| **Screen reader** | Semantic HTML, ARIA labels, role=button for icon buttons | All icon-only buttons have `aria-label` |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable hover translates, animations | Transitions ≤ 200ms, no autoplay |
| **Text scaling** | Works up to 200% browser zoom | Relative units (rem) throughout |
| **Error prevention** | Inline validation, Indonesian messages, confirmations for destructive actions | Delete/dispose confirm dialogs |
| **Form labels** | Associated `<label for=...>`, no placeholder-only | Per ux-guidelines.csv Form Labels (High) |

---

## 🇮🇩 Indonesian Language Label Considerations

- All UI text in Indonesian (per NFR-05.3).
- Common translations used: Simpan (Save), Batal (Cancel), Hapus (Delete), Ubah (Edit), Tambah (Add), Cari (Search), Filter, Detail, Riwayat, Dokumen, Cetak (Print), Ekspor (Export), Impor (Import), Konfirmasi (Confirm), Aset (Asset), Klasifikasi (Classification), Golongan (Group), Kategori (Category), Cluster, Sub-Cluster, Lokasi (Location), Tanggal (Date), Nomor Seri (Serial Number), Penanggung Jawab (Person in Charge), Mutasi (Mutation), Disposisi (Disposal), Aktif (Active), Dipinjam (On Loan), Perbaikan (Under Repair), Tidak ada data (No data), Belum ada (Not yet), Wajib diisi (Required), Berhasil (Success), Gagal (Failed).
- Avoid truncating Indonesian compound words mid-word; allow 2-line wrap for labels.
- Button labels ≤ 3 words where possible.
- Toasts and validation messages in Indonesian (e.g., "Aset berhasil disimpan", "Nama aset wajib diisi").

---

## ✅ Pre-Delivery Checklist (ui-ux-pro-max)

- [ ] Design system tokens defined: colors (light/dark), typography, spacing, radius, shadows
- [ ] Primary `#2D82B7` used consistently across all components
- [ ] WCAG 6:1 contrast verified for normal text in both modes
- [ ] 44px minimum touch targets on all interactive elements
- [ ] Focus-visible rings on all interactive components
- [ ] Keyboard-navigable: sidebar → header → main → footer
- [ ] Screen reader labels on all icon-only buttons
- [ ] Reduced motion respected (`prefers-reduced-motion`)
- [ ] Persistent layout: sidebar/header don't remount on route change (Inertia)
- [ ] 3-click rule satisfied for asset detail/actions
- [ ] Skeleton loading states on Dashboard and Asset List
- [ ] Search debounce 300ms (NFR-06.3)
- [ ] Indonesian labels throughout; no placeholder-only inputs
- [ ] Confirmation dialogs for destructive actions (delete/dispose)
- [ ] Mobile bottom nav replaces sidebar on mobile
- [ ] lucide-react standardized as icon library (no Phosphor migration)
- [ ] Asset status color mapping (ACT/LOAN/RPR/MUT/DSP) defined
- [ ] Empty states for all list/table screens
- [ ] Toast glass premium spec defined
- [ ] Donut/status chart specs defined
- [ ] Tenant Switcher with SSO/OIDC subtitle

---

**UI Designer:** UI Designer Agent  
**Design System Date:** 29 Oct 2026  
**Implementation:** Ready for developer handoff (design document only — no implementation code)  
**QA Process:** Design review and validation protocols established against this document

---


