<?php

namespace Tests\Feature;

use App\Actions\MergeDuplicateRolesAction;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MergeDuplicateRolesActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_merge_moves_assignments_and_permissions_onto_survivor(): void
    {
        $survivor = Role::create(['name' => User::ROLE_SUPER_ADMIN, 'guard_name' => 'web']);
        $duplicate = Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

        $survivorPermission = Permission::create(['name' => 'asset.view', 'guard_name' => 'web']);
        $duplicatePermission = Permission::create(['name' => 'employee.view', 'guard_name' => 'web']);
        $survivor->givePermissionTo($survivorPermission);
        $duplicate->givePermissionTo($duplicatePermission);

        $user = User::factory()->create();
        $employee = Employee::factory()->create();
        $user->assignRole([$survivor, $duplicate]);
        $employee->assignRole([$survivor, $duplicate]);

        app(MergeDuplicateRolesAction::class)('super_admin', User::ROLE_SUPER_ADMIN);

        // Role duplikat hilang, kanonik tetap satu.
        $this->assertSame(0, Role::where('name', 'super_admin')->count());
        $this->assertSame(1, Role::where('name', User::ROLE_SUPER_ADMIN)->count());

        // Assignment user & employee pindah ke role kanonik (exactly one row each).
        $this->assertTrue($user->fresh()->hasRole(User::ROLE_SUPER_ADMIN));
        $this->assertSame(
            1,
            DB::table('model_has_roles')
                ->where('role_id', $survivor->getKey())
                ->where('model_type', User::class)
                ->where('model_id', $user->getKey())
                ->count(),
        );
        $this->assertTrue($employee->fresh()->hasRole(User::ROLE_SUPER_ADMIN));
        $this->assertSame(
            1,
            DB::table('model_has_roles')
                ->where('role_id', $survivor->getKey())
                ->where('model_type', Employee::class)
                ->where('model_id', $employee->getKey())
                ->count(),
        );

        // Permission gabungan utuh di role yang selamat.
        $mergedPermissions = Role::findByName(User::ROLE_SUPER_ADMIN, 'web')
            ->permissions()
            ->pluck('name')
            ->all();

        $this->assertEqualsCanonicalizing(['asset.view', 'employee.view'], $mergedPermissions);
    }

    public function test_merge_is_idempotent(): void
    {
        $duplicate = Role::create(['name' => 'super_admin', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($duplicate);

        $action = app(MergeDuplicateRolesAction::class);

        $action('super_admin', User::ROLE_SUPER_ADMIN);
        $rolesAfterFirstRun = Role::query()->pluck('name')->sort()->implode(',');
        $pivotRowsAfterFirstRun = DB::table('model_has_roles')->count();

        $action(User::ROLE_SUPER_ADMIN, User::ROLE_SUPER_ADMIN); // survivor name as input: no-op guard
        $action('super_admin', User::ROLE_SUPER_ADMIN);          // from role already gone: no-op

        $this->assertSame($rolesAfterFirstRun, Role::query()->pluck('name')->sort()->implode(','));
        $this->assertSame($pivotRowsAfterFirstRun, DB::table('model_has_roles')->count());
        $this->assertTrue($user->fresh()->hasRole(User::ROLE_SUPER_ADMIN));
    }

    public function test_missing_from_role_is_a_noop(): void
    {
        Role::create(['name' => User::ROLE_SUPER_ADMIN, 'guard_name' => 'web']);
        $user = User::factory()->create();

        app(MergeDuplicateRolesAction::class)('super_admin', User::ROLE_SUPER_ADMIN);

        $this->assertSame(1, Role::where('name', User::ROLE_SUPER_ADMIN)->count());
        $this->assertFalse($user->fresh()->hasRole(User::ROLE_SUPER_ADMIN));
    }
}
