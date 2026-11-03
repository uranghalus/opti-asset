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
        // hasAnyRole() with no arguments is always false in Spatie — the
        // question is whether the akun holds ANY role at all.
        if (! $user->roles()->exists()) {
            return $this->deny('no_role');
        }

        // Tenant resolved from SAML assertion (session) takes precedence over
        // the user's stored tenant_id. session('saml.tenant') is set by
        // SamlController::acs() from the SAML assertion's company attribute.
        $sessionTenant = session('saml.tenant');
        $tenantId = $sessionTenant ? (is_string($sessionTenant) ? $sessionTenant : $sessionTenant->id) : null;
        $tenantId = $tenantId ?? $user->tenant_id;

        if (! $tenantId) {
            return $this->deny('no_tenant');
        }

        $tenant = Tenant::find((string) $tenantId);

        if (! $tenant) {
            return $this->deny('no_tenant');
        }

        return redirect()->route('tenant.dashboard', ['tenant' => $tenant->code]);
    }
}
