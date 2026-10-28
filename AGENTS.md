# AGENTS.md — Konfigurasi Project & Memory

## Identitas Project

- **Nama:** opti-asset (folder/slug: `opti-asset`)
- **Memory:** SecondBrain (vault Obsidian) + Supermemory (plugin `opencode-supermemory`). Keduanya WAJIB selalu sinkron.

---

## Aturan Utama

1. **JANGAN berasumsi.** Kalau ada yang tidak jelas (kebutuhan, scope, gaya kode, nama, lokasi file), TANYA user dulu sebelum mengerjakan.
2. **Wajib baca memory sebelum mengerjakan APA PUN** (lihat bagian _Protokol Setiap Pekerjaan_). Jangan mengandalkan ingatan sesi — baca dari Supermemory dan vault.
3. **Gaya coding dan struktur kode user TIDAK boleh berubah-ubah.** Ikuti `Patterns/` di vault dan memory bertipe `preference` / `learned-pattern` di Supermemory. Jangan memperkenalkan gaya, struktur folder, atau penamaan baru tanpa persetujuan user.
4. **Vault dan Supermemory harus sama.** Setiap catatan yang ditulis ke salah satunya wajib ditulis juga ke yang lain pada sesi yang sama.
5. **Jangan pernah menyimpan** `.env`, kredensial, API key, token, atau data pribadi ke vault maupun Supermemory. Konten di dalam `<private>...</private>` tidak disimpan.

---

## Supermemory (opencode-supermemory)

### Konfigurasi

Plugin terdaftar di config OpenCode (`opencode.jsonc`):

```jsonc
{
    "plugin": ["opencode-supermemory"],
}
```

Container tag project dikunci ke `opti-asset` lewat `supermemory.jsonc` (agar memory sama di semua mesin dan tidak berubah mengikuti hash path/remote):

```jsonc
{
    "projectContainerTag": "opti-asset",
}
```

Cek koneksi kapan saja: `bunx opencode-supermemory@latest status`. Log: `~/.opencode-supermemory.log`.

### Tool `supermemory`

| Mode      | Args                         | Fungsi            |
| --------- | ---------------------------- | ----------------- |
| `add`     | `content`, `type?`, `scope?` | Simpan memory     |
| `search`  | `query`, `scope?`            | Cari memory       |
| `profile` | `query?`                     | Lihat profil user |
| `list`    | `scope?`, `limit?`           | Daftar memory     |
| `forget`  | `memoryId`, `scope?`         | Hapus memory      |

- **Scope:** `project` (default) dan `user`.
- **Type:** `project-config`, `architecture`, `error-solution`, `preference`, `learned-pattern`, `conversation`.
- `forget` hanya boleh dipakai atas permintaan eksplisit user.

### Pemetaan vault → type Supermemory

| Folder vault    | Type Supermemory                                         |
| --------------- | -------------------------------------------------------- |
| `Context/`      | `project-config`                                         |
| `Architecture/` | `architecture`                                           |
| `Decisions/`    | `architecture`                                           |
| `Patterns/`     | `learned-pattern`; gaya/preferensi coding → `preference` |
| `Mistakes/`     | `error-solution`                                         |
| `Planning/`     | `project-config`                                         |
| `Sessions/`     | `conversation` (ringkasan sesi saja, bukan log mentah)   |

---

## Protokol Setiap Pekerjaan (WAJIB)

### Sebelum mengerjakan

1. `supermemory` mode `profile` — baca profil dan preferensi user.
2. `supermemory` mode `search` (scope `project`) dengan kata kunci sesuai tugas. Lakukan lebih dari satu pencarian bila tugas menyentuh beberapa area.
3. Baca vault: `Context/`, `Decisions/`, `Patterns/`, `Planning/`, dan `Architecture/` / `Mistakes/` yang relevan.
4. Cek issue/PRD yang sedang berjalan bila ada.
5. Jika isi Supermemory dan vault **bertentangan** atau salah satunya kosong untuk hal yang seharusnya ada, **laporkan ke user dan tanya** — jangan memilih sendiri.

