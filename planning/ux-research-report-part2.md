# Opti-Asset UX Research Report — Part 2: User Roles & Capabilities

**Source:** PRD_Sistem_Manajemen_Aset.md (v1.3, 9 Sep 2026)

---

## 2. User Roles and Permissions/Capabilities

### Role: Super Admin (Admin Sistem)

| Capability | Permissions |
|---|---|
| Full system access | All modules, all tenants |
| User & role management | Create/edit/delete users, assign roles, manage permissions (FR-10) |
| Classification management | Full CRUD on all classification levels (FR-02) |
| Asset management | Full CRUD on all assets across all tenants (FR-01) |
| Mutation & disposal | Approve/reject all mutations and disposals (FR-05, FR-06) |
| Reports | Generate and export all reports (FR-07) |
| Audit trail | View all audit logs (FR-12) |
| Settings | Configure capitalization threshold, asset type rules (FR-13) |
| System config | Backup/recovery, maintenance (NFR-11, NFR-08) |

### Role: Asset Manager (Pengelola Aset)

| Capability | Permissions |
|---|---|
| Asset CRUD | Add, edit, delete assets within assigned tenant(s) (FR-01) |
| Classification view | View classification hierarchy (FR-02.2, read-only) |
| Asset item | Add/edit/delete asset items (FR-03) |
| Barcode scan | Scan barcode/QR via camera (FR-04) |
| Mutation | Create mutation requests (FR-05.1) |
| Disposal | Create disposal requests (FR-06.1) |
| Reports | Generate reports for assigned assets (FR-07) |
| Audit trail | View own activity logs (FR-12) |

### Role: Management (Manajemen)

| Capability | Permissions |
|---|---|
| Dashboard | View asset summary dashboard with charts (FR-08) |
| Asset list | View asset list and details (FR-01.2, FR-01.3, read-only) |
| Search & filter | Search and filter assets (FR-09, read-only) |
| Reports | View reports (FR-07, read-only) |
| Audit trail | View audit logs (FR-12, read-only) |
| No write access | Cannot create/edit/delete assets, mutations, or disposals |

### Role: End User

| Capability | Permissions |
|---|---|
| Asset list | View asset list (FR-01.2, read-only) |
| Asset detail | View asset detail (FR-01.3, read-only) |
| Search | Search assets by code, name, location (FR-09.1, read-only) |
| Barcode scan | Scan to view asset info (FR-04.2, read-only) |
| No write access | Cannot modify any asset data |

### Authentication

- Corporate SSO (OIDC) — no local password flow
- Tenant context is session-based; users can switch between organizations they belong to
- All queries filter by `tenant_id` automatically (multi-tenant enforcement)

---

*End of Part 2.*