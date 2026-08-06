<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $search = $request->string('search')->trim()->toString();
        $group = $request->string('group')->trim()->toString();
        $sort = $request->string('sort')->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            default => ['name', 'asc'],
        };

        $permissions = Permission::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($group !== '', fn ($query) => $query->where('name', 'like', "{$group}.%"))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $groups = Permission::query()
            ->pluck('name')
            ->map(fn (string $name) => Str::beforeLast($name, '.'))
            ->countBy()
            ->map(fn (int $count, string $name) => ['name' => $name, 'count' => $count])
            ->sortBy('name')
            ->values();

        return Inertia::render('permissions/Index', [
            'permissions' => $permissions,
            'filters' => [
                'search' => $search,
                'group' => $group,
                'sort' => $sort,
            ],
            'groups' => $groups,
        ]);
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            foreach ($validated['actions'] as $action) {
                Permission::firstOrCreate([
                    'name' => $validated['resource'].'.'.$action,
                    'guard_name' => 'web',
                ]);
            }
        });

        return back();
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $permission->update(['name' => $request->validated()['name']]);

        return back();
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        $permission->delete();

        return back();
    }
}
