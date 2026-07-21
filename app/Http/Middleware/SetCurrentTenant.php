<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->session()->get('current_tenant_id');

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);

            if ($tenant && $request->user()?->tenants()->where('tenants.id', $tenant->id)->exists()) {
                $tenant->makeCurrent();
            } else {
                $request->session()->forget('current_tenant_id');
                $this->setDefaultTenant($request);
            }
        } else {
            $this->setDefaultTenant($request);
        }

        return $next($request);
    }

    private function setDefaultTenant(Request $request): void
    {
        $user = $request->user();

        if (! $user) {
            return;
        }

        $firstTenant = $user->tenants()->first();

        if ($firstTenant) {
            $firstTenant->makeCurrent();
            $request->session()->put('current_tenant_id', $firstTenant->id);
        }
    }
}
