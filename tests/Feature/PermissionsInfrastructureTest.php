<?php

namespace Tests\Feature;

use App\Actions\SyncUserRolesFromEmployeeAction;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PermissionsInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        foreach (['super-admin', 'old-role', 'standalone', 'to-be-cleared', 'employee.edit'] as $name) {
            if ($name === 'employee.edit') {
                Permission::create(['name' => $name, 'guard_name' => 'web']);
                $this->user->givePermissionTo($name);

                continue;
            }

            Role::create(['name' => $name, 'guard_name' => 'web']);
        }
    }

    public function test_model_id_columns_accept_uuid_strings(): void
    {
        $this->assertSame('varchar', Schema::getColumnType('model_has_roles', 'model_id'));
        $this->assertSame('varchar', Schema::getColumnType('model_has_permissions', 'model_id'));

        $role = Role::create(['name' => 'uuid-test', 'guard_name' => 'web']);
        $employee = Employee::factory()->create();
        $employee->assignRole($role);

        $this->assertDatabaseHas('model_has_roles', [
            'role_id' => $role->id,
            'model_id' => $employee->id_employee,
            'model_type' => Employee::class,
        ]);
    }

    public function test_seeder_gives_super_admin_no_database_permissions(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $superAdmin = Role::findByName('super-admin', 'web');

        $this->assertSame(0, $superAdmin->permissions()->count());
    }

    public function test_seeder_gives_administrator_every_catalogued_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $administrator = Role::findByName('administrator', 'web');

        $this->assertSame(count(RolePermissionSeeder::PERMISSIONS), $administrator->permissions()->count());
    }

    public function test_seeder_creates_exactly_the_expected_roles(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $expected = ['super-admin', 'administrator', 'manager', 'staff-asset', 'akunting'];

        $this->assertEqualsCanonicalizing(
            $expected,
            Role::query()->whereIn('name', $expected)->pluck('name')->all(),
        );
    }

    public function test_gate_before_grants_super_admin_everything_without_permissions(): void
    {
        $this->user->assignRole('super-admin');

        $this->assertTrue(Gate::forUser($this->user)->allows('any-ability-never-defined'));
        $this->assertTrue(Gate::forUser($this->user)->allows('asset.view'));
    }

    public function test_gate_allows_user_with_direct_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->user->givePermissionTo('asset.view');

        $this->assertTrue(Gate::forUser($this->user)->allows('asset.view'));
        $this->assertTrue(Gate::forUser($this->user)->denies('asset.delete'));
    }

    public function test_gate_denies_user_without_roles_or_permissions(): void
    {
        $this->seed(RolePermissionSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->assertTrue(Gate::forUser($this->user)->denies('asset.view'));
    }

    public function test_sync_action_copies_employee_roles_to_linked_user(): void
    {
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $employee = Employee::factory()->create(['email' => $this->user->email]);
        $employee->assignRole($role);

        app(SyncUserRolesFromEmployeeAction::class)->execute($this->user);

        $this->assertTrue($this->user->fresh()->hasRole('manager'));
    }

    public function test_sync_action_replaces_stale_user_roles(): void
    {
        $this->user->assignRole('old-role');

        $role = Role::create(['name' => 'staff-asset', 'guard_name' => 'web']);
        $employee = Employee::factory()->create(['email' => $this->user->email]);
        $employee->assignRole($role);

        app(SyncUserRolesFromEmployeeAction::class)->execute($this->user);

        $this->assertTrue($this->user->fresh()->hasRole('staff-asset'));
        $this->assertFalse($this->user->fresh()->hasRole('old-role'));
    }

    public function test_sync_action_keeps_user_roles_without_linked_employee(): void
    {
        $this->user->assignRole('standalone');

        app(SyncUserRolesFromEmployeeAction::class)->execute($this->user);

        $this->assertTrue($this->user->fresh()->hasRole('standalone'));
    }

    public function test_sync_action_syncs_empty_employee_roles(): void
    {
        $this->user->assignRole('to-be-cleared');

        Employee::factory()->create(['email' => $this->user->email]);

        app(SyncUserRolesFromEmployeeAction::class)->execute($this->user);

        $this->assertSame(0, $this->user->fresh()->roles()->count());
    }

    public function test_login_event_triggers_role_sync(): void
    {
        $role = Role::create(['name' => 'akunting', 'guard_name' => 'web']);
        $employee = Employee::factory()->create(['email' => $this->user->email]);
        $employee->assignRole($role);

        // actingAs() does not dispatch auth events; a real login does.
        auth()->login($this->user);

        $this->assertTrue($this->user->fresh()->hasRole('akunting'));
    }

    public function test_assign_roles_endpoint_updates_linked_user_immediately(): void
    {
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $employee = Employee::factory()->create(['email' => $this->user->email]);

        $this->actingAs($this->user)
            ->from(route('employees.index'))
            ->post(route('employees.roles.update', $employee), ['roles' => ['manager']])
            ->assertRedirect(route('employees.index'));

        $this->assertTrue($employee->fresh()->hasRole('manager'));
        $this->assertTrue($this->user->fresh()->hasRole('manager'));
    }
}
