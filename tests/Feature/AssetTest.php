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
use Tests\TestCase;

class AssetTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_asset_gets_tenant_id_on_create(): void
    {
        $asset = Asset::factory()->create();

        $this->assertSame('acme', $asset->tenant_id);
    }

    public function test_assets_scoped_to_current_tenant(): void
    {
        Asset::factory()->create();

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Asset::withoutGlobalScopes()->forceCreate([
            'tenant_id' => $other->id,
            'item_id' => Item::factory()->create()->id,
            'kode_asset' => 'AST-OTHER',
        ]);

        $this->assertSame(1, Asset::count());
        $this->assertSame('AST-OTHER', Asset::withoutGlobalScopes()->where('tenant_id', 'other')->first()?->kode_asset);
    }

    public function test_asset_defaults_statuses(): void
    {
        $asset = Asset::factory()->create();

        $this->assertSame('ACTIVE', $asset->status);
        $this->assertSame('AVAILABLE', $asset->assigned_status);
    }

    public function test_asset_belongs_to_item_location_and_department(): void
    {
        $item = Item::factory()->create();
        $location = Location::factory()->create();
        $department = Department::factory()->create();
        $asset = Asset::factory()->create([
            'item_id' => $item->id,
            'location_id' => $location->id,
            'department_id' => $department->id_department,
        ]);

        $this->assertTrue($asset->item()->first()->is($item));
        $this->assertTrue($asset->location()->first()->is($location));
        $this->assertTrue($asset->department()->first()->is($department));
    }

    public function test_asset_belongs_to_classification_chain(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id]);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id]);

        $asset = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
        ]);

        $this->assertTrue($asset->assetGroup()->first()->is($group));
        $this->assertTrue($asset->assetCategory()->first()->is($category));
        $this->assertTrue($asset->assetCluster()->first()->is($cluster));
        $this->assertTrue($asset->assetSubCluster()->first()->is($subCluster));
    }

    public function test_same_kode_asset_allowed_across_tenants(): void
    {
        Asset::factory()->create(['kode_asset' => 'AST-001']);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Asset::withoutGlobalScopes()->forceCreate([
            'tenant_id' => $other->id,
            'item_id' => Item::factory()->create()->id,
            'kode_asset' => 'AST-001',
        ]);

        $this->assertSame(1, Asset::count());
    }

    private function classificationChain(): array
    {
        $group = AssetGroup::factory()->create(['code' => '01']);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '01.01']);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '01.01.01']);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => '01.01.01.01']);

        return [$group, $category, $cluster, $subCluster];
    }

    public function test_index_renders_assets(): void
    {
        Asset::factory()->count(2)->create();

        $this->actingAs($this->user)
            ->get(route('assets.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->has('assets.data', 2));
    }

    public function test_create_page_renders(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Create')
                ->has('groups')
                ->has('categories')
                ->has('clusters')
                ->has('subClusters')
                ->has('items')
                ->has('locations')
                ->has('departments'));
    }

    public function test_edit_page_renders_with_asset(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('assets.edit', $asset))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Edit')
                ->where('asset.id', $asset->id));
    }

    public function test_store_generates_kode_asset_from_classification_chain(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => Item::factory()->create()->id,
                'serial_number' => 'SN-TEST-001',
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'kode_asset' => '01.01.01.01.001',
            'serial_number' => 'SN-TEST-001',
            'tenant_id' => 'acme',
        ]);
    }

    public function test_store_increments_sequence_within_same_sub_cluster(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        foreach (['SN-A-001', 'SN-A-002'] as $serial) {
            $this->actingAs($this->user)
                ->from(route('assets.index'))
                ->post(route('assets.store'), [
                    'serial_number' => $serial,
                    'asset_group_id' => $group->id,
                    'asset_category_id' => $category->id,
                    'asset_cluster_id' => $cluster->id,
                    'asset_sub_cluster_id' => $subCluster->id,
                ])
                ->assertRedirect(route('assets.index'));
        }

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-A-001', 'kode_asset' => '01.01.01.01.001']);
        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-A-002', 'kode_asset' => '01.01.01.01.002']);
    }

    public function test_store_requires_all_classification_levels(): void
    {
        [$group, $category, $cluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
            ])
            ->assertSessionHasErrors(['asset_sub_cluster_id']);

        $this->assertSame(0, Asset::count());
    }

    public function test_update_regenerates_kode_asset_when_classification_changes(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();
        $asset = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
            'kode_asset' => '01.01.01.01',
        ]);

        $newSub = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => '01.01.01.02']);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'serial_number' => 'SN-BARU-001',
                'asset_sub_cluster_id' => $newSub->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'kode_asset' => '01.01.01.02.001',
            'serial_number' => 'SN-BARU-001',
        ]);
    }

    public function test_destroy_deletes_asset(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->delete(route('assets.destroy', $asset))
            ->assertRedirect(route('assets.index'));

        $this->assertSame(0, Asset::count());
    }
}
