# 401 Unauthorized Page — Design Specification

**Project:** opti-asset (`D:\Laravel Project\opti-asset`)
**Feature:** SAML Login Tenant Routing Sprint — Task T-10 (design first)
**Agent:** UI Designer
**Status:** Design spec only — implementation is T-11
**Date:** 31 Oct 2026

---

## ⚠️ Design Source of Truth Note

The task context references a `DESIGN.md` at repo root (canvas `#EEF1F4`, surface `#FFFFFF`, brand `#0C6B58`, ink `#15202B`). **That file does not exist in the repository.**

The actual, implemented design system lives in `planning/ui-design.md` ("Soft UI Evolution", brand `#2D82B7`, bg `#F8FAFC`, surface `#FFFFFF`, foreground `#0F172A`, destructive `#DC2626`, Public Sans + Noto Sans Mono, WCAG AA targeting 6:1).

This spec uses **`planning/ui-design.md` as the primary source of truth** (it is what the shadcn/ui components and existing pages actually implement). A color mapping table (Section 1.1) reconciles the DESIGN.md-referenced teal values against the implemented blue values. DESIGN.md should be created/synced separately — out of scope for T-10.

---

## 1. Visual Design

### 1.1 Color Palette

Colors below use the implemented design tokens from `planning/ui-design.md`. Tailwind v4 exposes these as CSS variables (`--background`, `--primary`, `--destructive`, etc.) via `@theme inline` in `resources/css/globals.css`.

| Token | Hex | Light mode | Dark mode | Semantic use | Contrast (vs surface) |
|-------|-----|------------|-----------|--------------|----------------------|
| `--background` (canvas) | `#F8FAFC` / `#020617` | `#F8FAFC` | `#020617` | Page outer background | n/a |
| `--card` (surface) | `#FFFFFF` / `#0F172A` | `#FFFFFF` | `#0F172A` | Error card surface | n/a |
| `--primary` (brand) | `#2D82B7` / `#38BDF8` | `#2D82B7` | `#38BDF8` | Primary button, icon accent | 4.5:1+ |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | Primary button text | n/a |
| `--foreground` (ink) | `#0F172A` / `#F8FAFC` | `#0F172A` | `#F8FAFC` | Headings, body text | 6:1+ |
| `--muted-foreground` | `#64748B` / `#94A3B8` | `#64748B` | `#94A3B8` | Secondary helper text | 4.5:1+ |
| `--destructive` | `#DC2626` / `#F87171` | `#DC2626` | `#F87171` | "Akses Ditolak" header, destructive button | 4.5:1+ |
| `--destructive-foreground` | `#FFFFFF` / `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | Destructive button text | n/a |
| `--border` | `#E2E8F0` / `#1E293B` | `#E2E8F0` | `#1E293B` | Card border, input borders | 3:1+ |
| `--ring` | `#2D82B7` / `#38BDF8` | `#2D82B7` | `#38BDF8` | Focus ring | n/a |

**Reconciliation with DESIGN.md-referenced values (if DESIGN.md is later created):**

| DESIGN.md-ref (task) | Implemented (ui-design.md) | Decision |
|----------------------|----------------------------|----------|
| brand `#0C6B58` (teal) | `#2D82B7` (blue) | Use implemented `#2D82B7` |
| canvas `#EEF1F4` | `#F8FAFC` | Use implemented `#F8FAFC` |
| ink `#15202B` | `#0F172A` | Use implemented `#0F172A` |
| danger `#C0392B` | `#DC2626` | Use implemented `#DC2626` |

**WCAG AA:** All body/heading text ≥ 6:1 contrast per PRD NFR (targeting 6:1, exceeding WCAG AA 4.5:1 minimum). Interactive element borders ≥ 3:1.

### 1.2 Typography

All UI text is Indonesian.

| Element | Font | Size | Weight | Line-height | Color token | Use |
|---------|------|------|--------|-------------|-------------|-----|
| Page title ("Akses Ditolak") | Public Sans | 2rem (32px) | 700 | 1.2 | `--foreground` | H1, card title |
| Error code ("401") | Noto Sans Mono | 3rem (48px) | 700 | 1.0 | `--primary` | Large decorative code |
| Subtitle / status ("403 Forbidden" variant label) | Public Sans | 1.125rem (18px) | 500 | 1.4 | `--primary-foreground` or `--destructive` | Status chip |
| Error message body | Public Sans | 1rem (16px) | 400 | 1.6 | `--foreground` | Main explanation |
| Helper text / detail | Public Sans | 0.875rem (14px) | 400 | 1.5 | `--muted-foreground` | 401 vs 403 nuance, tenant context |
| Button labels | Public Sans | 0.875rem (14px) | 500 | 1.2 | variant-dependent | Action buttons |
| Footer links | Public Sans | 0.875rem (14px) | 400 | 1.4 | `--primary` | "Hubungi admin" |

