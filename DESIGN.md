---
version: '1.0'
name: 'Opname Field Desk'
description: 'Operational UI for Indonesian enterprise asset management — field scan first, ledger clarity second, no decorative chrome.'
colors:
  primary: '#0D5C56'
  primary-hover: '#0A4A45'
  primary-muted: '#D8EDEA'
  ink: '#15202B'
  ink-muted: '#5A6A7A'
  paper: '#F1F4F6'
  surface: '#FFFFFF'
  border: '#D5DCE3'
  focus: '#0D5C56'
  status-aktif: '#1B7F5A'
  status-loan: '#1D6A9F'
  status-rpr: '#B45309'
  status-mut: '#0E7490'
  status-dsp: '#9B2C2C'
  tipe-aktiva: '#0D5C56'
  tipe-peralatan: '#475569'
  destructive: '#B42318'
  success: '#1B7F5A'
  warning: '#B45309'
  info: '#1D6A9F'
  dark-bg: '#0B1220'
  dark-surface: '#151D2A'
  dark-border: '#2A3544'
  dark-primary: '#2A9B93'
typography:
  display:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.75rem'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.375rem'
    fontWeight: 650
    lineHeight: 1.3
  title:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Public Sans, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: '0.01em'
  mono:
    fontFamily: 'Noto Sans Mono, ui-monospace, monospace'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.4
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
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
    height: '44px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.surface}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
    height: '44px'
  button-destructive:
    backgroundColor: '{colors.destructive}'
    textColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
    height: '44px'
  input-default:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '10px 12px'
    height: '44px'
  card-asset:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '16px'
  badge-status:
    rounded: '{rounded.sm}'
    padding: '2px 8px'
  tabbar-mobile:
    backgroundColor: '{colors.surface}'
    height: '64px'
---

# Design System: Opname Field Desk

> **Mode:** Operate (task completion over expression)
> **Product:** Opti-Asset — multi-tenant asset management (PRD Sistem Manajemen Aset v1.3 + Mobile-First UI PRD)
> **Replaces:** Soft UI Evolution pastels, American Express / Benton Sans, and NOON warm glassmorphism

---

## 1. Design principles (mandatory)

### P1 — Status is the interface
Every asset screen must make **status** (Aktif / Dipinjamkan / Dalam Perbaikan / Dimutasi / Dihapus) and **tipe** (Aktiva Tetap / Peralatan) readable in under one second without opening a detail view. Color, badge shape, and label are locked to the status token map — never decorative accents.

**Why:** Staff Asset and Auditor success is "know the state of this thing now." Soft pastel systems and glass chrome bury that signal.

### P2 — Thumb-first, desk-second
Primary actions (Scan, Simpan, Ajukan mutasi, Ajukan disposal) sit in the **thumb zone** on mobile (bottom bar / sticky footer). Dense tables are a **desktop privilege**; below `md` the same data is card + section stacks. Minimum interactive height: **44px**.

**Why:** The Mobile-First PRD and NFR-05 require ≤3 taps to core tasks on smartphones used during opname and corridor walks.

### P3 — Ledger honesty over decoration
Surfaces are **opaque**, borders are **1px**, shadows are **structural only** (modals, sticky bars, toasts). No glassmorphism, no glow, no neon. Copy is Bahasa Indonesia; asset codes and barcodes use monospace.

**Why:** Outdoor/warehouse glare kills frosted glass; auditors need contrast and printable mental models; Indonesian-first is a PRODUCT.md brand commitment.

---

## 2. Visual direction

**Creative North Star: "Opname Field Desk"**

The metaphor is the moment of **opname aset**: a cool-gray clipboard under fluorescent light, a teal inventory stamp, a barcode label, a stamped ledger line. Not banking luxury, not pastel SaaS, not dark cyber-ops.

| Axis | Choice | Rationale |
| --- | --- | --- |
| Mood | Calm, precise, field-ready | Long data sessions + phone in hand |
| Density | 7/10 on desktop lists; 5/10 on mobile cards | PRD volume ≥10k assets; phone needs breathing room |
| Motion | 3/10 — feedback only (150–220ms) | Confirm save/scan; never entertain |
| Light | Light-first for field; dark as equal peer for desk night work | Cool paper outdoors; dark ink desk for night reviews |
| Culture | Indonesian enterprise ops | Labels ID; codes EN |

**Reference feel (craft bar, not clones):** government service forms (clarity), warehouse WMS mobile (thumb reach), accounting ledgers (mono codes).

