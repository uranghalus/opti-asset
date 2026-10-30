<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\CapitalizationThreshold;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class DashboardAssetTypeBreakdownTest extends TestCase
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

    public function test_dashboard_renders_asset_type_breakdown_when_assets_exist(): void
    {
        $this->givenActiveCapitalizationThreshold();

        Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 10_000_000,
            'accumulated_depreciation' => 2_000_000,
        ]);

        Asset::factory()->create([
            'asset_type' => 'equipment',
            'acquisition_cost' => 4_000_000,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.dashboard', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('asset_by_type', 2)
                ->where('asset_by_type.0.type', 'equipment')
                ->where('asset_by_type.0.label', 'Peralatan')
                ->where('asset_by_type.0.count', 1)
                ->where('asset_by_type.0.value', '4000000.00')
                ->where('asset_by_type.0.book_value', '4000000.00')
                ->where('asset_by_type.1.type', 'fixed_asset')
                ->where('asset_by_type.1.label', 'Aktiva Tetap')
                ->where('asset_by_type.1.count', 1)
                ->where('asset_by_type.1.value', '10000000.00')
                ->where('asset_by_type.1.book_value', '8000000.00'));
    }

    public function test_dashboard_shows_correct_counts_and_values_per_type(): void
    {
        $this->givenActiveCapitalizationThreshold();

        Asset::factory()->count(2)->create([
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 10_000_000,
            'accumulated_depreciation' => 2_000_000,
        ]);

        Asset::factory()->count(3)->create([
            'asset_type' => 'equipment',
            'acquisition_cost' => 4_000_000,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.dashboard', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('asset_by_type', 2)
                ->where('asset_by_type.0.type', 'equipment')
                ->where('asset_by_type.0.count', 3)
                ->where('asset_by_type.0.value', '12000000.00')
                ->where('asset_by_type.0.book_value', '12000000.00')
                ->where('asset_by_type.1.type', 'fixed_asset')
                ->where('asset_by_type.1.count', 2)
                ->where('asset_by_type.1.value', '20000000.00')
                ->where('asset_by_type.1.book_value', '16000000.00'));
    }

    public function test_dashboard_asset_type_breakdown_is_empty_when_no_assets(): void
    {
        $this->actingAs($this->user)
            ->get(route('tenant.dashboard', ['tenant' => $this->tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('stats.total_assets', 0)
                ->where('asset_by_type', []));
    }

    private function givenActiveCapitalizationThreshold(): void
    {
        CapitalizationThreshold::create([
            'amount' => 5_000_000,
            'currency' => 'IDR',
            'created_by' => $this->user->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);
    }
}
