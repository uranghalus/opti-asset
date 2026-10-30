<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\TenantAccess;
use App\Services\TenantSwitchTarget;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Actions\MakeTenantCurrentAction;

class TenantSwitchController extends Controller
{
    public function __construct(
        protected TenantAccess $tenantAccess,
        protected TenantSwitchTarget $switchTarget,
        protected UrlGenerator $urlGenerator,
        protected MakeTenantCurrentAction $makeTenantCurrentAction,
    ) {}

    public function switch(Request $request): RedirectResponse
    {
        Gate::authorize('tenant.switch');

        $validated = $request->validate([
            'tenant' => ['required', 'string'],
        ]);

        $tenantCode = $validated['tenant'];
        $tenant = Tenant::whereCode($tenantCode)->first();

        if (! $tenant) {
            abort(404, 'Tenant tidak ditemukan.');
        }

        $user = $request->user();

        if (! $this->tenantAccess->canOperate($user, $tenant->id)) {
            abort(403, 'Anda tidak memiliki akses ke tenant ini.');
        }

        // Compute target page after switch (stay on current page)
        $route = $request->route();
        $routeName = $route ? $route->getName() : null;
        $routeParams = $route ? $route->parameters() : [];

        $target = $this->switchTarget->resolve($tenantCode, $routeName, $routeParams);

        // Set current tenant for Spatie multitenancy
        $this->makeTenantCurrentAction->execute($tenant);

        if ($request->hasSession()) {
            $request->session()->put('current_tenant_id', $tenant->id);
        }

        Log::info('tenant.switch', [
            'user_id' => $user->id,
            'from_tenant_id' => $request->session()->get('previous_tenant_id'),
            'to_tenant_id' => $tenant->id,
            'to_tenant_code' => $tenantCode,
            'target_path' => $target['path'],
            'fell_back' => $target['fell_back'],
        ]);

        return redirect($target['path']);
    }

    public function signed(Request $request, string $tenantCode): RedirectResponse
    {
        Gate::authorize('tenant.switch');

        $tenant = Tenant::whereCode($tenantCode)->first();

        if (! $tenant) {
            abort(404, 'Tenant tidak ditemukan.');
        }

        $user = $request->user();

        if (! $this->tenantAccess->canOperate($user, $tenant->id)) {
            abort(403, 'Anda tidak memiliki akses ke tenant ini.');
        }

        $targetPath = $request->query('to', route('dashboard', ['tenant' => $tenantCode]));

        $this->makeTenantCurrentAction->execute($tenant);

        if ($request->hasSession()) {
            $request->session()->put('current_tenant_id', $tenant->id);
        }

        return redirect($targetPath);
    }
}
