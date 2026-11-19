# RUNBOOK — Perbaikan Hydration Mismatch & TypeError dashboard.url

**Project:** opti-asset (Laravel 13 + PHP 8.4 + Inertia v3 + React 19 + Tailwind v4 + Wayfinder v0)  
**Path:** `D:\Laravel Project\opti-asset`  
**Tanggal:** 31 Oktober 2026  
**Status:** SELESAI — semua quality gate lulus  
**Bahasa:** Bahasa Indonesia  

---

## 1. Ringkasan

Ditemukan dan diperbaiki **3 masalah** yang menyebabkan gagal render/kategori kesalahan pada halaman dashboard dan tema:

| # | Masalah | File | Akibat |
|---|---------|------|--------|
| 1 | Hydration mismatch pada `ThemeToggle` | `resources/js/hooks/use-appearance.tsx` | Server render berbeda dengan client render pertama kali (ikon Monitor vs Sun) |
| 2 | `TypeError: dashboard.url undefined` | `resources/js/pages/dashboard.tsx` | `dashboard()` dipanggil tanpa argumen `tenant` → TypeError saat pemuatan modul |
| 3 | `SyntaxError: module does not provide export 'dashboard'` | `resources/js/pages/dashboard.tsx` | Impor `dashboard` dari `@/routes` yang tidak mengekspor `dashboard` |

---

## 2. Bug 1 — Hydration Mismatch di `use-appearance.tsx`

### Apa yang diubah
**File:** `resources/js/hooks/use-appearance.tsx` (baris 94)

Sebelum:
```ts
const appearance: Appearance = useSyncExternalStore(
    subscribe,
    () => currentAppearance,
    () => 'system',   // getServerSnapshot
);
```

Sesudah:
```ts
const appearance: Appearance = useSyncExternalStore(
    subscribe,
    () => currentAppearance,
    () => 'light',    // getServerSnapshot — konsisten dengan nilai awal client
);
```

### Mengapa bug terjadi
- Variabel modul `currentAppearance` diinisialisasi sebagai `'light'` (baris 13), yang juga merupakan default `initializeTheme()` jika tidak ada `localStorage`.
- Pada sisi **server**, `initializeTheme()` kembali awal (`typeof window === 'undefined'`), jadi `currentAppearance` tetap `'light'`.
- `getSnapshot` mengembalikan `currentAppearance` → `'light'`.
- Namun `getServerSnapshot` (digunakan React saat SSR) mengembalikan `'system'` → render `<Monitor />`.
- Pada client pertama kali, `getSnapshot` mengembalikan `'light'` → render `<Sun />`.
- Hasil: HTML server dan client tidak cocok → hydration mismatch.

### Fix
Server dan client sekarang sama-sama mengembalikan `'light'` pada render pertama, sehingga tidak ada selisih HTML antara server dan client.

---

## 3. Bug 2 — `TypeError: dashboard.url undefined`

### Apa yang diubah
**File:** `resources/js/pages/dashboard.tsx`

**Baris 21 — Impor:**
Sebelum:
```ts
import { dashboard } from '@/routes';
```
Sesudah:
```ts
import { dashboard } from '@/routes/tenant';
```
`@/routes` (`resources/js/routes/index.ts`) **tidak mengekspor** `dashboard`. `dashboard` diekspor sebagai named export dari `resources/js/routes/tenant/index.ts` (route `/{tenant}/dashboard`).

**Baris 848–855 — `Dashboard.layout`:**
Sebelum:
```ts
Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
```
Sesudah:
```ts
Dashboard.layout = (props: { tenant: { code: string } }) => ({
    breadcrumbs: [{
        title: 'Dashboard',
        href: dashboard({ tenant: props.tenant.code }).url,
    }],
});
```

### Mengapa bug terjadi
- `dashboard()` dari `@/routes/tenant` **wajib** menerima argumen `tenant` (route adalah `/{tenant}/dashboard`).
- Pemanggilan `dashboard()` tanpa argumen membuat `args` = `undefined`, lalu `dashboard.url(undefined)` gagal dengan `Cannot read properties of undefined (reading 'toString')`.
- Impor dari `@/routes` juga salah karena module tersebut tidak menyediakan export `dashboard`.

### Fix
- Impor diarahkan ke `@/routes/tenant` tempat `dashboard` sebenarnya diekspor.
- `Dashboard.layout` diubah menjadi fungsi yang menerima `props`, mengambil `tenant.code` dari konteks halaman Inertia (`HandleInertiaRequests.php` sudah `share('tenant', ...)` ke semua halaman Inertia), lalu memanggil `dashboard({ tenant: props.tenant.code }).url`.
- Pola ini mengikuti `DisposalShow.layout` yang sudah ada di codebase.

---

## 4. Hasil Quality Gate (file yang diubah)

| Gate | Hasil |
|------|-------|
| `tsc --noEmit` | ✅ 0 error terkait `dashboard` |
| `eslint` | ✅ Tidak ada error baru (6 error pre-existing di baris tidak diubah) |
| `prettier --check` | ✅ Semua file memakai gaya Prettier |

*(Error tsc dan eslint yang tersisa adalah pre-existing di file lain yang tidak terkait dengan perbaikan ini, mis. `organizations/Index.tsx`, `reports/Index.tsx`.)*

---

## 5. File yang Diubah

1. `resources/js/hooks/use-appearance.tsx` — `getServerSnapshot` dari `'system'` → `'light'`
2. `resources/js/pages/dashboard.tsx` — impor `dashboard` dari `@/routes/tenant` + `Dashboard.layout` sebagai fungsi dengan argumen `tenant`

---

Perbaikan siap untuk di-merge. Apakah Anda ingin saya melanjutkan ke tahap berikutnya (misalnya menjalankan seluruh test suite, atau deployment)?
