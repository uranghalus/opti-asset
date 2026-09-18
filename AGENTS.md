# AGENTS.md — Opti-Asset (Laravel + Inertia + React)

# Memory Protocol — Vault: Opti-Asset

OpenCode punya akses ke vault Obsidian bernama "Opti-Asset" lewat MCP tool `obsidian`.

## Struktur memori

- `Memory/opencode-memory.md` — ringkasan konteks proyek, keputusan arsitektur, dan preferensi yang berlaku terus-menerus.
- `Memory/logs/YYYY-MM-DD.md` — catatan progres per sesi (opsional, buat kalau relevan).

## Aturan

1. Di awal sesi, sebelum mulai kerja, baca isi "Memory/opencode-memory.md" via tool obsidian (get_file_contents) untuk memahami konteks sebelumnya.
2. Setiap kali ada keputusan penting, konvensi baru, perubahan arsitektur, atau progres signifikan — tambahkan ringkasannya ke "Memory/opencode-memory.md" via append_content atau patch_content.
3. Jangan pernah menyimpan kredensial, API key, token, atau data sensitif lain ke catatan ini.
4. Tulis ringkas dan terstruktur (poin-poin), bukan transkrip percakapan mentah.

## Stack

- **PHP 8.4** / Laravel 13 / Fortify 1 / Inertia v3 / React 19 / Tailwind 4 / Vite 8
- **Wayfinder** generates typed TS route functions → `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/` (gitignored, generated)
- **shadcn/ui** (New York style, `components.json`) — UI components in `resources/js/components/ui/` (gitignored by ESLint/Prettier)
- **React Compiler** enabled via `babel-plugin-react-compiler` in `vite.config.ts`
- **PHPStan** level 7 (larastan), **Pint** (laravel preset), **ESLint** 9 + **Prettier** 3

## Commands

```bash
# Dev server (runs PHP server + queue + Vite concurrently)
composer dev

# CI check order (must run in this order)
npm run lint:check        # ESLint
npm run format:check      # Prettier
npm run types:check       # tsc --noEmit
php artisan test --compact # PHPUnit (in-memory SQLite)

# Single test file
php artisan test --compact tests/Feature/DashboardTest.php

# Single test by name
php artisan test --compact --filter=test_guests_are_redirected

# Format PHP (run after any PHP edit)
vendor/bin/pint --dirty --format agent

# Format TS/React
npm run format

# Lint TS/React (auto-fix)
npm run lint

# Type check
npm run types:check

# Full CI (all checks)
composer ci:check
```

## Architecture

```
app/
├── Actions/Fortify/          # Auth actions (CreateNewUser, ResetUserPassword)
├── Http/Controllers/Settings # ProfileController, SecurityController
├── Models/User.php           # Only model currently
├── Providers/                # AppServiceProvider, FortifyServiceProvider
routes/
├── web.php                   # /, /dashboard (auth+verified)
├── settings.php              # /settings/* routes
resources/js/
├── pages/                    # Inertia page components (welcome, dashboard, auth/, settings/)
├── layouts/                  # app-layout, auth-layout, settings/
├── components/               # Shared React components + ui/ (shadcn)
├── hooks/                    # Custom hooks (use-appearance, use-mobile, etc.)
├── lib/utils.ts              # cn() helper, toUrl()
├── types/                    # TypeScript types (auth, navigation, ui)
├── actions/                  # Wayfinder: controller action types (generated, gitignored)
├── routes/                   # Wayfinder: named route functions (generated, gitignored)
└── wayfinder/                # Wayfinder internals (generated, gitignored)
```

## Key Conventions

- **Inertia pages** live in `resources/js/pages/`. Page name = file path (e.g., `settings/profile` → `SettingsProfile`). Layout is auto-selected in `app.tsx` based on page name prefix.
- **Wayfinder imports**: `import { dashboard } from '@/routes'` for named routes, `import { edit } from '@/actions/Settings/ProfileController'` for controller actions. Never hardcode URLs.
- **Route::inertia()** used for pages with no controller logic (e.g., `welcome`, `appearance`). Use controllers for pages needing data/validation.
- **Tests use in-memory SQLite** (`phpunit.xml`). Factories required for models. `RefreshDatabase` trait used. Base `TestCase` has `skipUnlessFortifyHas()` helper.
- **Fortify features enabled**: registration, password reset, email verification, 2FA, passkeys. Config in `config/fortify.php`.
- **DESIGN.md** defines American Express visual identity — colors, typography, spacing. Reference when building UI.
- **Generated files are gitignored**: `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/`, `resources/js/components/ui/`. Never edit these directly.
- **ESLint ignores**: `resources/js/actions/**`, `resources/js/components/ui/*`, `resources/js/routes/**`, `resources/js/wayfinder/**` — these are generated.
- **Prettier ignores**: `resources/js/components/ui/*`, `resources/views/mail/*`
- **`@/*` path alias** maps to `resources/js/*` (tsconfig + vite).
- **PHP 8 constructor property promotion** required. Curly braces always. Explicit return types.
- **`composer test`** runs config:clear → lint:check → types:check → artisan test (full pipeline).
- **`composer setup`** does install + env + key + migrate + npm install + build.
- **SSR enabled** in `config/inertia.php` (dev server on port 13714). Build SSR with `npm run build:ssr`.

## Gotchas

- If `ViteException: Unable to locate file in Vite manifest` → run `npm run build` or `composer dev`
- Wayfinder types must be regenerated after route/controller changes: `php artisan wayfinder:generate --with-form` (the `--with-form` flag is required to match `formVariants: true` in `vite.config.ts`; without it generated routes lose `.form` variants and auth components break in `tsc`)
- `resources/js/components/ui/*` are shadcn-generated — don't manually edit, use `npx shadcn@latest add [component]`
- Tests enforce SQLite in-memory — no external DB needed for test suite
- `bootstrap/ssr/` is gitignored — SSR bundle is regenerated on build
- React Compiler is active — avoid patterns that conflict with automatic memoization

===

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

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
