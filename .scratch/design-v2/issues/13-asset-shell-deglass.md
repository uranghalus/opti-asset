# 13: Asset page shell de-glass + copy translation

**What to build:** A user opening the Aset page sees a light-first, opaque ledger surface that matches DESIGN.md v2.0: cool paper background, white surfaces with 1px borders, structural shadows only, no glow, no frosted panels, no forced dark theme. Indonesian copy is plain operational language (Aset, aset, Saringan→language users know, plain chips instead of BAY-n) so a first-time end user understands what each control does without training. Select actions are always visible on cards; scanning and import stay one tap away in the header.

**Blocked by:** 12 (status & classification recipes on-system).

**Status:** done (4648a61)

- [ ] Page root drops the forced dark manifest scope; renders on standard tokens in both themes
- [ ] No decorative background layer; page bg = paper, surfaces = card with 1px border
- [ ] Sidebar, header, breadcrumb, folder chips, filter bar, pagination, bulk toolbar: opaque surfaces, structural shadows, borders in both themes
- [ ] Copy: page title "Aset"; counts read as "N aset · M filter · K dipilih"; folder chips show name + code + count (no BAY-n); decorative barcode strips removed
- [ ] Search input styled per system (no frosted field, no fake keyboard shortcut badge)
- [ ] Card row actions (detail/edit/delete) always visible, 44px targets
- [ ] Processing overlay (Mencatat...) uses solid surface, readable in both themes
- [ ] Verified at 375px, 768px, 1024px, 1440px in light + dark
