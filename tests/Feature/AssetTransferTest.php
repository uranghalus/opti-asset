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

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_index_renders_transfers_with_pagination(): void
    {
        AssetTransfer::factory()->count(20)->create();

        $this->actingAs($this->user)
            ->get(route('asset-transfers.index'))
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
            ->get(route('asset-transfers.index', ['search' => 'Rusak']))
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
            ->get(route('asset-transfers.index', ['status' => 'pending']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1)
                ->where('transfers.data.0.id', $pending->id)
                ->where('filters.status', 'pending'));

        $this->actingAs($this->user)
            ->get(route('asset-transfers.index', ['status' => 'approved']))
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
            ->get(route('asset-transfers.index'))
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
            ->get(route('asset-transfers.create'))
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
            ->get(route('asset-transfers.create'))
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
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
                'asset_id' => $asset->id,
                'to_location_id' => $toLocation->id,
                'to_department_id' => $toDepartment->id_department,
                'quantity' => 1,
                'notes' => 'Pindah ke gudang baru',
            ])
            ->assertRedirect(route('asset-transfers.index'));

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
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
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
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
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
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
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
            ->from(route('asset-transfers.create'))
            ->post(route('asset-transfers.store'), [
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
        $this->get(route('asset-transfers.index'))
            ->assertRedirect(route('home'));
    }

    public function test_guests_are_redirected_from_create(): void
    {
        $this->get(route('asset-transfers.create'))
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
            ->post(route('asset-transfers.approve', $transfer))
            ->assertRedirect(route('asset-transfers.index'));

        $this->assertDatabaseHas('asset_histories', [
            'asset_id' => $asset->id,
            'field' => 'location_id',
            'old_value' => $fromLocation->name,
            'new_value' => $toLocation->name,
            'changed_by' => $this->user->id,
        ]);
    }
}
