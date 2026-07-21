<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Http\Requests\UpdateTenantRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $tenants = Tenant::forUser($user)->latest()->get();

        return Inertia::render('tenants/index', [
            'tenants' => $tenants->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'domain' => $tenant->domain,
                'role' => $tenant->pivot->role ?? null,
                'created_at' => $tenant->created_at,
                'updated_at' => $tenant->updated_at,
            ]),
            'current_tenant_id' => Tenant::current()?->id,
        ]);
    }

    public function store(StoreTenantRequest $request): RedirectResponse
    {
        $user = auth()->user();

        $tenant = DB::transaction(function () use ($request, $user) {
            $tenant = Tenant::create([
                'name' => $request->validated('name'),
                'domain' => $request->validated('domain'),
                'database' => uniqid(),
            ]);

            $tenant->users()->attach($user, ['role' => 'super_admin']);

            return $tenant;
        });

        $tenant->makeCurrent();
        session(['current_tenant_id' => $tenant->id]);

        return redirect()->route('tenants.index');
    }

    public function edit(Tenant $tenant): Response
    {
        abort_unless(
            $tenant->users()->wherePivot('user_id', auth()->id())->exists(),
            403,
        );

        return Inertia::render('tenants/edit', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'domain' => $tenant->domain,
                'role' => $tenant->users()->wherePivot('user_id', auth()->id())->first()?->pivot->role,
                'created_at' => $tenant->created_at,
                'updated_at' => $tenant->updated_at,
            ],
        ]);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): RedirectResponse
    {
        abort_unless($tenant->isSuperAdmin(), 403);

        $tenant->update($request->validated());

        return redirect()->route('tenants.index');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        abort_unless($tenant->isSuperAdmin(), 403);

        if (Tenant::current()?->id === $tenant->id) {
            Tenant::forgetCurrent();
            session()->forget('current_tenant_id');
        }

        $tenant->delete();

        return redirect()->route('tenants.index');
    }

    public function switch(Tenant $tenant): RedirectResponse
    {
        $user = auth()->user();

        abort_unless(
            $tenant->users()->wherePivot('user_id', $user->id)->exists(),
            403,
        );

        $tenant->makeCurrent();
        session(['current_tenant_id' => $tenant->id]);

        return redirect()->back();
    }
}
