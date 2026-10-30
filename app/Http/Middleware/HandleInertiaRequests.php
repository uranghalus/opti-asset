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

        $currentTenant = null;
        $availableTenants = collect();

        try {
            $activeTenant = Tenant::current();
            if ($activeTenant) {
                $currentTenant = $activeTenant->only(['id', 'code', 'name']);
            } elseif ($user) {
                $fallback = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
                if ($fallback) {
                    $currentTenant = $fallback->only(['id', 'code', 'name']);
                }
            }

            if ($user) {
                $query = $user->hasRole('super-admin')
                    ? Tenant::query()->select(['id', 'code', 'name'])->orderBy('name', 'asc')
                    : Tenant::query()->where('id', $user->tenant_id)->select(['id', 'code', 'name'])->orderBy('name', 'asc');

                $availableTenants = $query->get()->map(fn (Tenant $tenant): array => [
                    'id' => $tenant->id,
                    'code' => $tenant->code,
                    'name' => $tenant->name,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('HandleInertiaRequests: '.$e->getMessage());
            if (! app()->isProduction()) {
                throw $e;
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'tenant' => $currentTenant,
            'availableTenants' => $availableTenants->toArray(),
            'auth' => [
                'user' => $user
                    ? array_merge($user->toArray(), [
                        'roles' => $user->getRoleNames()->toArray(),
                        'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                    ])
                    : null,
                'isSuperAdmin' => $user !== null && $user->hasRole('super-admin'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
