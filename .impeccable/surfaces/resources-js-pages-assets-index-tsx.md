---
version: 1
slug: "resources-js-pages-assets-index-tsx"
primary_target: "resources/js/pages/assets/Index.tsx"
related_targets: ["resources/js/pages/assets/components/asset-page-header.tsx","resources/js/pages/assets/components/asset-card.tsx","resources/js/pages/assets/components/asset-card-grid.tsx"]
---

# Surface brief — Halaman Aset (`resources/js/pages/assets/Index.tsx`)

- Scope: modul asset — index + komponen `components/`-nya + halaman turunan (Show, Create, Edit, Scan, Labels, LabelsBatch) + shared (`components/assets/*`, `lib/asset-status`, `EmptyState` plain).
- Mode pengunjung: Operate — operator menyelesaikan pencatatan dan drill-down klasifikasi 4 tingkat.

## Tugas & isi

- Audiens: admin aset enterprise, Bahasa Indonesia, SSO, operasional desktop-berat.
- Pekerjaan: drill-down Golongan → Kategori → Cluster → Sub Cluster, cari, saring, pilih massal, impor, cetak barcode/label, hapus.
- Bukti: ledger pos (kode mono, foto, rantai klasifikasi, lokasi/unit, stempel status ACT/LOAN/RPR/MUT/DSP), paginasi 15/pos.
- Batasan: semua fungsi existing wajib hidup; dark mode + Bahasa Indonesia; tanpa kaca dekoratif di permukaan ini.

## Arah terpilih

- Manifest Deck dalam material NOON (DESIGN.md v1.0): scope `.dark.noon` khusus halaman asset.
- Momen khas: satu aset = satu kartu depot dalam grid responsif (pita traffic-light status, spanduk foto zoom saat hover, cap centang melayang, keping klasifikasi sewarna level), status sebagai stempel mono semantik, pilihan massal sebagai slip kaca yang menghentak (stamp-slam 200ms expo-out), kondisi kosong selalu bernama + menawarkan pemulihan.
- Material: token NOON (amber `#FFB23E`, violet `#B892FF`, teal `#5EEAD4`, bg `#1B1230`, surface `#221533`), blur 10-20px, border 1px `white/20`, radius sm 6px / md 8px / lg 12px, H1 2rem, label mikro mono 13px, glow amber untuk hover CTA primer. Tanpa gradien teks, tanpa hitam murni.

## Belum diputuskan

- Halaman turunan sudah diselaraskan (Show deck kaca + stempel, Create/Edit/Scan header kaca, Labels toolbar panel print-safe, `StatusBadge` menjadi stempel). Stiker cetak dan PDF tidak diubah (fidelitas cetak).
- Pengelompokan dipertahankan + simpul `unclassified` ("Tanpa Klasifikasi") agar aset tanpa klasifikasi tetap terjangkau; `browse()` dipulihkan, duplikat route `grouped` dibuang.
