# 11: Labels print + final a11y & state sweep

**What to build:** Label printing is pure black-on-white with mono codes (print durability over branding), and the whole app passes the brief's accessibility and state checklist: skip links, focus order, reduced-motion, ARIA wiring, offline banners, and per-screen state coverage verified.

**Blocked by:** 05, 06, 07, 08, 09, 10 (sweeps the completed screens).

**Status:** ready-for-agent

- [ ] Label + LabelsBatch pages: black-on-white, mono codes, no brand color in print output
- [ ] Skip link → main on every page; focus order = topbar/sidebar → header → filters → content → sticky CTA
- [ ] Focus ring visible everywhere (2px primary, 2px offset); no `outline: none` without replacement
- [ ] `prefers-reduced-motion` kills all transitions/animations app-wide
- [ ] ARIA audit: toasts polite (scan assertive), tabs/tree/badges/forms per §10; icon-only buttons have Indonesian aria-labels
- [ ] Offline banners present on list screens with writes disabled; state table §8 verified per screen
- [ ] Full CI: `npm run lint:check` + `format:check` + `types:check` + `php artisan test --compact` green
