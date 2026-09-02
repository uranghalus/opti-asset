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
        $availableTenants = [];

        try {
            $activeTenant = Tenant::current();

            if ($activeTenant) {
                $currentTenant = $activeTenant->only(['id', 'name']);
                // For super-admin, get ALL tenants, otherwise only user's assigned tenants
                $query = $user
                    ? ($user->hasRole('super-admin')
                        ? Tenant::latest()->get()
                        : $user->tenants())
                    : collect();
                $availableTenants = $query->map(fn (Tenant $t) => $this->mapTenant($t));
            } elseif ($user) {
                // For super-admin, get ALL tenants even without active tenant
                $query = $user->hasRole('super-admin') ? Tenant::latest()->get() : collect();
                $availableTenants = $query->map(fn (Tenant $t) => $this->mapTenant($t));
            }
        } catch (\Throwable $e) {
            Log::warning('HandleInertiaRequests: '.$e->getMessage());
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user
                    ? array_merge($user->toArray(), [
                        'roles' => $user->getRoleNames()->toArray(),
                    ])
                    : null,
            ],
            'tenant' => $currentTenant,
            'availableTenants' => $availableTenants,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{id: string, name: string}
     */
    private function mapTenant(Tenant $tenant): array
    {
        return ['id' => $tenant->id, 'name' => $tenant->name];
    }
}
