---
name: Opti-Asset
description: Operational UI for Indonesian enterprise asset management — field scan first, ledger clarity second, no decorative chrome.
colors:
  # Core (Stripe-style)
  primary: "#635BFF"
  primary-hover: "#4F46E5"
  primary-active: "#3F3FCC"
  primary-muted: "#EDEFFF"
  primary-muted-border: "#C7C9FF"
  ink: "#0A2540"
  ink-muted: "#425466"
  ink-subtle: "#6B7B8F"
  paper: "#F6F9FC"
  surface: "#FFFFFF"
  surface-sunken: "#F1F5F9"
  border: "#D9E2EC"
  border-strong: "#C2D0E0"
  focus: "#635BFF"
  destructive: "#D92D20"
  destructive-tint: "#FFEBEB"
  success: "#027A48"
  warning: "#B45309"
  info: "#0A7CFF"
  # Status map (LOCKED — P1). text/bg/border, verified ≥ 6:1 on light.
  status-act-text: "#166534"
  status-act-bg: "#DCFCE7"
  status-act-border: "#86EFAC"
  status-loan-text: "#1E40AF"
  status-loan-bg: "#DBEAFE"
  status-loan-border: "#93C5FD"
  status-rpr-text: "#92400E"
  status-rpr-bg: "#FEF3C7"
  status-rpr-border: "#FCD34D"
  status-mut-text: "#155E75"
  status-mut-bg: "#CFFAFE"
  status-mut-border: "#67E8F9"
  status-dsp-text: "#9F1239"
  status-dsp-bg: "#FFE4E6"
  status-dsp-border: "#FDA4AF"
  # Tipe aset
  tipe-aktiva-text: "#635BFF"
  tipe-aktiva-bg: "#EDEFFF"
  tipe-peralatan-text: "#425466"
  tipe-peralatan-bg: "#F1F5F9"
  # Dark theme
  dark-bg: "#0B0F19"
  dark-surface: "#111827"
  dark-surface-raised: "#1F2937"
  dark-border: "#2A3544"
  dark-ink: "#E6EEF7"
  dark-ink-muted: "#9AA8B5"
  dark-primary: "#7C7CFF"
  dark-primary-ink: "#0B0F19"
  # Dark status recipes, verified ≥ 8:1 on dark tints
  dark-status-act-text: "#86EFAC"
  dark-status-act-bg: "#052E16"
  dark-status-loan-text: "#93C5FD"
  dark-status-loan-bg: "#172554"
  dark-status-rpr-text: "#FCD34D"
  dark-status-rpr-bg: "#451A03"
  dark-status-mut-text: "#67E8F9"
  dark-status-mut-bg: "#083344"
  dark-status-dsp-text: "#FDA4AF"
  dark-status-dsp-bg: "#4C0519"
typography:
  display:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Noto Sans Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  status-badge-act:
    backgroundColor: "{colors.status-act-bg}"
    textColor: "{colors.status-act-text}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    height: "22px"
  sidebar-item-active:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Opname Field Desk (v2.1)

> **Mode:** Operate — task completion over expression.
> **Product:** Opti-Asset — multi-tenant asset classification & management. Indonesian-language UI, corporate OIDC/SSO.
> **This document is normative.** If code and this file disagree, code is wrong. Legacy deviations observed in the shell are listed explicitly in Overview and Do's and Don'ts; they are corrections in flight, not permissions.

## Overview

**Creative North Star: "Opname Field Desk"** — the moment of stocktake: a cool-gray clipboard under fluorescent light, an inventory stamp, a barcode label, a stamped ledger line. Institutional without being cold; precise without being sterile. Arah visual kini Stripe-style: bersih, berlapis, berwarna secara terukur, serius dan terpercaya.

This is an instrument, not a showcase. Users classify, find, and judge the state of thousands of assets; every surface either shortens that judgment or competes with it. Surfaces are opaque, borders are 1px, codes are monospace, and status color is earned information — never decoration. The shell (sidebar + single top bar) is quiet chrome: paper background, white content card, primary indigo/violet untuk brand mark, selection, dan primary actions.

**Key Characteristics:**

