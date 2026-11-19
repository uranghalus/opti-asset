# Opti-Asset UX Research Report — Part 4: Pending Items, User Journeys, Summary

**Source:** PRD_Sistem_Manajemen_Aset.md (v1.3, 9 Sep 2026), Design.md (v2.0)

---

## 5. Pending Items from Tracking Section

Based on PRD changelog (v1.1 → v1.3) and tracking references:

| Item | Reference | Status | Notes |
|---|---|---|---|
| FR-10.6 | Export user data | **PENDING** | User management export not yet implemented |
| FR-13.8 | Dashboard breakdown by asset type | **PENDING** | Dashboard asset-type breakdown not yet implemented |
| FR-07.2 | Export report to PDF/Excel | Implemented (v1.1) | Completed |
| FR-04 | Disposal UI + enum + toast Indonesia | Implemented (v1.1) | Completed |
| FR-12 | Audit Trail `ActivityLog` + observer + UI | Implemented (v1.1) | Completed |
| Bulk delete asset | Added v1.1 | Implemented | Completed |
| Import/export classification | Added v1.1 | Implemented | Completed |

**Key pending UX work:**
1. **FR-10.6 — User data export**: Add export button in User Management screen, generate CSV/Excel of user accounts
2. **FR-13.8 — Dashboard asset type breakdown**: Add Aktiva Tetap vs Peralatan breakdown chart on Dashboard
3. Both items are explicitly marked pending in PRD tracking (§12)

---

## 6. Key User Journeys

### Journey 1: Asset CRUD
**Actor:** Asset Manager  
**Path:** Login → Asset List → (search/filter) → Asset Create → fill form (code auto-generated) → save → Asset Detail → edit → delete (confirm)  
**Screens:** Login, Asset List, Asset Create, Asset Detail, Asset Edit  
**UX constraints:** 3-click rule to reach asset detail; unique code auto-generation; validation before save; toast confirmation (Indonesian)

### Journey 2: Barcode Scan
**Actor:** Asset Manager / End User  
**Path:** Asset List → scan button → camera permission → scan barcode → view asset info → (if fails) manual entry fallback  
**Screens:** Barcode Scanner, Scan Result, Manual Entry  
**UX constraints:** Camera access on mobile; <2s scan result; Indonesian toast messages; manual fallback

### Journey 3: Mutation / Disposal
**Actor:** Asset Manager → Manager (approver)  
**Path:** Create request → Manager reviews → Approve/Reject → Asset status/location updated → History recorded  
**Screens:** Mutation/Disposal Request, List, Approve/Reject, History  
**UX constraints:** Role-based approve/reject; status transition (ACT → MUT → ACT/DSP); audit log capture

### Journey 4: Dashboard
**Actor:** Management  
**Path:** Login → Dashboard → view summary cards → view status charts → filter by date/classification → (pending: asset type breakdown)  
**Screens:** Dashboard  
**UX constraints:** <3s load; real-time refresh; charts for status distribution; pending FR-13.8 asset type breakdown

### Journey 5: Settings (Asset Type & Accounting)
**Actor:** Super Admin  
**Path:** Settings → Asset Type config → set capitalization threshold → view accounting data → depreciation calculation  
**Screens:** Asset Type Settings, Capitalization Threshold, Accounting Data  
**UX constraints:** Threshold auto-determines asset type; accounting export pending (FR-13.7)

---

## 7. UX-Relevant Constraints Summary

| Constraint | Value | Source |
|---|---|---|
| 3-click rule | Max 3 clicks to common tasks | NFR-05.2 |
| Load time target | <3 seconds | NFR-06.1 |
| Asset scale | 10,000+ assets | NFR-06.2 |
| Device support | Desktop, tablet, mobile | NFR-04.1 |
| Barcode scan | Via camera, manual fallback | FR-04.1, FR-04.4 |
| Dark mode | Supported, WCAG ≥ 6:1 | Design.md |
| Language | Indonesian (all UI text) | NFR-05.3 |
| Classification | 4-level: Golongan → Kategori → Cluster → Sub-Cluster | PRD §4 |
| Asset statuses | ACT, LOAN, RPR, MUT, DSP | PRD §5 |
| Asset types | Aktiva Tetap, Peralatan | FR-13.1 |
| Authentication | Corporate SSO/OIDC, no local password | PRODUCT.md |
| Multi-tenant | Tenant-scoped, session-based switching | PRODUCT.md |

---

## 8. Recommended UX Priorities (for implementation)

**High Priority:**
1. Dashboard asset type breakdown (FR-13.8 — pending)
2. User data export (FR-10.6 — pending)
3. Barcode scanner camera UI (FR-04)
4. Asset list with search/filter under 3s load (NFR-06)

**Medium Priority:**
5. Dark mode toggle (Design.md)
6. Audit log UI with search (FR-12.4)
7. Classification tree drag-and-drop (FR-02)

**Low Priority:**
8. PDF/Excel export refinements (FR-07.2)
9. Depreciation calculation UI (FR-13.6)

---

*End of Part 4 — Research Report Complete.*