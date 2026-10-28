<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreSuperAdminGrantRequest;
use App\Http\Requests\UpdateSuperAdminGrantRequest;
use App\Models\Employee;
use App\Models\SuperAdminGrant;
use App\Models\User;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SuperAdminGrantController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('super-admin.view');

        $perPage = min((int) $request->integer('per_page', 10), 100);
        $search = $request->string('search')->trim()->toString();

        $grants = SuperAdminGrant::query()
            ->with(['grantedBy:id,name,email', 'grantedTo:id,name,email', 'revokedBy:id,name,email'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->whereHas('grantedTo', function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest('granted_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('super-admin-grants/Index', [
            'grants' => $grants,
            'filters' => [
                'search' => $search,
            ],
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreSuperAdminGrantRequest $request): RedirectResponse
    {
        Gate::authorize('super-admin.grant');

        $userId = $request->validated('user_id');
        $user = User::find($userId);

        // Pelindung tambahan di sisi kontroler (selain FormRequest).
        if ($user->id === auth()->id()) {
            return back()->withErrors([
                'user_id' => 'Tidak dapat memberikan hak super-admin kepada diri sendiri.',
            ]);
        }

        if ($user->email === SuperAdminSeeder::EMAIL) {
            return back()->withErrors([
                'user_id' => 'Pengguna super-admin bootstrap tidak dapat diberi hak super-admin ulang.',
            ]);
        }

        if ($user->hasRole(SuperAdminSeeder::SUPER_ADMIN_ROLE)) {
            return back()->withErrors([
                'user_id' => 'Pengguna sudah memiliki hak super-admin.',
            ]);
        }

        $grant = SuperAdminGrant::create([
            'granted_by_user_id' => auth()->id(),
            'granted_to_user_id' => $user->id,
            'reason' => $request->validated('reason'),
            'granted_at' => now(),
        ]);

        $role = Role::findOrCreate(SuperAdminSeeder::SUPER_ADMIN_ROLE, 'web');
        $user->assignRole($role);

        // Sinkronkan pula ke Employee agar data konsisten antara User dan Employee.
        $this->syncEmployeeRole($user, true);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Hak super-admin berhasil diberikan kepada '.$user->name.'.');
    }

    public function destroy(UpdateSuperAdminGrantRequest $request): RedirectResponse
    {
        Gate::authorize('super-admin.revoke');

        $userId = $request->validated('user_id');
        $user = User::find($userId);

        if ($user->id === auth()->id()) {
            return back()->withErrors([
                'user_id' => 'Tidak dapat mencabut hak super-admin dari diri sendiri.',
            ]);
        }

        if ($user->email === SuperAdminSeeder::EMAIL) {
            return back()->withErrors([
                'user_id' => 'Pengguna super-admin bootstrap tidak dapat dicabut hak super-adminnya.',
            ]);
        }

        if (! $user->hasRole(SuperAdminSeeder::SUPER_ADMIN_ROLE)) {
            return back()->withErrors([
                'user_id' => 'Pengguna tidak memiliki hak super-admin.',
            ]);
        }

        $grant = SuperAdminGrant::query()
            ->where('granted_to_user_id', $user->id)
            ->whereNull('revoked_at')
            ->latest('granted_at')
            ->first();

        if ($grant === null) {
            return back()->withErrors([
                'user_id' => 'Catatan pemberian hak super-admin tidak ditemukan.',
            ]);
        }

        $grant->update([
            'revoked_by_user_id' => auth()->id(),
            'revoked_at' => now(),
            'revoked_reason' => 'Dicabut melalui pengelolaan hak super-admin.',
        ]);

        $user->removeRole(SuperAdminSeeder::SUPER_ADMIN_ROLE);

        $this->syncEmployeeRole($user, false);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Hak super-admin berhasil dicabut dari '.$user->name.'.');
    }

    /**
     * Tambah atau hapus role super-admin pada Employee yang terhubung dengan User.
     */
    private function syncEmployeeRole(User $user, bool $grant): void
    {
        $employee = Employee::withoutGlobalScopes()
            ->where('email', $user->email)
            ->first();

        if ($employee === null) {
            return;
        }

        if ($grant) {
            $employee->assignRole(SuperAdminSeeder::SUPER_ADMIN_ROLE);
        } else {
            $employee->removeRole(SuperAdminSeeder::SUPER_ADMIN_ROLE);
        }
    }
}
