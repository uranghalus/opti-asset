---
version: '1.1'
name: 'NOON — Illuminate your workflow'
description: 'Modern SaaS dashboard with subtle Glassmorphism, optimized for data density, accessibility, and interactive productivity.'
colors:
    primary: '#FFB23E' # Primary CTAs, active states, key highlights
    secondary: '#B892FF' # Secondary accents, tags, charts
    tertiary: '#5EEAD4' # Success states, positive metrics, badges
    background-base: '#1B1230' # Main app background (dark mode optimized)
    background-surface: '#221533' # Cards, sidebars, elevated glass surfaces
    text-primary: '#F8FAFC'
    text-secondary: '#94A3B8'
typography:
    h1:
        fontFamily: system-ui, -apple-system, sans-serif
        fontSize: 2rem
        fontWeight: 700
        letterSpacing: -0.02em
    body-md:
        fontFamily: system-ui, -apple-system, sans-serif
        fontSize: 0.875rem # 14px, standard for SaaS data density
        fontWeight: 400
        lineHeight: 1.5
    mono:
        fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
        fontSize: 0.8125rem # 13px, for code blocks, IDs, data tables
        fontWeight: 400
rounded:
    sm: 6px # Inputs, small buttons
    md: 8px # Cards, modals
    lg: 12px # Large containers, sidebars
spacing:
    xs: 0.5rem
    sm: 1rem
    md: 1.5rem
    lg: 2.5rem
motion:
    duration-fast: 120ms # Hover, focus, toggle
    duration-base: 200ms # Row expand/collapse, drawer content swap
    duration-slow: 320ms # Modal/drawer enter-exit, page transitions
    easing-standard: cubic-bezier(0.4, 0, 0.2, 1) # Default in/out
    easing-emphasized: cubic-bezier(0.16, 1, 0.3, 1) # Drag-drop settle, success states
---

## Overview

NOON — Illuminate your workflow. Modern B2B SaaS dashboard with subtle Glassmorphism, tuned for an interactive, feedback-rich classification workflow (drag-and-drop tree, inline editing, bulk actions).

- Density: 7/10 — High density for data tables and dashboards
- Variance: 4/10 — Consistent UI patterns for predictability
- Motion: 6/10 — Deliberate, responsive micro-interactions on every action; no ambient/parallax motion

- **Style:** Subtle Glassmorphism / Clean Corporate
- **Keywords:** dashboard, data-driven, accessible, clean, productive, responsive
- **Era:** 2020s Modern SaaS
- **Light/Dark:** ✓ Light (optimized default) / ○ Dark (opt-in)

## Colors

- **#FFB23E** — Primary / CTA
- **#B892FF** — Secondary / Accent
- **#5EEAD4** — Tertiary / Success
- **#1B1230** — Base Background
- **#221533** — Surface / Glass Background
- **#F8FAFC** — Text Primary
- **#94A3B8** — Text Secondary

## Typography

- **system-ui** — headings and body text
- **ui-monospace** — code, IDs, and data tables

## Layout

- **Features:** CSS Grid, Flexbox, Backdrop Filter (for glass sidebars/modals), CSS Variables, Sticky Headers, Responsive Data Tables, CSS Masks
- **Components:** Sidebar Navigation, Topbar, Data Tables, Metric Cards, Modals, Drawers, Tooltips, Form Inputs, Tree View, Toast/Snackbar, Progress Bar, Skeleton Loader, Command Palette

## Effects

- Subtle Blur — for glassmorphic overlays and sidebars
- Soft Glow — for primary CTA hover states
- Glass Effect — for elevated cards and modals
- Gradients — for subtle background meshes or chart fills
- Focus Rings — high contrast focus states for accessibility
- Hover Effects — subtle background shifts and 2–4px lift on cards/rows, no heavy 3D transforms
- Press Feedback — brief scale-down (0.97x) on buttons and draggable rows for tactile confirmation
- Skeleton Shimmer — animated placeholder for tables/cards while data loads
- Toast/Snackbar Slide-in — success/error feedback slides in from the corner, auto-dismisses with a shrinking progress bar

## Interaction States

- **Hover:** background tint shift + soft glow on interactive elements (buttons, table rows, tree nodes); duration-fast
- **Active/Pressed:** scale-down 0.97x, glow intensifies briefly; duration-fast
- **Focus:** 2px high-contrast focus ring in primary color, always visible for keyboard navigation
- **Disabled:** reduced opacity (0.5), no hover/press response
- **Loading:** skeleton shimmer for data tables/cards; spinner + disabled state for buttons mid-action
- **Drag:** dragged row/node lifts with glass shadow and slight scale (1.02x); drop target highlights with a dashed primary-color outline; on release, node animates into place with easing-emphasized
- **Expand/Collapse:** tree nodes and accordion panels animate height + fade (duration-base, easing-standard), chevron rotates 90 degrees
- **Success confirmation:** brief tertiary-color pulse/glow on the affected row after save, then fades

## Motion Guidelines

- Every interactive element responds within duration-fast (120ms) — no dead clicks/taps
- Structural changes (drawer open, modal enter, tree expand) use duration-base to duration-slow with easing-standard
- Drag-and-drop and success states use easing-emphasized for a satisfying "settle" feel
- Respect `prefers-reduced-motion`: fall back to opacity-only transitions, no scale/translate

## Use Case

SaaS Dashboards, B2B Web Applications, Admin Panels, Analytics Tools, CRM Systems — especially interactive tree/hierarchy management with drag-and-drop, inline editing, and bulk operations.