**Font stack:** `font-sans` = Public Sans; `font-mono` = Noto Sans Mono (for error code, tenant codes, NIK).

### 1.3 Layout

- **Type:** Centered card-based layout (not full-width, not sidebar-wrapped).
- **Container:** Max-width card ~ `max-w-sm` (480px) on desktop, full-width with horizontal padding on mobile.
- **Page background:** `--background` (canvas) filling the viewport.
- **Card surface:** `--card` with `--border` border, `--ring` focus behavior, subtle shadow.
- **Vertical:** Card vertically centered in viewport (`min-h-screen flex items-center justify-center`).
- **Alignment:** Content left-aligned inside the card; error code and title at top, message in middle, action buttons at bottom (full-width stack on mobile, row on desktop).

### 1.4 Spacing, Borders, Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--space-4` | 16px | Inner card padding (x-axis) |
| `--space-6` | 24px | Inner card padding (y-axis), section gaps |
| `--space-8` | 32px | Between major blocks (title → message → actions) |
| `--radius` | 0.5rem (8px) | Card border-radius (`rounded-lg`) |
| `--border` | 1px | Card border (`border border-border-subtle`) |
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,0.28)` | Card base shadow (matches existing `Card` component) |
| `--shadow-lg` | `0 16px 40px rgba(0,0,0,0.42)` | Card hover/active elevation |

Consistent with existing `Card` component: `bg-card text-card-foreground rounded-lg border border-border-subtle shadow-[0_2px_12px_rgba(0,0,0,0.28)] p-5`.

---

## 2. Content

All copy in Indonesian (project language: Indonesian enterprise users, PT Tata Optima Property).

### 2.1 Page Title

- **Primary:** "Akses Ditolak" (H1)
- **English subtitle (optional, small):** "Unauthorized"

### 2.2 Error Code

- Large decorative: "401" in Noto Sans Mono, brand color.
- Status chip variant: "403 Forbidden" when the underlying abort was 403 (authenticated but forbidden vs unauthenticated). Shown as a small badge next to or below the code.

### 2.3 Error Message (401 vs 403)

**401 (Unauthorized — session/tenant issue):**
> Sesi Anda tidak memiliki hak akses ke resource ini. Anda mungkin perlu login ulang atau memilih tenant yang berbeda.

**403 (Forbidden — authenticated but insufficient privilege):**
> Anda telah login, tetapi tidak memiliki izin untuk mengakses resource ini. Silakan hubungi administrator untuk menambahkan hak akses.

Include a short helper line clarifying the distinction:
> 401 = akses tidak diizinkan (sesion/tenant) · 403 = login tetapi tanpa izin pada resource ini

### 2.4 Tenant Context (Optional)

If tenant context is available in session, show a subtle line:
> Tenant: `{tenant_code}` · Unit Bisnis: `{tenant_name}`

Rendered in `--muted-foreground`, monospace for the tenant code.

### 2.5 Action Buttons

Three actions, in this order:

1. **Kembali ke Dashboard** — Primary (`soft-primary` variant), full-width on mobile, left-aligned on desktop. Icon: `ArrowLeftIcon`. Navigates to user's tenant dashboard.
2. **Login Ulang** — Secondary/outline variant. Icon: `LogInIcon`. Triggers SAML re-login flow.
3. **Hubungi Administrator** — Ghost/link variant. Icon: `MailIcon`. `mailto:` or contact form link.

On desktop: buttons in a row (primary first). On mobile: stacked full-width buttons.

---

## 3. Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (< 640px) | Card full-width, `px-4` horizontal padding, `py-6` vertical | Buttons stacked full-width (`flex-col`), font sizes unchanged, touch targets ≥ 44px |
| Tablet (640–1023px) | Card `max-w-sm` centered, `px-6` | Buttons may remain stacked or wrap |
| Desktop (≥ 1024px) | Card `max-w-sm` (480px) centered in viewport, `px-6 py-8` | Buttons in row (`flex-row reverse` so primary is visually leading), generous whitespace |

- No horizontal scroll at any breakpoint.
- Card never exceeds ~90% of viewport width.
- Vertical centering preserved on all breakpoints (avoid pinning card to top on short viewports).

---

## 4. Component Structure (React / Inertia)

**File:** `resources/js/pages/errors/401.tsx` (Inertia page)
**Route:** Laravel `abort(401)` / `abort(403)` → Inertia handles via `HandleExceptions` middleware or a dedicated route. TBD in T-11 whether to use Laravel's default exception rendering or a custom Inertia error page.

### 4.1 Component Tree

```
Page401 (Inertia page, no AppLayout sidebar wrapper)
└── ErrorCard (Card)
    ├── ErrorIcon (ShieldAlertIcon, destructive, size-48)
    ├── CardHeader
    │   ├── CardTitle: "Akses Ditolak"
    │   └── CardDescription: "Unauthorized"
    ├── status-chip (Badge, variant destructive/secondary): "401 Unauthorized" or "403 Forbidden"
    ├── CardContent
    │   ├── ErrorCode (Noto Sans Mono, brand color): "401"
    │   └── Message (paragraph + helper text)
    ├── TenantContext (optional, muted text + monospace code)
    └── CardFooter (actions)
        ├── Button (soft-primary): "Kembali ke Dashboard"
        ├── Button (outline): "Login Ulang"
        └── Button (ghost/link): "Hubungi Administrator"
