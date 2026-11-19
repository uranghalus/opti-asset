<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InertiaAuthEmployeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    public function test_shares_auth_employee_for_linked_user(): void
    {
        $tenant = $this->makeTenant('tenant-a', 'a');
        $employee = $this->makeEmployee($tenant, 'Rina Linked');
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'employee_id' => $employee->id_employee,
        ]);

        $this->actingAs($user)
            ->get(route('tenant.dashboard', ['tenant' => $tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.employee.nama_employee', 'Rina Linked')
                ->where('auth.employee.id_employee', $employee->id_employee)
                ->where('auth.employee.department_id', $employee->id_department)
            );
    }

    public function test_employee_session_refreshes_without_relogin(): void
    {
        $tenant = $this->makeTenant('tenant-a', 'a');
        $department = Department::factory()->create(['tenant_id' => $tenant->id]);
        $employee = $this->makeEmployee($tenant, 'Budi Refresh');
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'employee_id' => $employee->id_employee,
        ]);

        // Request pertama: session/employee ditulis oleh share().
        $this->actingAs($user)
            ->get(route('tenant.dashboard', ['tenant' => $tenant->code]))
            ->assertOk();

        $this->assertSame($employee->id_department, session('employee')['department_id']);

        // Perubahan di DB (tanpa login ulang) harus terlihat di request berikutnya.
        Employee::withoutGlobalScopes()
            ->where('id_employee', $employee->id_employee)
            ->update(['id_department' => $department->id]);

        // Production me-resolve user fresh dari session setiap request;
        // instance baru memuat relasi FK terkini (tanpa event login ulang).
        $this->actingAs($user->fresh())
            ->get(route('tenant.dashboard', ['tenant' => $tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.employee.department_id', $department->id)
            );

        $this->assertSame($department->id, session('employee')['department_id']);
    }

    public function test_omits_employee_for_unlinked_user(): void
    {
        $tenant = $this->makeTenant('tenant-a', 'a');
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user)
            ->get(route('tenant.dashboard', ['tenant' => $tenant->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('auth.employee', null));

        $this->assertNull(session('employee'));
    }

    public function test_tenant_switch_keeps_employee_fresh(): void
    {
        $tenantA = $this->makeTenant('tenant-a', 'a');
        $tenantB = $this->makeTenant('tenant-b', 'b');
        $employee = $this->makeEmployee($tenantA, 'Santi Switch');

        // Super admin boleh berpindah tenant, sehingga session harus tetap
        // mengikuti relasi FK (bukan scope tenant) saat tenant current berubah.
        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'is_super_admin' => true,
            'employee_id' => $employee->id_employee,
        ]);

        $this->actingAs($user)
            ->get(route('tenant.dashboard', ['tenant' => $tenantA->code]))
            ->assertOk();

        $this->assertSame($employee->id_employee, session('employee')['id_employee']);

        // Tenant current berpindah ke B: snapshot employee harus tetap employee
        // yang ter-link (relasi FK mem-bypass scope tenant).
        $this->actingAs($user)
            ->get(route('tenant.dashboard', ['tenant' => $tenantB->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('auth.employee.id_employee', $employee->id_employee)
                ->where('auth.employee.nama_employee', 'Santi Switch')
            );

        $this->assertSame($employee->id_employee, session('employee')['id_employee']);
        $this->assertSame($employee->nama_employee, session('employee')['nama_employee']);
    }

    private function makeTenant(string $id, string $code): Tenant
    {
        return Tenant::create([
            'id' => $id,
            'code' => $code,
            'name' => 'Tenant '.$code,
            'is_active' => true,
        ]);
    }

    private function makeEmployee(Tenant $tenant, string $name): Employee
    {
        return Employee::factory()->create([
            'tenant_id' => $tenant->id,
            'nama_employee' => $name,
        ]);
    }
}
