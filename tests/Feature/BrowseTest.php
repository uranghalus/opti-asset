<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Department;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BrowseTest extends TestCase
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
    }

    /**
     * Build a full classification chain: group → category → cluster → sub-cluster.
     */
    private function buildFullChain(): array
    {
        $group = AssetGroup::factory()->create([
            'code' => '01', 'name' => 'Elektronik',
        ]);
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01', 'name' => 'Komputer',
        ]);
        $cluster = AssetCluster::factory()->create([
            'asset_category_id' => $category->id,
            'code' => '01.01.01', 'name' => 'Laptop',
        ]);
        $subCluster = AssetSubCluster::factory()->create([
            'asset_cluster_id' => $cluster->id,
            'code' => '01.01.01.01', 'name' => 'Business Laptop',
        ]);

        return [$group, $category, $cluster, $subCluster];
    }

    public function test_browse_loads_with_tree_and_assets(): void
    {
        $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assets/Manage')
                ->has('tree')
                ->where('assets', null)
                ->where('selected', null)
                ->where('breadcrumb', [])
            );
    }

    public function test_browse_renders_classification_tree_with_level_field(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assets/Manage')
                ->has('tree', 1)
                ->where('tree.0.level', 'group')
                ->where('tree.0.id', $group->id)
                ->where('tree.0.children.0.level', 'category')
                ->where('tree.0.children.0.id', $category->id)
                ->where('tree.0.children.0.children.0.level', 'cluster')
                ->where('tree.0.children.0.children.0.id', $cluster->id)
                ->where('tree.0.children.0.children.0.children.0.level', 'sub-cluster')
                ->where('tree.0.children.0.children.0.children.0.id', $subCluster->id)
                ->where('selected', null)
                ->where('breadcrumb', []));
    }

    public function test_browse_selected_asset_node_shows_assets_and_breadcrumb(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $item = Item::factory()->create(['code' => 'ITEM-01', 'name' => 'Laptop']);
        Asset::factory()->create([
            'item_id' => $item->id,
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assets/Manage')
                ->where('selected.level', 'sub-cluster')
                ->where('selected.id', $subCluster->id)
                ->has('assets.data', 1)
                ->has('breadcrumb', 4)
                ->where('breadcrumb.0.level', 'group')
                ->where('breadcrumb.0.name', 'Elektronik')
                ->where('breadcrumb.1.level', 'category')
                ->where('breadcrumb.1.name', 'Komputer')
                ->where('breadcrumb.2.level', 'cluster')
                ->where('breadcrumb.2.name', 'Laptop')
                ->where('breadcrumb.3.level', 'sub-cluster')
                ->where('breadcrumb.3.name', 'Business Laptop'));
    }

    public function test_browse_selected_group_node_shows_assets_with_short_breadcrumb(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        Asset::factory()->count(3)->create([
            'item_id' => Item::factory(),
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'group',
                'node' => $group->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected.level', 'group')
                ->where('selected.id', $group->id)
                ->has('assets.data', 3)
                ->has('breadcrumb', 1)
                ->where('breadcrumb.0.name', 'Elektronik')
                ->where('breadcrumb.0.code', '01'));
    }

    public function test_browse_without_node_returns_null_assets(): void
    {
        $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected', null)
                ->where('assets', null)
                ->where('breadcrumb', []));
    }

    public function test_browse_tree_carries_asset_counts(): void
    {
        $group = AssetGroup::factory()->create();
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'item_id' => $item->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tree.0.asset_count')
                ->where('tree.0.asset_count', 1));
    }

    public function test_browse_requires_authentication(): void
    {
        $this->get(route('assets.browse'))->assertRedirect();
    }

    public function test_browse_respects_multi_tenant_isolation(): void
    {
        $this->buildFullChain();

        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = AssetGroup::factory()->create(['code' => '99', 'name' => 'Outside']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->tenant->makeCurrent();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tree', 1)
                ->where('tree.0.code', '01'));
    }

    public function test_browse_invalid_level_falls_through(): void
    {
        $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse', ['level' => 'invalid', 'node' => '123']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected', null)
                ->where('assets', null)
                ->where('breadcrumb', []));
    }

    public function test_browse_filters_assets_by_search(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        Item::factory()->create(['code' => 'ITEM-01', 'name' => 'Laptop']);
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => Item::factory()->create()->id,
            'kode_asset' => 'TEST-ASSET-123',
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'search' => 'TEST-ASSET-123',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected.level', 'sub-cluster')
                ->has('assets.data', 1));
    }

    public function test_browse_filters_by_department(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $dept = Department::factory()->create();
        $item = Item::factory()->create();
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => $item->id,
            'department_id' => $dept->id_department,
        ]);
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => $item->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'department' => $dept->id_department,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected.level', 'sub-cluster')
                ->has('assets.data', 1));
    }

    public function test_browse_filters_by_status(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $item = Item::factory()->create();
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => $item->id,
            'status' => 'ACT',
        ]);
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => $item->id,
            'status' => 'LOAN',
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'status' => 'ACT',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected.level', 'sub-cluster')
                ->has('assets.data', 1));
    }

    public function test_browse_pagination_works(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        for ($i = 0; $i < 25; $i++) {
            Asset::factory()->create([
                'item_id' => Item::factory(),
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ]);
        }

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'per_page' => 10,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 10)
                ->has('assets.links')
                ->where('assets.last_page', 3));
    }
}
