<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\Tenant;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

#[Signature('app:sync-employees')]
#[Description('Auto-sync employees data from Optigate Portal API to local database')]
class SyncEmployees extends Command
{
    public function handle(): void
    {
        $url = config('services.optigate_portal.url').'/api/users';
        $token = config('services.optigate_portal.token');

        $tenantId = Tenant::current()?->id;

        if (! $tenantId) {
            $this->error('Tidak ada tenant aktif. Sinkronisasi dibatalkan.');

            return;
        }

        $this->info("Memulai sinkronisasi employee untuk tenant {$tenantId}...");

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->withOptions(['verify' => config('services.optigate_portal.verify')])
                ->get($url);

            if ($response->successful()) {
                $employees = $response->json('data') ?? $response->json();
                $count = 0;

                foreach ($employees as $employee) {
                    Employee::withoutGlobalScopes()->updateOrCreate(
                        ['id_employee' => $employee['id']],
                        [
                            'tenant_id' => $tenantId,
                            'nik_employee' => $employee['nik'] ?? null,
                            'nama_employee' => $employee['name'],
                            'email' => $employee['email'] ?? null,
                            'number' => $employee['whatsapp_number'] ?? null,
                            'photo_url' => $employee['photo_url'] ?? null,
                            'id_department' => $employee['department'] ?? null,
                            'id_position' => $employee['position'] ?? $employee['position_id'] ?? null,
                            'last_login_ip' => $employee['last_login_ip'] ?? null,
                        ]
                    );
                    $count++;
                }

                $this->info("Sinkronisasi selesai! $count data berhasil diproses.");
                Log::info("Auto-sync Employee berhasil: $count data.");
            } else {
                $errorMsg = 'Gagal mengambil data employee dari API Portal: '.$response->body();
                $this->error($errorMsg);
                Log::error($errorMsg);
            }
        } catch (\Throwable $th) {
            $errorMsg = 'Exception API Employee: '.$th->getMessage();
            $this->error($errorMsg);
            Log::error($errorMsg);
        }
    }
}
