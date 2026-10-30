<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class TenantAccess
{
    public function canOperate(User $user, ?string $tenantIdOrCode): bool
    {
        if (! $tenantIdOrCode) {
            return false;
        }

        // Super-admin bypass (Gate::before handles this too; explicit here for clarity)
        if ($user->isSuperAdmin()) {
            return true;
        }

        // tenantIdOrCode can be either the ULID (from session/user) or code (from route)
        // Resolve to ULID for comparison against user's home tenant_id
        $tenant = Tenant::where('id', $tenantIdOrCode)->first()
            ?? Tenant::whereCode($tenantIdOrCode)->first();

        if (! $tenant) {
            return false;
        }

        // D1: single home tenant_id on user
        return $user->tenant_id === $tenant->id;
    }

    public function operableTenants(User $user): Collection
    {
        if ($user->isSuperAdmin()) {
            return Tenant::query()->orderBy('name', 'asc')->get();
        }

        if (! $user->tenant_id) {
            return Tenant::query()->whereRaw('1 = 0')->get();
        }

        return Tenant::query()->where('id', $user->tenant_id)->orderBy('name', 'asc')->get();
    }

    public function canManageTenants(User $user): bool
    {
        return (bool) $user->isSuperAdmin();
    }
}
