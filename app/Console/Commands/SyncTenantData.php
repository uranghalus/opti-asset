<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

#[Signature('app:sync-tenant-data {--tenant= : ID atau kode tenant (default: semua tenant)}')]
#[Description('Sinkronisasi data tenant: departments, divisions, positions, employees, lalu resolusi HOD.')]
class SyncTenantData extends Command
{
    /**
     * Child commands are ordered by dependency. Departments run twice: the
     * first pass creates the rows employees need, the final pass resolves HOD
     * after employees exist.
     */
    protected const SYNC_STEPS = [
        ['app:sync-departments', 'departments (create/update)'],
        ['app:sync-divisions', 'divisions'],
        ['app:sync-positions', 'positions'],
        ['app:sync-employees', 'employees'],
        ['app:sync-departments', 'departments (HOD resolution)'],
    ];

    public function handle(): int
    {
        $tenantKey = $this->option('tenant');

        $tenants = Tenant::query()
            ->when($tenantKey, fn ($query, $key) => $query->where(
                fn ($nested) => $nested->where('id', $key)->orWhere('code', $key)
            ))
            ->get();

        if ($tenants->isEmpty()) {
            $this->warn('Tidak ada tenant ditemukan.');

            return self::SUCCESS;
        }

        $errors = [];

        foreach ($tenants as $tenant) {
            $this->info("Memproses tenant {$tenant->code} ({$tenant->name})");

            foreach (self::SYNC_STEPS as [$command, $label]) {
                $exitCode = Artisan::call($command, ['--tenant' => $tenant->id]);

                if ($exitCode !== Command::SUCCESS) {
                    $errors[] = "{$tenant->code}: {$command} ({$label}) gagal dengan exit code {$exitCode}";
                    $this->error("Step {$label} gagal untuk tenant {$tenant->code}");

                    continue;
                }

                $this->comment("Step {$label} selesai untuk tenant {$tenant->code}.");
            }
        }

        if (! empty($errors)) {
            $this->error('Sinkronisasi tenant data selesai dengan '.count($errors).' error:');
            foreach ($errors as $error) {
                $this->error("  - {$error}");
            }

            Log::warning('SyncTenantData completed with errors.', ['errors' => $errors]);

            return self::FAILURE;
        }

        $this->info('Sinkronisasi tenant data selesai untuk '.count($tenants).' tenant.');

        Log::info('SyncTenantData completed.', ['tenant_count' => count($tenants)]);

        return self::SUCCESS;
    }
}
