<?php

namespace Tests\Feature\Console;

use App\Console\Commands\SyncTenantData;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Console\OutputStyle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\BufferedOutput;
use Tests\TestCase;

class SyncTenantDataTest extends TestCase
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

        Config::set('auth.super_admin_email', 'test@test.com');
    }

    private function runCommand(?string $tenantKey = null): int
    {
        $command = app(SyncTenantData::class);
        $definition = new InputDefinition([
            new InputOption('tenant', null, InputOption::VALUE_REQUIRED, 'ID atau kode tenant'),
        ]);
        $input = new ArrayInput(
            $tenantKey !== null ? ['--tenant' => $tenantKey] : [],
            $definition
        );
        $command->setInput($input);
        $command->setOutput(new OutputStyle($input, new BufferedOutput));

        return $command->handle();
    }

    public function test_command_calls_subcommands_in_dependency_order(): void
    {
        $tenantId = $this->tenant->id;

        Artisan::shouldReceive('call')
            ->with('app:sync-departments', ['--tenant' => $tenantId])
            ->twice()
            ->andReturn(Command::SUCCESS);
        Artisan::shouldReceive('call')
            ->with('app:sync-divisions', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::SUCCESS);
        Artisan::shouldReceive('call')
            ->with('app:sync-positions', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::SUCCESS);
        Artisan::shouldReceive('call')
            ->with('app:sync-employees', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::SUCCESS);

        $this->assertSame(Command::SUCCESS, $this->runCommand($tenantId));
    }

    public function test_command_returns_failure_when_subcommand_fails(): void
    {
        $tenantId = $this->tenant->id;

        Artisan::shouldReceive('call')
            ->with('app:sync-departments', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::FAILURE);
        Artisan::shouldReceive('call')
            ->with('app:sync-divisions', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::FAILURE);
        Artisan::shouldReceive('call')
            ->with('app:sync-positions', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::FAILURE);
        Artisan::shouldReceive('call')
            ->with('app:sync-employees', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::FAILURE);
        Artisan::shouldReceive('call')
            ->with('app:sync-departments', ['--tenant' => $tenantId])
            ->once()
            ->andReturn(Command::FAILURE);

        $this->assertSame(Command::FAILURE, $this->runCommand($tenantId));
    }

    public function test_command_warns_when_no_tenant_found(): void
    {
        $this->assertSame(Command::SUCCESS, $this->runCommand('nonexistent'));
    }
}
