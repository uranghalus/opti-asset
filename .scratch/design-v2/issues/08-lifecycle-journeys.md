# 08: Mutasi, disposal & riwayat per brief

**What to build:** Lifecycle journeys match the brief: mutasi form (asal read-only → tujuan → tanggal → catatan), approval actions (Setujui primary / Tolak destructive with alasan dialog), disposal lists with muted DSP rows, and Riwayat as a vertical timeline (event icons per type, actor + timestamp captions, mono deltas including tipe overrides and nilai buku snapshots — FR-13.9/13.10 surfaced).

**Blocked by:** 05 (asset browse — shared list pattern, remember-last-list flows into forms).

**Status:** ready-for-agent

- [ ] Mutasi create: asal read-only, tujuan picker, tanggal, catatan; approval actions on detail per assigned approver
- [ ] Tolak requires alasan (dialog); approve updates lokasi automatically (FR-06.5) with toast + list refresh
- [ ] Disposal create/edit/detail with alasan + tanggal; approved → DSP status locked from transactions (FR-07.6)
- [ ] Lists: ApprovalBadge states + muted row treatment for Dihapus
- [ ] Riwayat timeline: edit/mutasi/disposal/override/nilai-buku event icons, actor + timestamp captions, mono deltas
- [ ] Empty/loading/error/offline states per §8 for all three modules
