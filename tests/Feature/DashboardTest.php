<?php

namespace Tests\Feature;

use App\Enums\AssetStatus;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\CapitalizationThreshold;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    public function test_dashboard_renders_with_asset_stats(): void
    {
        Asset::factory()->count(3)->create(['status' => AssetStatus::ACTIVE]);
        Asset::factory()->count(2)->create(['status' => AssetStatus::LOANED]);
        Asset::factory()->count(1)->create(['status' => AssetStatus::REPAIR]);

        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('stats.total_assets', 6)
                ->where('stats.asset_by_status.ACT', 3)
                ->where('stats.asset_by_status.LOAN', 2)
                ->where('stats.asset_by_status.RPR', 1)
                ->where('stats.asset_by_status.MUT', 0)
                ->where('stats.asset_by_status.DSP', 0)
                ->where('stats.pending_transfers', 0)
                ->where('stats.pending_disposals', 0)
                ->has('warranty_alerts')
                ->has('asset_by_classification')
                ->has('asset_by_type')
                ->has('asset_by_location')
                ->has('recent_transfers')
                ->has('recent_disposals')
                ->has('integrity_score'));
    }

    // ---------- FR-13.8: breakdown jumlah & nilai per Tipe Aset ----------

    public function test_dashboard_shows_asset_type_breakdown_with_values(): void
    {
        // Threshold aktif agar assigner membiarkan tipe eksplisit tetap terpasang
        // (tanpa threshold, observer menimpa fixed_asset → equipment).
        CapitalizationThreshold::create([
            'amount' => 5_000_000,
            'currency' => 'IDR',
            'created_by' => $this->user->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);

        // Aktiva Tetap: 10jt perolehan, 2jt akumulasi → nilai buku 8jt.
        Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 10_000_000,
            'accumulated_depreciation' => 2_000_000,
        ]);

        // Peralatan: 4jt perolehan (di bawah threshold).
        Asset::factory()->create([
            'acquisition_cost' => 4_000_000,
        ]);

        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('asset_by_type', 2)
                ->where('asset_by_type.0.type', 'equipment')
                ->where('asset_by_type.0.count', 1)
                ->where('asset_by_type.0.value', '4000000.00')
                ->where('asset_by_type.0.book_value', '4000000.00')
                ->where('asset_by_type.1.type', 'fixed_asset')
                ->where('asset_by_type.1.count', 1)
                ->where('asset_by_type.1.value', '10000000.00')
                ->where('asset_by_type.1.book_value', '8000000.00'));
    }

    public function test_dashboard_counts_pending_transfers(): void
    {
        Asset::factory()->count(2)->create();
        AssetTransfer::factory()->count(3)->create(['status' => 'pending']);
        AssetTransfer::factory()->count(1)->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.pending_transfers', 3));
    }

    public function test_dashboard_includes_warranty_alerts(): void
    {
        $expired = Asset::factory()->create([
            'warranty_expire' => Carbon::now()->subDays(10),
        ]);
        $expiringSoon = Asset::factory()->create([
            'warranty_expire' => Carbon::now()->addDays(5),
        ]);
        Asset::factory()->create([
            'warranty_expire' => Carbon::now()->addDays(60),
        ]);

        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('warranty_alerts.expired', 1)
                ->where('warranty_alerts.expiring_soon', 1)
                ->where('warranty_alerts.expiring_30', 2)
                ->has('warranty_alerts.assets', 2));
    }

    public function test_dashboard_returns_empty_stats_when_no_assets(): void
    {
        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.total_assets', 0)
                ->where('stats.pending_transfers', 0)
                ->where('warranty_alerts.expired', 0)
                ->where('warranty_alerts.expiring_soon', 0));
    }

    public function test_dashboard_orders_warranty_alerts_by_expiry_date(): void
    {
        Asset::factory()->create(['warranty_expire' => Carbon::now()->addDays(20)]);
        Asset::factory()->create(['warranty_expire' => Carbon::now()->addDays(2)]);
        Asset::factory()->create(['warranty_expire' => Carbon::now()->addDays(10)]);

        $this->actingAs($this->user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('warranty_alerts.assets.0.days_until', 2)
                ->where('warranty_alerts.assets.1.days_until', 10));
    }
}
