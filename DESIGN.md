---
version: '2.0'
date: '2026-09-24'
name: 'Opname Field Desk'
description: 'Operational UI for Indonesian enterprise asset management — field scan first, ledger clarity second, no decorative chrome.'
supersedes:
  - 'v1.0 (same direction, sharpened into a full brief)'
  - 'NOON warm glassmorphism (legacy chrome — scheduled for removal, see §Implementation notes)'
prp_reference: 'PRD Sistem Manajemen Aset v1.3'
colors:
  # Core
  primary: '#0D5C56'
  primary-hover: '#0A4A45'
  primary-active: '#083B37'
  primary-muted: '#D8EDEA'
  primary-muted-border: '#A7D2CC'
  ink: '#15202B'
  ink-muted: '#5A6A7A'
  ink-subtle: '#8593A2'
  paper: '#F1F4F6'
  surface: '#FFFFFF'
  surface-sunken: '#E9EDF0'
  border: '#D5DCE3'
  border-strong: '#B9C4CE'
  focus: '#0D5C56'
  # Semantic actions
  destructive: '#B42318'
  destructive-tint: '#FEECEB'
  success: '#1B7F5A'
  warning: '#B45309'
  info: '#1D6A9F'
  # Status map (LOCKED — P1). text/bg/border recipes verified ≥ 6:1 on light.
  status-act-text: '#166534'
  status-act-bg: '#DCFCE7'
  status-act-border: '#86EFAC'
  status-loan-text: '#1E40AF'
  status-loan-bg: '#DBEAFE'
  status-loan-border: '#93C5FD'
  status-rpr-text: '#92400E'
  status-rpr-bg: '#FEF3C7'
  status-rpr-border: '#FCD34D'
  status-mut-text: '#155E75'
  status-mut-bg: '#CFFAFE'
  status-mut-border: '#67E8F9'
  status-dsp-text: '#9F1239'
  status-dsp-bg: '#FFE4E6'
  status-dsp-border: '#FDA4AF'
  # Tipe aset
  tipe-aktiva-text: '#0D5C56'
  tipe-aktiva-bg: '#D8EDEA'
  tipe-peralatan-text: '#475569'
  tipe-peralatan-bg: '#E9EDF0'
  # Dark theme
  dark-bg: '#0B1220'
  dark-surface: '#151D2A'
  dark-surface-raised: '#1B2534'
  dark-border: '#2A3544'
  dark-ink: '#E8EEF2'
  dark-ink-muted: '#9AA8B5'
  dark-primary: '#2A9B93'
  dark-primary-ink: '#0B1220'
  # Dark status recipes verified ≥ 8:1 on dark tints
  dark-status-act-text: '#86EFAC'
  dark-status-act-bg: '#052E16'
  dark-status-loan-text: '#93C5FD'
  dark-status-loan-bg: '#172554'
  dark-status-rpr-text: '#FCD34D'
  dark-status-rpr-bg: '#451A03'
  dark-status-mut-text: '#67E8F9'
  dark-status-mut-bg: '#083344'
  dark-status-dsp-text: '#FDA4AF'
  dark-status-dsp-bg: '#4C0519'
fonts:
  sans: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
  mono: 'Noto Sans Mono, ui-monospace, SFMono-Regular, monospace'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  full: '9999px'
spacing:
  1: '4px'
  2: '8px'
  3: '12px'
  4: '16px'
  5: '20px'
  6: '24px'
  8: '32px'
  10: '40px'
  12: '48px'
  16: '64px'
motion:
  micro: '120ms'
  standard: '180ms'
  max: '220ms'
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)'
breakpoints:
  sm: '640px'
  md: '768px'
  lg: '1024px'
  xl: '1280px'
z-index:
  base: 0
  sticky: 100
  overlay: 200
  dropdown: 250
  modal: 300
  toast: 500
---

# Design System: Opname Field Desk (v2.0)

> **Mode:** Operate — task completion over expression.
> **Product:** Opti-Asset — multi-tenant asset management (PRD v1.3): classification, CRUD, scan, mutasi, disposal, audit trail, tipe aset + accounting.
> **Users:** Staff Asset (field + desk), Admin Department, Manajemen, Auditor. Indonesian-language UI, corporate OIDC/SSO.
> **This document is normative.** If code and this file disagree, code is wrong.

---

## 1. Design principles (mandatory)

### P1 — Status is the interface
Every asset screen must make **status** (Aktif / Dipinjamkan / Dalam Perbaikan / Dimutasi / Dihapus) and **tipe** (Aktiva Tetap / Peralatan) readable in under one second, without opening a detail view. Color, badge shape, and label are locked to the status token map in §3. The five status hues may never be used decoratively — a teal chip is "Aktif", not "brand accent".

