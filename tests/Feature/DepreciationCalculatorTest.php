<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use App\Services\DepreciationCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DepreciationCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private DepreciationCalculator $calc;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->calc = app(DepreciationCalculator::class);
    }

    private function fixedAsset(array $overrides = []): Asset
    {
        return Asset::make(array_merge([
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
            'item_id' => Item::factory()->create()->id,
        ], $overrides));
    }

    // ---------- DepreciationCalculator::compute() ----------

    public function test_straight_line_computes_known_values(): void
    {
        $asset = $this->fixedAsset([
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        // monthly = 12 000 000 / (4 × 12) = 250 000
        // 2024-01-01 → 2024-06-01 = 5 full months → 1 250 000
        $this->assertSame('1250000.00', $this->calc->compute($asset, Carbon::parse('2024-06-01')));
    }

    public function test_declining_balance_computes_known_values_floored_at_zero(): void
    {
        $asset = $this->fixedAsset([
            'acquisition_cost' => 1000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'declining_balance',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $accumulated = $this->calc->compute($asset, Carbon::parse('2024-12-31'));

        $this->assertGreaterThan('0.00', $accumulated);
        $this->assertLessThanOrEqual('1000000.00', $accumulated);
    }

    public function test_accumulated_depreciation_capped_at_acquisition_cost(): void
    {
        $asset = $this->fixedAsset([
            'acquisition_cost' => 1000000,
            'useful_life_years' => 1,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        // monthly = 1 000 000 / 12 ≈ 83 333.33, × 24 months = 2 000 000,
        // but capped at cost = 1 000 000
        $this->assertSame('1000000.00', $this->calc->compute($asset, Carbon::parse('2025-12-31')));
    }

    public function test_none_method_returns_zero(): void
    {
        $asset = $this->fixedAsset(['depreciation_method' => 'none']);

        $this->assertSame('0.00', $this->calc->compute($asset));
    }

    public function test_empty_method_returns_zero(): void
    {
        $asset = $this->fixedAsset(['depreciation_method' => '']);

        $this->assertSame('0.00', $this->calc->compute($asset));
    }

    public function test_zero_acquisition_cost_returns_zero(): void
    {
        $asset = $this->fixedAsset(['acquisition_cost' => 0]);

        $this->assertSame('0.00', $this->calc->compute($asset));
    }

    public function test_null_useful_life_returns_zero(): void
    {
        $asset = $this->fixedAsset(['useful_life_years' => null]);

        $this->assertSame('0.00', $this->calc->compute($asset));
    }

    // ---------- AssetObserver: snapshotBookValue dedup ----------

    public function test_created_observer_creates_one_snapshot_per_month(): void
    {
        $asset = Asset::factory()->create([
            'type_override_reason' => 'test',
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame(1, AssetBookValue::where('asset_id', $asset->id)->count());
    }

    public function test_updated_observer_does_not_duplicate_snapshot_same_month(): void
    {
        $asset = Asset::factory()->create([
            'type_override_reason' => 'test',
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame(1, AssetBookValue::where('asset_id', $asset->id)->count());

        $asset->update(['notes' => 'Diperbarui']);

        $this->assertSame(1, AssetBookValue::where('asset_id', $asset->id)->count());
    }

    public function test_non_fixed_asset_observer_skips_snapshot(): void
    {
        $asset = Asset::factory()->create([
            'type_override_reason' => 'test',
            'asset_type' => 'equipment',
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame(0, AssetBookValue::where('asset_id', $asset->id)->count());
    }

    public function test_snapshot_book_value_accuracy(): void
    {
        $asset = Asset::factory()->create([
            'type_override_reason' => 'test',
            'asset_type' => 'fixed_asset',
            'acquisition_cost' => 12000000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $snapshot = AssetBookValue::where('asset_id', $asset->id)->first();

        $this->assertNotNull($snapshot);
        $this->assertSame($asset->book_value, $snapshot->book_value);
        $this->assertSame($asset->accumulated_depreciation, $snapshot->accumulated_depreciation);
    }
}
