# Opti-Asset UX Research Report — Part 3: NFRs (UI/UX), Screen Inventory, UX Constraints

**Source:** PRD_Sistem_Manajemen_Aset.md (v1.3, 9 Sep 2026), Design.md (v2.0)

---

## 3. Non-Functional Requirements Relevant to UI/UX

### Performance (NFR-06)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-06.1 | Page load under 3 seconds | Critical for dashboard and asset list; skeleton loading states required |
| NFR-06.2 | System handles 10,000+ assets | Pagination, virtual scrolling, search debounce needed |
| NFR-06.3 | Search response under 1 second | Debounced search input, loading indicators |
| NFR-06.4 | Barcode scan result under 2 seconds | Camera UI must be fast, immediate feedback on scan |

### Usability (NFR-05)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-05.1 | Intuitive, easy-to-use interface | Clear information hierarchy, minimal cognitive load |
| NFR-05.2 | 3-click rule for common tasks | Max 3 clicks to reach any asset detail or action |
| NFR-05.3 | Indonesian language interface | All labels, messages, toasts in Indonesian |
| NFR-05.4 | Error messages clear and actionable | Validation messages in Indonesian, inline |
| NFR-05.5 | Confirmation for destructive actions | Delete/dispose confirmation dialogs |

### Compatibility (NFR-04)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-04.1 | Desktop, tablet, mobile support | Responsive design, touch-friendly targets |
| NFR-04.2 | Chrome, Firefox, Safari, Edge | Cross-browser testing |
| NFR-04.3 | Barcode scan via camera | Mobile camera access, desktop fallback to manual entry |

### Accessibility / Inclusive Design

| Requirement | UX Implication |
|---|---|
| Dark mode support (Design.md) | Toggle theme, WCAG contrast ≥ 6:1 verified |
| Focus states | Visible focus rings (focus: #0D5C56) |
| Status color mapping | Verified ≥ 6:1 contrast on light theme |
| Monospace classification codes | `03.08.01.03` rendered in monospace |

### Scalability (NFR-07)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-07.1 | Handle growth in assets, users, transactions | Pagination scales, no hard limits in UI |
| NFR-07.2 | Support new modules/features | Extensible navigation, modular screen structure |

### Maintainability (NFR-08)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-08.2 | Technical and user documentation | Help tooltips, user guide links in UI |

### Auditability (NFR-09)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-09.1 | Activity log retained min 1 year | Audit log UI with date range filter |
| NFR-09.2 | Traceable asset change history | "Who, when, what changed" on asset detail |
| NFR-09.3 | Show who/when/what on asset data | Audit trail panel on asset detail |

### Data Integrity (NFR-10)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-10.1 | Unique asset identity, no duplicates | Duplicate detection on create/edit |
| NFR-10.2 | Validate data before save | Client-side + server-side validation |
| NFR-10.3 | Consistency across asset, classification, item, mutation, disposal | Cascading updates, referential integrity UI |

### Backup & Recovery (NFR-11)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-11.1 | Daily automatic backup | No direct UI action needed; status indicator optional |
| NFR-11.3 | RTO max 4 hours after failure | Error page with recovery info |

### Compliance (NFR-12)

| ID | Requirement | UX Implication |
|---|---|---|
| NFR-12.1 | Data storage compliance | Privacy notice, data retention info |
| NFR-12.2 | User consent for data processing | Consent banners where applicable |

---

## 4. Screen Inventory (All Pages Needed)

### Dashboard Module
1. **Dashboard** — asset summary, status charts, classification breakdown (FR-08, pending FR-13.8)

### Asset Management Module
2. **Asset List** — paginated, search, filter by status/classification, sort (FR-01.2, FR-09)
3. **Asset Create** — add new asset with unique code generation (FR-01.1, FR-01.6, FR-01.7)
4. **Asset Edit** — modify asset data (FR-01.4)
5. **Asset Detail** — view full asset info, audit trail panel, who/when/what (FR-01.3, NFR-09.3)
6. **Asset Delete** — confirmation dialog (FR-01.5)

### Classification Module
7. **Classification Tree** — 4-level drill-down (Golongan → Kategori → Cluster → Sub-Cluster), drag-and-drop reorder (FR-02)
8. **Classification Create/Edit** — add/edit classification node (FR-02.1, FR-02.3)
9. **Classification Detail** — view node with code, name, description, notes (FR-02.2)

### Asset Item Module
10. **Asset Item List** — list items linked to classification (FR-03.2)
11. **Asset Item Create/Edit** — add/edit item (FR-03.1, FR-03.3)

### Barcode / QR Scan Module
12. **Barcode Scanner** — camera scan interface (FR-04.1)
13. **Scan Result** — display asset info from scan (FR-04.2)
14. **Manual Entry** — fallback input if scan fails (FR-04.4)

### Mutation Module
15. **Mutation Request** — create transfer request (FR-05.1)
16. **Mutation List** — view all mutations (FR-05.2)
17. **Mutation Approve/Reject** — approve or reject (FR-05.3)
18. **Mutation History** — view mutation history per asset (FR-05.5)

### Disposal Module
19. **Disposal Request** — create disposal (FR-06.1)
20. **Disposal List** — view all disposals (FR-06.2)
21. **Disposal Approve/Reject** — approve/reject (FR-06.3)

### Reporting Module
22. **Reports** — generate asset reports (FR-07.1)
23. **Report Filters** — filter by date, status, classification (FR-07.3)
24. **Export** — PDF/Excel export (FR-07.2, pending FR-10.6 for users)

### User & Role Management Module
25. **Login** — SSO/OIDC (FR-10.4, FR-11.1)
26. **User Management** — create/edit/delete users (FR-10.1)
27. **Role Management** — assign roles, manage permissions (FR-10.2, FR-10.3)
28. **User Profile** — profile management (FR-10.5)
29. **Tenant Switcher** — switch between organizations (session-based)

### Settings Module
30. **Asset Type Settings** — Aktiva Tetap / Peralatan config (FR-13.1)
31. **Capitalization Threshold** — configure threshold value (FR-13.3)
32. **Accounting Data** — account code, depreciation setup (FR-13.5, FR-13.6)
33. **Dark Mode Toggle** — theme switching (Design.md)

### Audit Trail Module
34. **Audit Log** — view activity log (FR-12.1, FR-12.2, FR-12.3)
35. **Audit Log Search** — search and trace audit log (FR-12.4)

---

*End of Part 3.*