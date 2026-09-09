<?php

namespace App\Actions;

use App\Models\Employee;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class SyncUserRolesFromEmployeeAction
{
    /**
     * Copy an Employee's role names onto the User with the same email, so
     * roles assigned in the Employees section become effective for
     * authorization (gates run against the authenticated User).
     */
    public function execute(User $user): void
    {
        $employee = Employee::withoutGlobalScopes()
            ->where('email', $user->email)
            ->first();

        if ($employee === null) {
            // No linked employee: keep the user's directly-assigned roles.
            return;
        }

        $roleNames = $employee->roles()
            ->withoutGlobalScopes()
            ->pluck('name')
            ->all();

        $existing = $user->roles()
            ->withoutGlobalScopes()
            ->pluck('name')
            ->all();

        if ($existing === $roleNames) {
            return;
        }

        $user->syncRoles($roleNames);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
