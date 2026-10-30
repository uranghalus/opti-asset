<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

#[Signature('app:sync-tenants')]
#[Description('Sinkronisasi tenant dari Optigate Portal API: buat, perbarui, nonaktifkan yang hilang, aktifkan kembali yang muncul lagi.')]
class SyncTenants extends Command
{
    /** Companies requested per page from the Optigate API. */
    protected const PER_PAGE = 100;

    /** Hard cap on pages, so a broken meta.total can never loop forever. */
    protected const MAX_PAGES = 100;

    public function handle(): int
    {
        $url = config('services.optigate_portal.url');
        $token = config('services.optigate_portal.token');

        if (blank($url) || blank($token)) {
            $this->error('Konfigurasi portal belum diatur. Tambahkan WEB_PORTAL_URL dan WEB_PORTAL_TOKEN di file .env.');

            return Command::FAILURE;
        }

        try {
            $companies = $this->fetchAllCompanies($url, $token);
        } catch (Throwable $exception) {
            $this->error('Gagal mengambil data perusahaan dari Optigate: '.$exception->getMessage());
            Log::error('Optigate tenant sync: gagal mengambil data company.', ['exception' => $exception]);

            return Command::FAILURE;
        }

        [$created, $updated, $deactivated, $reactivated] = $this->syncCompanies($companies);

        $total = $created + $updated + $deactivated + $reactivated;

        $this->info("Sinkronisasi selesai! {$total} data tenant berhasil diproses.");
        $this->line("  Dibuat:   {$created}");
        $this->line("  Diperbarui: {$updated}");
        $this->line("  Dinonaktifkan: {$deactivated}");
        $this->line("  Diaktifkan kembali: {$reactivated}");

        Log::info('Optigate tenant sync: selesai.', [
            'created' => $created,
            'updated' => $updated,
            'deactivated' => $deactivated,
            'reactivated' => $reactivated,
            'total' => $total,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Fetch all companies from the Optigate API, paginating up to MAX_PAGES.
     *
     * @return array<int, array<string, mixed>>
     */
    private function fetchAllCompanies(string $url, string $token): array
    {
        $companies = [];
        $page = 1;

        while ($page <= static::MAX_PAGES) {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get($url.'/api/companies', [
                    'per_page' => static::PER_PAGE,
                    'page' => $page,
                ]);

            if (! $response->successful()) {
                throw new RequestException($response);
            }

            $pageData = $response->json('data') ?? [];

            foreach ($pageData as $company) {
                if (! $this->isValidCompany($company)) {
                    Log::warning('Optigate tenant sync: melewati company yang tidak valid.', [
                        'company' => $company,
                    ]);

                    continue;
                }

                $companies[] = $company;
            }

            $meta = $response->json('meta') ?? [];
            $currentPage = (int) ($meta['current_page'] ?? $page);
            $lastPage = (int) ($meta['last_page'] ?? $currentPage);

            if ($currentPage >= $lastPage) {
                break;
            }

            $page++;
        }

        if ($page > static::MAX_PAGES) {
            Log::warning('Optigate tenant sync: mencapai batas MAX_PAGES, sinkronisasi dihentikan.', [
                'max_pages' => static::MAX_PAGES,
            ]);
        }

        return $companies;
    }

    /**
     * Validate that a company has the minimum required fields.
     *
     * id, name, and code are all required: id links to Optigate, name is the
     * tenant display name, code is the URL slug identifier.
     *
     * @param  array<string, mixed>  $company
     */
    private function isValidCompany(array $company): bool
    {
        return ! blank($company['id'] ?? null)
            && ! blank($company['name'] ?? null)
            && ! blank($company['code'] ?? null);
    }

    /**
     * Sync companies against the local tenants table.
     *
     * Creates new tenants, updates existing ones, deactivates tenants missing
     * from the API, and reactivates tenants that returned to the API.
     *
     * @param  array<int, array<string, mixed>>  $companies
     * @return array{0: int, 1: int, 2: int, 3: int} [created, updated, deactivated, reactivated]
     */
    private function syncCompanies(array $companies): array
    {
        $syncedIds = [];
        $created = 0;
        $updated = 0;

        foreach ($companies as $company) {
            $existing = Tenant::where('optigate_company_id', $company['id'])->first();

            $defaults = [
                'code' => $company['code'] ?? Str::slug($company['name']),
                'name' => $company['name'],
                'is_active' => true,
                'deactivated_at' => null,
            ];

            if (! $existing) {
                Tenant::create(array_merge([
                    'id' => (string) Str::ulid(),
                    'optigate_company_id' => (string) $company['id'],
                ], $defaults));
                $created++;
                $syncedIds[] = (string) $company['id'];

                continue;
            }

            $existing->update($defaults);
            $updated++;
            $syncedIds[] = (string) $company['id'];
        }

        $deactivated = $this->deactivateMissingTenants($syncedIds);
        $reactivated = $this->reactivateReturningTenants($syncedIds);

        return [$created, $updated, $deactivated, $reactivated];
    }

    /**
     * Deactivate tenants that exist locally but are missing from the API sync.
     *
     * @param  list<string>  $syncedIds
     * @return int Number of tenants deactivated
     */
    private function deactivateMissingTenants(array $syncedIds): int
    {
        $deactivated = Tenant::where('is_active', true)
            ->whereNotIn('optigate_company_id', $syncedIds)
            ->update([
                'is_active' => false,
                'deactivated_at' => now(),
            ]);

        Log::info('Optigate tenant sync: nonaktifkan tenant yang hilang dari API.', [
            'deactivated' => (int) $deactivated,
        ]);

        return (int) $deactivated;
    }

    /**
     * Reactivate tenants that returned to the API after being deactivated.
     *
     * @param  list<string>  $syncedIds
     * @return int Number of tenants reactivated
     */
    private function reactivateReturningTenants(array $syncedIds): int
    {
        $reactivated = Tenant::where('is_active', false)
            ->whereIn('optigate_company_id', $syncedIds)
            ->update([
                'is_active' => true,
                'deactivated_at' => null,
            ]);

        Log::info('Optigate tenant sync: aktifkan kembali tenant yang muncul lagi.', [
            'reactivated' => (int) $reactivated,
        ]);

        return (int) $reactivated;
    }
}