**Why:** Staff Asset and Auditor success is "know the state of this thing now". With ≥10,000 assets (NFR-01.4) and audit targets of 95% correctly-classified assets, misread status is the most expensive failure in the product. Decorative color competes with that signal.

### P2 — Thumb-first, desk-second
Primary actions (Scan, Simpan, Ajukan mutasi, Ajukan disposal) live in the **thumb zone** on mobile: bottom tab bar, sticky footer, or full-bleed button. Dense tables are a **desktop privilege**; below `md` the same data renders as card stacks. Minimum interactive height 44×44px everywhere.

**Why:** Opname fisik happens standing, in one hand, often in glare. The Mobile-First requirement and NFR-05.2 (≤3 taps to core functions) both fail if primary actions sit in the top-right corner of a 6-inch screen.

### P3 — Ledger honesty over decoration
Surfaces are **opaque**, borders are **1px**, shadows are **structural only** (modals, sticky bars, toasts). No glassmorphism, no glow, no gradients on chrome. Copy is Bahasa Indonesia; asset codes, barcode values, and monetary figures render in monospace with tabular numerals.

**Why:** This is an instrument, not a showcase. Frosted panels lose contrast over arbitrary content behind them (the exact problem the legacy NOON glass hit), warehouse lighting kills low-contrast chrome, and auditors need a printable, quotable record — codes that copy-paste cleanly and numbers that align in columns. Opaque surfaces, thin borders, and mono codes are the cheapest possible way to look *trustworthy* rather than *trendy*.

---

## 2. Visual direction

**Creative North Star: "Opname Field Desk"** — the moment of stocktake: a cool-gray clipboard under fluorescent light, a teal inventory stamp, a barcode label, a stamped ledger line. Institutional without being cold; precise without being sterile.

| Axis | Choice | Rationale |
| --- | --- | --- |
| Mood | Calm, precise, field-ready | Long data sessions at a desk + a phone in the other hand |
| Density | 7/10 desktop lists, 5/10 mobile cards | ≥10k assets on desktop; thumbs need air |
| Motion | 3/10 — feedback only (120–220ms) | Confirm save/scan/approve; never entertain |
| Light | Light-first (field), dark as equal peer (desk night work) | Cool paper reads outdoors; dark ink for late reconciliation |
| Culture | Indonesian enterprise ops | Labels and copy ID-first; codes and identifiers EN |

**Reference feel (craft bar, not clones):** government service forms (clarity under obligation), warehouse WMS mobile apps (thumb-reach ergonomics), accounting ledgers (mono codes, aligned numerals). The system should feel like well-maintained public infrastructure.

**Avoid (hard bans):**
- Glassmorphism / frosted / `backdrop-filter` on any chrome — *including the legacy glass toasts, glass sidebar, and glass header still in the codebase*
- Soft pastels (`#87CEEB`, `#FFB6C1`, `#90EE90` — the legacy `--color-soft-*` tokens)
- Warm cream + terracotta + serif display (the AI-default cluster); NOON amber/violet accents
- Purple-to-indigo SaaS gradients; neon glow; multi-layer decorative shadows
- Benton Sans or any luxury-bank face
- Purple anywhere — not a status, not an accent, not a chart series
- Emoji in UI chrome (Lucide icons only)
- Pure `#000` text or pure `#FFF` text on saturated fills without an AA check
- Pill-shaped primary CTAs (pills are for avatars; controls are rectangles)

---

## 3. Design tokens

### 3.1 Colors — core

| Token | Hex | Role | Verified contrast |
| --- | --- | --- | --- |
| `primary` | `#0D5C56` | CTAs, links, focus ring, brand mark | 7.8:1 on white (AAA) |
| `primary-hover` | `#0A4A45` | Primary hover/pressed | — |
| `primary-active` | `#083B37` | Primary active | — |
| `primary-muted` | `#D8EDEA` | Selected rows, active filter chips, Aktiva Tetap tint | — |
| `primary-muted-border` | `#A7D2CC` | Border for primary-muted chips | — |
| `ink` | `#15202B` | Primary text | 14.9:1 on paper (AAA) |
| `ink-muted` | `#5A6A7A` | Secondary text, placeholders | 5.6:1 on surface (AA) |
| `ink-subtle` | `#8593A2` | Timestamps, disabled text (non-essential only) | 3.5:1 — large text/meta only |
| `paper` | `#F1F4F6` | App background | — |
| `surface` | `#FFFFFF` | Cards, sheets, inputs, tables | — |
| `surface-sunken` | `#E9EDF0` | Table header rows, inset panels, Peralatan tint | — |
| `border` | `#D5DCE3` | Dividers, input strokes | — |
| `border-strong` | `#B9C4CE` | Hovered borders, pressed inputs | — |
| `destructive` | `#B42318` | Hapus, Tolak, irreversible confirmations | 5.9:1 on white |
| `success` | `#1B7F5A` | Success toast accent, saved indicators | — |
| `warning` | `#B45309` | Warning callouts (adjacent to RPR) | — |
| `info` | `#1D6A9F` | Informational callouts | — |

