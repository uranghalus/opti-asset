<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantAccess;
use Closure;
use Illuminate\Http\Request;
use Spatie\Multitenancy\Actions\MakeTenantCurrentAction;

/**
 * Guards `{tenant}` URL-prefix routes.
 *
 * Resolves the tenant by route `tenant` code slug, makes it current for the
 * request (Spatie multitenancy), and verifies the user can operate on it
 * (IDOR prevention — D5).
 */
class TenantAccessMiddleware
{
    public function __construct(
        protected TenantAccess $tenantAccess,
        protected MakeTenantCurrentAction $makeTenantCurrentAction,
    ) {}

    public function handle(Request $request, Closure $next): mixed
    {
        $tenantCode = $request->route('tenant');

        if ($tenantCode) {
            $tenant = Tenant::whereCode($tenantCode)->first();

            if (! $tenant) {
                abort(404, 'Tenant tidak ditemukan.');
            }

            $user = $request->user();

            // Only enforce tenant access when user is authenticated.
            // Unauthenticated requests are handled by the auth middleware.
            if ($user && ! $this->tenantAccess->canOperate($user, $tenant->id)) {
                abort(403, 'Anda tidak memiliki akses ke tenant ini.');
            }

            $this->makeTenantCurrentAction->execute($tenant);

            if ($request->hasSession()) {
                $request->session()->put('current_tenant_id', $tenant->id);
            }
        }

        return $next($request);
    }
}
