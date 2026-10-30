<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Role-aware post-login landing (one rule for every login path).
 *
 * Authorization is resolved from the user's roles/permissions per request —
 * the Spatie role pivot is never snapshotted into the session at login time,
 * so this resolver only decides WHERE a freshly authenticated user lands:
 *
 * - No active role at all  → session ended, denied ('no_role'): a login that
 *   may do nothing is not a usable session.
 * - Platform super admin   → central admin panel (unit bisnis picker).
 * - Home tenant membership → that tenant's dashboard.
 * - Role but no membership → session ended, denied ('no_tenant').
 */
class LoginLanding
{
    /**
     * End the freshly started session before bouncing to the denial page —
     * a rejected login must not stay authenticated.
     */
    public function deny(string $reason): RedirectResponse
    {
        Auth::guard('web')->logout();

        return redirect()
            ->route('saml.denied')
            ->with('saml.denial_reason', $reason);
    }

    public function redirect(User $user): RedirectResponse
    {
        // Platform accounts are never denied: a super admin (flag or role)
        // bypasses every gate and tenant scope, so the no-role rule does not
        // apply to it.
        if ($user->isSuperAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        // hasAnyRole() with no arguments is always false in Spatie — the
        // question is whether the akun holds ANY role at all.
        if (! $user->roles()->exists()) {
            return $this->deny('no_role');
        }

        // Role but no home tenant membership: login is not usable.
        if (! $user->tenant_id) {
            return $this->deny('no_tenant');
        }

        $tenant = Tenant::find((string) $user->tenant_id);

        if (! $tenant) {
            return $this->deny('no_tenant');
        }

        return redirect()->route('tenant.dashboard', ['tenant' => $tenant->code]);
    }
}
