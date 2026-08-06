# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Enterprise asset managers and administrators who need to classify, organize, and manage organizational assets across multiple tenants/departments. Users authenticate via corporate SSO (OIDC) and operate in an Indonesian-language interface.

## Product Purpose

Opti-Asset provides the classification and taxonomy layer for organizational asset management. It enables teams to define and maintain a structured 4-level hierarchy (Golongan → Kategori → Cluster → Sub Cluster) that organizes assets into meaningful groups for tracking, reporting, and governance.

## Positioning

Multi-tenant asset classification system with SSO-first authentication. Differentiates from generic classification tools by operating within a multi-tenant framework where each organization (tenant) maintains its own independent classification hierarchy, with tenant context enforced at the database level.

## Operating Context

- Users authenticate through corporate OIDC/SSO provider (no local password flow)
- Tenant context is session-based; users can switch between organizations they belong to
- Classification hierarchy is managed through a tree UI with drag-and-drop reordering, bulk CSV import/export, and inline editing
- Each classification node supports code, name, description, and notes (sub-cluster level)
- Data is tenant-scoped: all queries filter by `tenant_id` automatically

## Capabilities and Constraints

- 4-level classification hierarchy: Golongan Asset → Kategori Asset → Cluster Asset → Sub Cluster Asset
- Full CRUD for all classification levels with inline editing and detail panel
- Drag-and-drop reorder within same level, with cross-level move support
- Bulk operations: multi-select delete, CSV import/export
- Duplicate node with children
- Search/filter across the classification tree
- Multi-tenancy via Spatie Multitenancy with database-level tenant isolation
- Tenant switching via session
- User profile, 2FA, passkeys, password management (Fortify-powered)
- Dark mode support

## Brand Commitments

- Indonesian language interface (all UI labels, toast messages, descriptions)
- Corporate/enterprise visual tone — professional, clean, functional
- Glassmorphism design system defined in DESIGN.md

## Evidence on Hand

- Working classification CRUD with 4-level tree hierarchy
- OIDC SSO integration with user provisioning
- Multi-tenant architecture with tenant switching
- Dashboard with organizational stats
- shadcn/ui (New York style) component library

## Product Principles

1. Tenant isolation is non-negotiable — all data queries are scoped by tenant at the model level
2. Classification structure must be maintainable by non-technical users — drag-and-drop, CSV import, inline editing
3. SSO-first authentication — no local account creation, users provisioned from corporate identity provider
4. Hierarchy integrity — parent-child relationships enforced, preventing orphaned or circular references
5. Indonesian-first — UI and copy in Bahasa Indonesia, technical identifiers in English
