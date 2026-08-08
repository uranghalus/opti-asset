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
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EmployeeTest extends TestCase
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

    public function test_employee_gets_tenant_id_on_create(): void
    {
        $employee = Employee::create([
            'nama_employee' => 'Budi',
            'nik_employee' => 'NIK-001',
        ]);

        $this->assertSame('acme', $employee->tenant_id);
    }

    public function test_employees_scoped_to_current_tenant(): void
    {
        Employee::create(['nama_employee' => 'Budi', 'nik_employee' => 'NIK-001']);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Employee::withoutGlobalScopes()->create([
            'tenant_id' => $other->id,
            'nama_employee' => 'Agus',
            'nik_employee' => 'NIK-002',
        ]);

        $this->assertSame(1, Employee::count());
    }

    public function test_same_nik_allowed_across_tenants(): void
    {
        Employee::create(['nama_employee' => 'Budi', 'nik_employee' => 'NIK-001']);

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        Employee::withoutGlobalScopes()->create([
            'tenant_id' => $other->id,
            'nama_employee' => 'Budi',
            'nik_employee' => 'NIK-001',
        ]);

        $this->assertSame(1, Employee::count());
    }

    public function test_index_renders_employees(): void
    {
        Employee::create(['nama_employee' => 'Budi', 'nik_employee' => 'NIK-001']);
        Employee::create(['nama_employee' => 'Agus', 'nik_employee' => 'NIK-002']);

        $this->actingAs($this->user)
            ->get(route('employees.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Index')
                ->has('employees.data', 2)
                ->where('employees.data.0.nama_employee', 'Agus'));
    }

    public function test_roles_can_be_assigned_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);

        $this->actingAs($this->user)
            ->from(route('employees.index'))
            ->post(route('employees.roles.update', $employee), ['roles' => ['manager']])
            ->assertRedirect(route('employees.index'));

        $this->assertTrue($employee->fresh()->hasRole('manager'));
        $this->assertSame(1, $employee->fresh()->roles()->count());
    }

    public function test_roles_can_be_synced_on_employee(): void
    {
        $employee = Employee::factory()->create();
        $manager = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $staff = Role::create(['name' => 'staff', 'guard_name' => 'web']);
        $employee->assignRole($manager);

        $this->actingAs($this->user)
            ->from(route('employees.index'))
            ->post(route('employees.roles.update', $employee), ['roles' => ['staff']])
            ->assertRedirect(route('employees.index'));

        $this->assertTrue($employee->fresh()->hasRole('staff'));
        $this->assertFalse($employee->fresh()->hasRole('manager'));
    }

    public function test_roles_can_be_cleared_on_employee(): void
    {
        $employee = Employee::factory()->create();
        $role = Role::create(['name' => 'staff', 'guard_name' => 'web']);
        $employee->assignRole($role);

        $this->actingAs($this->user)
            ->from(route('employees.index'))
            ->post(route('employees.roles.update', $employee), ['roles' => []])
            ->assertRedirect(route('employees.index'));

        $this->assertSame(0, $employee->fresh()->roles()->count());
    }

    public function test_roles_must_exist_when_assigned_to_employee(): void
    {
        $employee = Employee::factory()->create();

        $this->actingAs($this->user)
            ->from(route('employees.index'))
            ->post(route('employees.roles.update', $employee), ['roles' => ['ghost-role']])
            ->assertSessionHasErrors('roles.0');

        $this->assertSame(0, $employee->fresh()->roles()->count());
    }

    public function test_employee_show_renders_roles(): void
    {
        $employee = Employee::factory()->create();
        $role = Role::create(['name' => 'staff', 'guard_name' => 'web']);
        $employee->assignRole($role);

        $this->actingAs($this->user)
            ->get(route('employees.show', $employee))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Show')
                ->where('employee.nama_employee', $employee->nama_employee)
                ->where('employee.roles.0.name', 'staff'));
    }

    public function test_index_searches_employees(): void
    {
        Employee::create(['nama_employee' => 'Budi', 'nik_employee' => 'NIK-001']);
        Employee::create(['nama_employee' => 'Agus', 'email' => 'agus@example.com']);

        $this->actingAs($this->user)
            ->get(route('employees.index', ['search' => 'agus@example.com']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('employees.total', 1)
                ->where('employees.data.0.nama_employee', 'Agus')
                ->where('filters.search', 'agus@example.com'));
    }

    public function test_index_filters_by_department(): void
    {
        $it = Department::create(['kode_department' => 'IT', 'nama_department' => 'Teknologi']);
        Employee::create(['nama_employee' => 'Budi', 'id_department' => $it->id_department]);
        Employee::create(['nama_employee' => 'Agus']);

        $this->actingAs($this->user)
            ->get(route('employees.index', ['department' => $it->id_department]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('employees.total', 1)
                ->where('employees.data.0.nama_employee', 'Budi')
                ->where('filters.department', $it->id_department));
    }

    public function test_show_renders_employee_with_department(): void
    {
        $department = Department::create(['kode_department' => 'IT', 'nama_department' => 'Teknologi']);
        $employee = Employee::create([
            'nama_employee' => 'Budi',
            'nik_employee' => 'NIK-001',
            'id_department' => $department->id_department,
        ]);

        $this->actingAs($this->user)
            ->get(route('employees.show', $employee))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Employees/Show')
                ->where('employee.nama_employee', 'Budi')
                ->where('employee.department.nama_department', 'Teknologi'));
    }

    public function test_sync_imports_employees_from_portal(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            'https://portal.example/api/users' => Http::response([
                'data' => [
                    [
                        'id' => 'emp-1',
                        'name' => 'Budi',
                        'nik' => 'NIK-001',
                        'email' => 'budi@example.com',
                        'whatsapp_number' => '0812345678',
                        'department' => 'dept-1',
                        'position' => 'pos-1',
                    ],
                ],
            ]),
        ]);

        $this->actingAs($this->user)
            ->post(route('employees.sync'))
            ->assertRedirect(route('employees.index'));

        $employee = Employee::where('nik_employee', 'NIK-001')->first();
        $this->assertNotNull($employee);
        $this->assertSame('Budi', $employee->nama_employee);
        $this->assertSame('0812345678', $employee->number);
        $this->assertSame('dept-1', $employee->id_department);
        $this->assertSame($this->tenant->id, $employee->tenant_id);
    }

    public function test_sync_after_switching_tenant_does_not_duplicate(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        $payload = fn () => Http::response([
            'data' => [
                [
                    'id' => 'emp-1',
                    'name' => 'Budi',
                    'nik' => 'NIK-001',
                ],
            ],
        ]);

        Http::fake([
            'https://portal.example/api/users' => $payload(),
        ]);

        $this->actingAs($this->user)
            ->post(route('employees.sync'));

        $other = Tenant::create(['id' => 'other', 'name' => 'Other Corp']);

        $this->actingAs($this->user)
            ->withSession(['current_tenant_id' => 'other'])
            ->post(route('employees.sync'))
            ->assertRedirect(route('employees.index'));

        $this->assertSame(1, Employee::count());
        $employee = Employee::withoutGlobalScopes()->first();
        $this->assertSame('other', $employee->tenant_id);
    }
}
