<?php

namespace Tests\Feature;

use App\Enums\ClassificationType;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\CapitalizationThreshold;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ClassificationTypeTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();
    }

    public function test_enum_maps_to_asset_type(): void
    {
        $this->assertSame('equipment', ClassificationType::PERALATAN->toAssetType());
        $this->assertSame('fixed_asset', ClassificationType::AKTIVA_TETAP->toAssetType());
    }

    public function test_composite_fk_rejects_child_with_different_type(): void
    {
        $group = AssetGroup::factory()->peralatan()->create();

        $category = AssetCategory::factory()->make([
            'asset_group_id' => $group->id,
        ]);

        $this->expectException(QueryException::class);
        $category->save();
    }

    public function test_composite_fk_rejects_cluster_with_different_type_than_category(): void
    {
        $group = AssetGroup::factory()->peralatan()->create();
        $category = AssetCategory::factory()->peralatan()->create(['asset_group_id' => $group->id]);

        $cluster = AssetCluster::factory()->make([
            'asset_category_id' => $category->id,
        ]);

        $this->expectException(QueryException::class);
        $cluster->save();
    }

    public function test_full_chain_is_allowed_when_types_match(): void
    {
        $group = AssetGroup::factory()->peralatan()->create();
        $category = AssetCategory::factory()->peralatan()->create(['asset_group_id' => $group->id]);
        $cluster = AssetCluster::factory()->peralatan()->create(['asset_category_id' => $category->id]);
        $subCluster = AssetSubCluster::factory()->peralatan()->create(['asset_cluster_id' => $cluster->id]);

        $this->assertModelExists($subCluster);
        $this->assertSame(ClassificationType::PERALATAN, $group->fresh()->classification_type);
        $this->assertSame(ClassificationType::PERALATAN, $subCluster->fresh()->classification_type);
    }

    public function test_null_child_passes_fk_before_backfill(): void
    {
        $group = AssetGroup::factory()->create();

        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'classification_type' => null,
        ]);

        $this->assertModelExists($category);
    }

    public function test_backfill_maps_unanimous_types(): void
    {
        $equipmentGroup = AssetGroup::factory()->create(['classification_type' => null]);
        $fixedGroup = AssetGroup::factory()->create(['classification_type' => null]);
        Asset::factory()->create(['asset_group_id' => $equipmentGroup->id, 'asset_type' => 'equipment', 'type_override_reason' => 'test']);
        Asset::factory()->create(['asset_group_id' => $fixedGroup->id, 'asset_type' => 'fixed_asset', 'type_override_reason' => 'test']);

        Artisan::call('app:backfill-classification-type');

        $this->assertSame(ClassificationType::PERALATAN->value, $equipmentGroup->fresh()->classification_type?->value);
        $this->assertSame(ClassificationType::AKTIVA_TETAP->value, $fixedGroup->fresh()->classification_type?->value);
    }

    public function test_backfill_assigns_dominant_type_and_flags_mixed_node(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null, 'name' => 'Mixed Node']);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'equipment', 'type_override_reason' => 'test']);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'fixed_asset', 'type_override_reason' => 'test']);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'fixed_asset', 'type_override_reason' => 'test']);

        Artisan::call('app:backfill-classification-type');

        $group->refresh();
        $this->assertSame(ClassificationType::AKTIVA_TETAP->value, $group->classification_type?->value);

        $output = Artisan::output();
        $this->assertStringContainsString('Mixed Node', $output);
        $this->assertStringContainsString('still need a split', $output);
    }

    public function test_backfill_defaults_unmapped_nodes_pending_review(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null]);

        Artisan::call('app:backfill-classification-type');

        $this->assertSame(ClassificationType::AKTIVA_TETAP->value, $group->fresh()->classification_type?->value);
        $this->assertStringContainsString('pending review', Artisan::output());
    }

    public function test_dry_run_reports_without_writing(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null]);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'equipment', 'type_override_reason' => 'test']);

        Artisan::call('app:backfill-classification-type', ['--dry-run' => true]);

        $this->assertNull($group->fresh()->classification_type);
        $this->assertStringContainsString('Dry run', Artisan::output());
    }

    public function test_backfill_is_idempotent(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null]);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'equipment', 'type_override_reason' => 'test']);

        Artisan::call('app:backfill-classification-type');
        Artisan::call('app:backfill-classification-type');

        $this->assertSame(ClassificationType::PERALATAN->value, $group->fresh()->classification_type?->value);
    }

    public function test_backfill_flushes_classification_cache(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null]);
        Asset::factory()->create(['asset_group_id' => $group->id, 'asset_type' => 'fixed_asset', 'type_override_reason' => 'test']);
        Cache::put('classification.tree.'.$this->tenant->id, ['stale']);

        Artisan::call('app:backfill-classification-type');

        $this->assertFalse(Cache::has('classification.tree.'.$this->tenant->id));
    }

    public function test_backfill_keeps_existing_asset_codes_unchanged(): void
    {
        $group = AssetGroup::factory()->create(['classification_type' => null]);
        $asset = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'test',
            'kode_asset' => '01.01.01.01.001',
        ]);

        Artisan::call('app:backfill-classification-type');

        $this->assertSame('01.01.01.01.001', $asset->fresh()->kode_asset);
    }

    public function test_asset_type_is_derived_from_classification_chain(): void
    {
        $creator = User::factory()->create(['tenant_id' => $this->tenant->id]);
        CapitalizationThreshold::create([
            'amount' => 1,
            'currency' => 'IDR',
            'created_by' => $creator->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);
        $group = AssetGroup::factory()->peralatan()->create();
        $category = AssetCategory::factory()->peralatan()->create(['asset_group_id' => $group->id]);

        // Cost far above the threshold would say fixed_asset — the chain wins.
        $asset = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'acquisition_cost' => 100_000_000,
        ]);

        $this->assertSame('equipment', $asset->fresh()->asset_type);
    }

    public function test_unclassified_asset_keeps_threshold_derivation(): void
    {
        $creator = User::factory()->create(['tenant_id' => $this->tenant->id]);
        CapitalizationThreshold::create([
            'amount' => 1,
            'currency' => 'IDR',
            'created_by' => $creator->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);

        $asset = Asset::factory()->create([
            'asset_group_id' => null,
            'acquisition_cost' => 100_000_000,
        ]);

        $this->assertSame('fixed_asset', $asset->fresh()->asset_type);
    }

    public function test_manual_override_wins_over_classification(): void
    {
        $group = AssetGroup::factory()->peralatan()->create();

        $asset = Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_type' => 'fixed_asset',
            'type_override_reason' => 'Permintaan akunting',
        ]);

        $this->assertSame('fixed_asset', $asset->fresh()->asset_type);
    }

    public function test_classification_tree_carries_type_and_flag(): void
    {
        $group = AssetGroup::factory()->peralatan()->create();
        $viewer = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $viewer->givePermissionTo(Permission::findOrCreate('asset.classification.view', 'web'));

        config(['features.classification_v2' => true]);

        $this->actingAs($viewer)
            ->get(route('asset-classification.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('classification_v2', true)
                ->where('groups.0.classification_type', 'peralatan'));

        config(['features.classification_v2' => false]);

        $this->actingAs($viewer)
            ->get(route('asset-classification.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('classification_v2', false));
        $this->assertNotNull($group->fresh()->classification_type);
    }

    public function test_import_asset_reports_ambiguous_code_across_types(): void
    {
        Permission::findOrCreate('asset.create', 'web');
        $user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $user->givePermissionTo('asset.create');

        AssetGroup::factory()->peralatan()->create(['code' => '01']);
        AssetGroup::factory()->create(['code' => '01']);

        $path = tempnam(sys_get_temp_dir(), 'amb').'.xlsx';
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(['Unit', 'Kode Asset']));
        $writer->addRow(Row::fromValues(['Meja', '01.02.03.04']));
        $writer->close();

        $file = new UploadedFile($path, 'aktiva.xlsx', null, null, true);

        $this->actingAs($user)
            ->post(route('assets.import'), ['file' => $file])
            ->assertRedirect();

        // Perilaku import existing: klasifikasi gagal → aset tetap dibuat tanpa
        // klasifikasi, dengan error per baris yang jelas.
        $this->assertSame(1, Asset::withoutGlobalScopes()->count());
        $this->assertNull(Asset::withoutGlobalScopes()->first()?->asset_group_id);

        $flash = session('inertia.flash_data');
        $this->assertIsArray($flash);
        $this->assertArrayHasKey('import_report', $flash);
        $this->assertStringContainsString('ambigu', (string) json_encode($flash['import_report']));
    }
}
