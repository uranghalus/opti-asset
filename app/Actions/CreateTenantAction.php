<?php

namespace App\Actions;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Str;

class CreateTenantAction
{
    public function execute(User $user, ?string $name = null): Tenant
    {
        $baseId = Str::slug($user->name);
        $tenantId = $baseId;
        $suffix = 1;

        while (Tenant::where('id', $tenantId)->exists()) {
            $tenantId = $baseId.'-'.$suffix++;
        }

        $tenant = Tenant::create([
            'id' => $tenantId,
            'name' => $name ?? $user->name."'s Organization",
        ]);

        $user->update(['tenant_id' => $tenant->id]);
        $user->tenants()->attach($tenant->id);

        return $tenant;
    }
}