**Why mineral teal:** `#0D5C56` is deliberately *not* finance blue (trust-banking cliché), not hospital green, not SaaS purple. It reads as stewardship and inventory control — the emotional register of "this thing is accounted for". It also passes AAA on white for normal text, so it can carry links, focus rings, and small labels without a separate darker variant. Hue distance from every status color is large enough that the two layers never blur.

**Two reds, on purpose:** `destructive #B42318` belongs to **actions** (buttons that delete/reject). Status `DSP` uses its own red family (§3.2). Merging them would make every Dihapus row look like a live delete button, and every delete button look like a passive state.

### 3.2 Status map (LOCKED — P1)

Badge recipe: `text` on `bg` with 1px `border`. Text label always present — color is never the sole channel.

| Status | Code | Light text / bg / border | Contrast | Dark text / bg | Contrast |
| --- | --- | --- | --- | --- | --- |
| Aktif | ACT | `#166534` / `#DCFCE7` / `#86EFAC` | 6.6:1 | `#86EFAC` / `#052E16` | 10.5:1 |
| Dipinjamkan | LOAN | `#1E40AF` / `#DBEAFE` / `#93C5FD` | 7.2:1 | `#93C5FD` / `#172554` | 8.2:1 |
| Dalam Perbaikan | RPR | `#92400E` / `#FEF3C7` / `#FCD34D` | 6.4:1 | `#FCD34D` / `#451A03` | 10.4:1 |
| Dimutasi | MUT | `#155E75` / `#CFFAFE` / `#67E8F9` | 6.6:1 | `#67E8F9` / `#083344` | 9.2:1 |
| Dihapus | DSP | `#9F1239` / `#FFE4E6` / `#FDA4AF` | 6.6:1 | `#FDA4AF` / `#4C0519` | 8.3:1 |

**The Status Lock Rule.** These hues are semantic, not free accents. Do not use the ACT green for a "Save" button or the LOAN blue for a link. Primary CTAs are always `primary` teal. Dihapus additionally gets **muted row treatment** (slightly reduced content emphasis) — it is a tombstone, not a task.

**Tipe aset** (independent axis from status — FR-13.1):

| Tipe | Recipe |
| --- | --- |
| Aktiva Tetap | `#0D5C56` text on `#D8EDEA`, 1px `#A7D2CC` border |
| Peralatan | `#475569` text on `#E9EDF0`, 1px `#B9C4CE` border |

Tipe badges are **outline-tinted and quieter** than status badges (smaller dot, regular weight) so the eye reads status first, tipe second.

**Chart ramp (FR-13.8, dashboard/report panels):** when charting *status*, reuse the exact status hues above. For non-status series: `#0D5C56`, `#0E7490`, `#B45309`, `#1D6A9F`, `#475569` (teal → cyan → amber → blue → slate). Charts never introduce new hues.

### 3.3 Dark theme

| Token | Hex |
| --- | --- |
| `dark-bg` | `#0B1220` |
| `dark-surface` | `#151D2A` |
| `dark-surface-raised` | `#1B2534` (cards, sheets) |
| `dark-border` | `#2A3544` |
| `dark-ink` | `#E8EEF2` (14.5:1 on dark-surface) |
| `dark-ink-muted` | `#9AA8B5` (6.1:1 on dark-surface) |
| `dark-primary` | `#2A9B93` (5.0:1 on dark-surface) |
| `dark-primary-ink` | `#0B1220` — text on dark-primary buttons (5.5:1) |

Rules: dark surfaces are **cool navy, never purple-plum** (the legacy NOON plum `#1B1230` family is banned). Primary buttons in dark mode use `dark-primary` bg + `dark-primary-ink` text — white-on-teal fails AA at button sizes. Status recipes shift to the dark variants in §3.2; hue meaning never changes.

### 3.4 Typography

