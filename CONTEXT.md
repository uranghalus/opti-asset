# Opti-Asset

Multi-tenant asset management for Indonesian enterprise operations: classification, registration, scan, mutation, disposal, audit trail.

## Language

### Classification

**Klasifikasi**:
The four-level hierarchy that organizes assets: Golongan → Kategori → Cluster → Sub-Cluster.
_Avoid_: folder, directory, tree path

**Golongan (Group)**:
Top classification level; the broad family an asset belongs to.
_Avoid_: class, type, category

**Kategori (Category)**:
Second classification level, child of a Golongan.
_Avoid_: group, class

**Cluster**:
Third classification level, child of a Kategori.
_Avoid_: group, family

**Sub-Cluster**:
Fourth and finest classification level, child of a Cluster.
_Avoid_: subcategory, item type

**Kode Klasifikasi**:
Dotted code identifying the full path Golongan.Kategori.Cluster.Sub-Cluster (e.g. `03.08.01.03`). Always rendered in monospace.
_Avoid_: class code, folder ID

**Tanpa Klasifikasi**:
Bucket for assets with no classification assigned; always listed last with its count.
_Avoid_: unclassified node, other, root

**Drill-down**:
Navigation that narrows the asset list by entering one classification node at a time.
_Avoid_: filtering, faceting

**Cakupan (scope)**:
The classification node currently selected; the asset list shows only assets inside it, and ancestor levels above the scope are not repeated in list rows.
_Avoid_: active folder, current selection

### Browsing

**Jalur (path)**:
The full classification chain of the current scope, shown once in the page title area, e.g. "Peralatan Kantor & Rumah Tangga → Alat Kerja Kantor (Elektronik)".
_Avoid_: breadcrumb trail, address

**Daftar Aset (asset list)**:
The paginated list of assets matching the current scope, search, and filters. One screen, both a table (desktop) and cards (narrow).
_Avoid_: manifest, index, register

**Filter aktif**:
A non-default filter (status, tipe, lokasi) shown as a removable chip so the current query is always visible.
_Avoid_: applied filter, criteria