### Selama mengerjakan

- Ikuti `Patterns/` dan memory `preference` / `learned-pattern`. Baca kode di sekitar sebelum menulis kode baru.
- Jika menemukan pola/gaya yang belum tercatat, tanya user lalu catat (vault + Supermemory).

### Setelah mengerjakan

1. Tulis log sesi di vault (lihat _Development Log_).
2. Untuk hal signifikan (keputusan, pola baru, bug + solusinya, perubahan arsitektur, preferensi gaya coding): tulis/update catatan di folder vault yang sesuai, **lalu** `supermemory add` dengan isi yang sama dan `type` sesuai tabel pemetaan. Sertakan path catatan vault di `content`.
3. Verifikasi sinkron: `supermemory search` isi yang baru disimpan harus ketemu, dan file vault-nya ada. Jika salah satu gagal, beri tahu user.
4. Jika tool `supermemory` tidak tersedia atau error, beri tahu user dan tanya cara melanjutkan — jangan diam-diam lanjut hanya dengan vault.

---

## SecondBrain (Vault Obsidian)

Simpan seluruh catatan penting project ini di path berikut. **JANGAN tanya ulang lokasi vault di tiap sesi baru.**

```text
C:\Users\Administrator\OneDrive\SecondBrain\01 Projects\opti-asset
├── Context\       ← konteks project: stack, konvensi, constraint, glossary
├── Decisions\     ← keputusan teknis + alasannya
├── Patterns\      ← pola/konvensi kode yang berulang (gaya coding user)
├── Mistakes\      ← histori bug/kesalahan dan solusinya
├── Sessions\      ← development log tiap sesi kerja
├── Planning\      ← rencana ke depan: apa yang mau dikerjakan selanjutnya
└── Architecture\  ← dokumentasi arsitektur & desain sistem
```

Buat folder yang belum ada secara otomatis saat pertama kali dibutuhkan.

> Catatan: aturan "Documentation Files" di bagian Laravel Boost (di bawah) berlaku untuk dokumentasi di dalam repo. Catatan di vault Obsidian dan memory Supermemory dikecualikan, karena memang diwajibkan oleh file ini. `record-rule` tetap dipakai untuk aturan tim di `.ai/rules`; vault/Supermemory tidak menggantikannya.

### Kapan pakai folder yang mana

