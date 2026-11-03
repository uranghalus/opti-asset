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

    public function test_resolve_matches_employee_by_email_and_stores_session(): void
    {
        $tenant = $this->setCurrentTenant();
        $department = Department::factory()->create(['tenant_id' => $tenant->id]);

        $employee = Employee::create([
            'id_employee' => 'emp-001',
            'tenant_id' => $tenant->id,
            'nik_employee' => 'NIK-1234',
            'nama_employee' => 'John Doe',
            'email' => 'john.doe@example.com',
            'number' => '081234567890',
            'photo_url' => null,
            'id_department' => $department->id,
            'division_id' => 'div-001',
            'id_position' => 'pos-001',
            'last_login_ip' => null,
        ]);

        $user = User::factory()->create([
            'email' => 'john.doe@example.com',
        ]);

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNotNull($result);
        $this->assertSame('emp-001', $result['id_employee']);
        $this->assertSame('NIK-1234', $result['nik_employee']);
        $this->assertSame('John Doe', $result['nama_employee']);
        $this->assertSame('john.doe@example.com', $result['email']);
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

    public function test_resolve_matches_employee_by_nik_when_no_email_match(): void
    {
        $tenant = $this->setCurrentTenant();
        $department = Department::factory()->create(['tenant_id' => $tenant->id]);

        $employee = Employee::create([
            'id_employee' => 'emp-003',
            'tenant_id' => $tenant->id,
            'nik_employee' => 'NIK-8888',
            'nama_employee' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'number' => '081234567892',
            'photo_url' => null,
            'id_department' => $department->id,
            'division_id' => 'div-003',
            'id_position' => 'pos-003',
            'last_login_ip' => null,
        ]);

        // User email differs from every employee email; NIK comes from SAML.
        $user = User::factory()->create([
            'email' => 'different@example.com',
        ]);
        $user->setAttribute('nik', 'NIK-8888');

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNotNull($result);
        $this->assertSame('emp-003', $result['id_employee']);
        $this->assertSame('NIK-8888', $result['nik_employee']);
        $this->assertSame('Budi Santoso', $result['nama_employee']);
        $this->assertSame('budi@example.com', $result['email']);
        $this->assertSame($department->id, $result['department_id']);
        $this->assertSame('div-003', $result['division_id']);
        $this->assertSame('pos-003', $result['id_position']);
        $this->assertSame($tenant->id, $result['tenant_id']);

        $stored = session('employee');
        $this->assertSame($department->id, $stored['department_id']);
        $this->assertArrayNotHasKey('id_department', $stored);
        $this->assertSame($employee->id_employee, $stored['id_employee']);
    }

    public function test_resolve_returns_null_and_stores_null_session_when_no_match(): void
    {
        $tenant = $this->setCurrentTenant();

        $user = User::factory()->create([
            'email' => 'nobody@example.com',
        ]);

        $resolver = new EmployeeSessionResolver;
        $result = $resolver->resolve($user);

        $this->assertNull($result);
        $this->assertNull(session('employee'));
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
