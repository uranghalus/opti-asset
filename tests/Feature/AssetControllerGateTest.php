<?php

namespace Tests\Feature;

use App\Enums\ClassificationLevel;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AssetControllerGateTest extends TestCase
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

        $this->tenant = Tenant::create(['id' => 'acme', 'code' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        foreach (['asset.view', 'asset.create', 'asset.edit', 'asset.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.view', 'asset.create', 'asset.edit', 'asset.delete']);
    }

    /** @return array{group, category, cluster, subCluster, categoryModel, Item} */
    private function itemWithCategory(string $code = '01'): array
    {
        $group = AssetGroup::factory()->create(['code' => $code]);
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => $code]);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id, 'code' => $code]);
        $subCluster = AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id, 'code' => $code]);

        $cat = \App\Models\Category::create([
            'name' => 'Kategori '.$subCluster->name,
            'code' => implode('.', array_fill(0, 4, $code)),
            'classification_id' => $subCluster->id,
            'classification_type' => ClassificationLevel::SUBCLUSTER,
        ]);

        $item = Item::factory()->create(['category_id' => $cat->id]);

        return [$group, $category, $cluster, $subCluster, $cat, $item];
    }

    /** @return array{User, Asset, Item} */
    private function actingUserWithItem(): array
    {
        $asset = Asset::factory()->create();
        [$item] = $this->itemWithCategory();

        return ['user' => $this->user, 'asset' => $asset, 'item' => $item];
    }

    // ---------- asset.view ----------

    public function test_index_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.index', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_grouped_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.grouped', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_browse_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.browse', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_scan_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.scan', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_scan_lookup_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->getJson(route('tenant.assets.scan-lookup', array_merge(['tenant' => $this->tenant->code], ['code' => 'X'])))
            ->assertForbidden();
    }

    public function test_labels_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('assets.labels', ['ids' => []]))
            ->assertForbidden();
    }

    public function test_labels_batch_forbids_without_asset_view(): void
    {
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.labels-batch', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_show_forbids_without_asset_view(): void
    {
        $asset = Asset::factory()->create();
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertForbidden();
    }

    public function test_history_forbids_without_asset_view(): void
    {
        $asset = Asset::factory()->create();
        $this->user->revokePermissionTo('asset.view');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.history', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertForbidden();
    }

    public function test_index_ok_with_asset_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.index', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_grouped_ok_with_asset_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.grouped', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_browse_ok_with_asset_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.browse', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_scan_ok_with_asset_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.scan', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_scan_lookup_ok_with_asset_view(): void
    {
        $asset = Asset::factory()->create(['kode_asset' => 'AST-GATE-001']);

        $this->actingAs($this->user)
            ->getJson(route('tenant.assets.scan-lookup', array_merge(['tenant' => $this->tenant->code], ['code' => 'AST-GATE-001'])))
            ->assertOk()
            ->assertJsonPath('asset.kode_asset', 'AST-GATE-001');
    }

    public function test_labels_ok_with_asset_view(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('assets.labels', ['ids' => [$asset->id]]))
            ->assertOk();
    }

    public function test_labels_batch_ok_with_asset_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.labels-batch', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_show_ok_with_asset_view(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk();
    }

    public function test_history_ok_with_asset_view(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.assets.history', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk();
    }

    // ---------- asset.create ----------

    public function test_create_forbids_without_asset_create(): void
    {
        $this->user->revokePermissionTo('asset.create');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.create', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_store_forbids_without_asset_create(): void
    {
        $this->user->revokePermissionTo('asset.create');

        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->post(route('tenant.assets.store', ['tenant' => $this->tenant->code]), [
                'item_id' => $item->id,
                'serial_number' => 'SN-NO-PERM',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('assets', ['serial_number' => 'SN-NO-PERM']);
    }

    public function test_upload_forbids_without_asset_create(): void
    {
        $this->user->revokePermissionTo('asset.create');

        Storage::fake('public');

        $this->actingAs($this->user)
            ->post(route('tenant.assets.upload', ['tenant' => $this->tenant->code]), [
                'file' => UploadedFile::fake()->image('asset-photo.jpg', 100, 100),
            ])
            ->assertForbidden();
    }

    public function test_import_template_forbids_without_asset_create(): void
    {
        $this->user->revokePermissionTo('asset.create');

        $this->actingAs($this->user)
            ->get(route('tenant.assets.import-template', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_import_forbids_without_asset_create(): void
    {
        $this->user->revokePermissionTo('asset.create');

        $this->actingAs($this->user)
            ->post(route('tenant.assets.import', ['tenant' => $this->tenant->code]), [
                'file' => UploadedFile::fake()->create('assets.csv', 'brand,model,serial_number\nBrand X,Model Y,SN-X\n'),
                'item_id' => Item::factory()->create()->id,
            ])
            ->assertForbidden();
    }

    public function test_create_ok_with_asset_create(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.create', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    public function test_store_ok_with_asset_create(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $this->actingAs($this->user)
            ->post(route('tenant.assets.store', ['tenant' => $this->tenant->code]), [
                'item_id' => $item->id,
                'serial_number' => 'SN-GATE-STORE-001',
            ])
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-GATE-STORE-001']);
    }

    public function test_upload_ok_with_asset_create(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user)
            ->post(route('tenant.assets.upload', ['tenant' => $this->tenant->code]), [
                'file' => UploadedFile::fake()->image('asset-photo.jpg', 100, 100),
            ])
            ->assertOk()
            ->assertJsonStructure(['url']);
    }

    public function test_import_template_ok_with_asset_create(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.assets.import-template', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertDownload('template-import-aset.xlsx');
    }

    public function test_import_ok_with_asset_create(): void
    {
        [, , , , , $item] = $this->itemWithCategory();

        $csv = implode(',', ['brand', 'model', 'serial_number'])."\n"
            .implode(',', ['Brand X', 'Model Y', 'SN-GATE-IMPORT-001'])."\n";

        $file = UploadedFile::fake()->createWithContent('assets.csv', $csv);

        $this->actingAs($this->user)
            ->post(route('tenant.assets.import', ['tenant' => $this->tenant->code]), [
                'file' => $file,
                'item_id' => $item->id,
            ])
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('assets', ['serial_number' => 'SN-GATE-IMPORT-001']);
    }

    // ---------- asset.edit ----------

    public function test_edit_forbids_without_asset_edit(): void
    {
        $this->user->revokePermissionTo('asset.edit');

        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.assets.edit', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertForbidden();
    }

    public function test_update_forbids_without_asset_edit(): void
    {
        $this->user->revokePermissionTo('asset.edit');

        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->patch(route('tenant.assets.update', ['tenant' => $this->tenant->code, '$asset' => $asset]), ['brand' => 'Tidak Boleh'])
            ->assertForbidden();

        $this->assertSame($asset->refresh()->brand, $asset->brand);
    }

    public function test_edit_ok_with_asset_edit(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.assets.edit', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk();
    }

    public function test_update_ok_with_asset_edit(): void
    {
        $asset = Asset::factory()->create(['brand' => 'Brand Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.assets.update', ['tenant' => $this->tenant->code, '$asset' => $asset]), ['brand' => 'Brand Baru'])
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertSame('Brand Baru', $asset->refresh()->brand);
    }

    // ---------- asset.delete ----------

    public function test_destroy_forbids_without_asset_delete(): void
    {
        $this->user->revokePermissionTo('asset.delete');

        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.assets.destroy', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertForbidden();

        $this->assertDatabaseHas('assets', ['id' => $asset->id]);
    }

    public function test_destroy_bulk_forbids_without_asset_delete(): void
    {
        $this->user->revokePermissionTo('asset.delete');

        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.assets.destroy-bulk', ['tenant' => $this->tenant->code]), ['ids' => [$asset->id]])
            ->assertForbidden();

        $this->assertDatabaseHas('assets', ['id' => $asset->id]);
    }

    public function test_destroy_ok_with_asset_delete(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.assets.destroy', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
    }

    public function test_destroy_bulk_ok_with_asset_delete(): void
    {
        $targets = Asset::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.assets.destroy-bulk', ['tenant' => $this->tenant->code]), ['ids' => $targets->pluck('id')->all()])
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertSame(0, Asset::query()->whereKey($targets->pluck('id'))->count());
    }
}