**Avoid (hard bans):**
- Soft UI pastels (`#87CEEB` / `#FFB6C1` / `#90EE90`)
- Warm cream + terracotta / serif display (AI default cluster)
- Purple-to-indigo SaaS gradients, neon glow, multi-layer shadows
- American Express Benton Sans / Centurion luxury cues
- Glassmorphism / frosted panels as primary chrome
- Emoji in UI chrome (Lucide icons only)
- Pure black `#000` or pure white text on saturated fills without AA check

---

## Overview

**Creative North Star: "Opname Field Desk"**

Opti-Asset is an Operate product: Staff Asset, Admin Department, Manajemen, and Auditor complete classification, CRUD, scan, mutasi, disposal, and audit trails. The UI must feel like a trustworthy field instrument — cool, mineral, slightly institutional — so status and codes dominate perception.

Key characteristics:
- Restrained palette: cool paper + mineral teal primary; status colors carry meaning
- Public Sans for UI; Noto Sans Mono for kode aset / barcode values
- Card lists on mobile; data tables on desktop
- Opaque surfaces, thin borders, minimal elevation
- Full light + dark themes with shared semantic tokens

---

## 3. Design tokens

### Colors

| Token | Hex | Role |
| --- | --- | --- |
| `primary` | `#0D5C56` | CTAs, links, focus ring, brand mark |
| `primary-hover` | `#0A4A45` | Primary pressed/hover |
| `primary-muted` | `#D8EDEA` | Selected rows, soft chips |
| `ink` | `#15202B` | Primary text |
| `ink-muted` | `#5A6A7A` | Secondary text, placeholders |
| `paper` | `#F1F4F6` | App background |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `border` | `#D5DCE3` | Dividers, input stroke |
| `destructive` | `#B42318` | Delete, reject, irreversible |
| `success` | `#1B7F5A` | Toast success, confirm |
| `warning` | `#B45309` | Warnings, RPR adjacency |
| `info` | `#1D6A9F` | Informational callouts |

**Status map (locked — P1):**

| Status | Code | Hex | Usage |
| --- | --- | --- | --- |
| Aktif | ACT | `#1B7F5A` | Badge + optional left rail on cards |
| Dipinjamkan | LOAN | `#1D6A9F` | Badge |
| Dalam Perbaikan | RPR | `#B45309` | Badge |
| Dimutasi | MUT | `#0E7490` | Badge (in-transit cyan, not purple) |
| Dihapus | DSP | `#9B2C2C` | Badge; muted row treatment |

**Tipe aset:**
- Aktiva Tetap → `#0D5C56` outline badge
- Peralatan → `#475569` outline badge

**Dark theme:**
- `dark-bg` `#0B1220` · `dark-surface` `#151D2A` · `dark-border` `#2A3544`
- `dark-primary` `#2A9B93` (lighter teal for AA on dark surfaces)
- Status hues shift +8–12% lightness; never invert meaning

**The Status Lock Rule.** Status hexes are not free accents. Do not use `#1B7F5A` for a marketing CTA; primary CTAs use `primary` teal only.

**Contrast targets:** Body text on paper ≥ 7:1; UI text on surface ≥ 4.5:1; large text ≥ 3:1; focus ring 3:1 against adjacent colors (WCAG 2.2 AA).

### Typography

**UI face: Public Sans** — designed for high-stakes government forms (USWDS). It stays legible in dense Indonesian labels, resists the Inter/Jakarta AI cluster, and signals institutional trust without luxury branding.

**Mono face: Noto Sans Mono** — reliable digit/letter width for `kode aset` and barcode strings; Noto family aligns with Indonesian glyph coverage if copy expands.

| Role | Size | Weight | Use |
| --- | --- | --- | --- |
| Display | 1.75rem (28px) | 700 | Rare page titles (Dashboard, Scan) |
| Headline | 1.375rem (22px) | 650 | Section headers |
| Title | 1.125rem (18px) | 600 | Card titles, dialog titles |
| Body | 1rem (16px) | 400 | Forms, descriptions |
| Label | 0.875rem (14px) | 500 | Field labels, table headers |
| Caption | 0.75rem (12px) | 500 | Meta, timestamps |
| Mono | 0.875–1rem | 500 | Kode aset, barcode, nilai buku |

**The Code Face Rule.** Never style asset codes in the UI sans; always mono.

### Spacing scale

Base unit **4px**. Common steps: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48.

- Screen padding mobile: 16px
- Screen padding desktop: 24–32px
- Stack gap in forms: 16px
- Section gap: 24–32px
- Touch target: min 44×44px; icon-only buttons 44px hit area even if glyph is 20px