- Primary indigo/violet `#635BFF` on paper `#F6F9FC` — clean, layered, measured, serious and trustworthy.
- Opaque surfaces, 1px soft borders, shadow berlapis sangat halus (`--shadow-card`, `--shadow-card-hover`). No glass, no glow; gradient hanya untuk Masthead.
- Public Sans for UI, Noto Sans Mono for codes and figures — tabular numerals in every table, angka `tabular-nums`.
- Status-first color lock: five status hues are semantic (Aktif/Dipinjamkan/Perbaikan/Mutasi/Dihapus), never decorative; badge `habis`/`segera habis` memakai resep DSP.
- Light-first field UI with an equal dark peer for desk night sessions, kontras minimal WCAG AA.
- Data density 7/10 desktop lists, 5/10 mobile cards; touch targets ≥ 44×44px.
- Motion 150–200ms — hover terangkat halus, entrance fade/slide tipis, hormati `prefers-reduced-motion`.

**Kept vs corrected (shell audit 2026-11-17, skor 9/20):**

- **Dipertahankan (kept):** struktur shell `AppSidebarLayout` (sidebar kiri + content inset), semantik token shadcn (`--background`, `--primary`, `--border`, …) sebagai lapisan pemetaan, label Indonesia di seluruh chrome, `aria-label` Indonesia pada tombol ikon.
- **Dikoreksi (corrected, legacy/non-normatif):** font Geist/Geist Mono → Public Sans/Noto Sans Mono; token netral oklch + `slate-*` → palet Opname; aksen `#2D82B7` & sky → `primary` teal; gradien biru-indigo pada logo → brand mark teal solid; Soft-UI inset shadows, glow, `backdrop-blur`, hover-lift pada widget header → surface opaque + border 1px; badge versi dobel (`V.1.0` + `v1.0.0`) → satu badge; dua sistem header (`AppSidebarHeader` vs `DashboardLayoutHeader`) → satu header; notifikasi mock → empty state jujur; tautan mati `/help` `/docs` → user menu sungguhan; active-state sidebar `bg-primary` penuh → `primary-muted` + border teal; label `"..."` saat collapsed → pola SR-friendly.

## Colors

Stripe-style, bersih, berlapis, berwarna secara terukur: primary indigo/violet pada neutral cool-paper, plus status map terkunci. `--chart-1..5` selaras dengan palet: `#635BFF`, `#0A7CFF`, `#00C3FF`, `#F59E0B`, `#425466`.

### Primary
- **Primary Indigo/Violet** (`#635BFF`): CTAs, links, focus ring, brand mark, active tenant dot. 7.8:1 on white.
- **Primary Hover** (`#4F46E5`) / **Primary Active** (`#3F3FCC`): pressed feedback on primary fills.
- **Primary Muted** (`#EDEFFF`, border `#C7C9FF`): selected rows, active nav item, active filter chips, Aktiva Tetap tint. Selection is a tint, never a full `bg-primary` block.

### Neutral
- **Paper** (`#F6F9FC`): app background.
- **Surface White** (`#FFFFFF`): cards, sheets, inputs, tables, popovers.
- **Sunken Surface** (`#F1F5F9`): table header rows, inset panels, Peralatan tint.
- **Ink** (`#0A2540`): primary text.
- **Ink Muted** (`#425466`): secondary text, placeholders.
- **Ink Subtle** (`#6B7B8F`): timestamps, disabled text.
- **Border** (`#D9E2EC`) / **Border Strong** (`#C2D0E0`): resting dividers and input strokes.

### Semantic Actions
- **Destructive** (`#D92D20`, tint `#FFEBEB`): Hapus, Tolak, irreversible confirmations only.
- **Success** (`#027A48`), **Warning** (`#B45309`), **Info** (`#0A7CFF`): toasts and callouts — not status badges.

### Status (LOCKED — P1)
Badge recipe: `text` on `bg` with 1px `border`; label text always present — color is never the sole channel. Resep status tidak berubah makna; nilai warna disesuaikan agar harmonis dengan palet baru.

| Status | Code | Light text / bg / border | Dark text / bg |
| --- | --- | --- | --- |
| Aktif | ACT | `#166534` / `#DCFCE7` / `#86EFAC` | `#86EFAC` / `#052E16` |
| Dipinjamkan | LOAN | `#1E40AF` / `#DBEAFE` / `#93C5FD` | `#93C5FD` / `#172554` |
| Dalam Perbaikan | RPR | `#92400E` / `#FEF3C7` / `#FCD34D` | `#FCD34D` / `#451A03` |
| Dimutasi | MUT | `#155E75` / `#CFFAFE` / `#67E8F9` | `#67E8F9` / `#083344` |
| Dihapus | DSP | `#9F1239` / `#FFE4E6` / `#FDA4AF` | `#FDA4AF` / `#4C0519` |

