# Drill-down browsing keeps classification as the primary asset navigation, with search as the equal first-class path

The end user explicitly requested assets be organized and navigated by drill-down through
Golongan → Kategori → Cluster → Sub-Cluster. We keep that model and strengthen it (full-path
page title, counts on every node, no empty dead-ends) instead of replacing it with cascading
selects or a flat table — abandoning the requested grouping would re-litigate the product
decision with the requester, not just change a layout.

## Considered Options

- Cascading selects instead of the tree (rejected: abandons the explicitly requested grouping;
  facets are being added alongside, not instead)
- Flat Excel-like table with filter chips (rejected: same reason; loses the mental model the
  end user asked for)

## Consequences

- Search must work at the list root (no node selected), because laypeople will search first;
  this removes the current backend gate where `assets` is null without a selected node.
- Ancestor levels of the current scope are hidden from list rows and chips; the scope path
  appears once in the page title. Redundant repetition of the selected node is a defect.
- Every tree node displays an asset count; a scope with zero assets shows guidance to go up
  or to sibling nodes instead of a bare empty state.
