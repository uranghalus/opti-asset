<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Session;

/**
 * Resolves and persists employee data into the session at SAML login.
 *
 * Employee data already contains department_id, division_id, and id_position,
 * so no separate department assignment is needed — the employee record is the
 * single source of truth for the user's organizational context.
 *
 * Matching order:
 *  1. By email (primary) — Employee.email matches User.email
 *  2. By NIK (fallback) — Employee.nik_employee matches User->nik dynamic attribute
 *
 * If no match is found, null is returned and the employee session is cleared.
 */
class EmployeeSessionResolver
{
    public const SESSION_KEY = 'employee';

    /**
     * Resolve the employee for the given user and store it in the session.
     *
     * @return array{id_employee: string, nik_employee: string, nama_employee: string, email: string, department_id: ?string, division_id: ?string, id_position: ?string, tenant_id: string}|null
     */
    public function resolve(User $user): ?array
    {
        $employee = Employee::withoutGlobalScopes()
            ->where('email', $user->email)
            ->first();

        if (! $employee) {
            $nik = $user->nik ?? null;
            if ($nik) {
                $employee = Employee::withoutGlobalScopes()
                    ->where('nik_employee', $nik)
                    ->first();
            }
        }

        if (! $employee) {
            Session::forget(self::SESSION_KEY);

            return null;
        }

        // Store the employee attributes in the session using the canonical
        // `department_id` key. The Employee model column is `id_department`, so
        // the key is normalised here — readers must never see the raw column
        // name (see department-scoping P0-A).
        Session::put(self::SESSION_KEY, [
            'id_employee' => $employee->id_employee,
            'tenant_id' => $employee->tenant_id,
            'nik_employee' => $employee->nik_employee,
            'nama_employee' => $employee->nama_employee,
            'email' => $employee->email,
            'number' => $employee->number,
            'photo_url' => $employee->photo_url,
            'department_id' => $employee->id_department,
            'division_id' => $employee->division_id,
            'id_position' => $employee->id_position,
            'last_login_ip' => $employee->last_login_ip,
            'updated_at' => $employee->updated_at->toISOString(),
            'created_at' => $employee->created_at->toISOString(),
        ]);

        // Return a curated subset for the caller.
        return [
            'id_employee' => $employee->id_employee,
            'nik_employee' => $employee->nik_employee,
            'nama_employee' => $employee->nama_employee,
            'email' => $employee->email,
            'department_id' => $employee->id_department,
            'division_id' => $employee->division_id,
            'id_position' => $employee->id_position,
            'tenant_id' => $employee->tenant_id,
        ];
    }
}
