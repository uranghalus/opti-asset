<?php

namespace Tests\Feature\Console;

use App\Console\Commands\SyncDivisions;
use App\Models\Division;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use ReflectionMethod;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\BufferedOutput;
use Tests\TestCase;

class SyncDivisionsTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'code' => 't1',
            'name' => 'Tenant One',
            'optigate_company_id' => 'c1',
        ]);
    }

    private function runCommand(?string $tenantKey = null): int
    {
        $command = app(SyncDivisions::class);
        $definition = new InputDefinition([
            new InputOption('tenant', null, InputOption::VALUE_REQUIRED, 'ID tenant tujuan'),
        ]);
        $input = new ArrayInput(
            $tenantKey !== null ? ['--tenant' => $tenantKey] : [],
            $definition
        );
        $command->setInput($input);
        $command->setOutput(new OutputStyle($input, new BufferedOutput));

        return $command->handle();
    }

    public function test_sync_fails_without_portal_configuration(): void
    {
        config([
            'services.optigate_portal.url' => null,
            'services.optigate_portal.token' => null,
        ]);

        $this->assertSame(Command::FAILURE, $this->runCommand($this->tenant->id));
    }

    public function test_sync_creates_divisions_from_api_response(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [
                    [
                        'id' => 101,
                        'kode_division' => 'DIV-01',
                        'nama_division' => 'Division Satu',
                        'department_id' => null,
                        'is_active' => true,
                    ],
                    [
                        'id' => 102,
                        'kode_division' => 'DIV-02',
                        'nama_division' => 'Division Dua',
                        'department_id' => null,
                        'is_active' => true,
                    ],
                ],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runCommand($this->tenant->id));

        $this->assertDatabaseCount('tb_division', 2);
        $this->assertDatabaseHas('tb_division', [
            'optigate_division_id' => '101',
            'tenant_id' => $this->tenant->id,
            'kode_division' => 'DIV-01',
            'nama_division' => 'Division Satu',
            'is_active' => true,
        ]);
    }

    public function test_sync_divisions_method_creates_records_directly(): void
    {
        $command = app(SyncDivisions::class);
        $divisions = collect([
            [
                'id' => 201,
                'kode_division' => 'DIV-A',
                'nama_division' => 'Division A',
                'department_id' => null,
                'is_active' => true,
            ],
            [
                'id' => 202,
                'kode_division' => 'DIV-B',
                'nama_division' => 'Division B',
                'department_id' => null,
                'is_active' => true,
            ],
        ]);

        $method = new ReflectionMethod($command, 'syncDivisions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $divisions);

        $this->assertSame(2, $created);
        $this->assertSame(0, $updated);
        $this->assertSame(0, $deactivated);
        $this->assertSame(0, $reactivated);
        $this->assertDatabaseCount('tb_division', 2);
        $this->assertDatabaseHas('tb_division', [
            'optigate_division_id' => '201',
            'tenant_id' => $this->tenant->id,
            'kode_division' => 'DIV-A',
        ]);
    }

    public function test_sync_divisions_method_reactivates_returning_divisions(): void
    {
        $existing = Division::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_division_id' => '301',
            'kode_division' => 'OLD',
            'nama_division' => 'Old Division',
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        $command = app(SyncDivisions::class);
        $divisions = collect([
            [
                'id' => 301,
                'kode_division' => 'REACTIVATED',
                'nama_division' => 'Reactivated Division',
                'department_id' => null,
                'is_active' => true,
            ],
        ]);

        $method = new ReflectionMethod($command, 'syncDivisions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $divisions);

        $this->assertSame(0, $created);
        $this->assertSame(1, $updated);
        $this->assertSame(0, $deactivated);
        $this->assertSame(1, $reactivated);

        $existing->refresh();
        $this->assertTrue((bool) $existing->is_active);
        $this->assertNull($existing->deactivated_at);
        $this->assertDatabaseHas('tb_division', [
            'optigate_division_id' => '301',
            'nama_division' => 'Reactivated Division',
        ]);
    }

    public function test_sync_divisions_method_deactivates_missing_divisions(): void
    {
        $oldDivision = Division::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_division_id' => '400',
            'kode_division' => 'GONE',
            'nama_division' => 'Gone Division',
            'is_active' => true,
        ]);

        $command = app(SyncDivisions::class);
        $divisions = collect([]);

        $method = new ReflectionMethod($command, 'syncDivisions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $divisions);

        $this->assertSame(0, $created);
        $this->assertSame(0, $updated);
        $this->assertSame(1, $deactivated);
        $this->assertSame(0, $reactivated);

        $this->assertDatabaseHas('tb_division', [
            'optigate_division_id' => '400',
            'is_active' => false,
        ]);
        $this->assertNotNull($oldDivision->refresh()->deactivated_at);
    }

    public function test_sync_deactivates_divisions_no_longer_in_portal(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $oldDivision = Division::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_division_id' => '999',
            'kode_division' => 'OLD',
            'nama_division' => 'Old Division',
            'is_active' => true,
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runCommand($this->tenant->id));

        $this->assertDatabaseHas('tb_division', [
            'optigate_division_id' => '999',
            'is_active' => false,
        ]);
        $this->assertNotNull($oldDivision->refresh()->deactivated_at);
    }

    public function test_sync_updates_last_division_synced_at_on_tenant(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake(function ($request) {
            return Http::response([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ]);
        });

        $this->assertSame(Command::SUCCESS, $this->runCommand($this->tenant->id));

        $this->tenant->refresh();
        $this->assertNotNull($this->tenant->last_division_synced_at);
    }
}
