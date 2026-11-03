<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Division;
use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

#[Signature('app:sync-divisions {--tenant= : ID tenant tujuan (default: tenant aktif)}')]
#[Description('Sinkronisasi division dari Optigate Portal API per tenant.')]
class SyncDivisions extends Command
{
    /** Divisions requested per page from the Optigate API. */
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

        $tenantId = $this->option('tenant') ?: Tenant::current()?->id;

        if (! $tenantId) {
            $this->error('Tidak ada tenant aktif. Gunakan --tenant=<id> atau aktifkan tenant terlebih dahulu.');

            return Command::FAILURE;
        }

        $tenant = Tenant::query()->find($tenantId);

        if (! $tenant) {
            $this->error("Tenant {$tenantId} tidak ditemukan.");

            return Command::FAILURE;
        }

        if (blank($tenant->optigate_company_id)) {
            $this->error('Tenant tidak memiliki optigate_company_id.');

            return Command::FAILURE;
        }

        $this->info("Memulai sinkronisasi division untuk tenant {$tenant->code}...");

        try {
            $divisions = $this->fetchAllDivisions($url, $token, $tenant->optigate_company_id);
        } catch (Throwable $exception) {
            $this->error('Gagal mengambil data division dari Optigate: '.$exception->getMessage());
            Log::error('Division sync: gagal mengambil data division.', ['exception' => $exception, 'tenant' => $tenant->code]);

            return Command::FAILURE;
        }

        [$created, $updated, $deactivated, $reactivated] = $this->syncDivisions($tenant, $divisions);

        $tenant->update(['last_division_synced_at' => now()]);

        $total = $created + $updated + $deactivated + $reactivated;

        $this->info("Sinkronisasi division selesai! Dibuat: {$created}, diperbarui: {$updated}, dinonaktifkan: {$deactivated}, diaktifkan kembali: {$reactivated}.");

        Log::info('Division sync completed.', [
            'tenant' => $tenant->code,
            'created' => $created,
            'updated' => $updated,
            'deactivated' => $deactivated,
            'reactivated' => $reactivated,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Fetch all divisions for a company with pagination.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function fetchAllDivisions(string $url, string $token, string $companyId): Collection
    {
        $divisions = collect();

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            try {
                $response = Http::withToken($token)
                    ->timeout(10)
                    ->withOptions(['verify' => config('services.optigate_portal.verify')])
                    ->get("{$url}/api/companies/{$companyId}/divisions", [
                        'page' => $page,
                        'per_page' => self::PER_PAGE,
                    ]);

                if (! $response->successful()) {
                    if ($response->status() === 401 || $response->status() === 403) {
                        throw new \RuntimeException("Optigate API returned {$response->status()} for divisions (company {$companyId}).");
                    }

                    throw new \RuntimeException("Optigate API returned {$response->status()} for divisions (company {$companyId}): {$response->body()}");
                }

                $data = $response->json('data') ?? [];
                $meta = $response->json('meta') ?? [];

                foreach ($data as $division) {
                    $divisions->push($division);
                }

                $currentPage = $meta['current_page'] ?? $page;
                $lastPage = $meta['last_page'] ?? $page;

                if ($currentPage >= $lastPage) {
                    break;
                }
            } catch (ConnectionException $exception) {
                usleep(500000 * $page);

                continue;
            }
        }

        return $divisions;
    }

    /**
     * Sync divisions: create, update, deactivate missing, reactivate returning.
     *
     * @return array{int, int, int, int}
     */
    protected function syncDivisions(Tenant $tenant, Collection $divisions): array
    {
        $created = 0;
        $updated = 0;
        $reactivated = 0;
        $syncedIds = [];

        foreach ($divisions as $rawDivision) {
            $division = (array) $rawDivision;

            if (blank($division['id'] ?? null) || blank($division['kode_division'] ?? null) || blank($division['nama_division'] ?? null)) {
                Log::warning('Division sync: skipping incomplete division data.', ['division' => $division]);

                continue;
            }

            $optigateDivisionId = (string) $division['id'];
            $syncedIds[] = $optigateDivisionId;

            $department = null;
            if (! blank($division['department_id'])) {
                $department = Department::withoutGlobalScopes()->where('id_department', $division['department_id'])->first();
            }

            $record = Division::withoutGlobalScopes()
                ->where('optigate_division_id', $optigateDivisionId)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (! $record) {
                $record = new Division;
                $record->optigate_division_id = $optigateDivisionId;
                $record->tenant_id = $tenant->id;
                $wasCreated = true;
                $wasActive = false;
            } else {
                $wasCreated = false;
                $wasActive = (bool) $record->getOriginal('is_active');
            }

            $record->fill([
                'kode_division' => $division['kode_division'],
                'nama_division' => $division['nama_division'],
                'is_active' => $division['is_active'] ?? true,
                'deactivated_at' => ($division['is_active'] ?? true) ? null : now(),
            ]);
            $record->save();

            if ($department) {
                $record->update(['department_id' => $department->id_department]);
            }

            if ($wasCreated) {
                $created++;
            } else {
                $updated++;

                // Reactivate if previously deactivated but now active in portal
                if (! $wasActive && ($division['is_active'] ?? true)) {
                    $record->update(['is_active' => true, 'deactivated_at' => null]);
                    $reactivated++;
                }
            }
        }

        // Deactivate divisions that are no longer in the portal
        $deactivated = Division::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereNotIn('optigate_division_id', $syncedIds)
            ->where('is_active', true)
            ->update(['is_active' => false, 'deactivated_at' => now()]);

        return [$created, $updated, $deactivated, $reactivated];
    }
}