### Corner radii

| Token | Value | Use |
| --- | --- | --- |
| `sm` | 4px | Badges, tiny chips |
| `md` | 8px | Buttons, inputs, menu items |
| `lg` | 12px | Cards, sheets, dialogs |
| `full` | 9999px | Avatars only — **not** pills for primary actions |

### Shadows

| Token | Value | Use |
| --- | --- | --- |
| `none` | — | Default resting surfaces |
| `sticky` | `0 1px 0 rgba(21,32,43,0.08)` | Sticky headers / tab bars |
| `overlay` | `0 8px 24px rgba(21,32,43,0.14)` | Dialogs, popovers |
| `toast` | `0 4px 16px rgba(21,32,43,0.12)` | Toasts |

No glow (`box-shadow` with saturated color). Depth otherwise comes from `border` + background shift (`paper` → `surface`).

---

## Colors

Cool mineral system: teal primary on cool gray paper. Status colors are a separate semantic layer.

### Primary
- **Mineral Teal** (`#0D5C56`): CTAs, focus, brand. Reads as stewardship/inventory, not finance blue or hospital green.

### Neutral
- **Ink** (`#15202B`), **Muted Ink** (`#5A6A7A`), **Paper** (`#F1F4F6`), **Surface** (`#FFFFFF`), **Border** (`#D5DCE3`)

### Semantic / Status
See token tables above. Destructive red is reserved for irreversible actions (hapus, reject disposal) — never for soft warnings.

---

## Typography

See §3. Character: workhorse institutional grotesque + mono ledger codes. No display serif. No tracked all-caps except tiny table column headers (max 0.04em).

---

## Layout

