<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RolePermissionTest extends TestCase
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

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    private function makePermission(string $name): Permission
    {
        return Permission::create(['name' => $name, 'guard_name' => 'web']);
    }

    private function makeRole(string $name): Role
    {
        return Role::create(['name' => $name, 'guard_name' => 'web']);
    }

    public function test_roles_index_renders_with_permission_groups(): void
    {
        $this->makePermission('asset.location.view');
        $this->makePermission('asset.location.delete');
        $this->makePermission('inventory.view');
        $this->makeRole('manager');

        $this->actingAs($this->user)
            ->get(route('roles.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('roles/Index')
                ->has('roles.data', 1)
                ->where('roles.data.0.name', 'manager')
                ->where('roles.data.0.users_count', 0)
                ->has('permissionGroups', 2)
                ->where('permissionGroups.0.group', 'asset.location')
                ->where('permissionGroups.1.group', 'inventory'));
    }

    public function test_roles_index_searches_and_sorts(): void
    {
        $this->makeRole('super-admin');
        $this->makeRole('manager');

        $this->actingAs($this->user)
            ->get(route('roles.index', ['search' => 'manager']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('roles.total', 1)
                ->where('filters.search', 'manager'));

        $this->actingAs($this->user)
            ->get(route('roles.index', ['sort' => 'name']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('roles.data.0.name', 'manager')
                ->where('roles.data.1.name', 'super-admin'));
    }

    public function test_role_can_be_created(): void
    {
        $this->actingAs($this->user)
            ->post(route('roles.store'), ['name' => 'supervisor'])
            ->assertRedirect();

        $this->assertSame(1, Role::count());
        $this->assertSame('supervisor', Role::first()?->name);
        $this->assertSame('web', Role::first()?->guard_name);
    }

    public function test_role_name_must_be_unique(): void
    {
        $this->makeRole('manager');

        $this->actingAs($this->user)
            ->from(route('roles.index'))
            ->post(route('roles.store'), ['name' => 'manager'])
            ->assertSessionHasErrors('name');
    }

    public function test_role_can_be_updated_keeping_own_name(): void
    {
        $role = $this->makeRole('manager');

        $this->actingAs($this->user)
            ->patch(route('roles.update', $role->id), ['name' => 'manager'])
            ->assertRedirect();
    }

    public function test_role_can_be_updated(): void
    {
        $role = $this->makeRole('manager');

        $this->actingAs($this->user)
            ->patch(route('roles.update', $role->id), ['name' => 'supervisor'])
            ->assertRedirect();

        $this->assertSame('supervisor', $role->fresh()?->name);
    }

    public function test_super_admin_role_cannot_be_deleted(): void
    {
        $role = $this->makeRole('super-admin');

        $this->actingAs($this->user)
            ->delete(route('roles.destroy', $role->id))
            ->assertRedirect()
            ->assertSessionHasErrors('role');

        $this->assertSame(1, Role::count());
    }

    public function test_role_can_be_deleted(): void
    {
        $role = $this->makeRole('manager');

        $this->actingAs($this->user)
            ->delete(route('roles.destroy', $role->id))
            ->assertRedirect();

        $this->assertSame(0, Role::count());
    }

    public function test_permissions_can_be_synced_to_role(): void
    {
        $role = $this->makeRole('manager');
        $this->makePermission('asset.view');
        $this->makePermission('asset.edit');

        $this->actingAs($this->user)
            ->put(route('roles.permissions.sync', $role->id), [
                'permissions' => ['asset.view', 'asset.edit'],
            ])
            ->assertRedirect();

        $this->assertSame(2, $role->fresh()->permissions()->count());
    }

    public function test_permissions_index_renders_and_filters_by_group(): void
    {
        $this->makePermission('asset.location.view');
        $this->makePermission('inventory.view');

        $this->actingAs($this->user)
            ->get(route('permissions.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('permissions/Index')
                ->has('permissions.data', 2)
                ->has('groups', 2));

        $this->actingAs($this->user)
            ->get(route('permissions.index', ['group' => 'inventory']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('permissions.total', 1)
                ->where('permissions.data.0.name', 'inventory.view'));
    }

    public function test_permission_can_be_created_with_valid_format(): void
    {
        $this->actingAs($this->user)
            ->post(route('permissions.store'), [
                'resource' => 'asset',
                'actions' => ['view', 'create'],
            ])
            ->assertRedirect();

        $this->assertSame(2, Permission::count());
        $this->assertTrue(Permission::where('name', 'asset.view')->exists());
        $this->assertTrue(Permission::where('name', 'asset.create')->exists());
    }

    public function test_permission_batch_create_is_idempotent(): void
    {
        $this->makePermission('asset.view');

        $this->actingAs($this->user)
            ->post(route('permissions.store'), [
                'resource' => 'asset',
                'actions' => ['view', 'edit'],
            ])
            ->assertRedirect();

        $this->assertSame(2, Permission::count());
        $this->assertTrue(Permission::where('name', 'asset.view')->exists());
        $this->assertTrue(Permission::where('name', 'asset.edit')->exists());
    }

    public function test_permission_requires_resource_and_actions(): void
    {
        $this->actingAs($this->user)
            ->from(route('permissions.index'))
            ->post(route('permissions.store'), ['resource' => '', 'actions' => []])
            ->assertSessionHasErrors(['resource', 'actions']);

        $this->actingAs($this->user)
            ->from(route('permissions.index'))
            ->post(route('permissions.store'), [
                'resource' => 'Not Valid!',
                'actions' => ['view'],
            ])
            ->assertSessionHasErrors('resource');

        $this->actingAs($this->user)
            ->from(route('permissions.index'))
            ->post(route('permissions.store'), [
                'resource' => 'asset',
                'actions' => ['bad action!'],
            ])
            ->assertSessionHasErrors('actions.0');
    }

    public function test_permission_can_be_updated_and_deleted(): void
    {
        $permission = $this->makePermission('asset.view');

        $this->actingAs($this->user)
            ->patch(route('permissions.update', $permission->id), [
                'name' => 'asset.browse',
            ])
            ->assertRedirect();

        $this->assertSame('asset.browse', $permission->fresh()?->name);

        $this->actingAs($this->user)
            ->delete(route('permissions.destroy', $permission->id))
            ->assertRedirect();

        $this->assertSame(0, Permission::count());
    }
}
