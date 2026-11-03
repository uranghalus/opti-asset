<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Division;
use App\Models\Position;
use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

#[Signature('app:sync-positions {--tenant= : ID tenant tujuan (default: tenant aktif)}')]
#[Description('Sinkronisasi position dari Optigate Portal API per tenant.')]
class SyncPositions extends Command
{
    /** Positions requested per page from the Optigate API. */
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

        $this->info("Memulai sinkronisasi position untuk tenant {$tenant->code}...");

        try {
            $positions = $this->fetchAllPositions($url, $token, $tenant->optigate_company_id);
        } catch (Throwable $exception) {
            $this->error('Gagal mengambil data position dari Optigate: '.$exception->getMessage());
            Log::error('Position sync: gagal mengambil data position.', ['exception' => $exception, 'tenant' => $tenant->code]);

            return Command::FAILURE;
        }

        [$created, $updated, $deactivated, $reactivated] = $this->syncPositions($tenant, $positions);

        $tenant->update(['last_position_synced_at' => now()]);

        $total = $created + $updated + $deactivated + $reactivated;

        $this->info("Sinkronisasi position selesai! Dibuat: {$created}, diperbarui: {$updated}, dinonaktifkan: {$deactivated}, diaktifkan kembali: {$reactivated}.");

        Log::info('Position sync completed.', [
            'tenant' => $tenant->code,
            'created' => $created,
            'updated' => $updated,
            'deactivated' => $deactivated,
            'reactivated' => $reactivated,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Fetch all positions for a company with pagination.
     *
     * @return Collection<int, array<string, mixed>>
     */
    protected function fetchAllPositions(string $url, string $token, string $companyId): Collection
    {
        $positions = collect();

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            try {
                $response = Http::withToken($token)
                    ->timeout(10)
                    ->withOptions(['verify' => config('services.optigate_portal.verify')])
                    ->get("{$url}/api/companies/{$companyId}/positions", [
                        'page' => $page,
                        'per_page' => self::PER_PAGE,
                    ]);

                if (! $response->successful()) {
                    if ($response->status() === 401 || $response->status() === 403) {
                        throw new \RuntimeException("Optigate API returned {$response->status()} for positions (company {$companyId}).");
                    }

                    throw new \RuntimeException("Optigate API returned {$response->status()} for positions (company {$companyId}): {$response->body()}");
                }

                $data = $response->json('data') ?? [];
                $meta = $response->json('meta') ?? [];

                foreach ($data as $position) {
                    $positions->push($position);
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

        return $positions;
    }

    /**
     * Sync positions: create, update, deactivate missing, reactivate returning.
     *
     * @return array{int, int, int, int}
     */
    protected function syncPositions(Tenant $tenant, Collection $positions): array
    {
        $created = 0;
        $updated = 0;
        $reactivated = 0;
        $syncedIds = [];

        foreach ($positions as $rawPosition) {
            $position = (array) $rawPosition;

            if (blank($position['id'] ?? null) || blank($position['kode_position'] ?? null) || blank($position['nama_position'] ?? null)) {
                Log::warning('Position sync: skipping incomplete position data.', ['position' => $position]);

                continue;
            }

            $optigatePositionId = (string) $position['id'];
            $syncedIds[] = $optigatePositionId;

            $department = null;
            if (! blank($position['department_id'])) {
                $department = Department::withoutGlobalScopes()->where('id_department', $position['department_id'])->first();
            }

            $division = null;
            if (! blank($position['division_id'])) {
                $division = Division::withoutGlobalScopes()->where('optigate_division_id', $position['division_id'])->where('tenant_id', $tenant->id)->first();
            }

            $record = Position::withoutGlobalScopes()
                ->where('optigate_position_id', $optigatePositionId)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (! $record) {
                $record = new Position;
                $record->optigate_position_id = $optigatePositionId;
                $record->tenant_id = $tenant->id;
                $wasCreated = true;
                $wasActive = false;
            } else {
                $wasCreated = false;
                $wasActive = (bool) $record->getOriginal('is_active');
            }

            $record->fill([
                'department_id' => $department?->id_department,
                'division_id' => $division?->id_division,
                'kode_position' => $position['kode_position'],
                'nama_position' => $position['nama_position'],
                'is_active' => $position['is_active'] ?? true,
                'deactivated_at' => ($position['is_active'] ?? true) ? null : now(),
            ]);
            $record->save();

            if ($wasCreated) {
                $created++;
            } else {
                $updated++;

                // Reactivate if previously deactivated but now active in portal
                if (! $wasActive && ($position['is_active'] ?? true)) {
                    $record->update(['is_active' => true, 'deactivated_at' => null]);
                    $reactivated++;
                }
            }
        }

        // Deactivate positions that are no longer in the portal
        $deactivated = Position::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereNotIn('optigate_position_id', $syncedIds)
            ->where('is_active', true)
            ->update(['is_active' => false, 'deactivated_at' => now()]);

        return [$created, $updated, $deactivated, $reactivated];
    }
}
