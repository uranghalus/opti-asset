<?php

namespace Tests\Feature;

use App\Models\AssetGroup;
use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ItemCategoryLocationGateTest extends TestCase
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

        foreach ([
            'asset.item.view', 'asset.item.create', 'asset.item.edit', 'asset.item.delete',
            'asset.category.view', 'asset.category.create', 'asset.category.edit', 'asset.category.delete',
            'asset.location.view', 'asset.location.create', 'asset.location.edit', 'asset.location.delete',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo([
            'asset.item.view', 'asset.item.create', 'asset.item.edit', 'asset.item.delete',
            'asset.category.view', 'asset.category.create', 'asset.category.edit', 'asset.category.delete',
            'asset.location.view', 'asset.location.create', 'asset.location.edit', 'asset.location.delete',
        ]);
    }

    // ---------- asset.item.view ----------

    public function test_item_index_forbids_without_asset_item_view(): void
    {
        $this->user->revokePermissionTo('asset.item.view');

        $this->actingAs($this->user)
            ->get(route('tenant.items.index', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_item_index_ok_with_asset_item_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.items.index', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    // ---------- asset.item.create ----------

    public function test_item_store_forbids_without_asset_item_create(): void
    {
        $this->user->revokePermissionTo('asset.item.create');

        $this->actingAs($this->user)
            ->post(route('tenant.items.store', ['tenant' => $this->tenant->code]), [
                'code' => 'ITM-NO-PERM-001',
                'name' => 'Item Tanpa Izin',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('items', ['code' => 'ITM-NO-PERM-001']);
    }

    public function test_item_store_ok_with_asset_item_create(): void
    {
        $this->actingAs($this->user)->get(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $this->actingAs($this->user)
            ->post(route('tenant.items.store', ['tenant' => $this->tenant->code]), [
                'code' => 'ITM-GATE-STORE-001',
                'name' => 'Item Dengan Izin',
            ])
            ->assertRedirect(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('items', ['code' => 'ITM-GATE-STORE-001']);
    }

    // ---------- asset.item.edit ----------

    public function test_item_assign_category_batch_forbids_without_asset_item_edit(): void
    {
        $this->user->revokePermissionTo('asset.item.edit');

        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.items.batch-category', ['tenant' => $this->tenant->code]), [
                'ids' => [$item->id],
                'category_id' => null,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_item_assign_category_batch_ok_with_asset_item_edit(): void
    {
        $this->actingAs($this->user)->get(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $category = Category::factory()->create();
        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.items.batch-category', ['tenant' => $this->tenant->code]), [
                'ids' => [$item->id],
                'category_id' => $category->id,
            ])
            ->assertRedirect(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('items', ['id' => $item->id, 'category_id' => $category->id]);
    }

    public function test_item_update_forbids_without_asset_item_edit(): void
    {
        $this->user->revokePermissionTo('asset.item.edit');

        $item = Item::factory()->create(['name' => 'Nama Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.items.update', ['tenant' => $this->tenant->code, '$item' => $item]), [
                'code' => $item->code,
                'name' => 'Tidak Boleh Diubah',
            ])
            ->assertForbidden();

        $this->assertSame('Nama Awal', $item->refresh()->name);
    }

    public function test_item_update_ok_with_asset_item_edit(): void
    {
        $this->actingAs($this->user)->get(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $item = Item::factory()->create(['name' => 'Nama Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.items.update', ['tenant' => $this->tenant->code, '$item' => $item]), [
                'code' => $item->code,
                'name' => 'Nama Baru',
            ])
            ->assertRedirect(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $this->assertSame('Nama Baru', $item->refresh()->name);
    }

    // ---------- asset.item.delete ----------

    public function test_item_destroy_forbids_without_asset_item_delete(): void
    {
        $this->user->revokePermissionTo('asset.item.delete');

        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.items.destroy', ['tenant' => $this->tenant->code, '$item' => $item]))
            ->assertForbidden();

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_item_destroy_ok_with_asset_item_delete(): void
    {
        $this->actingAs($this->user)->get(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.items.destroy', ['tenant' => $this->tenant->code, '$item' => $item]))
            ->assertRedirect(route('tenant.items.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('items', ['id' => $item->id]);
    }

    // ---------- asset.category.view ----------

    public function test_category_index_forbids_without_asset_category_view(): void
    {
        $this->user->revokePermissionTo('asset.category.view');

        $this->actingAs($this->user)
            ->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_category_index_ok_with_asset_category_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    // ---------- asset.category.create ----------

    public function test_category_store_forbids_without_asset_category_create(): void
    {
        $this->user->revokePermissionTo('asset.category.create');

        $this->actingAs($this->user)
            ->post(route('tenant.categories.store', ['tenant' => $this->tenant->code]), [
                'name' => 'Kategori Tanpa Izin',
                'classification_type' => 'GROUP',
                'classification_id' => AssetGroup::factory()->create()->id,
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('categories', ['name' => 'Kategori Tanpa Izin']);
    }

    public function test_category_store_ok_with_asset_category_create(): void
    {
        $this->actingAs($this->user)->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.categories.store', ['tenant' => $this->tenant->code]), [
                'name' => 'Kategori Dengan Izin',
                'classification_type' => 'GROUP',
                'classification_id' => $group->id,
            ])
            ->assertRedirect(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('categories', ['name' => 'Kategori Dengan Izin']);
    }

    // ---------- asset.category.edit ----------

    public function test_category_update_forbids_without_asset_category_edit(): void
    {
        $this->user->revokePermissionTo('asset.category.edit');

        $category = Category::factory()->create(['name' => 'Nama Awal']);
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->patch(route('tenant.categories.update', ['tenant' => $this->tenant->code, '$category' => $category]), [
                'name' => 'Tidak Boleh Diubah',
                'classification_type' => 'GROUP',
                'classification_id' => $group->id,
            ])
            ->assertForbidden();

        $this->assertSame('Nama Awal', $category->refresh()->name);
    }

    public function test_category_update_ok_with_asset_category_edit(): void
    {
        $this->actingAs($this->user)->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $category = Category::factory()->create(['name' => 'Nama Awal']);
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->patch(route('tenant.categories.update', ['tenant' => $this->tenant->code, '$category' => $category]), [
                'name' => 'Nama Baru',
                'classification_type' => 'GROUP',
                'classification_id' => $group->id,
            ])
            ->assertRedirect(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $this->assertSame('Nama Baru', $category->refresh()->name);
    }

    // ---------- asset.category.delete ----------

    public function test_category_destroy_forbids_without_asset_category_delete(): void
    {
        $this->user->revokePermissionTo('asset.category.delete');

        $category = Category::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.categories.destroy', ['tenant' => $this->tenant->code, '$category' => $category]))
            ->assertForbidden();

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_category_destroy_ok_with_asset_category_delete(): void
    {
        $this->actingAs($this->user)->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $category = Category::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.categories.destroy', ['tenant' => $this->tenant->code, '$category' => $category]))
            ->assertRedirect(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_category_destroy_bulk_forbids_without_asset_category_delete(): void
    {
        $this->user->revokePermissionTo('asset.category.delete');

        $targets = Category::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.categories.destroy-bulk', ['tenant' => $this->tenant->code]), ['ids' => $targets->pluck('id')->all()])
            ->assertForbidden();

        $this->assertSame(3, Category::query()->whereKey($targets->pluck('id'))->count());
    }

    public function test_category_destroy_bulk_ok_with_asset_category_delete(): void
    {
        $this->actingAs($this->user)->get(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $targets = Category::factory()->count(3)->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.categories.destroy-bulk', ['tenant' => $this->tenant->code]), ['ids' => $targets->pluck('id')->all()])
            ->assertRedirect(route('tenant.categories.index', ['tenant' => $this->tenant->code]));

        $this->assertSame(0, Category::query()->whereKey($targets->pluck('id'))->count());
    }

    // ---------- asset.location.view ----------

    public function test_location_index_forbids_without_asset_location_view(): void
    {
        $this->user->revokePermissionTo('asset.location.view');

        $this->actingAs($this->user)
            ->get(route('tenant.locations.index', ['tenant' => $this->tenant->code]))
            ->assertForbidden();
    }

    public function test_location_index_ok_with_asset_location_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.locations.index', ['tenant' => $this->tenant->code]))
            ->assertOk();
    }

    // ---------- asset.location.create ----------

    public function test_location_store_forbids_without_asset_location_create(): void
    {
        $this->user->revokePermissionTo('asset.location.create');

        $this->actingAs($this->user)
            ->post(route('tenant.locations.store', ['tenant' => $this->tenant->code]), ['name' => 'Lokasi Tanpa Izin'])
            ->assertForbidden();

        $this->assertDatabaseMissing('locations', ['name' => 'Lokasi Tanpa Izin']);
    }

    public function test_location_store_ok_with_asset_location_create(): void
    {
        $this->actingAs($this->user)->get(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $this->actingAs($this->user)
            ->post(route('tenant.locations.store', ['tenant' => $this->tenant->code]), ['name' => 'Lokasi Dengan Izin'])
            ->assertRedirect(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('locations', ['name' => 'Lokasi Dengan Izin']);
    }

    // ---------- asset.location.edit ----------

    public function test_location_update_forbids_without_asset_location_edit(): void
    {
        $this->user->revokePermissionTo('asset.location.edit');

        $location = Location::factory()->create(['name' => 'Nama Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.locations.update', ['tenant' => $this->tenant->code, '$location' => $location]), ['name' => 'Tidak Boleh Diubah'])
            ->assertForbidden();

        $this->assertSame('Nama Awal', $location->refresh()->name);
    }

    public function test_location_update_ok_with_asset_location_edit(): void
    {
        $this->actingAs($this->user)->get(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $location = Location::factory()->create(['name' => 'Nama Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.locations.update', ['tenant' => $this->tenant->code, '$location' => $location]), ['name' => 'Nama Baru'])
            ->assertRedirect(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $this->assertSame('Nama Baru', $location->refresh()->name);
    }

    // ---------- asset.location.delete ----------

    public function test_location_destroy_forbids_without_asset_location_delete(): void
    {
        $this->user->revokePermissionTo('asset.location.delete');

        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.locations.destroy', ['tenant' => $this->tenant->code, '$location' => $location]))
            ->assertForbidden();

        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    public function test_location_destroy_ok_with_asset_location_delete(): void
    {
        $this->actingAs($this->user)->get(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('tenant.locations.destroy', ['tenant' => $this->tenant->code, '$location' => $location]))
            ->assertRedirect(route('tenant.locations.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }
}