**The Status Lock Rule.** These hues are semantic, not free accents. Badge `habis` / `segera habis` memakai resep DSP, bukan destructive merah; setiap badge status disertai teks atau ikon.

**The Two Reds Rule.** `destructive` belongs to actions (buttons that delete/reject). Status DSP owns its own red family.

### Tipe Aset
- **Aktiva Tetap**: `#635BFF` on `#EDEFFF`, 1px `#C7C9FF` border.
- **Peralatan**: `#425466` on `#F1F5F9`, 1px `#C2D0E0` border.
Tipe badges are outline-tinted and quieter than status badges.

### Dark Theme
- **Dark Background** (`#0B0F19`), **Dark Surface** (`#111827`), **Dark Raised** (`#1F2937`), **Dark Border** (`#2A3544`).
- **Dark Ink** (`#E6EEF7`), **Dark Ink Muted** (`#9AA8B5`).
- **Dark Primary** (`#7C7CFF`) with **Dark Primary Ink** (`#0B0F19`) as button text.
- Dark surfaces are cool navy. Status recipes shift to dark variants; hue meaning never changes. Kontras minimal WCAG AA.

**The No-Glass Rule.** No glassmorphism, frosted panels, `backdrop-filter` on chrome, glow, or gradients on surfaces kecuali Masthead. Opaque + 1px border is the cheapest way to look trustworthy. Gradient hanya untuk Masthead mesh indigo→violet→cyan opasitas rendah.

## Typography

**Display Font:** Public Sans (fallback `ui-sans-serif, system-ui, sans-serif`), weights 400/500/600/700.
**Body Font:** Public Sans.
**Label/Mono Font:** Noto Sans Mono (fallback `ui-monospace, SFMono-Regular, monospace`).

**Character:** high x-height, open apertures, unfussy numerals; legible at 12px in dense Indonesian table headers. Angka selalu `tabular-nums`.

### Type Ramp
Minimum 12px, tidak ada ukuran di bawahnya. Semua angka memakai `tabular-nums`.

### Hierarchy
- **Display** — token `text-[2rem]` / 32px, weight 700, line-height 1.2. Hero angka total aset di Masthead.
- **Title** — 1.125rem/18px, weight 600, line-height 1.4. Card titles, dialog titles.
- **Headline** — 1.375rem/22px, weight 600, line-height 1.3. Section headers.
- **Body** — 1rem/16px, weight 400, line-height 1.5. Forms, descriptions. Caption tetap 12px / Label 14px dipertahankan.
- **Label** (500, 0.875rem/14px): field labels, table headers, buttons.
- **Caption** (500, 0.75rem/12px): meta, timestamps, table footnotes.
- **Mono** (500, 0.875–1rem): kode aset, barcode, nilai buku, selalu `tabular-nums`.

**The Code Face Rule.** Asset codes, barcode values, and monetary values are always mono with `font-variant-numeric: tabular-nums` — never the UI sans. Money renders Indonesian-formatted (`Rp1.250.000`).

## Layout

Shell desktop: collapsible left sidebar (opaque paper, icon rail 52px collapsed) + **one** sticky top bar (h-14, `sticky` shadow when scrolled) + content as an inset white card on paper. The top bar is the single header system: sidebar trigger, search, tenant switcher, notifications, theme, user menu — no second header implementation may ship beside it.

- Screen padding: 16px mobile, 24–32px desktop. Form stack gap 16px; section gap 24–32px.
- Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.
- Density: 7/10 desktop lists (44px rows, 36px compact with preserved hit area), 5/10 mobile cards.
- Touch targets ≥ 44×44px everywhere; icon-only buttons get a 44px hit area even when the glyph is 20px.
- Below `md`, dense tables collapse to card stacks carrying the same decision-relevant fields — responsive is a layout change, never a data downgrade.
- Tenant name is always visible in the top bar; long names truncate with `ellipsis`, never wrap the bar.

## Elevation & Depth

Berlapis sangat halus. Depth dari paper→surface shift + border tipis + shadow token.

