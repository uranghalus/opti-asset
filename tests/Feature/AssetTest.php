<?php

namespace Tests\Feature;

use App\Enums\ClassificationLevel;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetHistory;
use App\Models\AssetSubCluster;
use App\Models\Category;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class AssetTest extends TestCase
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

        $this->assertSame('ACT', $asset->status->value);
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
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '01']);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '01']);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => '01']);

        return [$group, $category, $cluster, $subCluster];
    }

    /**
     * Build the full classification chain plus an Item whose category
     * resolves to the deepest (sub cluster) node. Pass a distinct $code
     * when creating more than one chain in the same test.
     */
    private function itemWithCategory(string $code = '01'): array
    {
        $group = AssetGroup::factory()->create(['code' => $code]);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => $code]);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => $code]);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => $code]);

        $cat = Category::create([
            'name' => 'Kategori '.$subCluster->name,
            'code' => implode('.', array_fill(0, 4, $code)),
            'classification_id' => $subCluster->id,
            'classification_type' => ClassificationLevel::SUBCLUSTER,
        ]);

        $item = Item::factory()->create(['category_id' => $cat->id]);

        return [$group, $category, $cluster, $subCluster, $cat, $item];
    }

    public function test_index_renders_assets(): void
    {
        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->get(route('assets.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->has('tree'));
    }

    public function test_grouped_route_renders_index_view(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->get(route('assets.grouped', ['level' => $group->id, 'node' => $subCluster->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->has('tree')
                ->has('assets'));
    }

    public function test_show_page_renders_with_relations(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();
        $item = Item::factory()->create();
        $location = Location::factory()->create();
        $asset = Asset::factory()->create([
            'kode_asset' => '01.01.01.01.001',
            'item_id' => $item->id,
            'location_id' => $location->id,
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'asset_cluster_id' => $cluster->id,
            'asset_sub_cluster_id' => $subCluster->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.show', $asset))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Show')
                ->where('asset.kode_asset', '01.01.01.01.001')
                ->where('asset.item.name', $item->name)
                ->where('asset.location.name', $location->name)
                ->where('asset.asset_group.name', $group->name)
                ->where('asset.asset_category.name', $category->name)
                ->where('asset.asset_cluster.name', $cluster->name)
                ->where('asset.asset_sub_cluster.name', $subCluster->name));
    }

    public function test_show_page_blocks_another_tenants_asset(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Asset::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('assets.show', $foreign))
            ->assertNotFound();
    }

    public function test_scan_page_renders(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.scan'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('assets/Scan'));
    }

    public function test_scan_lookup_finds_asset_by_code(): void
    {
        $asset = Asset::factory()->create(['kode_asset' => '01.01.01.01.001']);

        $this->actingAs($this->user)
            ->getJson(route('assets.scan-lookup', ['code' => '01.01.01.01.001']))
            ->assertOk()
            ->assertJsonPath('asset.id', $asset->id)
            ->assertJsonPath('asset.kode_asset', '01.01.01.01.001');
    }

    public function test_scan_lookup_returns_404_when_not_found(): void
    {
        $this->actingAs($this->user)
            ->getJson(route('assets.scan-lookup', ['code' => 'TIDAK-ADA']))
            ->assertNotFound()
            ->assertJsonPath('message', 'Aset tidak ditemukan.');
    }

    public function test_scan_lookup_requires_code(): void
    {
        $this->actingAs($this->user)
            ->from(route('assets.scan'))
            ->get(route('assets.scan-lookup'))
            ->assertSessionHasErrors(['code']);
    }

    public function test_labels_page_renders_selected_assets(): void
    {
        $first = Asset::factory()->create(['kode_asset' => '01.01.01.01.001']);
        $second = Asset::factory()->create(['kode_asset' => '01.01.01.02.001']);

        $this->actingAs($this->user)
            ->get(route('assets.labels', ['ids' => [$first->id, $second->id]]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Labels')
                ->has('assets', 2)
                ->where('assets.0.kode_asset', '01.01.01.01.001'));
    }

    public function test_labels_page_requires_ids(): void
    {
        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->get(route('assets.labels'))
            ->assertSessionHasErrors(['ids']);
    }

    public function test_labels_page_only_lists_current_tenants_assets(): void
    {
        $own = Asset::factory()->create(['kode_asset' => '01.01.01.01.001']);

        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Asset::factory()->create(['kode_asset' => '02.02.02.02.001']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('assets.labels', ['ids' => [$own->id, $foreign->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('assets', 1)
                ->where('assets.0.id', $own->id));
    }

    public function test_create_page_renders(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Create')
                ->has('items')
                ->has('locations')
                ->has('departments')
                ->has('employees'));
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

    public function test_store_generates_kode_asset_from_item_category(): void
    {
        [$group, $category, $cluster, $subCluster, $cat, $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-TEST-001',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'kode_asset' => '01.01.01.01.001',
            'serial_number' => 'SN-TEST-001',
            'tenant_id' => 'acme',
        ]);

        $asset = Asset::query()->where('serial_number', 'SN-TEST-001')->firstOrFail();
        $this->assertSame($group->id, $asset->asset_group_id);
        $this->assertSame($category->id, $asset->asset_category_id);
        $this->assertSame($cluster->id, $asset->asset_cluster_id);
        $this->assertSame($subCluster->id, $asset->asset_sub_cluster_id);
    }

    public function test_store_increments_sequence_within_same_item_category(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        foreach (['SN-A-001', 'SN-A-002'] as $serial) {
            $this->actingAs($this->user)
                ->from(route('assets.index'))
                ->post(route('assets.store'), [
                    'item_id' => $item->id,
                    'serial_number' => $serial,
                ])
                ->assertRedirect(route('assets.index'));
        }

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-A-001', 'kode_asset' => '01.01.01.01.001']);
        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-A-002', 'kode_asset' => '01.01.01.01.002']);
    }

    public function test_store_keeps_sequence_independent_per_item(): void
    {
        [, , , , , $itemA] = $this->itemWithCategory();
        [, , , , , $itemB] = $this->itemWithCategory('02');

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $itemA->id,
                'serial_number' => 'SN-C1-001',
            ])
            ->assertRedirect(route('assets.index'));

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $itemB->id,
                'serial_number' => 'SN-C2-001',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-C1-001', 'kode_asset' => '01.01.01.01.001']);
        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-C2-001', 'kode_asset' => '02.02.02.02.001']);
    }

    public function test_store_continues_sequence_after_deletion(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $first = Asset::factory()->create([
            'serial_number' => 'SN-DEL-001',
            'kode_asset' => '01.01.01.01.001',
            'item_id' => $item->id,
        ]);
        Asset::factory()->create([
            'serial_number' => 'SN-DEL-002',
            'kode_asset' => '01.01.01.01.002',
            'item_id' => $item->id,
        ]);

        $first->delete();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-DEL-003',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-DEL-003', 'kode_asset' => '01.01.01.01.003']);
    }

    public function test_store_persists_multiple_media_urls(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-MEDIA-001',
                'photo_url' => ['/storage/photos/a.jpg', '/storage/photos/b.jpg'],
                'document_url' => ['/storage/docs/faktur.pdf'],
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('serial_number', 'SN-MEDIA-001')->first();

        $this->assertSame(['/storage/photos/a.jpg', '/storage/photos/b.jpg'], $asset->photo_url);
        $this->assertSame(['/storage/docs/faktur.pdf'], $asset->document_url);
    }

    public function test_upload_stores_media_and_returns_public_url(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user)
            ->post(route('assets.upload'), [
                'file' => UploadedFile::fake()->image('asset-photo.jpg', 100, 100),
            ])
            ->assertOk()
            ->assertJsonStructure(['url']);

        $this->assertNotEmpty(Storage::disk('public')->files('assets/acme/media'));
    }

    public function test_upload_rejects_file_larger_than_one_megabyte(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user)
            ->from(route('assets.create'))
            ->post(route('assets.upload'), [
                'file' => UploadedFile::fake()->create('large.pdf', 2048),
            ])
            ->assertSessionHasErrors(['file']);
    }

    public function test_upload_rejects_unsupported_file_type(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user)
            ->from(route('assets.create'))
            ->post(route('assets.upload'), [
                'file' => UploadedFile::fake()->create('malware.exe', 10),
            ])
            ->assertSessionHasErrors(['file']);
    }

    public function test_store_persists_multiple_pics(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-PIC-001',
                'pic' => ['Budi', 'Siti'],
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('serial_number', 'SN-PIC-001')->first();

        $this->assertSame(['Budi', 'Siti'], $asset->pic);
    }

    public function test_store_requires_item(): void
    {
        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'serial_number' => 'SN-NO-ITEM',
            ])
            ->assertSessionHasErrors(['item_id']);

        $this->assertSame(0, Asset::count());
    }

    public function test_store_generates_code_from_item_with_group_level_category(): void
    {
        [$group] = $this->classificationChain();

        $cat = Category::create([
            'name' => 'Kategori Golongan',
            'code' => '01',
            'classification_id' => $group->id,
            'classification_type' => ClassificationLevel::GROUP,
        ]);
        $item = Item::factory()->create(['category_id' => $cat->id]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-GROUP-ONLY',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-GROUP-ONLY',
            'kode_asset' => '01.001',
            'asset_group_id' => $group->id,
            'asset_category_id' => null,
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ]);
    }

    public function test_store_generates_code_from_item_with_category_level_category(): void
    {
        [$group, $category] = $this->classificationChain();

        $cat = Category::create([
            'name' => 'Kategori Kategori',
            'code' => '01.01',
            'classification_id' => $category->id,
            'classification_type' => ClassificationLevel::CATEGORY,
        ]);
        $item = Item::factory()->create(['category_id' => $cat->id]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-UPTO-CAT',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-UPTO-CAT',
            'kode_asset' => '01.01.001',
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ]);
    }

    public function test_store_allows_item_without_category(): void
    {
        $item = Item::factory()->create(['category_id' => null]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'serial_number' => 'SN-NO-CAT',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-NO-CAT',
            'kode_asset' => null,
            'item_id' => $item->id,
        ]);
    }

    public function test_update_regenerates_kode_asset_when_item_changes(): void
    {
        [, , , , , $itemA] = $this->itemWithCategory();
        [, , , , , $itemB] = $this->itemWithCategory('02');

        $asset = Asset::factory()->create([
            'item_id' => $itemA->id,
            'kode_asset' => '01.01.01.01',
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'item_id' => $itemB->id,
                'serial_number' => 'SN-BARU-001',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'kode_asset' => '02.02.02.02.001',
            'serial_number' => 'SN-BARU-001',
            'item_id' => $itemB->id,
        ]);
    }

    public function test_update_records_lifecycle_history(): void
    {
        $asset = Asset::factory()->create(['status' => 'ACT', 'condition' => 'Baik']);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'status' => 'LOAN',
                'condition' => 'Rusak Ringan',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'status',
            'old_value' => 'ACT',
            'new_value' => 'LOAN',
            'changed_by' => $this->user->id,
        ]);
        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'condition',
            'old_value' => 'Baik',
            'new_value' => 'Rusak Ringan',
        ]);
    }

    public function test_store_rejects_invalid_status(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'status' => 'BOGUS',
            ])
            ->assertSessionHasErrors(['status']);

        $this->assertSame(0, Asset::count());
    }

    public function test_import_normalizes_status_labels(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $csv = implode(',', ['brand', 'model', 'serial_number', 'status'])."\n"
            .implode(',', ['Brand X', 'Model Y', 'SN-STATUS-001', 'Dalam Perbaikan'])."\n";

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-STATUS-001',
            'status' => 'RPR',
        ]);
    }

    public function test_update_records_kode_asset_change_history(): void
    {
        [, , , , , $itemA] = $this->itemWithCategory();
        [, , , , , $itemB] = $this->itemWithCategory('02');

        $asset = Asset::factory()->create([
            'item_id' => $itemA->id,
            'kode_asset' => '01.01.01.01.001',
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'item_id' => $itemB->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'kode_asset',
            'old_value' => '01.01.01.01.001',
            'new_value' => '02.02.02.02.001',
        ]);
    }

    public function test_update_without_changes_records_no_history(): void
    {
        $asset = Asset::factory()->create(['notes' => 'Awal']);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'notes' => 'Diperbarui',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(0, AssetHistory::count());
    }

    public function test_show_renders_histories(): void
    {
        $asset = Asset::factory()->create();
        AssetHistory::factory()->count(3)->create(['asset_id' => $asset->id]);

        $this->actingAs($this->user)
            ->get(route('assets.show', $asset))
            ->assertInertia(fn ($page) => $page
                ->has('asset.histories', 3));
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

    public function test_store_records_created_history(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'item_id' => $item->id,
                'brand' => 'Brand Baru',
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::first();

        $this->assertNotNull($asset);
        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'created',
            'old_value' => null,
            'new_value' => $asset->kode_asset,
            'changed_by' => $this->user->id,
        ]);
    }

    public function test_import_template_downloads_xlsx(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.import-template'))
            ->assertOk()
            ->assertDownload('template-import-aset.xlsx');
    }

    public function test_import_creates_assets_from_spreadsheet(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $csv = $this->csvContent([
            'Brand X',
            'Model Y',
            'SN-IMPORT-001',
        ]);

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-IMPORT-001']);
        $this->assertSame(1, Asset::count());
        $this->assertSame('01.01.01.01.001', Asset::query()->first()?->kode_asset);
    }

    public function test_import_uses_selected_item_for_all_rows(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $csv = $this->csvContent([
            'Brand X',
            'Model Y',
            'SN-IMPORT-ITEM',
        ]);

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-IMPORT-ITEM',
            'item_id' => $item->id,
        ]);
        $this->assertSame(1, Asset::count());
    }

    public function test_import_without_item_or_item_column_creates_default_item(): void
    {
        $file = $this->xlsxFile([
            ['Brand', 'Model', 'Serial Number'],
            ['Brand X', 'Model Y', 'SN-DEFAULT-ITEM'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('serial_number', 'SN-DEFAULT-ITEM')->first();
        $this->assertNotNull($asset);
        $this->assertNotNull($asset->item_id);
        $this->assertNotNull(Item::find($asset->item_id));
    }

    public function test_import_requires_valid_file(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => UploadedFile::fake()->create('assets.txt'),
                'item_id' => $item->id,
            ])
            ->assertSessionHasErrors(['file']);
    }

    public function test_import_reads_office_export_format(): void
    {
        [, , , , , $item] = $this->itemWithCategory();
        $location = Location::factory()->create(['name' => 'OFFICE BM']);
        $department = Department::factory()->create(['nama_department' => 'ACC & FIN']);

        $file = $this->xlsxFile([
            ['', 'AKTIVA TETAP - DUMMY SAMPLE'],
            ['', 'Lantai', 'No.', 'Unit', 'Model/ Type', 'PIC', 'Dept', 'Kode Asset', 'Kondisi ', '', 'Keterangan', '', '', ''],
            ['', '', '', '', '', '', '', '', 'Baik', 'Rusak', 'NO. SERI', 'AREA', 'ARAH', 'Tgl/Bln/Thn Pengadaan'],
            ['', 'OFFICE BM', '1', 'NVR', 'NVR Hikvision DS-7616NI-Q1', 'Kasir', 'ACC & FIN', '03.08.01.07.001', '', '', 'SN-NVR-1', '', '', '2026-07-13'],
            ['', 'OFFICE BM', '2', 'Printer Epson', 'Epson L-3210', 'Kasir', 'ACC & FIN', '03.08.03.05.001', 'X', '', '', '', '', '2026-04-20'],
            ['', 'PERALATAN - DUMMY SAMPLE'],
            ['', 'Lantai', 'No.', 'Unit', 'Model/ Type', 'PIC', 'Dept', 'Kode Asset', 'Kondisi ', '', 'Keterangan', '', '', ''],
            ['', '', '', '', '', '', '', '', 'Baik', 'Rusak', 'NO. SERI', 'AREA', 'ARAH', 'Tgl/Bln/Thn Pengadaan'],
            ['', 'Ruang Genset', '3', 'Obeng Plus', '', 'ENG', 'ENG', 'A1.01.01.01.A001', '', 'X', '', '', '', ''],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(3, Asset::count());
        $this->assertSame(4, Item::count());

        $first = Asset::query()->where('kode_asset', '03.08.01.07.001')->first();
        $this->assertNotNull($first);
        $this->assertSame($location->id, $first->location_id);
        $this->assertSame($department->id_department, $first->department_id);
        $this->assertSame('Baik', $first->condition);
        $this->assertSame('SN-NVR-1', $first->serial_number);
        $this->assertSame('2026-07-13', $first->purchase_date?->format('Y-m-d'));
        $this->assertNotSame($item->id, $first->item_id);
        $this->assertSame('NVR', Item::query()->find($first->item_id)?->name);

        $second = Asset::query()->where('kode_asset', '03.08.03.05.001')->first();
        $this->assertNotNull($second);
        $this->assertSame('Baik', $second->condition);
        $this->assertSame('Printer Epson', Item::query()->find($second->item_id)?->name);

        $third = Asset::query()->where('kode_asset', 'A1.01.01.01.A001')->first();
        $this->assertNotNull($third);
        $this->assertSame('Rusak', $third->condition);
        $this->assertNull($third->purchase_date);
        $this->assertSame('Obeng Plus', Item::query()->find($third->item_id)?->name);
    }

    public function test_import_skips_rows_with_duplicate_kode_asset(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $file = $this->xlsxFile([
            ['Lantai', 'Unit', 'Kode Asset', 'NO. SERI'],
            ['BM', 'NVR', '03.01.001', 'SN-KODE-A'],
            ['BM', 'Printer', '03.01.001', 'SN-KODE-B'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(1, Asset::count());
        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-KODE-A']);
        $this->assertDatabaseMissing('assets', ['serial_number' => 'SN-KODE-B']);
    }

    public function test_import_skips_rows_matching_existing_kode_or_serial(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        Asset::factory()->create(['kode_asset' => '03.01.001', 'serial_number' => 'SN-DB-1']);

        $file = $this->xlsxFile([
            ['Lantai', 'Unit', 'Kode Asset', 'NO. SERI'],
            ['BM', 'NVR', '03.01.001', 'SN-BARU-A'],
            ['BM', 'Printer', '03.01.002', 'SN-DB-1'],
            ['BM', 'Meja', '03.01.003', 'SN-BARU-B'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(2, Asset::count());
        $this->assertDatabaseMissing('assets', ['serial_number' => 'SN-BARU-A']);
        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-BARU-B']);
        $this->assertDatabaseMissing('assets', ['kode_asset' => '03.01.002']);
    }

    public function test_bulk_destroy_deletes_selected_assets(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $keep = Asset::factory()->create(['item_id' => $item->id]);
        $targets = Asset::factory()->count(3)->create(['item_id' => $item->id]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->delete(route('assets.destroy-bulk'), [
                'ids' => $targets->pluck('id')->all(),
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(1, Asset::count());
        $this->assertTrue($keep->refresh()->exists);
        foreach ($targets as $target) {
            $this->assertDatabaseMissing('assets', ['id' => $target->id]);
        }
    }

    public function test_bulk_destroy_requires_ids(): void
    {
        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->delete(route('assets.destroy-bulk'), [])
            ->assertSessionHasErrors(['ids']);
    }

    public function test_bulk_destroy_rejects_ids_from_other_tenant(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $otherTenant = Tenant::create(['id' => 'other-tenant', 'name' => 'Other Corp']);
        $otherAsset = Asset::withoutGlobalScopes()->forceCreate([
            'tenant_id' => $otherTenant->id,
            'item_id' => Item::factory()->create()->id,
            'kode_asset' => 'OTHER-1',
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->delete(route('assets.destroy-bulk'), [
                'ids' => [$otherAsset->id],
            ])
            ->assertSessionHasErrors(['ids.*']);

        $this->assertSame(1, Asset::withoutGlobalScopes()->where('tenant_id', $otherTenant->id)->count());
    }

    public function test_update_redirects_to_return_to_target(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $asset = Asset::factory()->create(['item_id' => $item->id]);

        $url = route('assets.update', $asset).'?return_to='.urlencode('/assets?page=2&search=abc');

        $this->actingAs($this->user)
            ->patch($url, ['notes' => 'Diperbarui'])
            ->assertRedirect('/assets?page=2&search=abc');
    }

    public function test_update_falls_back_for_unsafe_return_to(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $asset = Asset::factory()->create(['item_id' => $item->id]);

        foreach (['https://evil.com', '//evil.com', '/\\evil.com'] as $returnTo) {
            $url = route('assets.update', $asset).'?return_to='.urlencode($returnTo);

            $this->actingAs($this->user)
                ->patch($url, ['notes' => 'Coba'])
                ->assertRedirect(route('assets.index'));
        }
    }

    public function test_store_redirects_to_return_to_target(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $url = route('assets.store').'?return_to='.urlencode('/assets?page=3&status=ACT');

        $this->actingAs($this->user)
            ->post($url, ['item_id' => $item->id])
            ->assertRedirect('/assets?page=3&status=ACT');
    }

    public function test_destroy_redirects_back_with_index_fallback(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $asset = Asset::factory()->create(['item_id' => $item->id]);

        $this->actingAs($this->user)
            ->delete(route('assets.destroy', $asset))
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
    }

    public function test_import_creates_missing_location_and_warns_missing_department(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $file = $this->xlsxFile([
            ['Lantai', 'Unit', 'Dept', 'Kode Asset'],
            ['RUANG X', 'Meja Kerja', 'DEPT GAK ADA', 'X.001'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('kode_asset', 'X.001')->first();
        $this->assertNotNull($asset);
        $this->assertNotNull($asset->location_id);
        $this->assertSame('RUANG X', Location::query()->find($asset->location_id)?->name);
        $this->assertNull($asset->department_id);

        $flash = session('inertia.flash_data');
        $this->assertIsArray($flash);
        $this->assertStringContainsString('DEPT GAK ADA', (string) ($flash['toast']['message'] ?? ''));
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     */
    private function xlsxFile(array $rows): UploadedFile
    {
        $path = storage_path('app/import-test-'.uniqid().'.xlsx');

        $writer = new Writer;
        $writer->openToFile($path);

        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }

        $writer->close();

        $file = UploadedFile::fake()->createWithContent('aktiva.xlsx', (string) file_get_contents($path));

        @unlink($path);

        return $file;
    }

    /** @param array<int, string> $values */
    private function csvContent(array $values): string
    {
        $headers = [
            'brand',
            'model',
            'serial_number',
            'kondisi',
            'tanggal_pembelian',
            'harga_pembelian',
            'lokasi',
            'department',
            'status',
            'vendor',
            'catatan',
        ];

        $row = array_pad($values, count($headers), '');

        return implode(',', $headers)."\n".implode(',', $row)."\n";
    }

    public function test_import_resolves_classification_by_exact_kode(): void
    {
        $group = AssetGroup::factory()->create(['code' => '03']);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '08']);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '11']);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => '07']);

        $item = Item::factory()->create();

        $file = $this->xlsxFile([
            ['Unit', 'Kode Asset'],
            ['Meja', '03.08.11.07'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('kode_asset', '03.08.11.07')->first();

        $this->assertNotNull($asset);
        $this->assertSame($group->id, $asset->asset_group_id);
        $this->assertSame($category->id, $asset->asset_category_id);
        $this->assertSame($cluster->id, $asset->asset_cluster_id);
        $this->assertSame($subCluster->id, $asset->asset_sub_cluster_id);
    }

    public function test_import_resolves_classification_by_positional_fallback(): void
    {
        $group = AssetGroup::factory()->create(['code' => '03']);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '08']);

        // Three clusters under category — codes do NOT match '01' so positional kicks in.
        $firstCluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '1A', 'sort_order' => 1]);
        $secondCluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '1B', 'sort_order' => 2]);
        AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '1C', 'sort_order' => 3]);

        // Two subclusters under the 2nd cluster.
        $firstSub = AssetSubCluster::factory()->create(['asset_cluster_id' => $secondCluster->id, 'code' => '2A', 'sort_order' => 1]);
        $secondSub = AssetSubCluster::factory()->create(['asset_cluster_id' => $secondCluster->id, 'code' => '2B', 'sort_order' => 2]);

        $item = Item::factory()->create();

        $file = $this->xlsxFile([
            ['Unit', 'Kode Asset'],
            ['Meja', '03.08.02.02'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('kode_asset', '03.08.02.02')->first();

        $this->assertNotNull($asset);
        $this->assertSame($secondCluster->id, $asset->asset_cluster_id, 'Positional fallback picks the 2nd cluster');
        $this->assertSame($secondSub->id, $asset->asset_sub_cluster_id, 'Positional fallback picks the 2nd subcluster');
    }

    public function test_import_records_errors_for_unknown_group_segment(): void
    {
        $item = Item::factory()->create();

        $file = $this->xlsxFile([
            ['Unit', 'Kode Asset'],
            ['Meja', '99.01.01.01'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $flash = session('inertia.flash_data');
        $this->assertIsArray($flash);
        $this->assertStringContainsString("Golongan '99' tidak ditemukan", (string) ($flash['toast']['message'] ?? ''));
    }

    public function test_import_records_errors_for_unknown_category_segment(): void
    {
        $group = AssetGroup::factory()->create(['code' => '03']);
        $item = Item::factory()->create();

        $file = $this->xlsxFile([
            ['Unit', 'Kode Asset'],
            ['Meja', '03.XX.01.01'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $flash = session('inertia.flash_data');
        $this->assertIsArray($flash);
        $this->assertStringContainsString("Kategori 'XX' tidak ditemukan di bawah golongan '03'", (string) ($flash['toast']['message'] ?? ''));
    }

    public function test_import_records_errors_for_unknown_subcluster_segment(): void
    {
        $group = AssetGroup::factory()->create(['code' => '03']);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '08']);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => '11']);
        $item = Item::factory()->create();

        // Kode '99' is numeric but exceeds available subclusters (only 0 exist).
        $file = $this->xlsxFile([
            ['Unit', 'Kode Asset'],
            ['Meja', '03.08.11.99'],
        ]);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('assets.index'));

        $flash = session('inertia.flash_data');
        $this->assertIsArray($flash);
        $this->assertStringContainsString("Sub Cluster '99' tidak ditemukan di bawah cluster '11'", (string) ($flash['toast']['message'] ?? ''));
    }

    public function test_index_exposes_unclassified_count(): void
    {
        [$group] = $this->classificationChain();
        $item = Item::factory()->create();
        Asset::factory()->create(['item_id' => $item->id, 'asset_group_id' => $group->id]);
        Asset::factory()->count(2)->create(['item_id' => $item->id, 'asset_group_id' => null]);

        $this->actingAs($this->user)
            ->get(route('assets.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->where('unclassifiedCount', 2)
                ->where('assets', null));
    }

    public function test_index_unclassified_node_lists_orphaned_assets(): void
    {
        [$group] = $this->classificationChain();
        $item = Item::factory()->create();
        Asset::factory()->create(['item_id' => $item->id, 'asset_group_id' => $group->id]);
        Asset::factory()->count(2)->create(['item_id' => $item->id, 'asset_group_id' => null]);

        $this->actingAs($this->user)
            ->get(route('assets.index', ['level' => 'group', 'node' => 'unclassified']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->where('selected.level', 'group')
                ->where('selected.id', 'unclassified')
                ->has('assets.data', 2)
                ->has('breadcrumb', 1)
                ->where('breadcrumb.0.name', 'Tanpa Klasifikasi'));
    }

    public function test_browse_route_renders_index_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Index')
                ->has('tree'));
    }
}
