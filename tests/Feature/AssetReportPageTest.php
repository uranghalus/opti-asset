<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use App\Services\EmployeeSessionResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Laporan Daftar Aset: akses, scoping department, filter, sorting, export.
 */
class AssetReportPageTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Department $departmentA;

    private Department $departmentB;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'code' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        Permission::findOrCreate('asset.view', 'web');

        $this->departmentA = Department::create([
            'id_department' => 'dept-a',
            'tenant_id' => $this->tenant->id,
            'kode_department' => 'A',
            'nama_department' => 'Departemen A',
        ]);

        $this->departmentB = Department::create([
            'id_department' => 'dept-b',
            'tenant_id' => $this->tenant->id,
            'kode_department' => 'B',
            'nama_department' => 'Departemen B',
        ]);
    }

    private function newUserWithRole(string $role, bool $withPermission = true): User
    {
        $roleModel = Role::findOrCreate($role, 'web');

        if ($withPermission) {
            $roleModel->givePermissionTo('asset.view');
        }

        $user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $user->assignRole($roleModel);

        return $user;
    }

    private function asEmployeeOf(User $user, Department $department): void
    {
        $employee = Employee::create([
            'id_employee' => 'emp-'.strtolower($department->id_department),
            'tenant_id' => $this->tenant->id,
            'nik_employee' => 'NIK-'.strtoupper($department->id_department),
            'nama_employee' => 'Karyawan '.$department->nama_department,
            'email' => 'hrd-'.strtolower($department->id_department).'@example.com',
            'number' => null,
            'photo_url' => null,
            'id_department' => $department->id_department,
            'division_id' => null,
            'id_position' => null,
            'last_login_ip' => null,
        ]);

        $user->update(['employee_id' => $employee->id_employee]);

        (new EmployeeSessionResolver)->resolve($user);
    }

    private function makeAsset(array $attributes = []): Asset
    {
        return Asset::factory()->create(array_merge([
            'department_id' => $this->departmentA->id_department,
            'kode_asset' => 'AST-'.fake()->unique()->numerify('#####'),
        ], $attributes));
    }

    private function reportUrl(array $query = []): string
    {
        return route('tenant.reports.assets.index', array_merge(
            ['tenant' => $this->tenant->code],
            $query,
        ));
    }

    private function exportUrl(array $query = []): string
    {
        return route('tenant.reports.assets.export', array_merge(
            ['tenant' => $this->tenant->code],
            $query,
        ));
    }

    public function test_user_without_permission_is_forbidden(): void
    {
        $user = $this->newUserWithRole('viewer', withPermission: false);

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertForbidden();
    }

    public function test_page_renders_with_expected_props(): void
    {
        $this->makeAsset(['brand' => 'Lenovo']);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Assets')
                ->has('assets.data', 1)
                ->has('summary.total_assets')
                ->has('summary.total_purchase_price')
                ->has('summary.total_acquisition_cost')
                ->has('filters')
                ->has('sort')
                ->has('items')
                ->has('locations')
                ->has('departments')
                ->has('employees')
            );
    }

    public function test_non_bypass_user_only_sees_own_department(): void
    {
        $this->makeAsset(['department_id' => $this->departmentA->id_department]);
        $this->makeAsset(['department_id' => $this->departmentB->id_department]);

        $user = $this->newUserWithRole('manager');
        $this->asEmployeeOf($user, $this->departmentA);

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 1)
                ->where('assets.data.0.department.nama_department', 'Departemen A')
            );
    }

    public function test_user_without_employee_session_sees_nothing(): void
    {
        $this->makeAsset();

        $user = $this->newUserWithRole('manager');

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 0)
                ->where('summary.total_assets', 0)
            );
    }

    #[DataProvider('bypassRoles')]
    public function test_bypass_roles_see_all_departments(string $role): void
    {
        $this->makeAsset(['department_id' => $this->departmentA->id_department]);
        $this->makeAsset(['department_id' => $this->departmentB->id_department]);

        $user = $this->newUserWithRole($role);

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 2));
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function bypassRoles(): array
    {
        return [
            'super-admin' => ['super-admin'],
            'staff-asset' => ['staff-asset'],
            'akunting' => ['akunting'],
            'administrator' => ['administrator'],
        ];
    }

    public function test_text_filter_matches_partial_value(): void
    {
        $this->makeAsset(['brand' => 'Lenovo ThinkPad']);
        $this->makeAsset(['brand' => 'HP ProBook']);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['brand' => 'thinkpad']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('assets.data', 1)
                ->where('assets.data.0.brand', 'Lenovo ThinkPad')
            );
    }

    public function test_exact_filters(): void
    {
        $this->makeAsset(['status' => 'ACT', 'condition' => 'Baik', 'asset_type' => 'fixed_asset', 'type_override_reason' => 'test']);
        $this->makeAsset(['status' => 'DSP', 'condition' => 'Rusak Berat', 'asset_type' => 'equipment', 'type_override_reason' => 'test']);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['status' => 'DSP']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));

        $this->actingAs($user)
            ->get($this->reportUrl(['condition' => 'Baik']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));

        $this->actingAs($user)
            ->get($this->reportUrl(['asset_type' => 'equipment']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));
    }

    public function test_numeric_range_filter(): void
    {
        $this->makeAsset(['purchase_price' => 1000000]);
        $this->makeAsset(['purchase_price' => 9000000]);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl([
                'purchase_price_min' => 5000000,
                'purchase_price_max' => 10000000,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));
    }

    public function test_photo_presence_filter(): void
    {
        $this->makeAsset(['photo_url' => ['a.jpg']]);
        $this->makeAsset(['photo_url' => []]);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['has_photo' => 'yes']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));

        $this->actingAs($user)
            ->get($this->reportUrl(['has_photo' => 'no']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));
    }

    public function test_pic_filter_matches_any_selected_name(): void
    {
        $this->makeAsset(['pic' => ['Budi']]);
        $this->makeAsset(['pic' => ['Sari']]);
        $this->makeAsset(['pic' => ['Joko']]);

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['pic' => ['Budi', 'Sari']]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 2));
    }

    public function test_invalid_sort_is_rejected(): void
    {
        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['sort' => 'password']))
            ->assertStatus(422);
    }

    public function test_per_page_is_capped(): void
    {
        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl(['per_page' => 500]))
            ->assertStatus(422);
    }

    public function test_inverted_date_range_is_rejected(): void
    {
        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->reportUrl([
                'purchase_date_from' => '2026-05-10',
                'purchase_date_to' => '2026-01-01',
            ]))
            ->assertStatus(422);
    }

    public function test_export_requires_at_least_one_column(): void
    {
        $this->makeAsset();

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->exportUrl(['format' => 'xlsx']))
            ->assertStatus(422);
    }

    public function test_export_rejects_unknown_column(): void
    {
        $this->makeAsset();

        $user = $this->newUserWithRole('akunting');

        $this->actingAs($user)
            ->get($this->exportUrl(['format' => 'xlsx', 'columns' => ['password']]))
            ->assertStatus(422);
    }

    public function test_export_xlsx_with_selected_columns(): void
    {
        $this->makeAsset(['brand' => 'Lenovo']);

        $user = $this->newUserWithRole('akunting');

        $response = $this->actingAs($user)
            ->get($this->exportUrl([
                'format' => 'xlsx',
                'columns' => ['kode_asset', 'brand'],
            ]));

        $response->assertOk();
        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_daftar_aset_', $disposition);
        self::assertStringContainsString('.xlsx', $disposition);
    }

    public function test_export_pdf(): void
    {
        $this->makeAsset();

        $user = $this->newUserWithRole('akunting');

        $response = $this->actingAs($user)
            ->get($this->exportUrl([
                'format' => 'pdf',
                'columns' => ['kode_asset', 'brand', 'status'],
            ]));

        $response->assertOk();
        $disposition = $response->headers->get('Content-Disposition');
        self::assertStringContainsString('laporan_daftar_aset_', $disposition);
        self::assertStringContainsString('.pdf', $disposition);
    }

    public function test_export_respects_department_scoping(): void
    {
        $this->makeAsset(['department_id' => $this->departmentA->id_department, 'brand' => 'AAA']);
        $this->makeAsset(['department_id' => $this->departmentB->id_department, 'brand' => 'BBB']);

        $user = $this->newUserWithRole('manager');
        $this->asEmployeeOf($user, $this->departmentA);

        $this->actingAs($user)
            ->get($this->reportUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1));
    }
}