- **Shell:** Desktop = collapsible sidebar + main. Mobile = top app bar + bottom tab bar (Beranda / Aset / Scan / Laporan / Lainnya).
- **Content max:** 1280px for dashboards; full-bleed lists may use viewport width with internal padding.
- **Breakpoints:** `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280
- **Mobile (<768):** cards, stacked filters in sheet, sticky primary CTA
- **Tablet (768–1023):** 2-col card grids; filters may be horizontal chips
- **Desktop (≥1024):** tables with sticky header; sidebar classification tree where relevant
- **z-index:** base 0 · sticky 100 · overlay 200 · modal 300 · toast 500

---

## Elevation & Depth

Flat-by-default. Borders define regions. Shadows only for overlay / sticky / toast (`sticky`, `overlay`, `toast` tokens).

**The No-Glass Rule.** No `backdrop-filter: blur` on primary chrome. Optional 2% tint on toasts is allowed only if contrast still meets AA.

---

## Shapes

8px controls, 12px cards, 4px badges. Prefer rectangular buttons over pill CTAs. Status badges are soft-rectangle, not capsules that compete with buttons.

---

## 4. Screen inventory

| Screen | Purpose |
| --- | --- |
| Login / SSO callback | Authenticate via corporate OIDC |
| Dashboard | Ringkasan jumlah aset by status, klasifikasi, lokasi, tipe (FR-10 / FR-13.8) |
| Aset — Daftar | Search/filter/browse assets; bulk actions |
| Aset — Detail | Full record, accounting fields if Aktiva Tetap, actions |
| Aset — Buat / Ubah | Create/edit asset + classification + tipe |
| Aset — Scan | Camera/scanner lookup → asset detail or not-found |
| Aset — Label / Label Batch | Print/export barcode labels |
| Aset — Import | Spreadsheet import + result panel |
| Aset — Riwayat | Per-asset history timeline |
| Klasifikasi | 4-level tree CRUD (Golongan→…→Sub-cluster) |
| Item | Master item specs linked to classification |
| Lokasi | Location master |
| Mutasi — Daftar / Buat / Detail | Transfer lifecycle + approve/reject |
| Disposal — Daftar / Buat / Ubah / Detail | Disposal lifecycle |
| Laporan | Mutasi & disposal reports + export XLSX/PDF |
| Audit Log | User activity search |
| Karyawan / Departemen / Organisasi | Org structure & tenants |
| Peran / Izin | RBAC |
| Pengaturan — Profil / Keamanan / Appearance | User settings |
| Pengaturan — Ambang Kapitalisasi | Threshold for Aktiva Tetap vs Peralatan |
| Tenant switch | Change active organization |

---

## 5. User flows (key journeys)

### F1 — Scan & verify (primary field journey)
1. Tab **Scan** → camera viewfinder + manual kode fallback
2. Successful decode → lookup ≤2s (NFR-01.2) → **Detail aset**
3. Hierarchy: status badge → nama → kode mono → lokasi → actions (Mutasi / Riwayat)
4. Primary action: continue scanning (sticky) · Secondary: open full detail

### F2 — Register asset
1. Aset → **Tambah**
2. Sections: Identitas → Klasifikasi cascade → Lokasi/Pemilik → Tipe (auto from nilai perolehan) → Accounting block **only if Aktiva Tetap** → Lampiran
3. Primary: **Simpan** (sticky footer mobile)

### F3 — Mutasi
1. From detail or Mutasi → **Ajukan mutasi**
2. Asal (read-only) → Tujuan → Tanggal → Catatan
3. Approver: Detail → **Setujui** / **Tolak**
4. On approve: lokasi updates; status reflects Dimutasi→Aktif per business rules

### F4 — Disposal
1. Ajukan disposal + alasan + tanggal
2. Manajemen approve path
3. Status → Dihapus; asset locked from active transactions

### F5 — Opname via list
1. Daftar → filters (klasifikasi, status, lokasi, tipe)
2. Card/table select → bulk label / bulk delete (permissioned)
3. Remember-last-list on return from detail/edit

### F6 — Audit
1. Audit Log → filter pelaku/waktu/aksi
2. Or Aset Riwayat → chronological ledger of changes / mutasi / disposal / nilai buku

---

## 6. Layout per screen (components)

| Screen | Layout building blocks |
| --- | --- |
| Dashboard | `PageHeader`, `MetricStrip`, `ChartPanel` / breakdown by tipe+status, `QuickActions` (Scan, Tambah aset) |
| Aset daftar | `PageHeader`, `FilterBar` (chips + sheet), `AssetCardGrid` **or** `DataTable`, `BulkToolbar`, `Pagination`/`InfiniteScroll` |
| Aset detail | `StatusHeader`, `DefinitionList`, `AccountingPanel` (conditional), `ActionRow`, `RelatedTabs` (Riwayat, Label) |
| Form buat/ubah | `FormSection`s, `CascadeSelect`, `MoneyInput`, `StickyFormFooter` |
| Scan | `ScanViewport`, `ManualCodeEntry`, `ScanResultSheet` |
| Klasifikasi | `TreeView`, `DetailPanel`, `InlineEdit` |
| Mutasi/Disposal lists | Same list pattern as aset; `ApprovalBadge` |
| Reports | `ReportFilters`, `ExportButtonGroup`, `ResultTable` |
| Settings threshold | `SettingsForm`, `ConfirmDialog` for recalculate/backfill |
| Mobile shell | `TopAppBar`, `BottomTabBar`, `ToastRegion` (above tab bar) |

---

## 7. Component library

### Buttons
| Variant | When | States |
| --- | --- | --- |
| Primary | One main action per view | default / hover / active / focus / disabled / loading |
| Secondary | Cancel, alternative | + outline border |
| Ghost | Tertiary / toolbar | text+icon |
| Destructive | Hapus, Tolak irreversible | confirm dialog required for bulk |
| Icon | Toolbar | 44px hit target |

Loading: replace label with spinner + `aria-busy`; keep width stable.

### Inputs
Text, Textarea, Select, Combobox, Cascade classification, Date, Money (ID-ID), File. Label above. Error text below in destructive. Focus: 2px `primary` ring offset 2px.

### AssetCard
Photo/placeholder · nama · kode mono · `StatusBadge` · `TipeBadge` · lokasi caption. Pressed state; checkbox mode for bulk.

### StatusBadge / TipeBadge
Locked colors (§3). Text always present (not color-only).

### FilterBar
Search + chip filters; overflow → bottom sheet on mobile.

### DataTable (desktop)
Sticky header, sortable columns, row click → detail, checkbox column.

### Dialog / AlertDialog
`overlay` shadow; destructive actions use destructive button on the right (LTR).

### Toast
Solid surface (not glass), icon tint by semantic, stacks above mobile tab bar.

### BottomTabBar
5 items max; Scan is center-emphasized (slightly larger icon, still 44px).

### Skeleton
Shimmer matching final layout (no generic circular spinner for page loads).

### EmptyState
Icon + one sentence + primary CTA.

---

## Components (canonical summary)

Buttons, inputs, cards, badges, navigation, skeletons, empty states as specified in §7. Signature component: **AssetCard + StatusBadge** — the system's most repeated object; if these two are wrong, the product is wrong.

---

## 8. States (key screens)

| Screen | Empty | Loading | Error | Success | Offline |
| --- | --- | --- | --- | --- | --- |
| Aset daftar | "Belum ada aset" + CTA Tambah / Import | Skeleton cards/rows | Inline alert + Retry | Toast after bulk ops | Banner "Tidak ada koneksi"; read-only cache if available; disable writes |
| Scan | Idle viewfinder tip | Decoding/lookup spinner on sheet | "Barcode tidak ditemukan" + manual entry | Sheet with asset summary | Block camera lookup; show manual + offline message |
| Form aset | — | Disable submit + progress | Field errors + toast on 500 | Toast "Aset disimpan" + return-to-list | Disable Simpan; keep local draft warning |
| Mutasi/Disposal approval | Empty queue message | Row skeletons | Toast error; leave item pending | Toast + list refresh | Banner; block approve/reject |
| Dashboard | Zero metrics with hint to add assets | Metric skeletons | Panel-level error | — | Stale timestamp "Data terakhir: …" |
| Import | Dropzone idle | Progress + partial results | Per-row error table | Summary panel counts | Abort with message |

Offline is **explicit and honest** (Mobile PRD open question): no silent queue in MVP unless product later validates sync; prefer clear disabled writes.

---

## 9. Responsive behavior

| Concern | Mobile (<768) | Tablet | Desktop (≥1024) |
| --- | --- | --- | --- |
| Nav | Bottom tabs | Bottom tabs or narrow rail | Sidebar |
| Lists | Cards, 1 col | Cards 2 col | Table |
| Filters | Sheet | Chips wrap | Inline FilterBar |
| Primary CTA | Sticky footer / tab Scan | Sticky footer optional | Header button |
| Classification | Full-screen tree | Split weak | Tree + detail split |
| Scan | Full-bleed camera | Contained | Contained + side help |
| Tables | Never horizontal-scroll as only option — switch to cards | Optional scroll | Sticky first col optional |
| Touch | 44px min | 44px | 36px ok for dense table rows if padding preserves hit area |

---

## 10. Accessibility

### Contrast
- Text/icon on surfaces: WCAG 2.2 AA minimum (prefer AAA for body).
- Status badges: text label mandatory; color never sole channel.
- Dark theme re-checked separately for primary and status tokens.

### Focus order
1. Skip link → main
2. Top bar / sidebar
3. Page header actions
4. Filters → content → sticky CTA
5. Dialogs trap focus; return focus to invoker on close

Visible focus ring: 2px `primary` / `dark-primary`, offset 2px. Never `outline: none` without replacement.

### Keyboard
- All actions reachable; Scan page: focus manual entry when camera unavailable
- Tree: arrow keys; Tables: row focus + Enter
- Dialog: Esc closes; Confirm destructive requires explicit button focus

### ARIA
- `aria-live="polite"` on toast region; `assertive` for scan failures
- Tabs: `role="tablist"`; status badges: text content, not `aria-label` only
- Loading buttons: `aria-busy="true"`
- Icon-only: `aria-label` in Indonesian (`"Pindai barcode"`)
- Forms: `aria-invalid` + `aria-describedby` error ids
- Offline banner: `role="status"`

### Motion
Respect `prefers-reduced-motion`: replace transitions with instant state swaps; keep focus visibility.

---

## Do's and Don'ts

### Do
- **Do** put Scan within one tap from any authenticated mobile screen.
- **Do** show StatusBadge + mono kode on every asset summary.
- **Do** hide accounting fields unless tipe = Aktiva Tetap.
- **Do** use Bahasa Indonesia for labels, toasts, errors.
- **Do** keep primary CTAs mineral teal; reserve red for irreversible actions.
- **Do** test outdoor legibility on a real phone mid-day.

### Don't
- **Don't** revive Soft UI pastels, Amex Benton, or NOON amber/violet glass.
- **Don't** use purple as a status or brand accent.
- **Don't** pill-shape primary buttons or emoji status.
- **Don't** ship tables as the only mobile list presentation.
- **Don't** rely on color alone for status or error.
- **Don't** animate for decoration; feedback only (≤220ms).

---

## Implementation notes for agents

1. Tokens in this file are normative; update `resources/css/app.css` and shadcn theme to match before restyling features.
2. Replace font loads: Public Sans + Noto Sans Mono (drop Benton Sans).
3. Remove `--color-soft-blue/pink/green` and glass toast styling that violates The No-Glass Rule.
4. Update PRODUCT.md brand commitments to **Opname Field Desk** (this document).
5. No application feature work should start until tokens + shell (sidebar/tabbar) match this brief.