**UI face: Public Sans.** Designed for US government service forms — high x-height, open apertures, unfussy numerals. It stays legible at 12px in dense Indonesian table headers, sidesteps the Inter/Plus Jakarta AI-cluster sameness, and carries institutional trust without luxury connotations. Variable weight 400/500/600/700.

**Mono face: Noto Sans Mono.** Uniform advance widths make `kode aset` (`AST-2026-00001`) and barcode strings column-align and copy-paste cleanly; Noto's Indonesian Latin coverage means no fallback surprises.

| Role | Size | Weight | Use |
| --- | --- | --- | --- |
| Display | 1.75rem / 28px | 700 | Rare page titles (Dashboard, Scan) |
| Headline | 1.375rem / 22px | 600 | Section headers, detail page titles |
| Title | 1.125rem / 18px | 600 | Card titles, dialog titles |
| Body | 1rem / 16px | 400 | Forms, descriptions |
| Label | 0.875rem / 14px | 500 | Field labels, table headers, buttons |
| Caption | 0.75rem / 12px | 500 | Meta, timestamps, table footnotes |
| Mono | 0.875rem–1rem | 500 | Kode aset, barcode, nilai buku |

**The Code Face Rule.** Asset codes, barcode values, and monetary values are always mono with `font-variant-numeric: tabular-nums` — never the UI sans. Money renders Indonesian-formatted (`Rp1.250.000`).

### 3.5 Spacing, radii, shadows, motion

**Spacing** — base 4px; steps 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64. Screen padding 16px mobile, 24–32px desktop. Form stack gap 16px; section gap 24–32px. Touch target ≥44×44px; icon-only buttons get a 44px hit area even when the glyph is 20px.

**Radii** — `sm` 4px badges/chips · `md` 8px buttons/inputs/menus · `lg` 12px cards/sheets/dialogs · `full` avatars only. Map explicitly in Tailwind 4 theme (`--radius-sm: 0.25rem; --radius-md: 0.5rem; --radius-lg: 0.75rem`) instead of deriving from shadcn's single `--radius`.

**Shadows — structural only:**

| Token | Value | Use |
| --- | --- | --- |
| `none` | — | Resting surfaces (depth = border + paper→surface shift) |
| `sticky` | `0 1px 0 rgba(21,32,43,0.08)` | Sticky headers, tab bars, sticky footers |
| `overlay` | `0 8px 24px rgba(21,32,43,0.14)` | Dialogs, popovers, dropdowns |
| `toast` | `0 4px 16px rgba(21,32,43,0.12)` | Toasts |

**Motion** — 120ms micro (chips, badges), 180ms standard (sheets, dialogs), 220ms hard maximum (toasts). Single easing token: `cubic-bezier(0.32, 0.72, 0, 1)`. All transitions die under `prefers-reduced-motion`.

**Z-index ladder:** base 0 · sticky 100 · overlay 200 · dropdown 250 · modal 300 · toast 500.

### 3.6 Mapping to shadcn semantic tokens (`resources/css/app.css`)

| shadcn token | Light | Dark |
| --- | --- | --- |
| `--background` | `paper #F1F4F6` | `#0B1220` |
| `--card` / `--popover` | `#FFFFFF` | `#1B2534` |
| `--foreground` | `ink #15202B` | `#E8EEF2` |
| `--muted-foreground` | `#5A6A7A` | `#9AA8B5` |
| `--primary` / `--ring` | `#0D5C56` | `#2A9B93` |
| `--primary-foreground` | `#FFFFFF` | `#0B1220` |
| `--secondary` / `--accent` | `#E9EDF0` / `#E9EDF0` | `#1B2534` |
| `--destructive` | `#B42318` | `#F04438`-family tint, AA-checked |
| `--border` / `--input` | `#D5DCE3` | `#2A3544` |
| `--radius-lg/md/sm` | 12 / 8 / 4 px | same |

`--font-sans` becomes Public Sans; `--font-mono` becomes Noto Sans Mono. The legacy `--color-soft-blue/pink/green`, `--color-scan-red`, `--sidebar-glow`, `--sidebar-gradient`, and all `*-glass` utilities are **removed**.

---

## 4. Screen inventory

