<?php

namespace Tests\Feature;

use App\Enums\AssetStatus;
use App\Models\Asset;
use App\Models\Department;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DisposedAssetGuardTest extends TestCase
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

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (['asset.edit', 'asset.delete', 'asset.transfer.create'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.edit', 'asset.delete', 'asset.transfer.create']);
    }

    private function activeAsset(array $attributes = []): Asset
    {
        return Asset::factory()->create(array_merge([
            'status' => AssetStatus::ACTIVE->value,
        ], $attributes));
    }

    private function disposedAsset(array $attributes = []): Asset
    {
        return Asset::factory()->create(array_merge([
            'status' => AssetStatus::DISPOSED->value,
        ], $attributes));
    }

    // ---------- asset.edit (update) ----------

    public function test_update_rejects_disposed_asset(): void
    {
        $asset = $this->disposedAsset(['brand' => 'Brand Lama']);
        $originalBrand = $asset->brand;

        $this->actingAs($this->user)
            ->from(route('tenant.assets.edit', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->patch(route('tenant.assets.update', ['tenant' => $this->tenant->code, '$asset' => $asset]), ['brand' => 'Diubah Paksa'])
            ->assertRedirect()
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertSame($originalBrand, $asset->refresh()->brand);
        $this->assertSame(AssetStatus::DISPOSED->value, $asset->status->value);
    }

    public function test_update_allows_active_asset(): void
    {
        $asset = $this->activeAsset(['brand' => 'Brand Awal']);

        $this->actingAs($this->user)
            ->patch(route('tenant.assets.update', ['tenant' => $this->tenant->code, '$asset' => $asset]), ['brand' => 'Brand Baru'])
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertSame('Brand Baru', $asset->refresh()->brand);
    }

    // ---------- asset.delete (destroy) ----------

    public function test_destroy_rejects_disposed_asset(): void
    {
        $asset = $this->disposedAsset();

        $this->actingAs($this->user)
            ->from(route('tenant.assets.edit', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->delete(route('tenant.assets.destroy', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertRedirect()
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'DSP']);
    }

    public function test_destroy_allows_active_asset(): void
    {
        $asset = $this->activeAsset();

        $this->actingAs($this->user)
            ->delete(route('tenant.assets.destroy', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertRedirect(route('tenant.assets.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
    }

    // ---------- asset.transfer.create (store) ----------

    public function test_transfer_store_rejects_disposed_asset(): void
    {
        $asset = $this->disposedAsset();
        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'to_location_id' => $location->id,
                'quantity' => 1,
            ])
            ->assertRedirect()
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertDatabaseCount('asset_transfers', 0);
    }

    public function test_transfer_store_allows_active_asset(): void
    {
        $asset = $this->activeAsset();
        $toLocation = Location::factory()->create();
        $toDepartment = Department::factory()->create();

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
                'notes' => 'Uji guard disposed aset',
            ])
            ->assertRedirect(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('asset_transfers', [
            'asset_id' => $asset->id,
            'notes' => 'Uji guard disposed aset',
        ]);
    }
}
