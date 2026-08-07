<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_department_gets_tenant_id_on_create(): void
    {
        $department = Department::create([
            'kode_department' => 'IT',
            'nama_department' => 'Teknologi',
        ]);

        $this->assertSame('acme', $department->tenant_id);
    }

    public function test_index_only_lists_current_tenants_departments(): void
    {
        Department::create([
            'kode_department' => 'IT',
            'nama_department' => 'Teknologi',
        ]);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Department::withoutGlobalScopes()->create([
            'tenant_id' => $other->id,
            'kode_department' => 'FIN',
            'nama_department' => 'Keuangan',
        ]);

        $this->assertSame(1, Department::count());
    }

    public function test_same_code_allowed_across_tenants(): void
    {
        Department::create([
            'kode_department' => 'IT',
            'nama_department' => 'Teknologi',
        ]);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Department::withoutGlobalScopes()->create([
            'tenant_id' => $other->id,
            'kode_department' => 'IT',
            'nama_department' => 'Teknologi Lain',
        ]);

        $this->assertSame(1, Department::count());
    }

    public function test_index_renders_departments(): void
    {
        Department::create(['kode_department' => 'IT', 'nama_department' => 'Teknologi']);
        Department::create(['kode_department' => 'HRD', 'nama_department' => 'SDM']);

        $this->actingAs($this->user)
            ->get(route('departments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Index')
                ->has('departments.data', 2)
                ->where('departments.data.0.kode_department', 'HRD'));
    }

    public function test_index_searches_departments(): void
    {
        Department::create(['kode_department' => 'IT', 'nama_department' => 'Teknologi']);
        Department::create(['kode_department' => 'HRD', 'nama_department' => 'Sumber Daya Manusia']);

        $this->actingAs($this->user)
            ->get(route('departments.index', ['search' => 'Teknologi']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('departments.total', 1)
                ->where('departments.data.0.nama_department', 'Teknologi')
                ->where('filters.search', 'Teknologi'));
    }

    public function test_show_renders_department_with_employees(): void
    {
        $department = Department::create(['kode_department' => 'IT', 'nama_department' => 'Teknologi']);
        $employee = Employee::create([
            'nama_employee' => 'Budi',
            'email' => 'budi@example.com',
            'id_department' => $department->id_department,
        ]);

        $this->actingAs($this->user)
            ->get(route('departments.show', $department))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Show')
                ->where('department.nama_department', 'Teknologi')
                ->where('department.employees.0.nama_employee', 'Budi'));
    }

    public function test_show_renders_department_hod_and_manager(): void
    {
        $hod = Employee::create(['nama_employee' => 'Kepala', 'email' => 'hod@example.com']);
        $manager = Employee::create(['nama_employee' => 'Manager', 'email' => 'manager@example.com']);
        $department = Department::create([
            'kode_department' => 'IT',
            'nama_department' => 'Teknologi',
            'hod_user_id' => $hod->id_employee,
            'manager_user_id' => $manager->id_employee,
        ]);

        $this->actingAs($this->user)
            ->get(route('departments.show', $department))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('department.hod.nama_employee', 'Kepala')
                ->where('department.manager.nama_employee', 'Manager'));
    }

    public function test_sync_imports_departments_from_portal(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            'https://portal.example/api/departments' => Http::response([
                'data' => [
                    ['id' => 'dept-1', 'name' => 'Teknologi Informasi', 'code' => 'IT'],
                    ['id' => 'dept-2', 'name' => 'Sumber Daya Manusia', 'code' => 'HRD'],
                ],
            ]),
        ]);

        $this->actingAs($this->user)
            ->post(route('departments.sync'))
            ->assertRedirect(route('departments.index'));

        $it = Department::where('kode_department', 'IT')->first();
        $this->assertNotNull($it);
        $this->assertSame('Teknologi Informasi', $it->nama_department);
        $this->assertSame($this->tenant->id, $it->tenant_id);
    }
}