- **Context/** — fakta dasar project yang jarang berubah: stack, constraint, glossary.
- **Decisions/** — keputusan teknis ("kenapa X bukan Y") + alasannya.
- **Patterns/** — konvensi kode berulang: penamaan, struktur controller/komponen, gaya penulisan.
- **Mistakes/** — bug/kesalahan yang pernah terjadi dan cara menghindarinya.
- **Sessions/** — log tiap sesi kerja.
- **Planning/** — hal yang MASIH AKAN dikerjakan. Tandai/pindahkan ke Sessions/ begitu selesai.
- **Architecture/** — desain sistem: struktur folder, alur data/request, diagram (boleh Mermaid), dependency antar modul.

### Cek duplikat sebelum membuat catatan

Sebelum bikin file baru di folder manapun (kecuali Sessions/), cari dulu catatan dengan topik serupa — di vault **dan** di Supermemory:

- Ada yang serupa → update catatan itu, jangan bikin file baru.
- Cukup beda untuk dipisah → buat baru, hubungkan `[[wikilink]]` ke yang lama.
- Ragu → tanya user dulu.

### Konvensi penamaan file

- Format: `kebab-case-huruf-kecil.md` (contoh: `fix-qr-scan-bug.md`), kecuali Sessions/ yang pakai format tanggal.
- Hindari nama generik (`catatan.md`, `note1.md`).

### Development Log

Pola: **bulan → tanggal → file per waktu kejadian**.

```text
Sessions/
├── 2026-10/
│   ├── 03/
│   │   ├── 1120-setup-xxx.md
│   │   └── ...
│   └── changelog.md   ← ringkasan seluruh sesi BULAN INI
```

- Satu file per sesi di `Sessions/YYYY-MM/DD/`, nama `HHmm-topik-singkat.md`, jam WITA (UTC+8).
- Isi: jam, apa yang dilakukan, folder/file yang diubah lengkap.
- `changelog.md` per bulan, struktur:

```markdown
## Ringkasan

- (diisi saat rollup bulanan: 3-5 poin highlight)

## Log

- 03, 11:20 — Setup xxx → [[Sessions/2026-10/03/1120-setup-xxx]]
```

- Tiap sesi baru: tambahkan SATU baris di paling atas `## Log` (terbaru di atas).
- Rollup bulanan: setiap awal bulan / saat diminta "rapikan log bulan lalu", ringkas `## Log` jadi 3-5 poin di `## Ringkasan`. File detail TIDAK dihapus.
- Item Planning/ yang selesai: tandai selesai dan sebutkan di changelog sesi.

### Relasi Sessions → Decisions

Sessions/ = log mentah. Decisions/ = rangkuman KEPUTUSAN/HASIL. Setelah menyelesaikan hal signifikan (bukan fix kecil harian):

1. Buat/update catatan di Decisions/ — APA yang diputuskan dan MENGAPA.
2. Tambahkan `[[wikilink]]` ke Sessions sumber.
3. Di Sessions terkait, tambahkan bagian `Terkait:` yang menyebut balik Decisions-nya.
4. Sinkronkan ke Supermemory (lihat _Protokol Setiap Pekerjaan_).

### Memory Linking (Obsidian wikilink)

Format: `[[folder/nama-tanpa-md]]` (tanpa `.md`).

- Setiap file vault baru wajib di header: link balik `[[Index]]` dan minimal satu link ke file terkait.
- Setiap sesi selesai, update `Index.md`: tambah baris link + ubah `Last updated`.
- Setiap session log wajib punya bagian `Terkait:`.
- Jangan biarkan file yatim (tanpa link masuk/keluar).

### Format Frontmatter

Tag diisi otomatis oleh AI sesuai isi catatan.

```yaml
---
created: <tanggal>
tags: [<tag relevan>]
status: <active|done|archived>
---
```

---

## Di Awal Sesi Baru

1. Jalankan _Protokol Setiap Pekerjaan → Sebelum mengerjakan_ (Supermemory `profile` + `search`).
2. Baca `Context/`, `Decisions/`, `Patterns/`, `Planning/` di vault.
3. Bandingkan hasilnya; laporkan jika ada yang tidak sinkron.

---

## Coding Philosophy

- Baca kode yang ada sebelum menulis kode baru; ikuti pola project.
- Perubahan minimal: hanya yang diminta. Jangan refactor di luar scope.
- Perbaiki akar masalah, bukan gejalanya.

## Safety

- Konfirmasi dulu sebelum: `git push --force`, `rm -rf`, `DROP TABLE`, hapus branch.
- Jangan pernah commit: `.env`, file kredensial, API key, secrets.
- Jangan bypass `--no-verify` atau force tanpa izin eksplisit.
- Jangan pernah force-push ke branch `main`/`master`.

---

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/socialite (SOCIALITE) - v5
- laravel/wayfinder (WAYFINDER) - v0
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Follow existing application Enum naming conventions.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `php artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should cover all happy paths, failure paths, and edge cases.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files; these are core to the application.

## Running Tests

- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `php artisan test --compact`.
- To run all tests in a file: `php artisan test --compact tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --compact --filter=testName` (recommended after making a change to a related file).

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>

<!-- context7 -->

Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g. routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs

<!-- context7 -->
