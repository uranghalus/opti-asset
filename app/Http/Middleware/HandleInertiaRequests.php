<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\User;
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
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        $currentTenant = null;
        $availableTenants = [];

        try {
            $activeTenant = Tenant::current();

            if ($activeTenant) {
                $currentTenant = $activeTenant->only(['id', 'name']);
                $availableTenants = $user
                    ? $user->tenants()->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->name])
                    : [];
            } elseif ($user) {
                $availableTenants = Tenant::latest()->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->name]);
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
}