| # | Screen | Purpose | Primary action |
| --- | --- | --- | --- |
| 1 | SSO redirect / callback | OIDC authentication; no local login page | Redirect to IdP |
| 2 | Dashboard | Ringkasan jumlah & nilai aset by status, tipe, klasifikasi, lokasi (FR-10, FR-13.8) | Scan / Tambah aset |
| 3 | Aset — Browse/Index | Search, filter (klasifikasi/lokasi/status/tipe), bulk select & delete, remember-last-list | Tambah aset |
| 4 | Aset — Detail | Full record; accounting block if Aktiva Tetap; approval-status surface | Edit / Ajukan mutasi |
| 5 | Aset — Buat / Ubah | Create/edit asset: identitas → klasifikasi cascade → lokasi → tipe → accounting (conditional) → lampiran | Simpan |
| 6 | Aset — Scan | Camera scan → lookup → detail; manual code fallback | Open camera / enter code |
| 7 | Aset — Label / Label Batch | Print/export barcode labels (single + batch) | Cetak label |
| 8 | Aset — Import | Spreadsheet import (office format) + result panel | Pilih file / Impor |
| 9 | Aset — Riwayat | Per-asset timeline: changes, mutasi, disposal, nilai buku snapshots, tipe overrides | Filter riwayat |
| 10 | Klasifikasi | 4-level tree CRUD (Golongan→Kategori→Cluster→Sub-cluster), drag reorder, CSV import/export | Tambah node |
| 11 | Kategori / Item / Lokasi | Master data CRUD tables | Tambah |
| 12 | Mutasi — Daftar / Buat / Detail | Transfer lifecycle; approve/reject | Ajukan / Setujui |
| 13 | Disposal — Daftar / Buat / Ubah / Detail | Disposal lifecycle; approve/reject; bulk | Ajukan / Setujui |
| 14 | Laporan | Mutasi & disposal reports + XLSX/PDF export (FR-10.6) | Ekspor |
| 15 | Audit Log | Activity search: pelaku, waktu, aksi (FR-12) | Filter |
| 16 | Organisasi / Departemen / Karyawan | Org structure + employee↔role bridge | Sinkron / Tambah |
| 17 | Peran / Izin | RBAC management (44-gate catalogue) | Tambah peran |
| 18 | Pengaturan — Profil / Keamanan | Profile, password, 2FA, passkeys | Simpan |
| 19 | Pengaturan — Ambang Kapitalisasi | Threshold config + hitung ulang/backfill (FR-13.3, FR-13.11) | Simpan ambang |
| 20 | Pengaturan — Appearance | Light/dark/system | Pilih tema |
| 21 | Tenant switch | Change active organization (session) | Pilih organisasi |

---

## 5. User flows (key journeys)

### F1 — Scan & verify (the field journey)
1. **Tab Scan** (bottom bar, center-emphasized) → camera viewfinder opens; manual kode entry visible below as fallback.
2. Successful decode → lookup ≤2s (NFR-01.2) → **ScanResultSheet**: status badge (top, largest), nama aset, kode mono, lokasi, tipe badge.
3. Hierarchy inside the sheet: status → identity → location → actions. Primary: **Lanjut pindai** (sticky). Secondary: **Buka detail**.
4. Not found → sheet with "Barcode tidak ditemukan" + manual entry focused + link to search. Failure is `aria-live="assertive"`.

### F2 — Register asset
1. Aset list → **Tambah aset**.
2. Sections in order: Identitas → Klasifikasi (4-level cascade select) → Lokasi & pemilik → Tipe (auto from nilai perolehan vs threshold; override requires alasan — FR-13.9) → **Accounting block only if Aktiva Tetap** (nilai perolehan, masa manfaat, metode penyusutan; FR-13.4/13.6) → Lampiran.
3. Sticky footer: **Simpan** (primary) + Batal. Validation inline per field; 500 → toast + form preserved.

### F3 — Mutasi
1. From asset detail or Mutasi list → **Ajukan mutasi**.
2. Form: asal (read-only, current lokasi) → tujuan (location picker) → tanggal → catatan.
3. Approver path: Mutasi detail → **Setujui** / **Tolak** (Tolak requires alasan).
4. On approve: lokasi updates automatically (FR-06.5); status reflects Dimutasi → Aktif; both appear in Riwayat.

### F4 — Disposal
1. **Ajukan disposal** + alasan (required) + tanggal.
2. Manajemen approves → status **Dihapus** (DSP); asset locked from active transactions (FR-07.6); row gets muted treatment in lists.
3. Destructive-adjacent: the *action* of requesting uses primary button; only irreversible confirmations use destructive styling.

### F5 — Opname via list
1. Daftar → FilterBar: search (nama/kode/barcode FR-04.1) + chips for klasifikasi, lokasi, status, tipe (FR-04.2, FR-13.7); overflow into bottom sheet on mobile.
2. Select-mode → BulkToolbar: **Hapus massal** (permissioned, confirm dialog), **Cetak label batch**.
3. Returning from detail/edit restores last list state (page + filters).

