<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            'users' => ['users_count', 'desc'],
            default => ['created_at', 'desc'],
        };

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('roles/Index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => $request->validated()['name'], 'guard_name' => 'web']);

        if ($permissions = $request->input('permissions')) {
            $role->syncPermissions($permissions);
        }

        return back();
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $role->update(['name' => $request->validated()['name']]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->input('permissions', []));
        }

        return back();
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->name === 'super-admin') {
            return back()->withErrors(['role' => 'Peran super-admin tidak dapat dihapus.']);
        }

        $role->delete();

        return back();
    }

    public function syncPermissions(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->syncPermissions($validated['permissions']);

        return back();
    }

    /**
     * @return array<int, array{group: string, permissions: array<int, array{id: int, name: string}>}>
     */
    private function permissionGroups(): array
    {
        return Permission::query()
            ->orderBy('name')
            ->get()
            ->groupBy(fn (Permission $permission) => Str::beforeLast($permission->name, '.'))
            ->map(fn ($permissions, string $group) => [
                'group' => $group,
                'permissions' => $permissions
                    ->map(fn (Permission $permission) => [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }
}
