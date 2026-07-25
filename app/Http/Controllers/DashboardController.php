<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $tenantId = session('current_tenant_id');

        $totalUsers = User::count();
        $totalTenants = Tenant::count();
        $totalDepartments = Department::count();
        $totalPasskeys = $user->passkeys()->count();

        $recentUsers = User::latest('created_at')
            ->take(5)
            ->get(['id', 'name', 'email', 'created_at']);

        $recentDepartments = Department::latest('created_at')
            ->take(5)
            ->get(['id_department', 'kode_department', 'nama_department', 'created_at']);

        return Inertia::render('dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_tenants' => $totalTenants,
                'total_departments' => $totalDepartments,
                'total_passkeys' => $totalPasskeys,
            ],
            'recent_users' => $recentUsers,
            'recent_departments' => $recentDepartments,
            'current_tenant_id' => $tenantId,
        ]);
    }
}
