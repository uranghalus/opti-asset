# Mobile-First Asset Management UI

## Problem
Users report buttons, tables, and forms are hard to use on smartphone browsers during asset workflows (scan, CRUD, transfer, disposal). Core features exist but are not mobile‑optimized, causing friction for Staff Asset, Admin Department, GM, and Accounting who access the app primarily on mobile.

## Evidence
- User complaints about button/table layout on smartphone testing (no specific count recorded).

## Users
- **Primary**: Staff Asset, Admin Department (daily CRUD, scan, transfer, disposal).
- **Also**: GM & Accounting (view dashboards, reports).
- **Not for**: External auditor, native mobile users.

## Hypothesis
We believe **mobile-first asset management UI** will **reduce UI friction and data entry errors** **Staff Asset & Admin Department**. We'll know we're right when **mobile task completion rate ≥90% and UI-related support tickets drop by 50%** within 1 month after launch.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Mobile task completion rate | ≥90% | Usability test with 5 Staff Asset |
| UI-related support tickets | -50% vs baseline | Support log comparison |
| Core feature parity (Next.js → Laravel) | 100% features migrated | PRD §12 tracking |

## Scope
**MVP** — Migrate all core Next.js features to Laravel (CRUD Assets, Classification, Loans, Transfers, Disposals), plus mobile-first responsive layouts (cards over wide tables) and optimized barcode scanning for mobile browsers.

**Out of scope**
- Native mobile app (mobile web only, no iOS/Android SDK).
- IoT / RFID hardware integration.
- Offline access (TBD — needs validation via user testing).
- AI predictive analytics.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Feature parity migration | All Next.js core features working in Laravel Inertia | complete | — |
| 2 | Mobile-first responsive UI | Card-based lists, touch-friendly forms/scans | complete | — |
| 3 | User validation | 5 Staff Asset complete key tasks on smartphone | pending | — |

## Mobile Validation Tests
### Scenarios
- **Login & Upload**: Login $\rightarrow$ upload asset $\rightarrow$ expect 200 OK, duration $\le 3\text{s}$.
- **Infinite Scroll**: View list $\rightarrow$ scroll $\rightarrow$ no layout shift, load $\le 2\text{s}$ per page.
- **Edit Workflow**: Edit asset $\rightarrow$ save $\rightarrow$ success $\ge 99\%$, UI responsive.
- **Deletion**: Delete asset $\rightarrow$ confirm modal $\rightarrow$ deletion $\le 1\text{s}$, list updates instantly.
- **Offline Resilience**: Offline $\rightarrow$ create draft $\rightarrow$ sync on reconnect, no data loss.

### KPI Tracking
| Metric | Target | Method |
|---|---|---|
| Success Rate | $\ge 95\%$ | `asset_task_completed` event |
| Avg Duration | $\le 5\text{s}$ | Duration tracking per task |
| Error Rate | $\le 2\%$ | Error event monitoring |

## Open Questions
- [ ] Offline access needs — users requested? (TBD — needs validation via user testing)
- [ ] Target smartphone browsers (Chrome iOS/Android, Safari, in‑app WebView)?
- [ ] Barcode scanner hardware integration (Zebra, generic camera)?


## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mobile layout breaks existing desktop UX | Medium | Medium | Responsive breakpoints tested on 3 breakpoints |
| Barcode scan unreliable on low‑end devices | Medium | High | Provide manual entry fallback |
| Feature parity gaps missed | Low | High | Checklist against Next.js routes |

*Status: DRAFT — requirements only. Implementation planning pending via /plan.*