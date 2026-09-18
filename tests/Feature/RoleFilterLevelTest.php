<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleFilterLevelTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Create roles needed for tests
        foreach (['super-admin', 'staff-asset', 'akunting', 'some-other-role'] as $roleName) {
            Role::create(['name' => $roleName, 'guard_name' => 'web']);
        }

        // FR-11.3 — browsing assets requires the asset.view permission.
        Permission::findOrCreate('asset.view', 'web');
        $this->user->givePermissionTo('asset.view');
    }

    public function test_super_admin_gets_group_level(): void
    {
        $this->user->assignRole('super-admin');

        $response = $this->actingAs($this->user)->get(route('assets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('filters.initialLevel', 'group'));
    }

    public function test_staff_asset_gets_group_level(): void
    {
        $this->user->assignRole('staff-asset');

        $response = $this->actingAs($this->user)->get(route('assets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('filters.initialLevel', 'group'));
    }

    public function test_akunting_gets_group_level(): void
    {
        $this->user->assignRole('akunting');

        $response = $this->actingAs($this->user)->get(route('assets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('filters.initialLevel', 'group'));
    }

    public function test_other_role_gets_cluster_level(): void
    {
        $this->user->assignRole('some-other-role');

        $response = $this->actingAs($this->user)->get(route('assets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('filters.initialLevel', 'cluster'));
    }

    public function test_guest_gets_redirect(): void
    {
        $response = $this->get(route('assets.index'));
        $response->assertRedirect();
    }
}
