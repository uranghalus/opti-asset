<?php

namespace Tests\Feature;

use App\Enums\AssetStatus;
use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AssetDisposalTest extends TestCase
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

        foreach (['asset.disposal.view', 'asset.disposal.create', 'asset.disposal.edit', 'asset.disposal.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.disposal.view', 'asset.disposal.create', 'asset.disposal.edit', 'asset.disposal.delete']);
    }

    public function test_store_forbids_user_without_disposal_create_permission(): void
    {
        $this->user->revokePermissionTo('asset.disposal.create');

        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.disposals.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'reason' => 'Rusak',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('asset_disposals', 0);
    }

    public function test_approve_forbids_user_without_disposal_edit_permission(): void
    {
        $this->user->revokePermissionTo('asset.disposal.edit');

        $disposal = AssetDisposal::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.disposals.approve', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertForbidden();

        $this->assertNotSame(AssetStatus::DISPOSED, $disposal->asset->refresh()->status);
    }

    // ---------- FR-07.6: hanya aset aktif yang dapat dihapus ----------

    public function test_store_rejects_disposal_of_non_active_asset(): void
    {
        $asset = Asset::factory()->create(['status' => 'DSP']);

        $this->actingAs($this->user)
            ->post(route('tenant.disposals.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'reason' => 'Sudah dihapus sebelumnya',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('asset_disposals', 0);
    }

    public function test_index_renders_disposals_with_pagination(): void
    {
        AssetDisposal::factory()->count(20)->create();

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-disposals/Index')
                ->has('disposals.data', 15)
                ->where('disposals.total', 20)
                ->where('disposals.per_page', 15)
                ->where('disposals.last_page', 2)
                ->has('filters'));
    }

    public function test_index_searches_disposals_by_asset_kode_and_reason(): void
    {
        $target = AssetDisposal::factory()->create([
            'reason' => 'Rusak parah',
        ]);

        AssetDisposal::factory()->create([
            'reason' => 'Pensiun aset',
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.index', array_merge(['tenant' => $this->tenant->code], ['search' => 'Rusak'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('disposals.total', 1)
                ->where('disposals.data.0.id', $target->id)
                ->where('filters.search', 'Rusak'));
    }

    public function test_index_filters_disposals_by_status(): void
    {
        $pending = AssetDisposal::factory()->create([
            'status' => 'pending',
        ]);
        $approved = AssetDisposal::factory()->create([
            'status' => 'approved',
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.index', array_merge(['tenant' => $this->tenant->code], ['status' => 'pending'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('disposals.total', 1)
                ->where('disposals.data.0.id', $pending->id)
                ->where('filters.status', 'pending'));

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.index', array_merge(['tenant' => $this->tenant->code], ['status' => 'approved'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('disposals.total', 1)
                ->where('disposals.data.0.id', $approved->id));
    }

    public function test_index_only_lists_current_tenants_disposals(): void
    {
        AssetDisposal::factory()->create();

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        AssetDisposal::withoutGlobalScopes()->forceCreate([
            'asset_id' => Asset::withoutGlobalScopes()->forceCreate([
                'id' => '01942f1e-766a-7d2a-bb89-47a88e91f1aa',
                'tenant_id' => $other->id,
                'kode_asset' => 'AST-OTHER',
                'status' => 'ACT',
            ])->id,
            'disposed_by' => $this->user->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('disposals.total', 1));

        $this->assertSame(2, AssetDisposal::count());
    }

    public function test_create_renders_form_with_active_assets(): void
    {
        $asset = Asset::factory()->create(['status' => 'ACT']);
        Asset::factory()->create(['status' => 'DSP']);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-disposals/Create')
                ->has('assets', 1)
                ->where('assets.0.id', $asset->id));
    }

    public function test_create_excludes_disposed_assets(): void
    {
        Asset::factory()->create(['status' => 'ACT']);
        Asset::factory()->create(['status' => 'DSP']);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('assets', fn ($assets) => count($assets) === 1));
    }

    public function test_disposal_can_be_created(): void
    {
        $asset = Asset::factory()->create([
            'status' => 'ACT',
            'kode_asset' => 'AST-001',
        ]);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'reason' => 'Aset sudah rusak total',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]));

        $disposal = AssetDisposal::first();

        $this->assertNotNull($disposal);
        $this->assertSame($asset->id, $disposal->asset_id);
        $this->assertSame('Aset sudah rusak total', $disposal->reason);
        $this->assertSame('pending', $disposal->status->value);
        $this->assertEquals($this->user->id, $disposal->disposed_by);
    }

    public function test_disposal_creation_requires_asset_id(): void
    {
        $this->actingAs($this->user)
            ->from(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.store', ['tenant' => $this->tenant->code]), [
                'reason' => 'Aset rusak',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('asset_id');

        $this->assertSame(0, AssetDisposal::count());
    }

    public function test_disposal_creation_validates_asset_exists(): void
    {
        $this->actingAs($this->user)
            ->from(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => '01942f1e-766a-7d2a-bb89-47a88e91f1aa',
                'reason' => 'Aset rusak',
                'disposal_date' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('asset_id');

        $this->assertSame(0, AssetDisposal::count());
    }

    public function test_show_renders_disposal_details(): void
    {
        $disposal = AssetDisposal::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.show', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-disposals/Show')
                ->where('disposal.id', $disposal->id)
                ->where('disposal.asset.id', $disposal->asset_id)
                ->where('disposal.reason', $disposal->reason)
                ->where('disposal.status', $disposal->status));
    }

    public function test_edit_renders_form_for_pending_disposal(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $asset = Asset::factory()->create(['status' => 'ACT']);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.edit', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-disposals/Edit')
                ->where('disposal.id', $disposal->id)
                ->has('assets'));
    }

    public function test_edit_redirects_for_non_pending_disposal(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->get(route('tenant.disposals.edit', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');
    }

    public function test_pending_disposal_can_be_updated(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $newAsset = Asset::factory()->create(['status' => 'ACT']);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.edit', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->patch(route('tenant.disposals.update', ['tenant' => $this->tenant->code, '$disposal' => $disposal]), [
                'asset_id' => $newAsset->id,
                'reason' => 'Alasan diperbarui',
                'disposal_date' => now()->addDays(5)->toDateString(),
            ])
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]));

        $disposal->refresh();

        $this->assertSame($newAsset->id, $disposal->asset_id);
        $this->assertSame('Alasan diperbarui', $disposal->reason);
    }

    public function test_non_pending_disposal_cannot_be_updated(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'approved']);
        $newAsset = Asset::factory()->create(['status' => 'ACT']);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.edit', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->patch(route('tenant.disposals.update', ['tenant' => $this->tenant->code, '$disposal' => $disposal]), [
                'asset_id' => $newAsset->id,
                'reason' => 'Alasan diperbarui',
            ])
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');
    }

    public function test_pending_disposal_can_be_deleted(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->actingAs($this->user)
            ->delete(route('tenant.disposals.destroy', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseMissing('asset_disposals', ['id' => $disposal->id]);
    }

    public function test_non_pending_disposal_cannot_be_deleted(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->delete(route('tenant.disposals.destroy', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertDatabaseHas('asset_disposals', ['id' => $disposal->id]);
    }

    public function test_pending_disposal_can_be_approved(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $asset = $disposal->asset;
        $originalStatus = $asset->status;

        $this->actingAs($this->user)
            ->post(route('tenant.disposals.approve', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'success');

        $disposal->refresh();
        $asset->refresh();

        $this->assertSame('approved', $disposal->status->value);
        $this->assertSame('DSP', $asset->status->value);
        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'disposal',
            'changed_by' => $this->user->id,
        ]);
    }

    public function test_pending_disposal_can_be_rejected(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);
        $asset = $disposal->asset;
        $originalStatus = $asset->status;

        $this->actingAs($this->user)
            ->post(route('tenant.disposals.reject', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'success');

        $disposal->refresh();
        $asset->refresh();

        $this->assertSame('rejected', $disposal->status->value);
        $this->assertSame($originalStatus instanceof AssetStatus ? $originalStatus->value : $originalStatus, $asset->status->value);
        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'disposal',
            'changed_by' => $this->user->id,
        ]);
    }

    public function test_non_pending_disposal_cannot_be_approved(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'rejected']);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.approve', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertSame('rejected', $disposal->fresh()->status->value);
    }

    public function test_bulk_delete_only_deletes_pending_disposals(): void
    {
        $pending1 = AssetDisposal::factory()->create(['status' => 'pending']);
        $pending2 = AssetDisposal::factory()->create(['status' => 'pending']);
        $approved = AssetDisposal::factory()->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.bulk', ['tenant' => $this->tenant->code]), [
                'ids' => [$pending1->id, $pending2->id, $approved->id],
            ])
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'success');

        $this->assertDatabaseMissing('asset_disposals', ['id' => $pending1->id]);
        $this->assertDatabaseMissing('asset_disposals', ['id' => $pending2->id]);
        $this->assertDatabaseHas('asset_disposals', ['id' => $approved->id]);
    }

    public function test_bulk_delete_with_no_pending_returns_error(): void
    {
        $approved = AssetDisposal::factory()->create(['status' => 'approved']);
        $rejected = AssetDisposal::factory()->create(['status' => 'rejected']);

        $this->actingAs($this->user)
            ->from(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.disposals.bulk', ['tenant' => $this->tenant->code]), [
                'ids' => [$approved->id, $rejected->id],
            ])
            ->assertRedirect(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertSessionHas('inertia.flash_data.toast.type', 'error');

        $this->assertDatabaseHas('asset_disposals', ['id' => $approved->id]);
        $this->assertDatabaseHas('asset_disposals', ['id' => $rejected->id]);
    }

    public function test_guests_are_redirected_from_index(): void
    {
        $this->get(route('tenant.disposals.index', ['tenant' => $this->tenant->code]))
            ->assertRedirect(route('home'));
    }

    public function test_guests_are_redirected_from_create(): void
    {
        $this->get(route('tenant.disposals.create', ['tenant' => $this->tenant->code]))
            ->assertRedirect(route('home'));
    }

    public function test_guests_are_redirected_from_show(): void
    {
        $disposal = AssetDisposal::factory()->create();

        $this->get(route('tenant.disposals.show', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('home'));
    }

    public function test_guests_are_redirected_from_approve_and_reject(): void
    {
        $disposal = AssetDisposal::factory()->create(['status' => 'pending']);

        $this->post(route('tenant.disposals.approve', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('home'));

        $this->post(route('tenant.disposals.reject', ['tenant' => $this->tenant->code, '$disposal' => $disposal]))
            ->assertRedirect(route('home'));
    }
}
