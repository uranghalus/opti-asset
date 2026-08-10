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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    public function test_store_persists_multiple_media_urls(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'serial_number' => 'SN-MEDIA-001',
                'photo_url' => ['/storage/photos/a.jpg', '/storage/photos/b.jpg'],
                'document_url' => ['/storage/docs/faktur.pdf'],
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
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
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'serial_number' => 'SN-PIC-001',
                'pic' => ['Budi', 'Siti'],
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertRedirect(route('assets.index'));

        $asset = Asset::query()->where('serial_number', 'SN-PIC-001')->first();

        $this->assertSame(['Budi', 'Siti'], $asset->pic);
    }

    public function test_store_requires_group(): void
    {
        [$group, $category, $cluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
            ])
            ->assertSessionHasErrors(['asset_group_id']);

        $this->assertSame(0, Asset::count());
    }

    public function test_store_generates_code_from_group_only(): void
    {
        [$group] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'serial_number' => 'SN-GROUP-ONLY',
                'asset_group_id' => $group->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-GROUP-ONLY',
            'kode_asset' => '01.001',
            'asset_category_id' => null,
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ]);
    }

    public function test_store_generates_code_up_to_category(): void
    {
        [$group, $category] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.store'), [
                'serial_number' => 'SN-UPTO-CAT',
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-UPTO-CAT',
            'kode_asset' => '01.01.001',
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ]);
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

    public function test_import_template_downloads_xlsx(): void
    {
        $this->actingAs($this->user)
            ->get(route('assets.import-template'))
            ->assertOk()
            ->assertDownload('template-import-aset.xlsx');
    }

    public function test_import_creates_assets_from_spreadsheet(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $csv = $this->csvContent([
            'Elevator',
            'Brand X',
            'Model Y',
            'SN-IMPORT-001',
        ]);

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-IMPORT-001']);
        $this->assertSame(1, Asset::count());
        $this->assertSame('01.01.01.01.001', Asset::query()->first()?->kode_asset);
    }

    public function test_import_creates_item_when_name_not_found(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $csv = $this->csvContent([
            'Elevator Baru',
            '',
            '',
            'SN-IMPORT-ITEM',
        ]);

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('items', ['name' => 'Elevator Baru']);
        $item = Item::query()->where('name', 'Elevator Baru')->first();
        $this->assertNotNull($item);
        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-IMPORT-ITEM',
            'item_id' => $item->id,
        ]);
    }

    public function test_import_reuses_existing_item_by_name(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();
        $item = Item::factory()->create(['name' => 'Elevator']);

        $csv = $this->csvContent([
            'Elevator',
            '',
            '',
            'SN-IMPORT-REUSE',
        ]);

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => $file,
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertDatabaseHas('assets', [
            'serial_number' => 'SN-IMPORT-REUSE',
            'item_id' => $item->id,
        ]);
        $this->assertSame(1, Asset::count());
    }

    public function test_import_requires_classification_chain(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'assets.csv',
            $this->csvContent(['Elevator', '', '', 'SN-IMPORT-X']),
        );

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), ['file' => $file])
            ->assertSessionHasErrors(['asset_group_id']);
    }

    public function test_import_requires_valid_file(): void
    {
        [$group, $category, $cluster, $subCluster] = $this->classificationChain();

        $this->actingAs($this->user)
            ->from(route('assets.index'))
            ->post(route('assets.import'), [
                'file' => UploadedFile::fake()->create('assets.txt'),
                'asset_group_id' => $group->id,
                'asset_category_id' => $category->id,
                'asset_cluster_id' => $cluster->id,
                'asset_sub_cluster_id' => $subCluster->id,
            ])
            ->assertSessionHasErrors(['file']);
    }

    /** @param array<int, string> $values */
    private function csvContent(array $values): string
    {
        $headers = [
            'item',
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
}
