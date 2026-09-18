<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Models\CapitalizationThreshold;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CapitalizationThresholdTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        Permission::findOrCreate('setting.edit', 'web');
        $role = Role::findOrCreate('super-admin', 'web');
        $role->givePermissionTo('setting.edit');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->superAdmin = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->superAdmin->assignRole('super-admin');
    }

    private function createActiveThreshold(float $amount): CapitalizationThreshold
    {
        return CapitalizationThreshold::create([
            'amount' => $amount,
            'currency' => 'IDR',
            'created_by' => $this->superAdmin->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);
    }

    // ---------- FR-13.2: penentuan tipe otomatis ----------

    public function test_asset_without_acquisition_cost_defaults_to_equipment(): void
    {
        $this->createActiveThreshold(5_000_000);

        $asset = Asset::factory()->create();

        $this->assertSame('equipment', $asset->refresh()->asset_type);
    }

    public function test_asset_at_or_above_active_threshold_becomes_fixed_asset(): void
    {
        $threshold = $this->createActiveThreshold(5_000_000);

        $atThreshold = Asset::factory()->create(['acquisition_cost' => 5_000_000]);
        $aboveThreshold = Asset::factory()->create(['acquisition_cost' => 10_000_000]);

        $this->assertSame('fixed_asset', $atThreshold->refresh()->asset_type);
        $this->assertSame('fixed_asset', $aboveThreshold->refresh()->asset_type);
        $this->assertSame($threshold->id, $atThreshold->capitalization_threshold_id);
    }

    public function test_asset_below_active_threshold_stays_equipment(): void
    {
        $this->createActiveThreshold(5_000_000);

        $asset = Asset::factory()->create(['acquisition_cost' => 4_999_999.99]);

        $this->assertSame('equipment', $asset->refresh()->asset_type);
    }

    public function test_asset_without_active_threshold_defaults_to_equipment(): void
    {
        $asset = Asset::factory()->create(['acquisition_cost' => 100_000_000]);

        $this->assertSame('equipment', $asset->refresh()->asset_type);
    }

    public function test_manual_override_prevents_automatic_reassignment(): void
    {
        $this->createActiveThreshold(5_000_000);

        $asset = Asset::factory()->create([
            'acquisition_cost' => 100_000_000,
            'asset_type' => 'equipment',
            'type_override_reason' => 'Kebijakan internal perusahaan',
        ]);

        $this->assertSame('equipment', $asset->refresh()->asset_type);
        $this->assertSame('Kebijakan internal perusahaan', $asset->type_override_reason);

        // Perubahan lain tidak mengubah tipe yang sudah di-override.
        $asset->update(['brand' => 'Brand Baru']);

        $this->assertSame('equipment', $asset->refresh()->asset_type);
    }

    // ---------- FR-13.10: snapshot nilai buku per periode ----------

    public function test_fixed_asset_creation_snapshots_book_value_for_today(): void
    {
        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin);

        // 12jt / 4 tahun = 250rb per bulan; 8 bulan layanan = 2jt akumulasi.
        $asset = Asset::factory()->create([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => today()->subMonthsNoOverflow(8),
        ]);

        $asset->refresh();

        $this->assertDatabaseHas('asset_book_values', [
            'asset_id' => $asset->id,
            'book_value' => 10_000_000,
            'accumulated_depreciation' => 2_000_000,
            'recorded_by' => $this->superAdmin->id,
        ]);
    }

    public function test_book_value_snapshot_is_deduplicated_per_month(): void
    {
        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin);

        $asset = Asset::factory()->create([
            'acquisition_cost' => 10_000_000,
            'accumulated_depreciation' => 0,
        ]);

        $asset->update(['brand' => 'Ubah Tanpa Ubah Nilai']);

        $this->assertSame(1, AssetBookValue::query()->where('asset_id', $asset->id)->count());
    }

    public function test_book_value_snapshot_created_once_per_period(): void
    {
        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin);

        $this->travelTo(Carbon::parse('2026-08-31'));

        $asset = Asset::factory()->create([
            'acquisition_cost' => 10_000_000,
            'accumulated_depreciation' => 0,
        ]);

        // Bulan berikutnya — snapshot baru wajar dibuat (periode berbeda).
        $this->travelTo(Carbon::parse('2026-09-15'));

        $asset->update(['brand' => 'Ubah Di Bulan Baru']);

        $this->assertSame(2, AssetBookValue::query()->where('asset_id', $asset->id)->count());
    }

    public function test_equipment_does_not_snapshot_book_value(): void
    {
        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin);

        $asset = Asset::factory()->create(['acquisition_cost' => 1_000_000]);

        $this->assertSame(0, AssetBookValue::query()->where('asset_id', $asset->id)->count());
    }

    public function test_book_value_snapshot_survives_missing_authenticated_user(): void
    {
        $this->createActiveThreshold(5_000_000);

        // Tidak ada sesi (CLI/seeder) — snapshot tetap tercatat tanpa recorded_by.
        // 12jt / 4 tahun = 250rb per bulan; 8 bulan layanan = 2jt akumulasi.
        $asset = Asset::factory()->create([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => today()->subMonthsNoOverflow(8),
        ]);

        $this->assertDatabaseHas('asset_book_values', [
            'asset_id' => $asset->id,
            'book_value' => 10_000_000,
            'recorded_by' => null,
        ]);
    }

    // ---------- FR-13.5: kalkulasi nilai buku ----------

    public function test_book_value_is_acquisition_minus_accumulated_depreciation(): void
    {
        $this->createActiveThreshold(5_000_000);

        // 12jt / 4 tahun = 250rb per bulan; 10 bulan layanan = 2,5jt akumulasi.
        $asset = Asset::factory()->create([
            'acquisition_cost' => 12_000_000,
            'useful_life_years' => 4,
            'depreciation_method' => 'straight_line',
            'in_come_date' => today()->subMonthsNoOverflow(10),
        ]);

        $asset->refresh();

        $this->assertSame('9500000.00', $asset->book_value);
    }

    public function test_book_value_is_null_for_equipment(): void
    {
        $asset = Asset::factory()->create([
            'acquisition_cost' => 1_000_000,
            'accumulated_depreciation' => 100_000,
        ]);

        $asset->refresh();

        $this->assertNull($asset->book_value);
    }

    // ---------- FR-13.3: pengaturan ambang batas ----------

    public function test_index_requires_setting_edit_permission(): void
    {
        $this->actingAs($this->user)
            ->get(route('settings.capitalization-threshold.index'))
            ->assertForbidden();
    }

    public function test_index_renders_for_super_admin(): void
    {
        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin)
            ->get(route('settings.capitalization-threshold.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/capitalization-threshold')
                ->has('thresholds', 1)
                ->where('activeThreshold.amount', '5000000.00'));
    }

    public function test_store_creates_active_threshold_and_deactivates_previous(): void
    {
        $old = $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->post(route('settings.capitalization-threshold.store'), [
                'amount' => 10_000_000,
                'currency' => 'IDR',
            ])
            ->assertRedirect();

        $old->refresh();
        $this->assertFalse($old->is_active);

        $new = CapitalizationThreshold::query()->where('is_active', true)->firstOrFail();
        $this->assertSame('10000000.00', $new->amount);
        $this->assertSame('IDR', $new->currency);
        $this->assertSame($this->superAdmin->id, $new->created_by);
    }

    public function test_store_validates_amount(): void
    {
        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->post(route('settings.capitalization-threshold.store'), [
                'amount' => 'bukan-angka',
            ])
            ->assertSessionHasErrors(['amount']);
    }

    public function test_store_rejects_invalid_currency(): void
    {
        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->post(route('settings.capitalization-threshold.store'), [
                'amount' => 5_000_000,
                'currency' => 'XYZ',
            ])
            ->assertSessionHasErrors(['currency']);
    }

    public function test_store_records_audit_log(): void
    {
        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->post(route('settings.capitalization-threshold.store'), [
                'amount' => 5_000_000,
                'currency' => 'IDR',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'created',
            'subject_type' => 'CapitalizationThreshold',
        ]);
    }

    public function test_destroy_removes_threshold(): void
    {
        $threshold = $this->createActiveThreshold(5_000_000);
        CapitalizationThreshold::query()->update(['is_active' => false]);

        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->delete(route('settings.capitalization-threshold.destroy', $threshold))
            ->assertRedirect();

        $this->assertSame(0, CapitalizationThreshold::count());
    }

    // ---------- FR-13.11: migrasi/backfill tipe aset ----------

    public function test_reassign_types_recomputes_stale_assets(): void
    {
        // Aset dibuat sebelum threshold ada — semua equipment (nilai basi).
        $below = Asset::factory()->create(['acquisition_cost' => 1_000_000]);
        $above = Asset::factory()->create(['acquisition_cost' => 20_000_000]);
        $above2 = Asset::factory()->create(['acquisition_cost' => 30_000_000]);

        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin)
            ->from(route('settings.capitalization-threshold.index'))
            ->post(route('settings.capitalization-threshold.reassign-types'))
            ->assertRedirect();

        $this->assertSame('equipment', $below->refresh()->asset_type);
        $this->assertSame('fixed_asset', $above->refresh()->asset_type);
        $this->assertSame('fixed_asset', $above2->refresh()->asset_type);
    }

    public function test_reassign_types_respects_manual_overrides(): void
    {
        $override = Asset::factory()->create([
            'acquisition_cost' => 100_000_000,
            'asset_type' => 'equipment',
            'type_override_reason' => 'Kebijakan internal',
        ]);

        $this->createActiveThreshold(5_000_000);

        $this->actingAs($this->superAdmin)
            ->post(route('settings.capitalization-threshold.reassign-types'))
            ->assertRedirect();

        $this->assertSame('equipment', $override->refresh()->asset_type);
        $this->assertSame('Kebijakan internal', $override->type_override_reason);
    }

    public function test_reassign_types_requires_setting_edit_permission(): void
    {
        $this->actingAs($this->user)
            ->post(route('settings.capitalization-threshold.reassign-types'))
            ->assertForbidden();
    }

    // ---------- FR-13.9: override manual tercatat di riwayat aset ----------

    public function test_type_override_is_recorded_in_asset_history(): void
    {
        $this->createActiveThreshold(5_000_000);

        $asset = Asset::factory()->create(['acquisition_cost' => 20_000_000]);
        $this->assertSame('fixed_asset', $asset->refresh()->asset_type);

        $this->actingAs($this->superAdmin)
            ->from(route('assets.index'))
            ->patch(route('assets.update', $asset), [
                'asset_type' => 'equipment',
                'type_override_reason' => 'Kebijakan internal perusahaan',
            ])
            ->assertRedirect();

        $asset->refresh();

        $this->assertSame('equipment', $asset->asset_type);
        $this->assertSame('Kebijakan internal perusahaan', $asset->type_override_reason);

        $typeEntry = $asset->histories()->where('field', 'asset_type')->first();
        $this->assertNotNull($typeEntry);
        $this->assertSame('Aktiva Tetap', $typeEntry->old_value);
        $this->assertSame('Peralatan', $typeEntry->new_value);

        $reasonEntry = $asset->histories()->where('field', 'type_override_reason')->first();
        $this->assertNotNull($reasonEntry);
        $this->assertSame('Kebijakan internal perusahaan', $reasonEntry->new_value);
    }

    public function test_threshold_routes_require_authentication(): void
    {
        $this->get(route('settings.capitalization-threshold.index'))
            ->assertRedirect();

        $this->post(route('settings.capitalization-threshold.store'), ['amount' => 1])
            ->assertRedirect();
    }
}
