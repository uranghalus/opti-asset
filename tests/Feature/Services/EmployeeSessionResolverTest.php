<?php

namespace Tests\Feature\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use App\Services\EmployeeSessionResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeSessionResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolve_writes_employee_snapshot_from_fk_link(): void
    {
        $tenant = $this->setCurrentTenant();
        $department = Department::factory()->create(['tenant_id' => $tenant->id]);

        // Email sengaja berbeda dari user: satu-satunya jalur resolusi
        // adalah FK `employee_id`, bukan email/NIK.
        $employee = Employee::create([
            'id_employee' => 'emp-001',
            'tenant_id' => $tenant->id,
            'nik_employee' => 'NIK-1234',
            'nama_employee' => 'John Doe',
            'email' => 'employee.john@example.com',
            'number' => '081234567890',
            'photo_url' => null,
            'id_department' => $department->id,
            'division_id' => 'div-001',
            'id_position' => 'pos-001',
            'last_login_ip' => null,
        ]);

        $user = User::factory()->create([
            'email' => 'john.doe@example.com',
            'employee_id' => $employee->id_employee,
        ]);

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNotNull($result);
        $this->assertSame('emp-001', $result['id_employee']);
        $this->assertSame('NIK-1234', $result['nik_employee']);
        $this->assertSame('John Doe', $result['nama_employee']);
        $this->assertSame('employee.john@example.com', $result['email']);
        $this->assertSame($department->id, $result['department_id']);
        $this->assertSame('div-001', $result['division_id']);
        $this->assertSame('pos-001', $result['id_position']);
        $this->assertSame($tenant->id, $result['tenant_id']);

        // Session menyimpan snapshot employee dengan key department yang
        // dinormalisasi menjadi `department_id` (bukan `id_department`),
        // sehingga seluruh pembaca session memakai satu kontrak.
        $stored = session('employee');
        $this->assertSame($department->id, $stored['department_id']);
        $this->assertArrayNotHasKey('id_department', $stored);
        $this->assertSame($employee->id_employee, $stored['id_employee']);
    }

    public function test_resolve_forgets_session_when_user_has_no_linked_employee(): void
    {
        $this->setCurrentTenant();

        $user = User::factory()->create([
            'email' => 'nobody@example.com',
        ]);

        // Snapshot basi dari login sebelumnya harus ikut terhapus.
        session([EmployeeSessionResolver::SESSION_KEY => ['id_employee' => 'emp-stale']]);

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNull($result);
        $this->assertNull(session('employee'));
    }

    public function test_resolve_works_without_current_tenant(): void
    {
        $tenant = $this->setCurrentTenant();
        $department = Department::factory()->create(['tenant_id' => $tenant->id]);

        $employee = Employee::create([
            'id_employee' => 'emp-002',
            'tenant_id' => $tenant->id,
            'nik_employee' => 'NIK-5678',
            'nama_employee' => 'Budi Santoso',
            'email' => 'employee.budi@example.com',
            'number' => '081234567891',
            'photo_url' => null,
            'id_department' => $department->id,
            'division_id' => 'div-002',
            'id_position' => 'pos-002',
            'last_login_ip' => null,
        ]);

        $user = User::factory()->create([
            'email' => 'budi@example.com',
            'employee_id' => $employee->id_employee,
        ]);

        // Kondisi persis seperti SAML ACS sebelum tenant context ada:
        // resolusi lewat FK (withoutGlobalScopes) tetap harus ketemu.
        Tenant::forgetCurrent();

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNotNull($result);
        $this->assertSame('emp-002', $result['id_employee']);
        $this->assertSame('Budi Santoso', $result['nama_employee']);
        $this->assertSame($department->id, $result['department_id']);
        $this->assertSame($tenant->id, $result['tenant_id']);

        $stored = session('employee');
        $this->assertSame($employee->id_employee, $stored['id_employee']);
        $this->assertSame($tenant->id, $stored['tenant_id']);
    }

    /**
     * Create a tenant and bind it as the current tenant so the BelongsToTenant
     * global scope on Employee/Department does not filter out the rows.
     */
    private function setCurrentTenant(): Tenant
    {
        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'code' => 'top',
            'name' => 'PT Tata Optima Property',
        ]);

        $tenant->makeCurrent();

        return $tenant;
    }
}