```

### 4.2 Reused shadcn/ui Components

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`@/components/ui/card`)
- `Button` (`@/components/ui/button`) — variants: `soft-primary`, `outline`, `ghost`, `link`
- `Badge` (`@/components/ui/badge`) — for status chip (401 vs 403)
- Icons from `lucide-react`: `ShieldAlertIcon`, `ArrowLeftIcon`, `LogInIcon`, `MailIcon`

### 4.3 Props Interface (anticipated for T-11)

```tsx
interface Error401Props {
    statusCode: 401 | 403;
    message?: string;              // override default message
    tenantCode?: string;           // optional tenant context
    tenantName?: string;
    onBackToDashboard: () => void; // navigation handler
    onRelogin: () => void;         // SAML re-login handler
    onContactAdmin: () => void;    // mailto/contact handler
}
```

### 4.4 Inertia Integration Notes

- Page should **not** wrap in `AppLayout` (no sidebar/header on error pages) — keep it distraction-free.
- `layout` prop can be `undefined` or a minimal layout.
- Flash `denial_reason` (set by `SamlController`) can be read via `usePage().props` if surfaced from Laravel.
- `abort(401)`/`abort(403)` rendering path to be decided in T-11 (Inertia exception page vs custom route).

---

## 5. Accessibility (WCAG AA)

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | Text ≥ 6:1 (exceeds WCAG AA 4.5:1); interactive borders ≥ 3:1; status chip text meets contrast on its background |
| Keyboard navigation | All buttons reachable via Tab in logical order (back → relogin → contact); no keyboard traps |
| Focus visible | `focus-visible:ring-[3px] focus-visible:ring-ring` on all buttons (matches shadcn/button convention) |
| Touch targets | All interactive elements ≥ 44×44px (`min-h-[44px]`, `min-w-[44px]` on icon buttons) |
| ARIA | `role="alert"` on the error card region; `aria-label` on icon-only buttons; heading uses semantic `<h1>` |
| Screen reader | Error code "401" announced via `aria-label="Kode kesalahan 401"`; status chip via `aria-live="polite"` |
| Reduced motion | Respect `prefers-reduced-motion` — disable hover translate/scale animations |
| Text scaling | Layout remains usable at 200% browser zoom; no fixed-height containers that clip text |
| Language | `lang="id"` on page/root; Indonesian copy throughout |

### Focus order (Tab):
1. Kembali ke Dashboard
2. Login Ulang
3. Hubungi Administrator

---

## 6. Mockup Description (ASCII)

```
┌─────────────────────────────────────────────────────────┐
│                    (viewport canvas #F8FAFC)            │
│                                                         │
│               ┌─────────────────────────┐               │
│               │      🛡️  (icon)          │               │
│               │                         │               │
│               │  Akses Ditolak          │  ← h1         │
│               │  Unauthorized           │  ← subtitle   │
│               │                         │               │
│               │  [401 Unauthorized]     │  ← badge      │
│               │                         │               │
│               │     401                 │  ← mono, large│
│               │                         │               │
│               │  Sesi Anda tidak        │               │
│               │  memiliki hak akses...  │  ← message    │
│               │                         │               │
│               │  Tenant: ACME-01        │  ← optional   │
│               │                         │               │
│               │  [Kembali ke Dashboard] │  ← primary    │
│               │  [Login Ulang]          │  ← outline    │
│               │  [Hubungi Administrator]│  ← ghost      │
│               └─────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Desktop button row (wide screens):**
```
[ Kembali ke Dashboard ] [ Login Ulang ] [ Hubungi Administrator ]
     (primary soft-primary)   (outline)        (ghost/link)
```

**Mobile stacked:**
```
┌─────────────────────────┐
│ [Kembali ke Dashboard]  │ ← full width
│ [Login Ulang            │ ← full width
│  Hubungi Administrator] │ ← full width
└─────────────────────────┘
```

---

## 7. Component Breakdown & Tailwind Class Suggestions

### 7.1 Page wrapper

```tsx
<div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
```

### 7.2 Error card

```tsx
<Card className="max-w-sm w-full text-center sm:text-left">
  {/* CardHeader, CardTitle, CardDescription, CardContent, CardFooter */}
</Card>
```

- `max-w-sm` = 480px desktop cap; `w-full` mobile
- `text-center` on mobile, `sm:text-left` desktop

### 7.3 Error icon

```tsx
<ShieldAlertIcon className="mx-auto mb-6 h-12 w-12 text-destructive sm:mb-8" />
```

### 7.4 Status chip (401 vs 403)

```tsx
<Badge variant={statusCode === 403 ? 'destructive' : 'secondary'} className="mb-4">
  {statusCode === 403 ? '403 Forbidden' : '401 Unauthorized'}
</Badge>
```

### 7.5 Error code (decorative)

```tsx
<div className="font-mono text-4xl font-bold text-primary mb-2" aria-label="Kode kesalahan 401">
  401
</div>
```

### 7.6 Message & helper

```tsx
<CardDescription className="mb-6">
  Sesi Anda tidak memiliki hak akses ke resource ini.
</CardDescription>
<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
  401 = akses tidak diizinkan (sesion/tenant) · 403 = login tanpa izin pada resource ini
</p>
```

### 7.7 Tenant context (optional)

```tsx
<div className="text-xs text-muted-foreground mb-6 flex items-center gap-1">
  <span className="font-mono">Tenant: ACME-01</span>
</div>
```

### 7.8 Action buttons

**Desktop (row):**
```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto justify-center sm:justify-start">
  <Button variant="soft-primary" className="w-full sm:w-auto" onClick={onBackToDashboard}>
    <ArrowLeftIcon className="mr-2 h-4 w-4" /> Kembali ke Dashboard
  </Button>
  <Button variant="outline" className="w-full sm:w-auto" onClick={onRelogin}>
    Login Ulang
  </Button>
  <Button variant="link" className="w-full sm:w-auto" onClick={onContactAdmin}>
    Hubungi Administrator
  </Button>
</div>
```

**Mobile:** `flex-col` (stacked, full-width). **Desktop:** `sm:flex-row` with `sm:w-auto` and `sm:justify-start`.

### 7.9 Focus ring (all buttons — inherited from shadcn/button)

```tsx
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

---

## 8. Open Questions (for T-11 implementation)

1. **Rendering path:** Should 401/403 be a dedicated Inertia page (`resources/js/pages/errors/401.tsx`) rendered via Laravel's `renderable` closure in `Handler.php`, or a standard route (`GET /error/401`)? Recommendation: Inertia error page for SPA consistency.
2. **Layout wrapper:** Confirm error page bypasses `AppLayout` (no sidebar/header) — yes per this spec.
3. **Flash data:** Does `SamlController` flash `denial_reason` into session for the denied page? If so, surface it as `message` prop.
4. **Dark mode:** Full dark-mode support required (both modes per ui-design.md). Verify Tailwind v4 dark strategy (class vs media) before implementation.
5. **DESIGN.md:** Create/sync `DESIGN.md` at repo root to resolve the teal vs blue brand discrepancy documented in Section 1.1.

---

## 9. Handoff Checklist (for T-11)

- [ ] Create `resources/js/pages/errors/401.tsx` per component tree (Section 4)
- [ ] Reuse shadcn/ui `Card`, `Button`, `Badge` components
- [ ] Apply Tailwind classes from Section 7
- [ ] Verify WCAG AA contrast (6:1 text, 3:1 borders)
- [ ] Verify focus-visible rings and keyboard order
- [ ] Test mobile/tablet/desktop responsive behavior
- [ ] Wire `abort(401)` / `abort(403)` → Inertia error page
- [ ] Surface `denial_reason` flash data if available
- [ ] Run `eslint`, `prettier`, `tsc` on new frontend file

---

**UI Designer** — Design system ready for developer handoff. Implementation begins at T-11.

**Related:** `planning/ui-design.md` (design system), `planning/sprint-saml-login-tenant-routing.md` (sprint plan), `app/Http/Controllers/Auth/SamlController.php` (denied flow)
