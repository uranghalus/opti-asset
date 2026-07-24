<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $currentTenant = null;
        $availableTenants = [];

        try {
            $activeTenant = Tenant::current();

            if ($activeTenant) {
                $currentTenant = $activeTenant->only(['id', 'name']);
                $availableTenants = $user
                    ? $user->tenants()->get()->map(fn (Tenant $t) => $this->mapTenant($t))
                    : [];
            } elseif ($user) {
                $availableTenants = Tenant::latest()->get()->map(fn (Tenant $t) => $this->mapTenant($t));
            }
        } catch (\Throwable $e) {
            // MongoDB not available (e.g., test env)
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
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
