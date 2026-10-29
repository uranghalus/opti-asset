<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        $availableTenants = collect();
        $availableTenantsTruncated = false;

        // availableTenants is resolved for every authenticated user,
        // independent of whether an active tenant session exists (blueprint §4-5).
        try {
            if ($user) {
                $query = $user->hasRole('super-admin')
                    ? Tenant::query()->select(['id', 'name'])->orderBy('name', 'asc')
                    : $user->tenants()->select(['tenants.id', 'tenants.name'])->orderBy('name', 'asc');

                $availableTenants = $query->get()->map(fn (Tenant $tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                ]);

                if ($availableTenants->count() > 50) {
                    $availableTenants = $availableTenants->take(50);
                    $availableTenantsTruncated = true;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('HandleInertiaRequests: '.$e->getMessage());
            if (! app()->isProduction()) {
                throw $e;
            }
        }

        $currentTenant = null;
        try {
            $activeTenant = Tenant::current();
            if ($activeTenant) {
                $currentTenant = $activeTenant->only(['id', 'name']);
            } elseif ($user) {
                // Blueprint §4: stale-session fallback — active tenant deleted,
                // fall back to user's first assigned tenant (name ASC) and re-populate session.
                $fallback = $user->tenants()->select(['tenants.id', 'tenants.name'])->orderBy('name', 'asc')->first();
                if ($fallback) {
                    $request->session()->put('current_tenant_id', $fallback->id);
                    $currentTenant = $fallback->only(['id', 'name']);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('HandleInertiaRequests: '.$e->getMessage());
            if (! app()->isProduction()) {
                throw $e;
            }
        }

        // Computed AFTER $availableTenants is populated (blueprint §1, option b).
        $canSwitchTenant = $user !== null
            && $user->can('tenant.switch')
            && $availableTenants->count() > 1;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user
                    ? array_merge($user->toArray(), [
                        'roles' => $user->getRoleNames()->toArray(),
                        'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                    ])
                    : null,
                'isSuperAdmin' => $user !== null && $user->hasRole('super-admin'),
                'canSwitchTenant' => $canSwitchTenant,
            ],
            'tenant' => $currentTenant,
            'availableTenants' => $availableTenants,
            'availableTenantsTruncated' => $availableTenantsTruncated,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
