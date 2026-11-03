<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetGroup;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use App\Services\EmployeeSessionResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Department scoping halaman browse aset (R6 / A5).
 *
 * Ketentuan: role selain staff-asset, super-admin, dan admin-ho
 * (padanan: administrator) hanya melihat aset department login.
 */
class AssetDepartmentScopingTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Department $departmentA;

    private Department $departmentB;

    private AssetCategory $category;

    /** @var array<int, string> */
    private array $departmentAIds = [];

    /** @var array<int, string> */
    private array $departmentBIds = [];

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

        $group = AssetGroup::factory()->create(['code' => '01']);
        $this->category = AssetCategory::factory()->create(['asset_group_id' => $group->id, 'code' => '01']);

        $this->departmentAIds = $this->createAssetsFor($this->departmentA);
        $this->departmentBIds = $this->createAssetsFor($this->departmentB);
    }

    /**
     * Buat 3 aset milik department: 2 terklasifikasi + 1 tanpa klasifikasi.
     *
     * @return array<int, string>
     */
    private function createAssetsFor(Department $department): array
    {
        $ids = [];

        foreach (range(1, 2) as $i) {
            $asset = Asset::factory()->create([
                'department_id' => $department->id_department,
                'asset_category_id' => $this->category->id,
                'kode_asset' => "AST-A-{$i}-{$department->id_department}",
            ]);
            $ids[] = $asset->id;
        }

        $unclassified = Asset::factory()->create([
            'department_id' => $department->id_department,
            'asset_category_id' => null,
            'kode_asset' => "AST-U-{$department->id_department}",
        ]);
        $ids[] = $unclassified->id;

        return $ids;
    }

    /**
     * Tulis session employee lewat jalur produksi (EmployeeSessionResolver),
     * bukan dengan menanam session manual — agar key `department_id`
     * yang diuji persis seperti runtime.
     */
    private function asEmployeeOf(User $user, Department $department): void
    {
        Employee::create([
            'id_employee' => 'emp-'.strtolower($department->id_department),
            'tenant_id' => $this->tenant->id,
            'nik_employee' => 'NIK-'.strtoupper($department->id_department),
            'nama_employee' => 'Karyawan '.$department->nama_department,
            'email' => $user->email,
            'number' => null,
            'photo_url' => null,
            'id_department' => $department->id_department,
            'division_id' => null,
            'id_position' => null,
            'last_login_ip' => null,
        ]);

        (new EmployeeSessionResolver)->resolve($user);
    }

    /**
     * @return array{tree: array<int, array<string, mixed>>, assets: array<string, mixed>, unclassifiedCount: int, filters: array<string, mixed>}
     */
    private function browse(User $user): array
    {
        $response = $this->actingAs($user)
            ->get(route('tenant.assets.browse', ['tenant' => $this->tenant->code, 'json' => 1]))
            ->assertOk();

        /** @var array{tree: array<int, array<string, mixed>>, assets: array<string, mixed>, unclassifiedCount: int, filters: array<string, mixed>} $payload */
        $payload = $response->json();

        return $payload;
    }

    // ---------- ledger (assets.data) ----------

    public function test_non_bypass_user_sees_only_own_department_assets(): void
    {
        $user = $this->newUserWithRole('akunting');
        $this->asEmployeeOf($user, $this->departmentA);

        $payload = $this->browse($user);

        $ids = array_column($payload['assets']['data'], 'id');
        $this->assertSame($this->departmentAIds, $ids);
    }

    public function test_non_bypass_user_without_employee_session_sees_nothing(): void
    {
        $user = $this->newUserWithRole('akunting');

        $payload = $this->browse($user);

        $this->assertSame([], $payload['assets']['data']);
        $this->assertSame(0, $payload['assets']['total']);
    }

    public function test_manager_is_scoped_to_own_department(): void
    {
        $user = $this->newUserWithRole('manager');
        $this->asEmployeeOf($user, $this->departmentB);

        $payload = $this->browse($user);

        $ids = array_column($payload['assets']['data'], 'id');
        $this->assertSame($this->departmentBIds, $ids);
        $this->assertNotSame($this->departmentAIds, $ids);
    }

    // ---------- bypass roles ----------

    public function test_staff_asset_bypasses_department_scoping(): void
    {
        $user = $this->newUserWithRole('staff-asset');

        $response = $this->actingAs($user)
            ->get(route('tenant.assets.index', ['tenant' => $this->tenant->code]));
        $this->assertSame(200, $response->status());
    }

    public function test_super_admin_hyphen_and_underscore_both_bypass(): void
    {
        foreach (['super-admin', 'super_admin'] as $role) {
            $user = $this->newUserWithRole($role);

            $payload = $this->browse($user);

            $this->assertSame(6, $payload['assets']['total'], "Role [{$role}] harus bypass department.");
        }
    }

    public function test_administrator_alias_bypasses_department_scoping(): void
    {
        $user = $this->newUserWithRole('administrator');

        $payload = $this->browse($user);

        $this->assertSame(6, $payload['assets']['total']);
    }

    // ---------- data yang dikelompokkan (tree + counts) ----------

    public function test_tree_counts_are_department_scoped_for_non_bypass_user(): void
    {
        $user = $this->newUserWithRole('akunting');
        $this->asEmployeeOf($user, $this->departmentA);

        $payload = $this->browse($user);

        $node = $this->findNodeById($payload['tree'], $this->category->id);
        $this->assertNotNull($node);
        $this->assertSame(2, $node['asset_count']);
    }

    public function test_tree_counts_show_full_tenant_for_bypass_user(): void
    {
        $user = $this->newUserWithRole('staff-asset');

        $payload = $this->browse($user);

        $node = $this->findNodeById($payload['tree'], $this->category->id);
        $this->assertNotNull($node);
        $this->assertSame(4, $node['asset_count']);
    }

    public function test_unclassified_count_is_department_scoped_for_non_bypass_user(): void
    {
        $user = $this->newUserWithRole('akunting');
        $this->asEmployeeOf($user, $this->departmentA);

        $payload = $this->browse($user);

        $this->assertSame(1, $payload['unclassifiedCount']);
    }

    /**
     * Cari node browse tree berdasarkan id, menyusuri children.
     *
     * @param  array<int, array<string, mixed>>  $tree
     * @return array<string, mixed>|null
     */
    private function findNodeById(array $tree, string $id): ?array
    {
        foreach ($tree as $node) {
            if ($node['id'] === $id) {
                return $node;
            }

            $children = $node['children'] ?? [];

            if ($children !== []) {
                $found = $this->findNodeById(is_array($children) ? $children : [], $id);

                if ($found !== null) {
                    return $found;
                }
            }
        }

        return null;
    }

    private function newUserWithRole(string $role): User
    {
        $roleModel = Role::findOrCreate($role, 'web');
        $roleModel->givePermissionTo('asset.view');

        $user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $user->assignRole($roleModel);

        return $user;
    }
}
