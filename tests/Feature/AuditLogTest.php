<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditLogTest extends TestCase
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

    public function test_creating_asset_records_activity_log(): void
    {
        $asset = $this->actingAs($this->user)->createAsset();

        $log = ActivityLog::query()
            ->where('action', 'created')
            ->where('subject_type', 'Asset')
            ->where('subject_id', $asset->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($this->user->id, $log->user_id);
        $this->assertSame($this->user->name, $log->user_name);
        $this->assertSame('acme', $log->tenant_id);
    }

    public function test_updating_asset_records_only_meaningful_changes(): void
    {
        $asset = $this->actingAs($this->user)->createAsset(['brand' => 'Brand Lama']);

        $asset->update(['brand' => 'Brand Baru']);

        $log = ActivityLog::query()
            ->where('action', 'updated')
            ->where('subject_id', $asset->id)
            ->latest()
            ->first();

        $this->assertNotNull($log);
        $this->assertArrayHasKey('brand', $log->properties ?? []);
        $this->assertSame('Brand Lama', $log->properties['brand']['old']);
        $this->assertSame('Brand Baru', $log->properties['brand']['new']);
        $this->assertArrayNotHasKey('updated_at', $log->properties ?? []);
    }

    public function test_touching_without_changes_records_nothing(): void
    {
        $asset = $this->actingAs($this->user)->createAsset();

        ActivityLog::query()->delete();

        $asset->update(['brand' => $asset->brand]);

        $this->assertSame(0, ActivityLog::query()->where('subject_id', $asset->id)->count());
    }

    public function test_deleting_asset_records_activity(): void
    {
        $asset = $this->actingAs($this->user)->createAsset();

        $asset->delete();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'deleted',
            'subject_type' => 'Asset',
            'subject_id' => $asset->id,
        ]);
    }

    public function test_logs_are_scoped_to_tenant(): void
    {
        $this->actingAs($this->user)->createAsset(['kode_asset' => 'ACME-1']);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $other->makeCurrent();
        $this->actingAs(User::factory()->create(['tenant_id' => $other->id]))->createAsset(['kode_asset' => 'OTHER-1']);
        $this->tenant->makeCurrent();

        $this->actingAs($this->user)
            ->get(route('audit-logs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('audit-logs/Index')
                ->has('logs.data', 2)
                ->where('logs.data.0.subject_type', 'Asset')
                ->where('logs.data.0.subject_label', 'ACME-1'));
    }

    public function test_index_filters_by_action_and_search(): void
    {
        $this->actingAs($this->user)->createAsset(['kode_asset' => 'FILTER-1']);
        $location = Location::query()->create(['name' => 'Gudang Filter']);
        Item::factory()->create(['name' => 'Item Unik XYZ']);

        $this->actingAs($this->user)
            ->get(route('audit-logs.index', ['action' => 'created']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logs.data')
                ->where('filters.action', 'created'));

        $this->actingAs($this->user)
            ->get(route('audit-logs.index', ['search' => 'Gudang Filter']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('logs.data.0.subject_label', 'Gudang Filter'));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createAsset(array $attributes = []): Asset
    {
        return Asset::factory()->create($attributes + [
            'item_id' => Item::factory()->create()->id,
        ]);
    }
}
