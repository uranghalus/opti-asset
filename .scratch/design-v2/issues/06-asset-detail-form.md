# 06: Asset detail + create/edit form per brief

**What to build:** Viewing and editing an asset matches the brief: StatusHeader (badge + nama + mono kode + actions), DefinitionList, AccountingPanel visible only for Aktiva Tetap (FR-13.6), TipeField with auto assignment + override requiring alasan (FR-13.9), StickyFormFooter with Simpan on mobile, and §8 form states (inline validation, preserved form on 500, draft warning offline).

**Blocked by:** 03 (status layer), 04 (shell).

**Status:** ready-for-agent

- [ ] Detail: StatusHeader hierarchy (badge → nama → kode mono → lokasi → actions); DefinitionList 2-col desktop; RelatedTabs (Riwayat, Label)
- [ ] AccountingPanel (nilai perolehan, masa manfaat, metode & akumulasi penyusutan, nilai buku) renders only for Aktiva Tetap; hidden for Peralatan (FR-13.6)
- [ ] TipeField: auto-determined from threshold, override requires alasan which is recorded in riwayat
- [ ] Form sections: Identitas → Klasifikasi cascade → Lokasi/pemilik → Tipe → Accounting (conditional) → Lampiran
- [ ] StickyFormFooter on mobile with Simpan + Batal; MoneyInput ID-ID format
- [ ] Inline field errors (`aria-invalid` + `aria-describedby`); 500 → toast + form preserved; offline → Simpan disabled + draft warning
