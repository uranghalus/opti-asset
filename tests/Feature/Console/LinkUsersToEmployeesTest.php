<?php

namespace Tests\Feature\Console;

use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class LinkUsersToEmployeesTest extends TestCase
{
    use RefreshDatabase;

    private function tenant(string $id): Tenant
    {
        return Tenant::factory()->create([
            'id' => $id,
            'code' => $id,
            'name' => 'Tenant '.$id,
        ]);
    }

    public function test_links_user_to_same_tenant_employee_by_email(): void
    {
        $tenant = $this->tenant('acme');
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        $this->artisan('users:link-employees')
            ->expectsOutput('Pengaitan user ke employee selesai!')
            ->expectsOutput('  linked: 1')
            ->expectsOutput('  cross_tenant: 0')
            ->expectsOutput('  ambiguous: 0')
            ->expectsOutput('  skipped: 0')
            ->expectsOutput('  dry_run: no')
            ->assertExitCode(Command::SUCCESS);

        $user->refresh();

        $this->assertSame($employee->id_employee, $user->employee_id);
        $this->assertTrue($user->employee->is($employee));
    }

    public function test_links_user_to_unique_cross_tenant_employee_and_warns(): void
    {
        $acme = $this->tenant('acme');
        $other = $this->tenant('other');

        $user = User::factory()->create(['tenant_id' => $acme->id, 'email' => 'budi@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $other->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        Log::spy();

        $this->artisan('users:link-employees')
            ->expectsOutput('  cross_tenant: 1')
            ->assertExitCode(Command::SUCCESS);

        $this->assertSame($employee->id_employee, $user->fresh()->employee_id);

        Log::shouldHaveReceived('warning')->once()->withArgs(
            fn (string $event, array $context): bool => $event === 'users.link-employees cross-tenant'
                && $context['user_id'] === $user->id
                && $context['employee_id'] === $employee->id_employee
                && $context['tenant_id'] === $other->id
        );
    }

    public function test_skips_user_when_email_appears_in_multiple_other_tenants(): void
    {
        $acme = $this->tenant('acme');
        $otherA = $this->tenant('other-a');
        $otherB = $this->tenant('other-b');

        $user = User::factory()->create(['tenant_id' => $acme->id, 'email' => 'budi@acme.test']);
        Employee::factory()->create([
            'tenant_id' => $otherA->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);
        Employee::factory()->create([
            'tenant_id' => $otherB->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        Log::spy();

        $this->artisan('users:link-employees')
            ->expectsOutput('  ambiguous: 1')
            ->assertExitCode(Command::SUCCESS);

        $this->assertNull($user->fresh()->employee_id);

        Log::shouldHaveReceived('warning')->once()->withArgs(
            fn (string $event, array $context): bool => $event === 'users.link-employees ambiguous'
                && $context['user_id'] === $user->id
                && $context['email'] === $user->email
        );
    }

    public function test_skips_user_without_matching_employee_email(): void
    {
        $tenant = $this->tenant('acme');
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);
        Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'other@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        Log::spy();

        $this->artisan('users:link-employees')
            ->expectsOutput('  skipped: 1')
            ->assertExitCode(Command::SUCCESS);

        $this->assertNull($user->fresh()->employee_id);

        Log::shouldNotHaveReceived('warning');
    }

    public function test_is_idempotent_when_run_twice(): void
    {
        $tenant = $this->tenant('acme');
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        $this->artisan('users:link-employees')->assertExitCode(Command::SUCCESS);

        $this->artisan('users:link-employees')
            ->expectsOutput('  linked: 0')
            ->expectsOutput('  skipped: 1')
            ->assertExitCode(Command::SUCCESS);

        $this->assertSame($employee->id_employee, $user->fresh()->employee_id);
    }

    public function test_dry_run_reports_counts_without_changing_database(): void
    {
        $tenant = $this->tenant('acme');
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);

        $this->artisan('users:link-employees', ['--dry-run' => true])
            ->expectsOutput('  linked: 1')
            ->expectsOutput('  dry_run: yes')
            ->assertExitCode(Command::SUCCESS);

        $this->assertNull($user->fresh()->employee_id);

        $this->artisan('users:link-employees')->assertExitCode(Command::SUCCESS);

        $this->assertSame($employee->id_employee, $user->fresh()->employee_id);
    }

    public function test_links_lowest_id_employee_when_same_tenant_has_duplicate_emails(): void
    {
        $tenant = $this->tenant('acme');
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);

        $first = Employee::factory()->create([
            'id_employee' => '00000000-0000-0000-0000-000000000001',
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);
        $second = Employee::factory()->create([
            'id_employee' => '00000000-0000-0000-0000-000000000002',
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-002',
        ]);

        $this->artisan('users:link-employees')
            ->expectsOutput('  linked: 1')
            ->assertExitCode(Command::SUCCESS);

        $user->refresh();

        $this->assertSame($first->id_employee, $user->employee_id);
        $this->assertNotSame($second->id_employee, $user->employee_id);
    }

    public function test_skips_user_when_employee_already_linked_to_different_user(): void
    {
        $tenant = $this->tenant('acme');

        // The employee is pre-linked to user A outside the backfill.
        $userA = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'agus@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);
        $userA->update(['employee_id' => $employee->id_employee]);

        // User B shares the employee's email but is not linked yet.
        $userB = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);

        Log::spy();

        $this->artisan('users:link-employees')
            ->expectsOutput('  linked: 0')
            ->expectsOutput('  skipped: 2')
            ->assertExitCode(Command::SUCCESS);

        $this->assertNull($userB->fresh()->employee_id);
        $this->assertSame($employee->id_employee, $userA->fresh()->employee_id);

        Log::shouldHaveReceived('warning')->once()->withArgs(
            fn (string $event, array $context): bool => $event === 'users.link-employees employee-already-linked'
                && $context['user_id'] === $userB->id
                && $context['employee_id'] === $employee->id_employee
        );

        // A second run leaves the database state identical.
        $this->artisan('users:link-employees')
            ->expectsOutput('  skipped: 2')
            ->assertExitCode(Command::SUCCESS);

        $this->assertNull($userB->fresh()->employee_id);
        $this->assertSame($employee->id_employee, $userA->fresh()->employee_id);
    }

    public function test_dry_run_reports_employee_already_linked_without_writing(): void
    {
        $tenant = $this->tenant('acme');

        $userA = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'agus@acme.test']);
        $employee = Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'budi@acme.test',
            'nik_employee' => 'NIK-001',
        ]);
        $userA->update(['employee_id' => $employee->id_employee]);

        $userB = User::factory()->create(['tenant_id' => $tenant->id, 'email' => 'budi@acme.test']);

        Log::spy();

        $this->artisan('users:link-employees', ['--dry-run' => true])
            ->expectsOutput('  skipped: 2')
            ->expectsOutput('  dry_run: yes')
            ->assertExitCode(Command::SUCCESS);

        Log::shouldHaveReceived('warning')->once()->withArgs(
            fn (string $event, array $context): bool => $event === 'users.link-employees employee-already-linked'
                && $context['user_id'] === $userB->id
        );

        $this->assertNull($userB->fresh()->employee_id);
        $this->assertSame($employee->id_employee, $userA->fresh()->employee_id);
    }
}