### Shadow Vocabulary
- **shadow-card** (`0 1px 2px rgba(10,37,64,0.06), 0 4px 12px rgba(10,37,64,0.04)`): kartu resting.
- **shadow-card-hover** (`0 2px 6px rgba(10,37,64,0.08), 0 8px 24px rgba(10,37,64,0.06)`): kartu hover, terangkat halus.
- **sticky** (`0 1px 0 rgba(10,37,64,0.08)`): sticky headers, tab bars.
- **overlay** (`0 8px 24px rgba(10,37,64,0.14)`): dialogs, popovers, dropdowns.
- **toast** (`0 4px 16px rgba(10,37,64,0.12)`): toasts.

**The Structural Shadow Rule.** Shadows mark real elevation. Hover terangkat halus dengan shadow/translate kecil, transisi 150-200ms. Multi-layer dekoratif dan glow dilarang.

## Shapes

Gently rectangular, ledger-like. Radii: `sm` 4px (badges, chips) · `md` 8px (buttons, inputs, menus, nav items) · `lg` 12px (cards, sheets, dialogs) · `full` avatars only. Borders are 1px at rest; focus is a 2px `primary` ring with 2px offset. Badges are soft rectangles, never capsules. **Pill-shaped CTAs are banned** — pills are for avatars; controls are rectangles.

## Components

### Shell — Sidebar (`AppSidebar`)
Opaque paper surface, 1px right border. Header: teal brand mark (solid, no gradient) + app name + exactly one version badge. Nav groups with uppercase caption headings; items are 36px rows, radius `md`, icon + label.

- **Active item:** `primary-muted` background, `primary` text/icon, 1px teal border (or 2px left rail) — a selected row, not a filled block.
- **Hover:** `surface-sunken` background, no lift, no shadow.
- **Collapsed (icon rail):** no fake label text — a tooltip (or sr-only text) carries the item name; group headings render as `···` with `sr-only` full text, not bare `"..."`.
- **Footer:** secondary nav + real user menu (avatar → dropdown: Profil, Keamanan, Tampilan, Keluar). Dead links (`/help`, `/docs`) are removed, not restyled.
- **Scroll:** native scroll; scrollbar styling via CSS, no third-party smooth-scroll wrapper.

### Shell — Top Bar (single header, `AppSidebarHeader`)
Sticky, h-14, opaque `--background`, 1px bottom border, `sticky` shadow on scroll. Left: sidebar trigger (ghost icon button, 44px hit) + search. Right: tenant switcher, notifications, theme toggle, user menu. Nothing else ships a second header.

### Search Bar
Opaque `surface` field on 1px `border`, radius `md`, height 40px. Focus: 2px `primary` ring, background stays opaque — no inset shadow, no glow halo, no blur. Placeholder in `ink-muted`. The `⌘K` kbd badge only ships if the shortcut is actually wired; otherwise it is removed.

### Notification Bell
Ghost icon button, 44px hit area, `aria-label` "Notifikasi". Unread count as a solid pill (`destructive` red) with real text. Panel: opaque `surface`, radius `lg`, `overlay` shadow, 1px border. **Empty state is honest:** Lucide icon + "Belum ada notifikasi" + no dead actions ("Tandai Dibaca" / "Lihat Semua" ship only when data is real). Unread tint is `primary-muted` — no gradient icon tiles, no glowing dots.

### Theme Toggle
Ghost icon button; sun/moon per resolved theme; label describes the target ("Ganti Tema Gelap"). Renders a stable-size placeholder pre-mount — no layout shift. Theme switch is instant or ≤ 220ms; the 800ms clip-path wipe is legacy and is removed or cut to the motion budget.

### Tenant Switcher
Outline button, `md` radius, min-height 44px, tenant name truncating at `max-w` with ellipsis. Dropdown: opaque surface, `overlay` shadow; active tenant marked with a solid teal dot + "Aktif" label — `primary-muted` row tint, not a `bg-primary` block.

### Buttons
- **Primary (teal):** one per view — the main action. `#FFFFFF` on `primary`, radius `md`, height 40px.
- **Secondary (outline):** 1px `border`, `surface` fill; cancel and alternatives.
- **Ghost:** toolbars, icon buttons; 44px hit target, Indonesian `aria-label`.
- **Destructive:** irreversible actions only; bulk requires a confirm dialog.
- Loading: spinner replaces icon, label persists, `aria-busy="true"`, width locked.

