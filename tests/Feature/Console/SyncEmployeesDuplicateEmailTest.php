<?php

namespace Tests\Feature\Console;

use App\Models\Employee;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncEmployeesDuplicateEmailTest extends TestCase
{
    use RefreshDatabase;

    private function makeCurrentTenant(): Tenant
    {
        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'code' => 'top',
            'name' => 'PT Tata Optima Property',
        ]);
        $tenant->makeCurrent();

        return $tenant;
    }

    private function fakePortal(string $path, array $payload): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            $path => Http::response(['data' => $payload]),
        ]);
    }

    public function test_sync_survives_duplicate_email_inside_payload(): void
    {
        $tenant = $this->makeCurrentTenant();

        $this->fakePortal('https://portal.example/api/users', [
            [
                'id' => 'portal-001',
                'name' => 'Karyawan Satu',
                'email' => 'samarang@example.com',
                'nik' => 'NIK-001',
            ],
            [
                'id' => 'portal-002',
                'name' => 'Karyawan Dua',
                'email' => 'samarang@example.com',
                'nik' => 'NIK-002',
            ],
            [
                'id' => 'portal-003',
                'name' => 'Karyawan Tiga',
                'email' => 'unik@example.com',
                'nik' => 'NIK-003',
            ],
        ]);

        $this->artisan('app:sync-employees')->assertExitCode(0);

        // Record valid tersimpan; record beremail duplikat dilewati, bukan
        // membatalkan seluruh sinkronisasi.
        $this->assertSame(2, Employee::withoutGlobalScopes()->count());
        $this->assertDatabaseHas('tb_employee', ['id_employee' => 'portal-001']);
        $this->assertDatabaseHas('tb_employee', ['id_employee' => 'portal-003']);
        $this->assertDatabaseMissing('tb_employee', ['id_employee' => 'portal-002']);
    }

    public function test_sync_skips_payload_matching_existing_employee_email(): void
    {
        $tenant = $this->makeCurrentTenant();

        Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'sudahada@example.com',
        ]);

        $this->fakePortal('https://portal.example/api/users', [
            [
                'id' => 'portal-baru',
                'name' => 'Karyawan Baru',
                'email' => 'sudahada@example.com',
                'nik' => 'NIK-BARU',
            ],
        ]);

        $this->artisan('app:sync-employees')->assertExitCode(0);

        $this->assertSame(1, Employee::withoutGlobalScopes()->count());
    }
}
