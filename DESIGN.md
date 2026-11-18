---
name: Opti-Asset
description: Operational UI for Indonesian enterprise asset management — field scan first, ledger clarity second, no decorative chrome.
colors:
  # Core (Opname Field Desk)
  primary: "#0D5C56"
  primary-hover: "#0A4A45"
  primary-active: "#083B37"
  primary-muted: "#D8EDEA"
  primary-muted-border: "#A7D2CC"
  ink: "#15202B"
  ink-muted: "#5A6A7A"
  ink-subtle: "#8593A2"
  paper: "#F1F4F6"
  surface: "#FFFFFF"
  surface-sunken: "#E9EDF0"
  border: "#D5DCE3"
  border-strong: "#B9C4CE"
  focus: "#0D5C56"
  destructive: "#B42318"
  destructive-tint: "#FEECEB"
  success: "#1B7F5A"
  warning: "#B45309"
  info: "#1D6A9F"
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
  tipe-aktiva-text: "#0D5C56"
  tipe-aktiva-bg: "#D8EDEA"
  tipe-peralatan-text: "#475569"
  tipe-peralatan-bg: "#E9EDF0"
  # Dark theme (cool navy, never purple-plum)
  dark-bg: "#0B1220"
  dark-surface: "#151D2A"
  dark-surface-raised: "#1B2534"
  dark-border: "#2A3544"
  dark-ink: "#E8EEF2"
  dark-ink-muted: "#9AA8B5"
  dark-primary: "#2A9B93"
  dark-primary-ink: "#0B1220"
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

**Creative North Star: "Opname Field Desk"** — the moment of stocktake: a cool-gray clipboard under fluorescent light, a mineral-teal inventory stamp, a barcode label, a stamped ledger line. Institutional without being cold; precise without being sterile.

This is an instrument, not a showcase. Users classify, find, and judge the state of thousands of assets; every surface either shortens that judgment or competes with it. Surfaces are opaque, borders are 1px, codes are monospace, and status color is earned information — never decoration. The shell (sidebar + single top bar) is quiet chrome: paper background, white content card, teal reserved for the brand mark, selection, and primary actions.

**Key Characteristics:**

- Mineral teal `#0D5C56` on cool paper `#F1F4F6` — stewardship, not finance-blue or SaaS purple.
- Opaque surfaces, 1px borders, structural-only shadows. No glass, no glow, no gradients on chrome.
- Public Sans for UI, Noto Sans Mono for codes and figures — tabular numerals in every table.
- Status-first color lock: five status hues are semantic (Aktif/Dipinjamkan/Perbaikan/Mutasi/Dihapus), never decorative.
- Light-first field UI with an equal dark peer (cool navy) for desk night sessions.
- Data density 7/10 desktop lists, 5/10 mobile cards; touch targets ≥ 44×44px.
- Motion 3/10 — feedback only, 120–220ms, single easing, dies under `prefers-reduced-motion`.

**Kept vs corrected (shell audit 2026-11-17, skor 9/20):**

- **Dipertahankan (kept):** struktur shell `AppSidebarLayout` (sidebar kiri + content inset), semantik token shadcn (`--background`, `--primary`, `--border`, …) sebagai lapisan pemetaan, label Indonesia di seluruh chrome, `aria-label` Indonesia pada tombol ikon.
- **Dikoreksi (corrected, legacy/non-normatif):** font Geist/Geist Mono → Public Sans/Noto Sans Mono; token netral oklch + `slate-*` → palet Opname; aksen `#2D82B7` & sky → `primary` teal; gradien biru-indigo pada logo → brand mark teal solid; Soft-UI inset shadows, glow, `backdrop-blur`, hover-lift pada widget header → surface opaque + border 1px; badge versi dobel (`V.1.0` + `v1.0.0`) → satu badge; dua sistem header (`AppSidebarHeader` vs `DashboardLayoutHeader`) → satu header; notifikasi mock → empty state jujur; tautan mati `/help` `/docs` → user menu sungguhan; active-state sidebar `bg-primary` penuh → `primary-muted` + border teal; label `"..."` saat collapsed → pola SR-friendly.