### F6 — Audit
1. Audit Log → filter pelaku/waktu/aksi → ledger table (who/when/what, FR-09.3).
2. Or Aset → Riwayat: chronological timeline per asset including mutasi, disposal, tipe override reasons (FR-13.9), and nilai buku snapshots per period (FR-13.10).

### F7 — Tenant switch & SSO
1. `/` redirects unauthenticated users to corporate OIDC (no password form to design).
2. Authenticated users switch organization via topbar tenant menu → confirmation → full data re-scope; tenant name always visible in the top bar.

---

## 6. Layout per screen

| Screen | Layout building blocks |
| --- | --- |
| Dashboard | `PageHeader`, `MetricStrip` (status counts), `ChartPanel` (breakdown by tipe + status, FR-13.8), `QuickActions` (Scan, Tambah aset), `RecentActivity` |
| Aset Browse | `PageHeader`, `FilterBar` (search + chips → sheet on mobile), `AssetCardGrid` <768 / `DataTable` ≥1024, `BulkToolbar`, `Pagination`, `ImportResultPanel` (dismissible, after import) |
| Aset Detail | `StatusHeader` (badge + nama + kode mono + actions), `DefinitionList`, `AccountingPanel` (Aktiva Tetap only), `ApprovalStateCallout`, `RelatedTabs` (Riwayat, Label) |
| Form buat/ubah | `FormSection` ×5, `CascadeSelect` (klasifikasi), `MoneyInput` (ID-ID), `TipeField` (auto + override with alasan), `StickyFormFooter` |
| Scan | `ScanViewport` (full-bleed), `ManualCodeEntry`, `ScanResultSheet`, `ScanErrorSheet` |
| Label / Batch | `LabelPreview` (pure black-on-white print sheet), `PrintControls` |
| Import | `Dropzone`, `ImportProgress`, `ImportResultPanel` (imported/skipped/errors table) |
| Klasifikasi | `TreeView` (4 levels, drag handles), `DetailPanel`, `InlineEdit`, `BulkActionBar` |
| Mutasi/Disposal | List = asset list pattern + `ApprovalBadge`; Detail = `ApprovalActions` (Setujui/Tolak + alasan dialog) |
| Laporan | `ReportFilters`, `ExportButtonGroup` (XLSX/PDF), `ResultTable` |
| Audit Log | `FilterBar`, `LedgerTable` (actor, action, target, timestamp — tabular-nums) |
| Org/Peran/Izin | Standard CRUD tables + `PermissionMatrix` (role × gate grid) |
| Settings | `SettingsNav` (vertical, desktop; horizontal chips, mobile) + form panels |
| Shell — desktop | Collapsible sidebar (`AppSidebar`, opaque `paper`) + `TopAppBar` (tenant switcher, appearance, user) |
| Shell — mobile | `TopAppBar` + `BottomTabBar` (Beranda / Aset / **Scan** / Laporan / Lainnya) + `ToastRegion` above tab bar |

---

## 7. Component library

All shadcn/ui primitives are restyled via the token mapping in §3.6 — never re-colored per page.

### Buttons
| Variant | When | States |
| --- | --- | --- |
| Primary (teal) | One per view — the main action | default / hover / active / focus-visible / disabled / loading |
| Secondary (outline) | Cancel, alternatives | same |
| Ghost | Toolbars, tertiary | same |
| Destructive | Hapus, Tolak — irreversible only; bulk requires confirm dialog | same |
| Icon | Dense toolbars | 44px hit target, `aria-label` in Indonesian |

Loading: spinner replaces icon, label persists, `aria-busy="true"`, width locked (no layout shift).

### Inputs
Text, Textarea, Select, Combobox (search), CascadeSelect (klasifikasi), Date, Money (Rp, ID-ID), File. Label above, error below in `destructive` with icon, hint in `ink-muted`. Focus: 2px `primary` ring, 2px offset. `aria-invalid` + `aria-describedby` wired.

### AssetCard — *the signature component*
Photo/placeholder · nama (Title) · kode (mono) · `StatusBadge` · `TipeBadge` · lokasi (Caption).
Variants: default / compact (scan result) / selectable (checkbox mode) / muted (DSP tombstone).
States: resting / pressed (scale 0.995 + border-strong) / selected (primary-muted bg) / disabled.
If AssetCard and StatusBadge are wrong, the product is wrong.

### StatusBadge / TipeBadge
Locked recipes (§3.2). Soft-rectangle (4px), never capsule. Always text + color; optional 6px leading dot for scan-distance legibility.

### FilterBar
Search input + filter chips; chips show active value; overflow → bottom `Sheet` on mobile. Active chip: primary-muted bg + border.

