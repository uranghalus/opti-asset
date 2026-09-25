<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
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

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::findOrCreate('asset.view', 'web');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo('asset.view');
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
                ->component('assets/Index')
                ->has('tree')
                // FR-04.1: daftar tidak lagi null di root — semua aset tampil.
                ->has('assets.data')
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
                ->component('assets/Index')
                // Pohon role non-staf berakar cluster (ADR 0001) —
                // kategori/golongan hidup di level induknya.
                ->has('tree', 1)
                ->where('tree.0.level', 'cluster')
                ->where('tree.0.id', $cluster->id)
                ->where('tree.0.children.0.level', 'sub-cluster')
                ->where('tree.0.children.0.id', $subCluster->id)
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
                ->component('assets/Index')
                ->where('selected.level', 'sub-cluster')
                ->where('selected.id', $subCluster->id)
                ->has('assets.data', 1)
                // Breadcrumb berhenti di akar pohon role (cluster).
                ->has('breadcrumb', 2)
                ->where('breadcrumb.0.level', 'cluster')
                ->where('breadcrumb.0.name', 'Laptop')
                ->where('breadcrumb.1.level', 'sub-cluster')
                ->where('breadcrumb.1.name', 'Business Laptop'));
    }

    public function test_browse_selected_cluster_node_shows_assets_with_short_breadcrumb(): void
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
                'level' => 'cluster',
                'node' => $cluster->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected.level', 'cluster')
                ->where('selected.id', $cluster->id)
                ->has('assets.data', 3)
                ->has('breadcrumb', 1)
                ->where('breadcrumb.0.name', 'Laptop')
                ->where('breadcrumb.0.code', '01.01.01'));
    }

    public function test_browse_without_node_returns_all_assets(): void
    {
        $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected', null)
                ->has('assets.data')
                ->where('breadcrumb', []));
    }

    public function test_browse_tree_carries_asset_counts(): void
    {
        [$group, $category, $cluster] = $this->buildFullChain();
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'item_id' => $item->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tree.0.asset_count')
                ->where('tree.0.asset_count', 1));
    }

    // ---------- FR-04.2: filter lokasi + FR-04.1: cari nama item ----------

    public function test_browse_filters_by_location(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $targetLocation = Location::factory()->create(['name' => 'Gudang Pusat']);
        $otherLocation = Location::factory()->create(['name' => 'Kantor Cabang']);

        $inTarget = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'location_id' => $targetLocation->id,
        ]);
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'location_id' => $otherLocation->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'location' => $targetLocation->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 1)
                ->where('assets.data.0.id', $inTarget->id));
    }

    public function test_browse_search_matches_item_name(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->buildFullChain();

        $item = Item::factory()->create(['name' => 'MacBook Pro M3']);
        $match = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'item_id' => $item->id,
            'brand' => 'Zebra',
        ]);
        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'brand' => 'Zebra',
            'serial_number' => 'ZZ-0001',
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', [
                'level' => 'sub-cluster',
                'node' => $subCluster->id,
                'search' => 'MacBook',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 1)
                ->where('assets.data.0.id', $match->id));
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
                ->where('tree.0.code', '01.01.01'));
    }

    public function test_browse_invalid_level_falls_through(): void
    {
        $this->buildFullChain();

        $this->actingAs($this->user)
            ->get(route('assets.browse', ['level' => 'invalid', 'node' => '123']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selected', null)
                ->has('assets.data')
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
