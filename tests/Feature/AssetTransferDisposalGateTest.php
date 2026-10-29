<?php

namespace Tests\Feature;

use App\Enums\AssetStatus;
use App\Enums\AssetTransferStatus;
use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AssetTransferDisposalGateTest extends TestCase
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

        foreach ([
            'asset.transfer.view',
            'asset.transfer.create',
            'asset.transfer.edit',
            'asset.disposal.view',
            'asset.disposal.create',
            'asset.disposal.edit',
            'asset.disposal.delete',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo([
            'asset.transfer.view',
            'asset.transfer.create',
            'asset.transfer.edit',
            'asset.disposal.view',
            'asset.disposal.create',
            'asset.disposal.edit',
            'asset.disposal.delete',
        ]);
    }

    private function activeAsset(): Asset
    {
        return Asset::factory()->create(['status' => AssetStatus::ACTIVE->value]);
    }

    // ---------- asset.transfer.view ----------

    public function test_transfer_index_forbids_without_asset_transfer_view(): void
    {
        $this->user->revokePermissionTo('asset.transfer.view');

        $this->actingAs($this->user)
            ->get(route('asset-transfers.index'))
            ->assertForbidden();
    }

    public function test_transfer_show_forbids_without_asset_transfer_view(): void
    {
        $transfer = AssetTransfer::factory()->create();
        $this->user->revokePermissionTo('asset.transfer.view');

        $this->actingAs($this->user)
            ->get(route('asset-transfers.show', $transfer))
            ->assertForbidden();
    }

    public function test_transfer_index_ok_with_asset_transfer_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('asset-transfers.index'))
            ->assertOk();
    }

    public function test_transfer_show_ok_with_asset_transfer_view(): void
    {
        $transfer = AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->get(route('asset-transfers.show', $transfer))
            ->assertOk();
    }

    // ---------- asset.transfer.create ----------

    public function test_transfer_create_forbids_without_asset_transfer_create(): void
    {
        $this->user->revokePermissionTo('asset.transfer.create');

        $this->actingAs($this->user)
            ->get(route('asset-transfers.create'))
            ->assertForbidden();
    }

    public function test_transfer_store_forbids_without_asset_transfer_create(): void
    {
        $this->user->revokePermissionTo('asset.transfer.create');

        $asset = $this->activeAsset();
        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->post(route('asset-transfers.store'), [
                'asset_id' => $asset->id,
                'to_location_id' => $location->id,
                'quantity' => 1,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('asset_transfers', 0);
    }

    public function test_transfer_create_ok_with_asset_transfer_create(): void
    {
        $this->actingAs($this->user)
            ->get(route('asset-transfers.create'))
            ->assertOk();
    }

    public function test_transfer_store_ok_with_asset_transfer_create(): void
    {
        $asset = $this->activeAsset();
        $toLocation = Location::factory()->create();
        $toDepartment = Department::factory()->create();

        $this->actingAs($this->user)
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
                'asset_id' => $asset->id,
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
                'notes' => 'Uji gate transfer',
            ])
            ->assertRedirect(route('asset-transfers.index'));

        $this->assertDatabaseHas('asset_transfers', [
            'asset_id' => $asset->id,
            'notes' => 'Uji gate transfer',
        ]);
    }

    // ---------- asset.transfer.edit ----------

    public function test_transfer_approve_forbids_without_asset_transfer_edit(): void
    {
        $this->user->revokePermissionTo('asset.transfer.edit');

        $transfer = AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->post(route('asset-transfers.approve', $transfer))
            ->assertForbidden();

        $this->assertSame(AssetTransferStatus::Pending, $transfer->refresh()->status);
    }

    public function test_transfer_reject_forbids_without_asset_transfer_edit(): void
    {
        $this->user->revokePermissionTo('asset.transfer.edit');

        $transfer = AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->post(route('asset-transfers.reject', $transfer))
            ->assertForbidden();

        $this->assertSame(AssetTransferStatus::Pending, $transfer->refresh()->status);
    }

    public function test_transfer_approve_ok_with_asset_transfer_edit(): void
    {
        $fromLocation = Location::factory()->create();
        $toLocation = Location::factory()->create();
        $asset = Asset::factory()->create([
            'status' => AssetStatus::ACTIVE->value,
            'location_id' => $fromLocation->id,
        ]);

        $transfer = AssetTransfer::factory()->create([
            'asset_id' => $asset->id,
            'to_location_id' => $toLocation->id,
        ]);

        $this->actingAs($this->user)
            ->post(route('asset-transfers.approve', $transfer))
            ->assertRedirect(route('asset-transfers.index'));

        $this->assertSame(AssetTransferStatus::Approved, $transfer->refresh()->status);
    }

    public function test_transfer_reject_ok_with_asset_transfer_edit(): void
    {
        $transfer = AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->post(route('asset-transfers.reject', $transfer))
            ->assertRedirect(route('asset-transfers.index'));

        $this->assertSame(AssetTransferStatus::Rejected, $transfer->refresh()->status);
    }

    // ---------- asset.disposal.view ----------

    public function test_disposal_index_forbids_without_asset_disposal_view(): void
    {
        $this->user->revokePermissionTo('asset.disposal.view');

        $this->actingAs($this->user)
            ->get(route('disposals.index'))
            ->assertForbidden();
    }

    public function test_disposal_show_forbids_without_asset_disposal_view(): void
    {
        $disposal = AssetDisposal::factory()->create();
        $this->user->revokePermissionTo('asset.disposal.view');

        $this->actingAs($this->user)
            ->get(route('disposals.show', $disposal))
            ->assertForbidden();
    }

    public function test_disposal_index_ok_with_asset_disposal_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('disposals.index'))
            ->assertOk();
    }

    public function test_disposal_show_ok_with_asset_disposal_view(): void
    {
        $disposal = AssetDisposal::factory()->create();

        $this->actingAs($this->user)
            ->get(route('disposals.show', $disposal))
            ->assertOk();
    }

    // ---------- asset.disposal.create ----------

    public function test_disposal_create_forbids_without_asset_disposal_create(): void
    {
        $this->user->revokePermissionTo('asset.disposal.create');

        $this->actingAs($this->user)
            ->get(route('disposals.create'))
            ->assertForbidden();
    }

    public function test_disposal_store_forbids_without_asset_disposal_create(): void
    {
        $this->user->revokePermissionTo('asset.disposal.create');

        $asset = $this->activeAsset();

        $this->actingAs($this->user)
            ->post(route('disposals.store'), [
                'asset_id' => $asset->id,
                'reason' => 'Rusak total',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('asset_disposals', 0);
    }

    public function test_disposal_create_ok_with_asset_disposal_create(): void
    {
        $this->actingAs($this->user)
            ->get(route('disposals.create'))
            ->assertOk();
    }

    public function test_disposal_store_ok_with_asset_disposal_create(): void
    {
        $asset = $this->activeAsset();

        $this->actingAs($this->user)
            ->from(route('disposals.create'))
            ->post(route('disposals.store'), [
                'asset_id' => $asset->id,
                'reason' => 'Uji gate disposal',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('disposals.index'));

        $this->assertDatabaseHas('asset_disposals', [
            'asset_id' => $asset->id,
            'reason' => 'Uji gate disposal',
        ]);
    }

    // ---------- asset.disposal.edit ----------

    public function test_disposal_edit_forbids_without_asset_disposal_edit(): void
    {
        $this->user->revokePermissionTo('asset.disposal.edit');

        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->get(route('disposals.edit', $disposal))
            ->assertForbidden();
    }

    public function test_disposal_update_forbids_without_asset_disposal_edit(): void
    {
        $this->user->revokePermissionTo('asset.disposal.edit');

        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $newAsset = $this->activeAsset();

        $this->actingAs($this->user)
            ->patch(route('disposals.update', $disposal), [
                'asset_id' => $newAsset->id,
                'reason' => 'Tidak boleh diubah',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertForbidden();

        $this->assertSame('pending', $disposal->refresh()->status->value);
    }

    public function test_disposal_approve_forbids_without_asset_disposal_edit(): void
    {
        $this->user->revokePermissionTo('asset.disposal.edit');

        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('disposals.approve', $disposal))
            ->assertForbidden();

        $this->assertSame('pending', $disposal->refresh()->status->value);
    }

    public function test_disposal_reject_forbids_without_asset_disposal_edit(): void
    {
        $this->user->revokePermissionTo('asset.disposal.edit');

        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('disposals.reject', $disposal))
            ->assertForbidden();

        $this->assertSame('pending', $disposal->refresh()->status->value);
    }

    public function test_disposal_edit_ok_with_asset_disposal_edit(): void
    {
        AssetDisposal::factory()->create(['status' => 'pending']);
        $this->activeAsset();

        $this->actingAs($this->user)
            ->get(route('disposals.edit', AssetDisposal::first()))
            ->assertOk();
    }

    public function test_disposal_update_ok_with_asset_disposal_edit(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $newAsset = $this->activeAsset();

        $this->actingAs($this->user)
            ->from(route('disposals.edit', $disposal))
            ->patch(route('disposals.update', $disposal), [
                'asset_id' => $newAsset->id,
                'reason' => 'Diperbarui lewat uji gate',
                'disposal_date' => now()->addDays(5)->toDateString(),
            ])
            ->assertRedirect(route('disposals.index'));

        $disposal->refresh();
        $this->assertSame($newAsset->id, $disposal->asset_id);
        $this->assertSame('Diperbarui lewat uji gate', $disposal->reason);
    }

    public function test_disposal_approve_ok_with_asset_disposal_edit(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $disposal->asset->update(['status' => AssetStatus::ACTIVE->value]);

        $this->actingAs($this->user)
            ->post(route('disposals.approve', $disposal))
            ->assertRedirect(route('disposals.index'));

        $this->assertSame('approved', $disposal->refresh()->status->value);
        $this->assertSame('DSP', $disposal->asset->refresh()->status->value);
    }

    public function test_disposal_reject_ok_with_asset_disposal_edit(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('disposals.reject', $disposal))
            ->assertRedirect(route('disposals.index'));

        $this->assertSame('rejected', $disposal->refresh()->status->value);
    }

    // ---------- asset.disposal.delete ----------

    public function test_disposal_destroy_forbids_without_asset_disposal_delete(): void
    {
        $this->user->revokePermissionTo('asset.disposal.delete');

        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->delete(route('disposals.destroy', $disposal))
            ->assertForbidden();

        $this->assertDatabaseHas('asset_disposals', ['id' => $disposal->id]);
    }

    public function test_disposal_bulk_forbids_without_asset_disposal_delete(): void
    {
        $this->user->revokePermissionTo('asset.disposal.delete');

        $pending = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('disposals.bulk'), ['ids' => [$pending->id]])
            ->assertForbidden();

        $this->assertDatabaseHas('asset_disposals', ['id' => $pending->id]);
    }

    public function test_disposal_destroy_ok_with_asset_disposal_delete(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->delete(route('disposals.destroy', $disposal))
            ->assertRedirect(route('disposals.index'));

        $this->assertDatabaseMissing('asset_disposals', ['id' => $disposal->id]);
    }

    public function test_disposal_bulk_ok_with_asset_disposal_delete(): void
    {
        $pending1 = AssetDisposal::factory()->create(['status' => 'pending']);
        $pending2 = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->post(route('disposals.bulk'), ['ids' => [$pending1->id, $pending2->id]])
            ->assertRedirect(route('disposals.index'));

        $this->assertDatabaseMissing('asset_disposals', ['id' => $pending1->id]);
        $this->assertDatabaseMissing('asset_disposals', ['id' => $pending2->id]);
    }
}