### DataTable (desktop)
Sticky header on `surface-sunken`, sortable columns (arrow indicator), checkbox column for bulk, row click → detail, tabular-nums for all numeric columns, 1px row dividers. Density: 44px rows default, 36px compact with preserved hit area.

### Dialog / AlertDialog / Sheet
`overlay` shadow, `lg` radius, focus-trapped. Destructive confirms: destructive button right (LTR), never auto-focused. Bottom Sheets on mobile for filters and scan results.

### Toast
**Solid surface** (no glass — legacy glass toasts are removed), semantic icon tint (success/warning/info/destructive), stacked above mobile tab bar, `aria-live="polite"` (scan failures `assertive`), max 3 visible.

### BottomTabBar / TopAppBar / AppSidebar
5 tabs max, Scan center-emphasized (larger glyph, same 44px target). Sidebar: opaque, 1px border, `aria-current` nav states, permission-filtered items (`useCan()`).

### Skeleton
Shimmer matching final layout geometry — never a lone circular spinner for page loads.

### EmptyState
Lucide icon + one Bahasa Indonesia sentence + primary CTA (e.g., "Belum ada aset" → Tambah aset / Impor).

### Timeline (Riwayat)
Vertical rail, event icon per type (edit/mutasi/disposal/override/nilai buku), actor + timestamp (Caption), delta values in mono.

### ApprovalActions
Setujui (primary) / Tolak (destructive w/ alasan dialog); disabled with tooltip when not the assigned approver.

---

## 8. States (key screens)

| Screen | Empty | Loading | Error | Success | Offline |
| --- | --- | --- | --- | --- | --- |
| Aset daftar | "Belum ada aset" + CTA Tambah/Impor | Skeleton cards/rows in final geometry | Inline alert panel + **Coba lagi** | Toast after bulk ops; list refreshes | Banner `role="status"` "Tidak ada koneksi"; cached list read-only; writes disabled |
| Scan | Viewfinder + tip "Arahkan ke barcode" | Decoding indicator on sheet | "Barcode tidak ditemukan" + manual entry focused (`aria-live="assertive"`) | Sheet with asset summary | Camera works; lookup fails → explicit offline message + manual entry |
| Form aset | — | Submit disabled + spinner | Field-level errors; 500 → toast, form preserved | Toast "Aset disimpan" → return to remembered list | Simpan disabled + local draft warning |
| Mutasi/Disposal | Empty queue message | Row skeletons | Toast error; item stays pending | Toast + list refresh | Banner; approve/reject blocked |
| Dashboard | Zero-state with "Tambah aset pertama" | Metric skeletons | Panel-level error with retry (other panels keep rendering) | — | "Data terakhir: <timestamp>" staleness label |
| Import | Dropzone idle | Progress + streamed partial results | Per-row error table (capped 250, per import report) | Summary panel: imported/skipped/errors | Abort with message |
| Laporan | "Tidak ada data pada rentang ini" | Table skeletons | Export failure toast + retry | File downloaded toast | Export disabled |

**Offline is explicit and honest.** No silent retry queues or optimistic sync in MVP — writes are visibly disabled with a reason. Better an honest "no connection" than a silent data lie in an audit product.

---

## 9. Responsive behavior

Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

| Concern | Mobile (<768) | Tablet (768–1023) | Desktop (≥1024) |
| --- | --- | --- | --- |
| Navigation | Bottom tabs + top bar | Bottom tabs or narrow rail | Collapsible sidebar |
| Lists | Cards 1-col | Cards 2-col | DataTable, sticky header |
| Filters | Bottom sheet | Wrapping chips | Inline FilterBar |
| Primary CTA | Sticky footer / Scan tab | Sticky footer optional | Header button |
| Klasifikasi | Full-screen tree | Tree + weak split | Tree + detail panel split |
| Scan | Full-bleed camera | Contained viewport | Contained + side help panel |
| Tables | Never scroll-only — collapse to cards | Optional horizontal scroll | Sticky first column optional |
| Detail | Stacked sections | 2-col where natural | DefinitionList 2-col + side actions |
| Touch target | 44px always | 44px | 36px dense rows OK (hit area preserved) |

Rule of conversion: a mobile card must contain **the same** decision-relevant fields as its desktop row — responsive is a layout change, never a data downgrade.

---

## 10. Accessibility

