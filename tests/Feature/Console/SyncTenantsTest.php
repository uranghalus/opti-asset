<?php

namespace Tests\Feature\Console;

use App\Console\Commands\SyncTenants;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Tests\TestCase;

class SyncTenantsTest extends TestCase
{
    use RefreshDatabase;

    private function runSync(): int
    {
        $command = app(SyncTenants::class);
        $command->setOutput(new OutputStyle(
            new ArrayInput([]),
            new BufferedOutput
        ));

        return $command->handle();
    }

    public function test_sync_fails_without_portal_configuration(): void
    {
        config([
            'services.optigate_portal.url' => null,
            'services.optigate_portal.token' => null,
        ]);

        $this->assertSame(Command::FAILURE, $this->runSync());

        $this->assertDatabaseCount('tenants', 0);
    }

    public function test_sync_creates_tenants_from_single_page_response(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [
                    ['id' => 1, 'code' => 'TOP', 'name' => 'PT Tata Optima Property'],
                    ['id' => 2, 'code' => 'SUB', 'name' => 'PT Subsidi Abadi'],
                ],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 2,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        $this->assertDatabaseCount('tenants', 2);

        $top = Tenant::where('optigate_company_id', '1')->first();
        $this->assertNotNull($top);
        $this->assertSame('TOP', $top->code);
        $this->assertSame('PT Tata Optima Property', $top->name);
        $this->assertTrue($top->is_active);
        $this->assertNull($top->deactivated_at);

        $sub = Tenant::where('optigate_company_id', '2')->first();
        $this->assertNotNull($sub);
        $this->assertSame('SUB', $sub->code);
    }

    public function test_sync_updates_existing_tenants(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $existing = Tenant::create([
            'id' => 'existing-1',
            'optigate_company_id' => '1',
            'code' => 'old-code',
            'name' => 'Old Name',
            'is_active' => true,
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [
                    ['id' => 1, 'code' => 'TOP', 'name' => 'PT Tata Optima Property'],
                ],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 1,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        $existing->refresh();
        $this->assertSame('TOP', $existing->code);
        $this->assertSame('PT Tata Optima Property', $existing->name);
        $this->assertTrue($existing->is_active);
        $this->assertSame(1, Tenant::count());
    }

    public function test_sync_paginates_through_all_pages(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $callCount = 0;
        Http::fake(function ($request) use (&$callCount) {
            $callCount++;

            if ($callCount === 1) {
                return Http::response([
                    'data' => [
                        ['id' => 1, 'code' => 'TOP', 'name' => 'PT Tata Optima Property'],
                        ['id' => 2, 'code' => 'SUB', 'name' => 'PT Subsidi Abadi'],
                    ],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 2,
                        'total' => 3,
                    ],
                ]);
            }

            if ($callCount === 2) {
                return Http::response([
                    'data' => [
                        ['id' => 3, 'code' => 'CAB', 'name' => 'PT Cabang Sejahtera'],
                    ],
                    'meta' => [
                        'current_page' => 2,
                        'last_page' => 2,
                        'total' => 3,
                    ],
                ]);
            }

            return Http::response([
                'data' => [],
                'meta' => [
                    'current_page' => $callCount,
                    'last_page' => $callCount,
                    'total' => 3,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        $this->assertDatabaseCount('tenants', 3);
        $this->assertNotNull(Tenant::where('optigate_company_id', '1')->first());
        $this->assertNotNull(Tenant::where('optigate_company_id', '2')->first());
        $this->assertNotNull(Tenant::where('optigate_company_id', '3')->first());
    }

    public function test_sync_deactivates_tenants_missing_from_api(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $existing = Tenant::create([
            'id' => 'tenant-missing',
            'optigate_company_id' => '99',
            'code' => 'missing',
            'name' => 'Missing Corp',
            'is_active' => true,
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        $existing->refresh();
        $this->assertFalse($existing->is_active);
        $this->assertNotNull($existing->deactivated_at);
    }

    public function test_sync_reactivates_returning_tenants(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Tenant::create([
            'id' => 'tenant-returning',
            'optigate_company_id' => '5',
            'code' => 'returning',
            'name' => 'Returning Corp',
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [
                    ['id' => 5, 'code' => 'RET', 'name' => 'Returning Corp'],
                ],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 1,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        $tenant = Tenant::where('optigate_company_id', '5')->first();
        $this->assertNotNull($tenant);
        $this->assertTrue($tenant->is_active);
        $this->assertNull($tenant->deactivated_at);
    }

    public function test_sync_skips_companies_missing_id_or_name(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [
                    ['id' => 1, 'code' => 'VALID', 'name' => 'Valid Company'],
                    ['code' => 'NO-ID', 'name' => 'Company Without ID'],
                    ['id' => 2, 'name' => 'Company Without Code'],
                    ['id' => 3, 'code' => '', 'name' => 'Company With Empty Code'],
                ],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 4,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        // Only the valid company should be synced
        $this->assertDatabaseCount('tenants', 1);
        $this->assertNotNull(Tenant::where('optigate_company_id', '1')->first());
    }

    public function test_sync_respects_max_pages_cap(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $fetchCount = 0;
        Http::fake(function ($request) use (&$fetchCount) {
            $fetchCount++;

            return Http::response([
                'data' => [
                    ['id' => 1, 'code' => 'TOP', 'name' => 'PT Tata Optima Property'],
                ],
                'meta' => [
                    'current_page' => $fetchCount,
                    'last_page' => 999,
                    'total' => 99900,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runSync());

        // Should stop at MAX_PAGES (100), not loop forever
        $this->assertLessThanOrEqual(100, $fetchCount);
        $this->assertDatabaseCount('tenants', 1);
    }
}
