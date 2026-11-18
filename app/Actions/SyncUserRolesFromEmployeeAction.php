<?php

namespace App\Actions;

use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class SyncUserRolesFromEmployeeAction
{
    /**
     * Copy an Employee's role names onto the linked User, so roles assigned
     * in the Employees section become effective for authorization (gates run
     * against the authenticated User).
     *
     * Resolution is the persistent `employee_id` FK (User::employee()),
     * never email matching. The user keeps the protected roles
     * (User::PROTECTED_ROLE_NAMES): employee role changes — including
     * revocation — propagate, but `guest` and `super-admin` are never
     * removed by the sync. A user without a linked employee keeps their
     * roles untouched (no destructive "sync empty").
     */
    public function execute(User $user): void
    {
        $employee = $user->employee;

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

        // guest/super-admin tidak pernah dicabut oleh sinkronisasi — role
        // ini diberikan langsung pada User dan harus tetap menempel.
        $protectedRoles = array_values(array_intersect(
            $existing,
            User::PROTECTED_ROLE_NAMES,
        ));

        $roleNames = array_values(array_unique(array_merge($roleNames, $protectedRoles)));

        if ($existing === $roleNames) {
            return;
        }

        $user->syncRoles($roleNames);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