### Contrast (WCAG 2.2 AA, AAA preferred for body)
| Pair | Ratio | Grade |
| --- | --- | --- |
| `ink` on `paper` / `surface` | 14.9:1 | AAA |
| `ink-muted` on `surface` | 5.6:1 | AA |
| `primary` text on `surface` | 7.8:1 | AAA |
| White on `primary` (buttons) | 7.8:1 | AAA |
| Status badge recipes (light) | 6.4–7.2:1 | AA+ |
| Status badge recipes (dark) | 8.2–10.5:1 | AAA |
| `dark-primary` on dark surfaces | 5.0:1 | AA |
| `ink-subtle` (timestamps) | 3.5:1 | Large text / non-essential meta only |

Focus ring (`primary`, 2px, 2px offset) holds ≥3:1 against both `paper` and `surface`. Dark theme verified separately — never assume light numbers transfer.

### Focus order
1. Skip link → main landmark
2. Top bar / sidebar
3. Page header + actions
4. Filters → content → sticky CTA
5. Dialogs/sheets trap focus; on close, focus returns to invoker

No `outline: none` without a visible replacement. Focus ring is `primary` (dark: `dark-primary`), never removed on interactive elements.

### Keyboard
- All actions reachable and operable by keyboard.
- Tree (Klasifikasi): ↑↓ move within level, ←→ collapse/expand, Enter opens detail.
- DataTable: row focus + Enter = open; Space toggles selection; column header Enter toggles sort.
- Scan page: when camera unavailable, focus moves to manual code entry automatically.
- Dialogs: Esc closes (sheets too); destructive confirms require explicit button press, never Enter-by-default on the destructive action.
- BottomTabBar: standard Tab order, not roving.

### ARIA
- Toast region: `aria-live="polite"`; scan failures `assertive`.
- Tabs: `role="tablist"` + `aria-selected`; Tree: `aria-expanded`/`aria-level`.
- Loading: `aria-busy="true"` on buttons and panels; skeletons `aria-hidden` with an accessible "Memuat…" label.
- Icon-only buttons: Indonesian `aria-label` ("Pindai barcode", "Hapus").
- Badges: real text content — color/`aria-label`-only is banned.
- Forms: `aria-invalid` + `aria-describedby` → error id.
- Offline banner: `role="status"`.
- Tenant switcher and appearance toggle: `aria-haspopup` + expanded state.

### Motion & print
`prefers-reduced-motion` → instant state swaps (no shimmer, no slide). Label print sheets are pure black-on-white, mono codes, no brand color — print durability over branding.

---

## Do's and Don'ts

### Do
- **Do** keep Scan one tap from any authenticated mobile screen.
- **Do** show StatusBadge + mono kode on every asset summary — card, row, sheet, detail.
- **Do** hide accounting fields unless tipe = Aktiva Tetap (FR-13.6).
- **Do** write all copy in Bahasa Indonesia; keep codes and identifiers in English.
- **Do** keep primary CTAs mineral teal; reserve red for irreversible actions.
- **Do** verify both themes and a real phone in daylight before shipping a screen.

### Don't
- **Don't** use glass, glow, gradients, or purple — anywhere.
- **Don't** reuse status hues for decoration or the primary color for status.
- **Don't** pill-shape CTAs or use emoji in chrome.
- **Don't** ship a table as the only mobile presentation of a list.
- **Don't** rely on color alone for status, selection, or error.
- **Don't** animate beyond 220ms or for decoration.
- **Don't** style asset codes in the UI sans.

---

## Implementation notes for agents

1. **`resources/css/app.css` is the first ticket.** Replace `--font-sans` (drop Benton Sans → Public Sans via `@fontsource-variable/public-sans`), add `--font-mono` (Noto Sans Mono), apply the §3.6 token map for light + dark, delete `--color-soft-*`, `--color-scan-red`, `--sidebar-glow`, `--sidebar-gradient`, and every `*-glass` utility (sidebar-glass, glass-header, glass toasts, glass panels).
2. Update `tailwind` theme radii explicitly (4/8/12), add motion + shadow tokens, `font-variant-numeric: tabular-nums` utility for tables and metrics.
3. Sweep legacy NOON accents (amber/violet/plum, e.g. on roles/permissions pages) → semantic tokens.
4. Status map lives in one shared constants module (code → recipe) — no inline hexes in components.
5. Wayfinder imports only (`@/routes`, `@/actions/...`); no hardcoded URLs; regenerate with `--with-form` after route changes.
6. React Compiler is active — avoid manual memoization patterns that conflict with it.
7. PRODUCT.md brand commitments already point here; PRD §12.2/§12.3 UI-polish lines should be marked updated once tickets land.
8. Feature screens are restyled only after tokens + shell + status layer land — sequence is in the tickets.
