# Opti-Asset UX Research Report — Part 1: Feature Modules & Requirements

**Source:** PRD_Sistem_Manajemen_Aset.md (v1.3, 9 Sep 2026)  
**Domain:** Multi-tenant asset management (Indonesian enterprise)  
**Stack:** Laravel 13 + Inertia.js v3 + React 19 + Tailwind CSS v4  

---

## 1. Feature Modules with Functional Requirements

### Module A — Asset Data Management (FR-01)

| ID | Requirement |
|---|---|
| FR-01.1 | Create new asset data |
| FR-01.2 | View asset list |
| FR-01.3 | View asset detail |
| FR-01.4 | Edit asset data |
| FR-01.5 | Delete asset data |
| FR-01.6 | Store asset attributes: asset code, asset name, classification, location, status, acquisition date, and other info |
| FR-01.7 | Generate unique asset code for each asset |

**Screens:** Asset List, Asset Create/Edit, Asset Detail

### Module B — Asset Classification Management (FR-02)

| ID | Requirement |
|---|---|
| FR-02.1 | Add asset classification |
| FR-02.2 | View classification list |
| FR-02.3 | Edit classification |
| FR-02.4 | Delete classification |
| FR-02.5 | Link each asset to one appropriate classification |

**Screens:** Classification Tree (4-level: Golongan → Kategori → Cluster → Sub-Cluster), Classification Detail/Edit

### Module C — Asset Item Management (FR-03)

| ID | Requirement |
|---|---|
| FR-03.1 | Add asset item data |
| FR-03.2 | View asset item list |
| FR-03.3 | Edit asset item |
| FR-03.4 | Delete asset item |
| FR-03.5 | Link item to classification |

**Screens:** Asset Item List, Asset Item Create/Edit

### Module D — Barcode / QR Scan (FR-04)

| ID | Requirement |
|---|---|
| FR-04.1 | Scan barcode/QR code via camera |
| FR-04.2 | Display asset info from scan result |
| FR-04.3 | Store scan result as reference |
| FR-04.4 | Manual input fallback if scan fails |

**Screens:** Barcode Scanner (camera), Scan Result, Manual Entry fallback

### Module E — Asset Mutation / Transfer (FR-05)

| ID | Requirement |
|---|---|
| FR-05.1 | Create asset mutation request |
| FR-05.2 | View mutation list |
| FR-05.3 | Approve/reject mutation |
| FR-05.4 | Update asset location/status after mutation |
| FR-05.5 | Record mutation history |

**Screens:** Mutation Request, Mutation List, Mutation Approve/Reject, Mutation History

### Module F — Asset Disposal (FR-06)

| ID | Requirement |
|---|---|
| FR-06.1 | Create disposal request |
| FR-06.2 | View disposal list |
| FR-06.3 | Approve/reject disposal |
| FR-06.4 | Update asset status to Disposed |
| FR-06.5 | Record disposal reason and date |

**Screens:** Disposal Request, Disposal List, Disposal Approve/Reject

### Module G — Reporting (FR-07)

| ID | Requirement |
|---|---|
| FR-07.1 | Generate asset report |
| FR-07.2 | Export report to PDF/Excel |
| FR-07.3 | Filter report by date, status, classification |

**Screens:** Reports, Report Filters, Export options

### Module H — Dashboard (FR-08)

| ID | Requirement |
|---|---|
| FR-08.1 | Display asset summary dashboard |
| FR-08.2 | Display charts: status distribution, classification breakdown |
| FR-08.3 | Real-time data refresh |

**Screens:** Dashboard

### Module I — Search & Filter (FR-09)

| ID | Requirement |
|---|---|
| FR-09.1 | Search assets by code, name, location |
| FR-09.2 | Filter assets by status, classification |
| FR-09.3 | Sort asset list |

**Screens:** Integrated into Asset List (search bar, filters, sort)

### Module J — User & Role Management (FR-10)

| ID | Requirement |
|---|---|
| FR-10.1 | Manage user accounts |
| FR-10.2 | Assign roles to users |
| FR-10.3 | Manage role permissions |
| FR-10.4 | User login/logout |
| FR-10.5 | User profile management |
| FR-10.6 | Export user data (PENDING) |

**Screens:** User Management, Role Management, Login, Profile

### Module K — Security & Access Control (FR-11)

| ID | Requirement |
|---|---|
| FR-11.1 | Authenticate users |
| FR-11.2 | Authorize access based on role |
| FR-11.3 | Restrict feature access by user role |
| FR-11.4 | Record user activity in audit log |

**Screens:** Login (SSO/OIDC), Permission configuration

### Module L — Audit Trail (FR-12)

| ID | Requirement |
|---|---|
| FR-12.1 | Record add, edit, delete activities |
| FR-12.2 | Record activity timestamp |
| FR-12.3 | Record user who performed activity |
| FR-12.4 | Search and trace audit log |

**Screens:** Audit Log, Audit Log Search/Filter

### Module M — Asset Type & Accounting Data (FR-13)

| ID | Requirement |
|---|---|
| FR-13.1 | Asset Type field: Aktiva Tetap or Peralatan (independent of classification) |
| FR-13.2 | Auto-determine Asset Type based on acquisition value vs capitalization threshold |
| FR-13.3 | Setting to configure capitalization threshold value |
| FR-13.4 | Display Asset Type on asset detail and report |
| FR-13.5 | Link asset to accounting data (account code, depreciation) |
| FR-13.6 | Calculate depreciation based on asset type and acquisition date |
| FR-13.7 | Export accounting data |
| FR-13.8 | Dashboard breakdown by asset type (PENDING) |

**Screens:** Asset Type settings, Capitalization threshold config, Accounting data, Depreciation calculation

---

*End of Part 1.*