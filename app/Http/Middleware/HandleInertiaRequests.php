<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\EmployeeSessionResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
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
                $query = $user->isSuperAdmin()
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

        // Refresh snapshot employee dari relasi FK setiap request. share()
        // berjalan SEBELUM controller, jadi pembaca session (mis.
        // AssetController department scoping) selalu melihat data terkini
        // tanpa login ulang. loadMissing() — bukan $user->employee langsung —
        // karena preventLazyLoading aktif di non-production.
        $employeeSnapshot = null;

        if ($user) {
            $user->loadMissing('employee');
            $employee = $user->employee;

            if ($employee === null) {
                Session::forget(EmployeeSessionResolver::SESSION_KEY);
            } else {
                Session::put(EmployeeSessionResolver::SESSION_KEY, EmployeeSessionResolver::snapshot($employee));

                $employeeSnapshot = [
                    'id_employee' => $employee->id_employee,
                    'tenant_id' => $employee->tenant_id,
                    'nik_employee' => $employee->nik_employee,
                    'nama_employee' => $employee->nama_employee,
                    'email' => $employee->email,
                    'number' => $employee->number,
                    'photo_url' => $employee->photo_url,
                    'department_id' => $employee->id_department,
                    'division_id' => $employee->division_id,
                    'id_position' => $employee->id_position,
                ];
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
                'isSuperAdmin' => $user !== null && $user->isSuperAdmin(),
                'employee' => $employeeSnapshot,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
