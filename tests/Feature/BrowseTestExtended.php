<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetGroup;
use App\Models\Department;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class BrowseTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private User $adminUser;
    private User $guestUser;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        // Create regular user
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Create admin user with super-admin role
        $this->adminUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
        // Assume we have a super-admin role with appropriate permissions

        // Create guest user (no role)
        $this->guestUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_browse_loads_with_tree_and_assets(): void
    {
        AssetGroup::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('assets.browse'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('assets/Browse')
                ->has('tree')
                ->has('assets')
                ->has('breadcrumb')
                ->where('selectedNode', null),
        );
    }

    public function test_browse_filters_assets_by_selected_node(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'item_id' => $item->id,
        ]);

        Asset::factory()->create(['item_id' => $item->id]);

        $response = $this->actingAs($this->user)
            ->get(route('assets.browse', ['node' => $group->id]));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->where('selectedNode', $group->id)
                ->where('selectedLevel', 'group')
                ->has('breadcrumb'),
        );
    }

    public function test_browse_tree_carries_asset_counts(): void
    {
        $group = AssetGroup::factory()->create();
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'item_id' => $item->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('assets.browse'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->has('tree.0.asset_count')
                ->where('tree.0.asset_count', 1),
        );
    }

    public function test_browse_requires_authentication(): void
    {
        $response = $this->get(route('assets.browse'));
        $response->assertRedirect();
    }

    public function test_guest_cannot_access_browse(): void
    {
        $response = $this->guestUser->get(route('assets.browse'));
        $response->assertRedirect();
    }

    public function test_regular_user_can_access_browse(): void
    {
        $response = $this->user->get(route('assets.browse'));
        $response->assertOk();
    }

    public function test_admin_user_can_access_browse(): void
    {
        $response = $this->adminUser->get(route('assets.browse'));
        $response->assertOk();
    }

    public function test_browse_respects_multi_tenant_isolation(): void
    {
        // Create assets for current tenant
        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'kode_asset' => 'ACME-001',
        ]);

        // Create assets for other tenant
        $otherTenant = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $otherTenant->makeCurrent();
        Asset::withoutGlobalScopes()->forceCreate([
            'tenant_id' => $otherTenant->id,
            'kode_asset' => 'OTHER-001',
        ]);
        $otherTenant->makeCurrent();

        // Check that only current tenant's assets are visible
        $response = $this->user->get(route('assets.browse'));
        $response->assertSee('ACME-001');
        $response->assertDontSee('OTHER-001');
    }

    public function test_browse_filters_by_search(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'item_id' => $item->id,
            'kode_asset' => 'TEST-ASSET-123',
        ]);

        $response = $this->user->get(route('assets.browse', ['search' => 'TEST-ASSET-123']));
        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->where('selectedNode', null)
                ->where('search', 'TEST-ASSET-123')
        );
    }

    public function test_browse_pagination_works(): void
    {
        // Create multiple assets to test pagination
        for ($i = 0; $i < 25; $i++) {
            Asset::factory()->create([
                'item_id' => Item::factory()->create()->id,
            ]);
        }

        $response = $this->user->get(route('assets.browse', ['per_page' => 10]));
        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->has('assets.data', 10)
                ->has('assets.links')
                ->has('assets.last_page', 3)
        );
    }
}