<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserEmployeeLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_employee_relation_resolves_without_tenant_scope(): void
    {
        // Sengaja TANPA Tenant::makeCurrent(): tb_employee punya global scope
        // tenant (whereRaw 1=0 saat tidak ada tenant), jadi kalau relasi User
        // tidak bypass scope, $user->employee pasti null.
        $employee = Employee::factory()->create();

        $user = User::factory()->create(['employee_id' => $employee->id_employee]);

        $this->assertSame($employee->id_employee, $user->employee->id_employee);
    }

    public function test_employee_id_is_fillable_and_hidden(): void
    {
        $employee = Employee::factory()->create();

        $user = User::create([
            'name' => 'Linked User',
            'email' => 'linked-user@example.com',
            'password' => 'password',
            'employee_id' => $employee->id_employee,
        ]);

        $this->assertSame($employee->id_employee, $user->employee_id);
        $this->assertArrayNotHasKey('employee_id', User::first()->toArray());
    }

    public function test_employee_user_relation(): void
    {
        $employee = Employee::factory()->create();

        $user = User::factory()->create(['employee_id' => $employee->id_employee]);

        $this->assertSame($user->id, $employee->user->id);
    }
}
