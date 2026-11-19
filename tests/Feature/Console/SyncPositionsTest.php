<?php

namespace Tests\Feature\Console;

use App\Console\Commands\SyncPositions;
use App\Models\Department;
use App\Models\Division;
use App\Models\Position;
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

class SyncPositionsTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected Department $department;

    protected Division $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'code' => 't1',
            'name' => 'Tenant One',
            'optigate_company_id' => 'c1',
        ]);

        $this->department = Department::factory()->create([
            'tenant_id' => $this->tenant->id,
            'id_department' => 'dept-100',
            'kode_department' => 'DEPT',
            'nama_department' => 'Test Department',
        ]);

        $this->division = Division::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_division_id' => 'div-200',
            'kode_division' => 'DIV',
            'nama_division' => 'Test Division',
        ]);
    }

    private function runCommand(?string $tenantKey = null): int
    {
        $command = app(SyncPositions::class);
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

    public function test_sync_positions_method_creates_records_directly(): void
    {
        $command = app(SyncPositions::class);
        $positions = collect([
            [
                'id' => 301,
                'kode_position' => 'POS-01',
                'nama_position' => 'Position Satu',
                'department_id' => 'dept-100',
                'division_id' => 'div-200',
                'is_active' => true,
            ],
        ]);

        $method = new ReflectionMethod($command, 'syncPositions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $positions);

        $this->assertSame(1, $created);
        $this->assertSame(0, $updated);
        $this->assertSame(0, $deactivated);
        $this->assertSame(0, $reactivated);
        $this->assertDatabaseCount('tb_position', 1);
        $this->assertDatabaseHas('tb_position', [
            'optigate_position_id' => '301',
            'tenant_id' => $this->tenant->id,
            'department_id' => 'dept-100',
            'division_id' => $this->division->id_division,
            'kode_position' => 'POS-01',
        ]);
    }

    public function test_sync_positions_method_reactivates_returning_positions(): void
    {
        $existing = Position::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_position_id' => '302',
            'kode_position' => 'OLD',
            'nama_position' => 'Old Position',
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        $command = app(SyncPositions::class);
        $positions = collect([
            [
                'id' => 302,
                'kode_position' => 'REACTIVATED',
                'nama_position' => 'Reactivated Position',
                'department_id' => 'dept-100',
                'division_id' => 'div-200',
                'is_active' => true,
            ],
        ]);

        $method = new ReflectionMethod($command, 'syncPositions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $positions);

        $this->assertSame(0, $created);
        $this->assertSame(1, $updated);
        $this->assertSame(0, $deactivated);
        $this->assertSame(1, $reactivated);

        $existing->refresh();
        $this->assertTrue((bool) $existing->is_active);
        $this->assertNull($existing->deactivated_at);
    }

    public function test_sync_positions_method_deactivates_missing_positions(): void
    {
        $oldPosition = Position::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_position_id' => '400',
            'kode_position' => 'GONE',
            'nama_position' => 'Gone Position',
            'is_active' => true,
        ]);

        $command = app(SyncPositions::class);
        $positions = collect([]);

        $method = new ReflectionMethod($command, 'syncPositions');
        $method->setAccessible(true);
        [$created, $updated, $deactivated, $reactivated] = $method->invoke($command, $this->tenant, $positions);

        $this->assertSame(0, $created);
        $this->assertSame(0, $updated);
        $this->assertSame(1, $deactivated);
        $this->assertSame(0, $reactivated);

        $this->assertDatabaseHas('tb_position', [
            'optigate_position_id' => '400',
            'is_active' => false,
        ]);
        $this->assertNotNull($oldPosition->refresh()->deactivated_at);
    }

    public function test_sync_deactivates_positions_no_longer_in_portal(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $oldPosition = Position::factory()->create([
            'tenant_id' => $this->tenant->id,
            'optigate_position_id' => '999',
            'kode_position' => 'OLD',
            'nama_position' => 'Old Position',
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

        $this->assertDatabaseHas('tb_position', [
            'optigate_position_id' => '999',
            'is_active' => false,
        ]);
        $this->assertNotNull($oldPosition->refresh()->deactivated_at);
    }
}
