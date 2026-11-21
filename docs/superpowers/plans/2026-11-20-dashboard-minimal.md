# Dashboard Minimal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce dashboard to essential operational sections, remove specified cards, improve language, and ensure no page scroll.

**Architecture:** Modify existing Inertia/React dashboard components, remove ValueLedger and Aset per Lokasi section, simplify RegisterStrip to 3 KPIs, update wording in WarrantyWatch.

**Tech Stack:** Laravel 13, Inertia v3 React, Tailwind CSS v4, Flux UI components

**Spec:** docs/superpowers/specs/2026-11-20-dashboard-minimal-design.md

## Global Constraints
- Do not change DashboardController data contract.
- No background processes in commands, never append `&`.
- Mobile responsive design required.
- Images from approved sources only.
- Run `graphify update .` after code changes.

## Review Focus
- KPI labels appear correctly on mobile carousel.
- Removed sections do not leave empty grid gaps.
- WarrantyWatch badge text updates correctly for negative days.
- Page height stays within viewport on 1366x768.
- Removed KPI does not break RegisterStrip mapping.

---
### Task 1: Update RegisterStrip KPI labels and remove Garansi Kedaluwarsa

**Files:**
- Modify: `resources/js/components/dashboard/register-strip.tsx:82-136`
- Test: Manual visual check via `php artisan serve`

**Interfaces:**
- Consumes: stats.pending_transfers, stats.pending_disposals, warranty.expiring30
- Produces: 3 KPI cards with updated labels

- [ ] Step 1: Remove KPI object with key 'warranty-expired' from kpis array
- [ ] Step 2: Rename label 'Mutasi Menunggu' to 'Mutasi Belum Disetujui'
- [ ] Step 3: Rename label 'Disposal Menunggu' to 'Penghapusan Belum Disetujui'
- [ ] Step 4: Rename label 'Garansi ≤ 30 Hari' to 'Garansi Akan Habis'
- [ ] Step 5: Update subtexts to match new labels
- [ ] Step 6: Verify RegisterStrip renders 3 cards, no console errors
- [ ] Step 7: Commit
```bash
git add resources/js/components/dashboard/register-strip.tsx
git commit -m "feat(dashboard): simplify KPI strip to 3 items and improve labels"
```

### Task 2: Remove ValueLedger from dashboard page

**Files:**
- Modify: `resources/js/pages/dashboard.tsx:1-...`
- Test: Visual check

**Interfaces:**
- Consumes: dashboard page layout
- Produces: Grid without ValueLedger

- [ ] Step 1: Remove import of ValueLedger
- [ ] Step 2: Remove `<ValueLedger ... />` component from grid
- [ ] Step 3: Update grid classes for StatusLedger to span full width on lg where needed
- [ ] Step 4: Verify page loads without errors
- [ ] Step 5: Commit
```bash
git add resources/js/pages/dashboard.tsx
git commit -m "feat(dashboard): remove ValueLedger card"
```

### Task 3: Remove Aset per Lokasi section

**Files:**
- Modify: `resources/js/pages/dashboard.tsx`
- Test: Visual check

**Interfaces:**
- Consumes: locations prop
- Produces: Only Aset per Klasifikasi section remains

- [ ] Step 1: Remove RegisterSection with title "Aset per Lokasi"
- [ ] Step 2: Remove related RankedList mapping for locations
- [ ] Step 3: Adjust grid column span for remaining RegisterSection
- [ ] Step 4: Verify no unused imports
- [ ] Step 5: Commit
```bash
git add resources/js/pages/dashboard.tsx
git commit -m "feat(dashboard): remove Aset per Lokasi section"
```

### Task 4: Update WarrantyWatch wording

**Files:**
- Modify: `resources/js/components/dashboard/warranty-watch.tsx:128-174`
- Test: Visual check

**Interfaces:**
- Consumes: alerts.expired, alerts.soon, alerts.assets
- Produces: Updated titles and badge texts

- [ ] Step 1: Change RegisterSection title from "Garansi" to "Peringatan Garansi"
- [ ] Step 2: Update badge text for expired from "kedaluwarsa" to "habis"
- [ ] Step 3: Update badge text for soon from "segera" to "segera habis"
- [ ] Step 4: Update AlertTitle to use "sudah habis" instead of "kedaluwarsa"
- [ ] Step 5: Verify empty state text remains correct
- [ ] Step 6: Commit
```bash
git add resources/js/components/dashboard/warranty-watch.tsx
git commit -m "feat(dashboard): improve warranty wording"
```

### Task 5: Ensure no page scroll

**Files:**
- Modify: `resources/js/pages/dashboard.tsx`
- Test: Playwright screenshot

**Interfaces:**
- Consumes: layout classes
- Produces: Dashboard height fits viewport

- [ ] Step 1: Reduce outer padding on mobile from p-4 to p-3 if needed
- [ ] Step 2: Limit ActivityLedger and WarrantyWatch max height with internal scroll
- [ ] Step 3: Run `./qa-playwright-capture.sh http://localhost:8000 public/qa-screenshots` to verify no vertical scrollbar
- [ ] Step 4: Run `graphify update .`
- [ ] Step 5: Commit
```bash
git add resources/js/pages/dashboard.tsx
git commit -m "chore(dashboard): adjust layout to prevent page scroll"
```
