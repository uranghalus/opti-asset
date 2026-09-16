<?php

namespace Tests\Unit\Services;

use App\Models\Asset;
use App\Models\CapitalizationThreshold;
use App\Models\Tenant;
use App\Models\User;
use App\Services\DepreciationCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DepreciationCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private DepreciationCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->calculator = new DepreciationCalculator;

        $tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $tenant->makeCurrent();

        // Tanggal acuan tetap agar hasil hitungan deterministik.
        Carbon::setTestNow(Carbon::parse('2026-09-15 10:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function makeAsset(array $attributes = []): Asset
    {
        // AssetFactory memicu observer (AssetTypeAssigner); buat langsung
        // tanpa observer dengan mematikan tipe otomatis (tanpa threshold).
        return Asset::factory()->create($attributes);
    }

    // ---------- Konvensi dasar ----------

    public function test_method_none_yields_zero(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'none',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame('0.00', $this->calculator->compute($asset));
    }

    public function test_missing_cost_yields_zero(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => null,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame('0.00', $this->calculator->compute($asset));
    }

    public function test_missing_useful_life_yields_zero(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => null,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame('0.00', $this->calculator->compute($asset));
    }

    public function test_service_not_started_yields_zero(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2026-10-01'), // masa depan
        ]);

        $this->assertSame('0.00', $this->calculator->compute($asset));
    }

    // ---------- Straight line (hand-verified) ----------

    /**
     * Cost 12.000.000, life 4 tahun → 48 bulan → 250.000/bulan.
     * In service sejak 2024-01-01, acuan 2026-09-15 → 32 bulan penuh.
     * 32 × 250.000 = 8.000.000.
     */
    public function test_straight_line_thirty_two_full_months(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $this->assertSame('8000000.00', $this->calculator->compute($asset));
    }

    /**
     * Partial month tidak dihitung: mulai 2024-02-10, acuan 2024-03-15
     * → hanya 1 bulan penuh (Feb→Mar) → 1 × 250.000.
     */
    public function test_straight_line_partial_month_not_counted(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-02-10'),
        ]);

        $this->calculator->compute($asset);
        $result = $this->calculator->compute($asset, Carbon::parse('2024-03-15'));

        $this->assertSame('250000.00', $result);
    }

    /**
     * Capped at cost: in service jauh lebih lama dari masa manfaat.
     * 12.000.000 over 4 tahun → habis tepat di 48 bulan; 100 bulan tetap 12.000.000.
     */
    public function test_straight_line_caps_at_acquisition_cost(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2018-01-01'),
        ]);

        $this->assertSame('12000000.00', $this->calculator->compute($asset));
    }

    // ---------- Declining balance (hand-verified) ----------

    /**
     * Double declining, cost 12.000.000, life 4 tahun (48 bulan) → rate 2/48 = 4,1667%/bln.
     * Bulan 1: 12.000.000 × 0,0416667 = 500.000; sisa 11.500.000.
     * Bulan 2: 11.500.000 × 0,0416667 = 479.166,67; sisa 11.020.833,33.
     * Akumulasi 2 bulan = 979.166,67.
     */
    public function test_declining_balance_two_months(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'declining_balance',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        $result = $this->calculator->compute($asset, Carbon::parse('2024-03-01'));

        $this->assertSame('979166.67', $result);
    }

    /**
     * Declining balance tak pernah mencapai nol secara alami; setelah
     * masa manfaat lewat, nilai sisa tetap ada (2% dari cost pada
     * 48 bulan) — capping at cost tidak boleh terpicu.
     * 100 bulan: sisa = 12.000.000 × (1 − 2/48)^100 ≈ 1.307.055,53
     * → akumulasi ≈ 10.692.944,47 < cost.
     */
    public function test_declining_balance_long_horizon(): void
    {
        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'declining_balance',
            'in_come_date' => Carbon::parse('2018-01-01'),
        ]);

        $result = (float) $this->calculator->compute($asset);

        $this->assertLessThan(12_000_000, $result);
        $this->assertGreaterThan(10_600_000, $result);
    }

    // ---------- Nilai buku (integrasi model) ----------

    public function test_book_value_uses_computed_depreciation(): void
    {
        // Threshold aktif agar aset menjadi fixed_asset (nilai buku relevan).
        $admin = User::factory()->create(['tenant_id' => 'acme']);
        CapitalizationThreshold::create([
            'amount' => 1_000_000,
            'currency' => 'IDR',
            'created_by' => $admin->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);

        $asset = $this->makeAsset([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => Carbon::parse('2024-01-01'),
        ]);

        // 32 bulan × 250.000 = 8.000.000; nilai buku = 4.000.000.
        $this->assertSame('4000000.00', $asset->refresh()->book_value);
    }
}