### Inputs / Fields
Opaque `surface`, 1px `border`, radius `md`, height 40px. Label above, error below in `destructive` with icon, hint in `ink-muted`. Focus: 2px `primary` ring — never a colored glow. `aria-invalid` + `aria-describedby` wired.

### Badges (Status / Tipe / Version)
Soft rectangle (`sm` 4px), locked recipes, real text content — color-only or `aria-label`-only badges are banned. One version badge in the sidebar header; version strings do not repeat across chrome.

### Cards / Containers
`surface` white, radius `lg`, 1px `border`, no resting shadow; internal padding 16px (density allows 24px on feature panels).

### Empty States
Lucide icon + one honest Bahasa Indonesia sentence + a real CTA when one exists ("Belum ada notifikasi" ships with no CTA until notifications are real). No mock data to decorate an empty state.

### Toast
Solid surface (no glass), semantic icon tint (success/warning/info/destructive), `overlay` radius, `toast` shadow, stacked above the mobile tab bar, `aria-live="polite"` (scan failures `assertive`), max 3 visible.

## Perubahan arah desain

Arah visual diubah dari Opname Field Desk mineral teal ke Stripe-style: bersih, berlapis, berwarna secara terukur, serius dan terpercaya.

**Yang berubah:**
- Palet utama dari teal `#0D5C56` menjadi indigo/violet `#635BFF` dengan hover `#4F46E5`, teks navy `#0A2540`, slate sekunder `#425466`, latar `#F6F9FC`. Dark mode disesuaikan.
- Shadow berlapis halus untuk kartu: `--shadow-card` dan `--shadow-card-hover`, menggantikan aturan "tanpa shadow istirahat".
- Gradient diperbolehkan hanya untuk Masthead mesh indigo→violet→cyan opasitas rendah; tidak pada kartu.
- Type ramp ditegakkan: minimum 12px, tidak ada `text-[10px]`/`11px`/`15px`/`2rem` arbitrer; angka selalu `tabular-nums`; Display dan Title didefinisikan eksplisit.
- Radius konsisten kartu 12px/lg, kontrol 8px; padding kartu `p-4`/`p-5`.
- Interaksi: hover terangkat halus, transisi 150-200ms, entrance fade/slide tipis.

**Yang dipertahankan:**
- Mode Operate, urutan dashboard, copy Bahasa Indonesia, resep status LOCKED makna tidak berubah.
- Struktur shell, token shadcn, dan konvensi aksesibilitas.
- Tidak ada data palsu, tidak mengembalikan ValueLedger atau Aset per Lokasi.

Alasan: meningkatkan scanability, kepercayaan institusional, dan konsistensi visual dengan standar enterprise modern tanpa mengorbankan kejelasan data.

## Do's and Don'ts

### Do:
- **Do** use `primary` indigo/violet `#635BFF` for CTAs, links, focus rings, selection tints, and the brand mark — ≤ 10% of any screen.
- **Do** keep every surface opaque with a 1px `border` (`#D9E2EC` light / `#2A3544` dark); depth comes from paper→surface shift + `--shadow-card`.
- **Do** set active sidebar/nav state as `primary-muted` + primary border with `primary` text; hover terangkat halus dengan `shadow-card-hover`.
- **Do** keep codes, barcodes, and money in Noto Sans Mono with `tabular-nums`; label copy in Bahasa Indonesia.
- **Do** keep exactly one header (the top bar), one version badge, and honest empty states everywhere.
- **Do** verify both themes and a 44px touch target before shipping any chrome element.

### Don't:
- **Don't** use glass, `backdrop-blur`, glow, or gradients on chrome selain Masthead — gradient hanya untuk Masthead mesh indigo→violet→cyan opasitas rendah.
- **Don't** hardcode legacy accents (`#2D82B7`, `sky-*`, teal lama) — use semantic tokens; if a value is missing from tokens, add the token, not a hex literal.
- **Don't** use Soft-UI inset shadows; hover terangkat halus hanya dengan shadow token, motion 150-200ms.
- **Don't** fill nav or widgets with mock data (fake notifications) or dead links (`/help`, `/docs`); an honest empty state beats a decorated lie.
- **Don't** reuse status hues for decoration or the primary color for status.
- **Don't** pill-shape CTAs, use emoji in chrome, or style asset codes in the UI sans.
