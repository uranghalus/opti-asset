<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\TenantFinder;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Actions\MakeTenantCurrentAction;

class IdentifyTenant
{
    public function __construct(
        protected TenantFinder $tenantFinder,
        protected MakeTenantCurrentAction $makeTenantCurrentAction,
    ) {}

    public function handle(Request $request, Closure $next): mixed
    {
        try {
            $tenant = $this->tenantFinder->findForRequest($request);

            if ($tenant) {
                $this->makeTenantCurrentAction->execute($tenant);
            } else {
                Tenant::forgetCurrent();

                // Blueprint §4: stale-session fallback — session tenant deleted,
                // fall back to user's first assigned tenant (name ASC) and
                // re-populate the session. Runs before auth middleware, so
                // resolve the user via the auth guard directly.
                if ($user = auth()->user()) {
                    $fallback = $user->tenants()->select(['tenants.id', 'tenants.name'])->orderBy('name', 'asc')->first();
                    if ($fallback) {
                        $request->session()->put('current_tenant_id', $fallback->id);
                        $this->makeTenantCurrentAction->execute($fallback);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('IdentifyTenant: '.$e->getMessage());
        }

        return $next($request);
    }
}
