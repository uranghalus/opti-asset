<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            \Spatie\Permission\Models\Role::create(['name' => $roleName, 'guard_name' => 'web']);
        }
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