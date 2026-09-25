# Asset list rows hide classification levels at or above the current scope, and render codes code-first

List rows repeated every ancestor level of the selected node ("Peralatan Kantor & Rumah
Tangga · Alat Kerja Kantor (Elektronik) · Laptop" under the scope "Alat Kerja Kantor
(Elektronik)"), which combined with single-line truncation produced unidentifiable labels
("what data is this?"). Rows now render only levels **below** the current scope, keep the
classification code in monospace first, and let the page title carry the full scope path
once. This is hard to reverse casually because it changes what the API returns to the list
(row payload no longer includes ancestor names), and a future reader will wonder why row
classification is partial — this records that it is deliberate.

## Consequences

- The Browse controller must derive each row's "levels below scope" at query time.
- When no scope is selected, rows show the full chain but still code-first.
- Import/export files and detail pages are unaffected — this is a list-rendering contract only.
