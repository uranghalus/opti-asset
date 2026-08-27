<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetTransfer;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ReportTest extends TestCase
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

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $permission = Permission::create(['name' => 'asset.view', 'guard_name' => 'web']);
        $role = Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->assignRole('super-admin');
    }

    public function test_index_renders_report_page(): void
    {
        AssetTransfer::factory()->count(3)->create();
        AssetDisposal::factory()->count(2)->create();

        $this->actingAs($this->user)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->has('transfers.data', 3)
                ->has('disposals.data', 2)
                ->has('filters'));
    }

    public function test_index_filters_by_transfer_status(): void
    {
        AssetTransfer::factory()->count(2)->create(['status' => 'pending']);
        AssetTransfer::factory()->count(1)->create(['status' => 'approved']);

        $this->actingAs($this->user)
            ->get(route('reports.index', ['transfer_status' => 'approved']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1));
    }

    public function test_index_filters_by_disposal_status(): void
    {
        AssetDisposal::factory()->count(2)->pending()->create();
        AssetDisposal::factory()->count(1)->approved()->create();

        $this->actingAs($this->user)
            ->get(route('reports.index', ['disposal_status' => 'approved']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('disposals.total', 1));
    }

    public function test_index_searches_transfers_by_asset_code(): void
    {
        $asset = Asset::factory()->create(['kode_asset' => 'AST-001']);
        AssetTransfer::factory()->create(['asset_id' => $asset->id]);
        AssetTransfer::factory()->create();

        $this->actingAs($this->user)
            ->get(route('reports.index', ['transfer_search' => 'AST-001']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('transfers.total', 1));
    }

    public function test_index_rejects_invalid_status_values(): void
    {
        $this->actingAs($this->user)
            ->get(route('reports.index', ['transfer_status' => 'invalid']))
            ->assertInvalid(['transfer_status']);
    }

    public function test_index_rejects_invalid_per_page(): void
    {
        $this->actingAs($this->user)
            ->get(route('reports.index', ['per_page' => 200]))
            ->assertInvalid(['per_page']);
    }

    public function test_unauthenticated_user_is_redirected(): void
    {
        $this->get(route('reports.index'))
            ->assertRedirect();
    }

    public function test_export_transfers_returns_xlsx(): void
    {
        AssetTransfer::factory()->count(2)->create();

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.transfers', ['format' => 'xlsx']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_mutasi_aset_', $disposition);
    }

    public function test_export_disposals_returns_xlsx(): void
    {
        AssetDisposal::factory()->count(2)->create();

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.disposals', ['format' => 'xlsx']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_penghapusan_aset_', $disposition);
    }

    public function test_export_transfers_returns_pdf(): void
    {
        AssetTransfer::factory()->count(2)->create();

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.transfers', ['format' => 'pdf']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_mutasi_aset_', $disposition);
        self::assertStringContainsString('.pdf', $disposition);
    }

    public function test_export_disposals_returns_pdf(): void
    {
        AssetDisposal::factory()->count(2)->create();

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.disposals', ['format' => 'pdf']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_penghapusan_aset_', $disposition);
        self::assertStringContainsString('.pdf', $disposition);
    }

    public function test_export_transfers_applies_status_filter(): void
    {
        AssetTransfer::factory()->count(2)->create(['status' => 'pending']);
        AssetTransfer::factory()->count(1)->create(['status' => 'approved']);

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.transfers', ['format' => 'xlsx', 'transfer_status' => 'approved']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_mutasi_aset_', $disposition);
    }

    public function test_export_disposals_applies_status_filter(): void
    {
        AssetDisposal::factory()->count(2)->pending()->create();
        AssetDisposal::factory()->count(1)->approved()->create();

        $response = $this->actingAs($this->user)
            ->get(route('reports.export.disposals', ['format' => 'xlsx', 'disposal_status' => 'approved']))
            ->assertOk();

        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_penghapusan_aset_', $disposition);
    }

    public function test_unauthenticated_user_cannot_export(): void
    {
        $this->get(route('reports.export.transfers', ['format' => 'xlsx']))
            ->assertRedirect();

        $this->get(route('reports.export.disposals', ['format' => 'xlsx']))
            ->assertRedirect();
    }
}
