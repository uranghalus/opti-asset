<?php

namespace Tests\Feature;

use App\Enums\AssetTransferStatus;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AssetTransferTest extends TestCase
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

        foreach (['asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit']);
    }

    public function test_store_forbids_user_without_transfer_create_permission(): void
    {
        $this->user->revokePermissionTo('asset.transfer.create');

        $asset = Asset::factory()->create();
        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'to_location_id' => $location->id,
                'quantity' => 1,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('asset_transfers', 0);
    }

    public function test_approve_forbids_user_without_transfer_edit_permission(): void
    {
        $this->user->revokePermissionTo('asset.transfer.edit');

        $transfer = AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.asset-transfers.approve', ['tenant' => $this->tenant->code, '$transfer' => $transfer]))
            ->assertForbidden();

        $this->assertSame(AssetTransferStatus::Pending, $transfer->refresh()->status);
    }

    // ---------- FR-07.6: aset terhapus tidak masuk transaksi aktif ----------

    public function test_store_rejects_transfer_of_disposed_asset(): void
    {
        $asset = Asset::factory()->create(['status' => 'DSP']);
        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'to_location_id' => $location->id,
                'quantity' => 1,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('asset_transfers', 0);
    }

    public function test_index_renders_transfers_with_pagination(): void
    {
        AssetTransfer::factory()->count(20)->create();

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-transfers/Index')
                ->has('transfers.data', 15)
                ->where('transfers.total', 20)
                ->where('transfers.per_page', 15)
                ->where('transfers.last_page', 2)
                ->has('departments'));
    }

    public function test_index_searches_transfers_by_asset_kode_and_notes(): void
    {
        $target = AssetTransfer::factory()->create([
            'notes' => 'Rusak karena jatuh',
        ]);

        AssetTransfer::factory()->create([
            'notes' => 'Pindah lokasi rutin',
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.index', array_merge(['tenant' => $this->tenant->code], ['search' => 'Rusak'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1)
                ->where('transfers.data.0.id', $target->id)
                ->where('filters.search', 'Rusak'));
    }

    public function test_index_filters_transfers_by_status(): void
    {
        $pending = AssetTransfer::factory()->create([
            'status' => AssetTransferStatus::Pending,
        ]);
        $approved = AssetTransfer::factory()->create([
            'status' => AssetTransferStatus::Approved,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.index', array_merge(['tenant' => $this->tenant->code], ['status' => 'pending'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1)
                ->where('transfers.data.0.id', $pending->id)
                ->where('filters.status', 'pending'));

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.index', array_merge(['tenant' => $this->tenant->code], ['status' => 'approved'])))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1)
                ->where('transfers.data.0.id', $approved->id));
    }

    public function test_index_only_lists_current_tenants_transfers(): void
    {
        AssetTransfer::factory()->create();

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        AssetTransfer::withoutGlobalScopes()->forceCreate([
            'tenant_id' => $other->id,
            'asset_id' => Asset::withoutGlobalScopes()->forceCreate([
                'id' => '01942f1e-766a-7d2a-bb89-47a88e91f1aa',
                'tenant_id' => $other->id,
                'kode_asset' => 'AST-OTHER',
                'status' => 'ACT',
            ])->id,
            'quantity' => 1,
            'status' => AssetTransferStatus::Pending,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1));

        $this->assertSame(1, AssetTransfer::count());
    }

    public function test_create_renders_form_with_options(): void
    {
        $asset = Asset::factory()->create(['status' => 'ACT']);
        $location = Location::factory()->create();
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-transfers/Create')
                ->has('assets', 1)
                ->where('assets.0.id', $asset->id)
                ->has('locations', 1)
                ->has('departments')
                ->has('employees', 1));
    }

    public function test_create_excludes_disposed_assets(): void
    {
        Asset::factory()->create(['status' => 'ACT']);
        Asset::factory()->create(['status' => 'DSP']);

        $this->actingAs($this->user)
            ->get(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('assets', fn ($assets) => count($assets) === 1));
    }

    public function test_transfer_can_be_created(): void
    {
        $asset = Asset::factory()->create([
            'status' => 'ACT',
            'kode_asset' => 'AST-001',
        ]);
        $toLocation = Location::factory()->create();
        $toDepartment = Department::factory()->create();

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
                'notes' => 'Pindah ke gudang baru',
            ])
            ->assertRedirect(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]));

        $transfer = AssetTransfer::first();

        $this->assertNotNull($transfer);
        $this->assertSame($asset->id, $transfer->asset_id);
        $this->assertSame($toLocation->id, $transfer->to_location_id);
        $this->assertSame($toDepartment->id_department, $transfer->to_department_id);
        $this->assertSame(1, (int) $transfer->quantity);
        $this->assertSame(AssetTransferStatus::Pending, $transfer->status);
        $this->assertEquals($this->user->id, $transfer->requested_by);
    }

    public function test_transfer_creation_requires_asset_id(): void
    {
        $toLocation = Location::factory()->create();
        $toDepartment = Department::factory()->create();

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
            ])
            ->assertSessionHasErrors('asset_id');

        $this->assertSame(0, AssetTransfer::count());
    }

    public function test_transfer_creation_requires_quantity(): void
    {
        $asset = Asset::factory()->create(['status' => 'ACT']);

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'quantity' => null,
            ])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(0, AssetTransfer::count());
    }

    public function test_transfer_creation_requires_quantity_at_least_one(): void
    {
        $asset = Asset::factory()->create(['status' => 'ACT']);

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => $asset->id,
                'quantity' => 0,
            ])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(0, AssetTransfer::count());
    }

    public function test_transfer_creation_validates_asset_exists(): void
    {
        $toLocation = Location::factory()->create();
        $toDepartment = Department::factory()->create();

        $this->actingAs($this->user)
            ->from(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->post(route('tenant.asset-transfers.store', ['tenant' => $this->tenant->code]), [
                'asset_id' => '01942f1e-766a-7d2a-bb89-47a88e91f1aa',
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
            ])
            ->assertSessionHasErrors('asset_id');

        $this->assertSame(0, AssetTransfer::count());
    }

    public function test_guests_are_redirected_from_index(): void
    {
        $this->get(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]))
            ->assertRedirect(route('home'));
    }

    public function test_guests_are_redirected_from_create(): void
    {
        $this->get(route('tenant.asset-transfers.create', ['tenant' => $this->tenant->code]))
            ->assertRedirect(route('home'));
    }

    public function test_approve_records_asset_history(): void
    {
        $fromLocation = Location::factory()->create();
        $toLocation = Location::factory()->create();
        $asset = Asset::factory()->create([
            'status' => 'ACT',
            'location_id' => $fromLocation->id,
        ]);

        $transfer = AssetTransfer::factory()->create([
            'asset_id' => $asset->id,
            'to_location_id' => $toLocation->id,
        ]);

        $this->actingAs($this->user)
            ->post(route('tenant.asset-transfers.approve', ['tenant' => $this->tenant->code, '$transfer' => $transfer]))
            ->assertRedirect(route('tenant.asset-transfers.index', ['tenant' => $this->tenant->code]));

        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'location_id',
            'old_value' => $fromLocation->name,
            'new_value' => $toLocation->name,
            'changed_by' => $this->user->id,
        ]);
    }
}
