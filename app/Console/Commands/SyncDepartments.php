<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

#[Signature('app:sync-departments')]
#[Description('Auto-sync departments data from Optigate Portal API to local database')]
class SyncDepartments extends Command
{
    public function handle(): void
    {
        $url = config('services.optigate_portal.url').'/api/departments';
        $token = config('services.optigate_portal.token');

        $tenantId = Tenant::current()?->id;

        if (! $tenantId) {
            $this->error('Tidak ada tenant aktif. Sinkronisasi dibatalkan.');

            return;
        }

        $this->info("Memulai sinkronisasi department untuk tenant {$tenantId}...");

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->withOptions(['verify' => config('services.optigate_portal.verify')])
                ->get($url);

            if ($response->successful()) {
                $departments = $response->json('data') ?? $response->json();
                $count = 0;

                foreach ($departments as $dept) {
                    // Gunakan updateOrCreate untuk mencegah duplikasi data
                    Department::withoutGlobalScopes()->updateOrCreate(
                        ['id_department' => $dept['id']],
                        [
                            'tenant_id' => $tenantId,
                            'nama_department' => $dept['name'],
                            'kode_department' => $dept['code'] ?? null,
                            'hod_user_id' => $dept['hod_user_id'] ?? null,
                            'manager_user_id' => $dept['manager_user_id'] ?? null,
                        ]
                    );
                    $count++;
                }

                $this->info("Sinkronisasi selesai! $count data berhasil diproses.");
                Log::info("Auto-sync Department berhasil: $count data.");
            } else {
                $errorMsg = 'Gagal mengambil data department dari API Portal: '.$response->body();
                $this->error($errorMsg);
                Log::error($errorMsg);
            }
        } catch (\Throwable $th) {
            $errorMsg = 'Exception API Department: '.$th->getMessage();
            $this->error($errorMsg);
            Log::error($errorMsg);
        }
    }
}