## Colors

Cool, mineral, institutional: one teal accent doing real work on a cool-paper neutral family, plus a locked five-hue status map. Warm pastels, purple, and finance blue have no role here.

### Primary
- **Mineral Teal** (`#0D5C56`): CTAs, links, focus ring, brand mark, active tenant dot. Reads as "this thing is accounted for"; 7.8:1 on white (AAA), so it carries small text without a darker variant.
- **Teal Hover** (`#0A4A45`) / **Teal Active** (`#083B37`): pressed feedback on primary fills.
- **Teal Muted** (`#D8EDEA`, border `#A7D2CC`): selected rows, active nav item, active filter chips, Aktiva Tetap tint. Selection is a tint, never a full `bg-primary` block.

### Neutral
- **Cool Paper** (`#F1F4F6`): app background.
- **Surface White** (`#FFFFFF`): cards, sheets, inputs, tables, popovers.
- **Sunken Surface** (`#E9EDF0`): table header rows, inset panels, Peralatan tint.
- **Ink** (`#15202B`): primary text (14.9:1 on paper).
- **Ink Muted** (`#5A6A7A`): secondary text, placeholders (5.6:1, AA).
- **Ink Subtle** (`#8593A2`): timestamps, disabled text — large text / non-essential meta only (3.5:1).
- **Border** (`#D5DCE3`) / **Border Strong** (`#B9C4CE`): resting dividers and input strokes; hovered/pressed borders.

### Semantic Actions
- **Action Red** (`#B42318`, tint `#FEECEB`): Hapus, Tolak, irreversible confirmations only (5.9:1).
- **Success Green** (`#1B7F5A`), **Warning Amber** (`#B45309`), **Info Blue** (`#1D6A9F`): toasts and callouts — not status badges.

### Status (LOCKED — P1)
Badge recipe: `text` on `bg` with 1px `border`; label text always present — color is never the sole channel.

| Status | Code | Light text / bg / border | Dark text / bg |
| --- | --- | --- | --- |
| Aktif | ACT | `#166534` / `#DCFCE7` / `#86EFAC` | `#86EFAC` / `#052E16` |
| Dipinjamkan | LOAN | `#1E40AF` / `#DBEAFE` / `#93C5FD` | `#93C5FD` / `#172554` |
| Dalam Perbaikan | RPR | `#92400E` / `#FEF3C7` / `#FCD34D` | `#FCD34D` / `#451A03` |
| Dimutasi | MUT | `#155E75` / `#CFFAFE` / `#67E8F9` | `#67E8F9` / `#083344` |
| Dihapus | DSP | `#9F1239` / `#FFE4E6` / `#FDA4AF` | `#FDA4AF` / `#4C0519` |

**The Status Lock Rule.** These hues are semantic, not free accents. The ACT green is never a "Simpan" button; the LOAN blue is never a link. Dihapus additionally gets muted row treatment — a tombstone, not a task.

**The Two Reds Rule.** `destructive #B42318` belongs to actions (buttons that delete/reject). Status DSP owns its own red family. Merging them makes every Dihapus row look like a live delete button.

### Tipe Aset
- **Aktiva Tetap**: `#0D5C56` on `#D8EDEA`, 1px `#A7D2CC` border.
- **Peralatan**: `#475569` on `#E9EDF0`, 1px `#B9C4CE` border.
Tipe badges are outline-tinted and quieter than status badges — the eye reads status first, tipe second.

### Dark Theme
- **Dark Background** (`#0B1220`), **Dark Surface** (`#151D2A`), **Dark Raised** (`#1B2534`), **Dark Border** (`#2A3544`).
- **Dark Ink** (`#E8EEF2`, 14.5:1), **Dark Ink Muted** (`#9AA8B5`, 6.1:1).
- **Dark Primary** (`#2A9B93`, 5.0:1) with **Dark Primary Ink** (`#0B1220`) as button text — white-on-teal fails AA at button sizes.
- Dark surfaces are cool navy, never purple-plum. Status recipes shift to the dark variants above; hue meaning never changes.

