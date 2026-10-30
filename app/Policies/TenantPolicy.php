<?php

namespace App\Policies;

use App\Models\User;

class TenantPolicy
{
    public function view(User $user): bool
    {
        return $user->can('tenant.view');
    }

    public function manage(User $user): bool
    {
        return $user->can('tenant.manage');
    }

    public function switch(User $user): bool
    {
        return $user->can('tenant.switch');
    }
}
