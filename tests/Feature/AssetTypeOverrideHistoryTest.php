<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AssetTypeOverrideHistoryTest extends TestCase
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

        foreach (['asset.view', 'asset.edit'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.view', 'asset.edit']);
    }

    public function test_asset_type_change_is_recorded_in_history(): void
    {
        // type_override_reason dipakai agar AssetTypeAssigner tidak menimpa
        // nilai asset_type yang di-set secara manual (lihat AssetObserver::updated).
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Override untuk pengujian',
        ]);

        $this->actingAs($this->user)
            ->patch(route('assets.update', $asset), [
                'asset_type' => 'equipment',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame('equipment', $asset->refresh()->asset_type);

        $entry = $asset->histories()->where('field', 'asset_type')->first();

        $this->assertNotNull($entry);
        $this->assertSame('Aktiva Tetap', $entry->old_value);
        $this->assertSame('Peralatan', $entry->new_value);
    }

    public function test_type_override_reason_change_is_recorded_in_history(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'equipment',
            'type_override_reason' => null,
        ]);

        $this->actingAs($this->user)
            ->patch(route('assets.update', $asset), [
                'type_override_reason' => 'Kebijakan internal perusahaan',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame('Kebijakan internal perusahaan', $asset->refresh()->type_override_reason);

        $entry = $asset->histories()->where('field', 'type_override_reason')->first();

        $this->assertNotNull($entry);
        $this->assertSame('', $entry->old_value);
        $this->assertSame('Kebijakan internal perusahaan', $entry->new_value);
    }

    public function test_asset_type_and_type_override_reason_together_are_recorded(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Alasan lama',
        ]);

        $this->actingAs($this->user)
            ->patch(route('assets.update', $asset), [
                'asset_type' => 'equipment',
                'type_override_reason' => 'Alasan baru',
            ])
            ->assertRedirect(route('assets.index'));

        $typeEntry = $asset->histories()->where('field', 'asset_type')->first();
        $this->assertNotNull($typeEntry);
        $this->assertSame('Aktiva Tetap', $typeEntry->old_value);
        $this->assertSame('Peralatan', $typeEntry->new_value);

        $reasonEntry = $asset->histories()->where('field', 'type_override_reason')->first();
        $this->assertNotNull($reasonEntry);
        $this->assertSame('Alasan lama', $reasonEntry->old_value);
        $this->assertSame('Alasan baru', $reasonEntry->new_value);
    }

    public function test_unchanged_asset_type_records_no_history(): void
    {
        $asset = Asset::factory()->create([
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Alasan tetap',
        ]);

        $this->actingAs($this->user)
            ->patch(route('assets.update', $asset), [
                'asset_type' => 'fixed_asset',
            ])
            ->assertRedirect(route('assets.index'));

        $this->assertSame(0, $asset->histories()->count());
    }
}
