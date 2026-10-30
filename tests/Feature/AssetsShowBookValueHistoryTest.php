<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AssetsShowBookValueHistoryTest extends TestCase
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

        Permission::findOrCreate('asset.view', 'web');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.view']);
    }

    public function test_show_renders_book_values_when_present(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Pengujian override',
            'acquisition_cost' => 10000000,
            'accumulated_depreciation' => 2000000,
        ]);

        AssetBookValue::create([
            'asset_id' => $asset->id,
            'period_ends_at' => '2026-12-31',
            'book_value' => '8000000.00',
            'accumulated_depreciation' => '2000000.00',
            'notes' => 'Penyusutan Desember',
            'recorded_by' => $this->user->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Show')
                ->where('asset.book_values.0.book_value', '8000000.00')
                ->where('asset.book_values.0.accumulated_depreciation', '2000000.00')
                ->where('asset.book_values.0.period_ends_at', '2026-12-31T00:00:00.000000Z')
            );
    }

    public function test_show_does_not_crash_when_no_book_values(): void
    {
        $asset = Asset::factory()->create();

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Show')
                ->where('asset.book_values', [])
            );
    }

    public function test_show_shows_accumulated_depreciation_for_fixed_asset(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Pengujian override',
            'acquisition_cost' => 10000000,
            'accumulated_depreciation' => 2000000,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Show')
                ->where('asset.asset_type', 'fixed_asset')
                ->where('asset.accumulated_depreciation', '2000000.00')
            );
    }

    public function test_show_shows_nilai_buku_for_fixed_asset(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Pengujian override',
            'acquisition_cost' => 10000000,
            'accumulated_depreciation' => 2000000,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.show', ['tenant' => $this->tenant->code, '$asset' => $asset]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('assets/Show')
                ->where('asset.asset_type', 'fixed_asset')
                ->where('asset.acquisition_cost', '10000000.00')
                ->where('asset.accumulated_depreciation', '2000000.00')
            );
    }
}