**The No-Glass Rule.** No glassmorphism, frosted panels, `backdrop-filter` on chrome, glow, or gradients on surfaces. Opaque + 1px border is the cheapest way to look trustworthy.

## Typography

**Display Font:** Public Sans (fallback `ui-sans-serif, system-ui, sans-serif`), weights 400/500/600/700.
**Body Font:** Public Sans.
**Label/Mono Font:** Noto Sans Mono (fallback `ui-monospace, SFMono-Regular, monospace`).

**Character:** a government-form face — high x-height, open apertures, unfussy numerals; legible at 12px in dense Indonesian table headers. It sidesteps the Inter/Geist AI-cluster sameness and carries institutional trust without luxury. Legacy Geist/Geist Mono in `resources/css/app.css` is a correction in flight, not an alternative.

### Hierarchy
- **Display** (700, 1.75rem/28px): rare page titles (Dashboard, Scan).
- **Headline** (600, 1.375rem/22px): section headers, detail page titles.
- **Title** (600, 1.125rem/18px): card titles, dialog titles.
- **Body** (400, 1rem/16px): forms, descriptions.
- **Label** (500, 0.875rem/14px): field labels, table headers, buttons.
- **Caption** (500, 0.75rem/12px): meta, timestamps, table footnotes.
- **Mono** (500, 0.875–1rem): kode aset, barcode, nilai buku.

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

Flat by default. Depth comes from the paper→surface shift and 1px borders; shadow appears only where an element truly floats above the page.

### Shadow Vocabulary
- **none** (resting surfaces): depth = border + paper→surface shift.
- **sticky** (`0 1px 0 rgba(21,32,43,0.08)`): sticky headers, tab bars, sticky footers.
- **overlay** (`0 8px 24px rgba(21,32,43,0.14)`): dialogs, popovers, dropdowns.
- **toast** (`0 4px 16px rgba(21,32,43,0.12)`): toasts.

**The Structural Shadow Rule.** Shadows mark real elevation (modal above page, toast above all). Multi-layer decorative shadows, colored glow, and inset neumorphism are banned — the legacy Soft-UI inset fields in `SearchBar`/`NotificationBell` are corrections, not precedents.

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

## Do's and Don'ts

### Do:
- **Do** use `primary` teal `#0D5C56` for CTAs, links, focus rings, selection tints, and the brand mark — ≤ 10% of any screen.
- **Do** keep every surface opaque with a 1px `border` (`#D5DCE3` light / `#2A3544` dark); depth comes from the paper→surface shift and structural shadows only.
- **Do** set active sidebar/nav state as `primary-muted` + teal border with `primary` text; keep hover as bare `surface-sunken`.
- **Do** keep codes, barcodes, and money in Noto Sans Mono with `tabular-nums`; label copy in Bahasa Indonesia.
- **Do** keep exactly one header (the top bar), one version badge, and honest empty states everywhere.
- **Do** verify both themes and a 44px touch target before shipping any chrome element.

### Don't:
- **Don't** use glass, `backdrop-blur`, glow, gradients, or purple — anywhere in chrome (legacy: logo gradient `from-blue-600 to-indigo-700`, glass popovers, glow shadows are all corrections).
- **Don't** hardcode legacy accents (`#2D82B7`, `sky-*`, slate gradients) — use semantic tokens; if a value is missing from tokens, add the token, not a hex literal.
- **Don't** use Soft-UI inset shadows or hover-lift/translate on static controls; motion is feedback only, ≤ 220ms.
- **Don't** fill nav or widgets with mock data (fake notifications) or dead links (`/help`, `/docs`); an honest empty state beats a decorated lie.
- **Don't** reuse status hues for decoration or the primary color for status.
- **Don't** pill-shape CTAs, use emoji in chrome, or style asset codes in the UI sans.
